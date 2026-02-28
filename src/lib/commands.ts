import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { base } from "$app/paths";
import type {
  FfmpegInfo,
  GifFileInfo,
  ProcessingOptions,
  ProcessingResult,
  ProgressInfo,
  ApplyEffectOptions,
} from "./types";
import { getFileExtension, getGifMimeType } from "./utils";

let ffmpeg: FFmpeg | null = null;

export async function initFFmpeg(
  onProgress?: (message: string) => void,
): Promise<FfmpegInfo> {
  ffmpeg = new FFmpeg();
  ffmpeg.on("log", ({ message }) => {
    console.log("[ffmpeg]", message);
  });

  onProgress?.("Worker を起動中...");

  const loadPromise = ffmpeg.load({
    coreURL: `${base}/ffmpeg-core.js`,
    wasmURL: `${base}/ffmpeg-core.wasm`,
    classWorkerURL: `${base}/ffmpeg-worker/worker.js`,
  });

  onProgress?.("FFmpeg コアを読み込み中...");

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () =>
        reject(new Error("FFmpeg の読み込みがタイムアウトしました（30秒）")),
      30000,
    ),
  );

  await Promise.race([loadPromise, timeout]);

  onProgress?.("初期化完了");
  return { version: "ffmpeg.wasm" };
}

function getFFmpeg(): FFmpeg {
  if (!ffmpeg) throw new Error("FFmpeg not initialized");
  return ffmpeg;
}

export async function resetFFmpeg(): Promise<void> {
  if (ffmpeg) {
    ffmpeg.terminate();
  }
  ffmpeg = new FFmpeg();
  ffmpeg.on("log", ({ message }) => {
    console.log("[ffmpeg]", message);
  });
  await ffmpeg.load({
    coreURL: `${base}/ffmpeg-core.js`,
    wasmURL: `${base}/ffmpeg-core.wasm`,
    classWorkerURL: `${base}/ffmpeg-worker/worker.js`,
  });
}

async function countColorsFromBlob(blob: Blob): Promise<number> {
  try {
    const bitmap = await createImageBitmap(blob, { colorSpaceConversion: "none" });
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const colors = new Set<number>();
    for (let i = 0; i < data.length; i += 4) {
      colors.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
    }
    bitmap.close();
    return colors.size;
  } catch {
    return 256;
  }
}

/** GIFバイナリから全カラーテーブル（GCT + 全LCT）のユニーク色を収集し、256色以下ならパレットとして返す */
function parseGifPalette(data: Uint8Array): Uint8Array | null {
  if (data[0] !== 0x47 || data[1] !== 0x49 || data[2] !== 0x46) return null;

  const colorSet = new Set<number>();

  const packed = data[10];
  const hasGct = !!(packed & 0x80);
  let pos: number;

  if (hasGct) {
    const gctBits = packed & 0x07;
    const numEntries = 1 << (gctBits + 1);
    const gctStart = 13;
    const gctEnd = gctStart + numEntries * 3;
    if (gctEnd > data.length) return null;
    for (let i = 0; i < numEntries; i++) {
      const off = gctStart + i * 3;
      colorSet.add((data[off] << 16) | (data[off + 1] << 8) | data[off + 2]);
    }
    pos = gctEnd;
  } else {
    pos = 13;
  }

  // フレームをスキャンし、LCTがあればそこからも色を収集
  while (pos < data.length) {
    const b = data[pos];
    if (b === 0x3b) break;
    if (b === 0x21) {
      pos += 2;
      while (pos < data.length) {
        const sz = data[pos++];
        if (sz === 0) break;
        pos += sz;
      }
    } else if (b === 0x2c) {
      if (pos + 10 > data.length) return null;
      const framePacked = data[pos + 9];
      if (framePacked & 0x80) {
        // LCTあり → 色を収集
        const lctBits = framePacked & 0x07;
        const lctEntries = 1 << (lctBits + 1);
        const lctStart = pos + 10;
        const lctEnd = lctStart + lctEntries * 3;
        if (lctEnd > data.length) return null;
        for (let i = 0; i < lctEntries; i++) {
          const off = lctStart + i * 3;
          colorSet.add((data[off] << 16) | (data[off + 1] << 8) | data[off + 2]);
        }
        if (colorSet.size > 256) return null; // 256色超過 → pallettegenに任せる
        pos = lctEnd;
      } else {
        pos += 10;
      }
      if (pos >= data.length) return null;
      pos++; // LZW min code size
      while (pos < data.length) {
        const sz = data[pos++];
        if (sz === 0) break;
        pos += sz;
      }
    } else {
      return null;
    }
  }

  if (colorSet.size === 0) return null;

  // ユニーク色をUint8Arrayに変換
  const colors = Array.from(colorSet);
  const result = new Uint8Array(colors.length * 3);
  for (let i = 0; i < colors.length; i++) {
    result[i * 3] = (colors[i] >> 16) & 0xff;
    result[i * 3 + 1] = (colors[i] >> 8) & 0xff;
    result[i * 3 + 2] = colors[i] & 0xff;
  }
  return result;
}

/** パレットバイト列（N色×RGB3バイト）からpalette.pngを生成してffmpeg FSに書き込む */
async function writeOriginalPalette(
  ff: FFmpeg,
  palette: Uint8Array,
): Promise<void> {
  const numEntries = palette.length / 3;

  // 16x16 RGB24 raw データを作成（256ピクセル、未使用部分は最後の色で埋める）
  const raw = new Uint8Array(16 * 16 * 3);
  for (let i = 0; i < 256; i++) {
    const src = Math.min(i, numEntries - 1);
    raw[i * 3] = palette[src * 3];
    raw[i * 3 + 1] = palette[src * 3 + 1];
    raw[i * 3 + 2] = palette[src * 3 + 2];
  }

  // ffmpeg で raw RGB → PNG に変換（カラーマネジメントなし）
  await ff.writeFile("_raw_pal.rgb", raw);
  await ff.exec([
    "-f", "rawvideo",
    "-pix_fmt", "rgb24",
    "-s", "16x16",
    "-i", "_raw_pal.rgb",
    "-y", "palette.png",
  ]);
  await ff.deleteFile("_raw_pal.rgb");
}

function getExtWithDot(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.substring(dot) : "";
}

export async function getGifInfo(file: File): Promise<GifFileInfo> {
  const ff = getFFmpeg();
  const tempName = "probe_input" + getExtWithDot(file.name);

  await ff.writeFile(tempName, await fetchFile(file));

  let width = 0;
  let height = 0;
  let fps = 0;
  let durationMs = 0;
  let frameCount = 0;

  const logHandler = ({ message }: { message: string }) => {
    const streamMatch = message.match(/Video:.*?,\s*(\d+)x(\d+)/);
    if (streamMatch) {
      width = parseInt(streamMatch[1]);
      height = parseInt(streamMatch[2]);
    }
    const fpsMatch = message.match(/([\d.]+)\s*fps/);
    if (fpsMatch) fps = parseFloat(fpsMatch[1]);
    const durMatch = message.match(
      /Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/,
    );
    if (durMatch) {
      const h = parseInt(durMatch[1]);
      const m = parseInt(durMatch[2]);
      const s = parseInt(durMatch[3]);
      const cs = parseInt(durMatch[4].padEnd(2, "0").substring(0, 2));
      durationMs = (h * 3600 + m * 60 + s) * 1000 + cs * 10;
    }
    const frameMatch = message.match(/frame=\s*(\d+)/);
    if (frameMatch) {
      frameCount = parseInt(frameMatch[1]);
    }
  };

  ff.on("log", logHandler);
  await ff.exec(["-i", tempName, "-f", "null", "-"]);
  ff.off("log", logHandler);

  if (frameCount === 0 && fps > 0 && durationMs > 0) {
    frameCount = Math.round((durationMs / 1000) * fps);
  }

  // Count unique colors using palettegen (same algorithm as processGifOutput)
  let colorCount = 256;
  try {
    await ff.exec([
      "-i", tempName,
      "-vf", "palettegen=max_colors=256:stats_mode=full:reserve_transparent=0",
      "-y", "_palette_probe.png",
    ]);
    const paletteData = await ff.readFile("_palette_probe.png");
    const paletteBlob = new Blob([paletteData], { type: "image/png" });
    colorCount = await countColorsFromBlob(paletteBlob);
    await ff.deleteFile("_palette_probe.png");
  } catch {}

  await ff.deleteFile(tempName);

  return {
    name: file.name,
    width,
    height,
    frameCount,
    duration_ms: durationMs,
    fps: Math.round(fps * 100) / 100,
    fileSize: file.size,
    format: getFileExtension(file.name),
    colorCount,
  };
}

function buildVideoFilters(options: ProcessingOptions): string[] {
  const filters: string[] = [];

  // Speed change
  if (options.speed) {
    filters.push(`setpts=PTS/${options.speed.multiplier}`);
  }

  // Reverse
  if (options.reverse) {
    filters.push("reverse");
  }

  // Frame rate
  if (options.frameRate) {
    filters.push(`fps=${options.frameRate.fps}`);
  }

  // Rotation & flip
  if (options.rotate) {
    if (options.rotate.angle === "90") filters.push("transpose=1");
    else if (options.rotate.angle === "180")
      filters.push("transpose=1,transpose=1");
    else if (options.rotate.angle === "270") filters.push("transpose=2");
    if (options.rotate.flipH) filters.push("hflip");
    if (options.rotate.flipV) filters.push("vflip");
  }

  // Crop (after rotation)
  if (options.crop) {
    const c = options.crop;
    filters.push(`crop=${c.width}:${c.height}:${c.x}:${c.y}`);
  }

  // Resize (after crop)
  if (options.resize) {
    const r = options.resize;
    if (r.mode === "percentage") {
      filters.push(
        `scale=trunc(iw*${r.percentage / 100}/2)*2:trunc(ih*${r.percentage / 100}/2)*2`,
      );
    } else {
      if (r.keepAspectRatio) {
        const w = r.width || -1;
        const h = r.height || -1;
        if (w > 0 && h <= 0) {
          filters.push(`scale=${w}:-1`);
        } else if (h > 0 && w <= 0) {
          filters.push(`scale=-1:${h}`);
        } else {
          filters.push(`scale=${w}:${h}:force_original_aspect_ratio=decrease`);
        }
      } else {
        filters.push(`scale=${r.width}:${r.height}`);
      }
    }
  }

  // Color adjustment (eq filter)
  if (options.color) {
    const c = options.color;
    const brightness = c.brightness / 100;
    const contrast = 1 + c.contrast / 100;
    const saturation = 1 + c.saturation / 100;
    if (brightness !== 0 || contrast !== 1 || saturation !== 1) {
      filters.push(
        `eq=brightness=${brightness}:contrast=${contrast}:saturation=${saturation}`,
      );
    }
  }

  // Filter effects
  if (options.filter) {
    const f = options.filter;
    if (f.grayscale) filters.push("format=gray");
    if (f.sepia) {
      filters.push(
        "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131:0",
      );
    }
    if (f.negate) filters.push("negate");
    if (f.blur !== null) filters.push(`gblur=sigma=${f.blur}`);
    if (f.sharpen) filters.push("unsharp");
  }

  return filters;
}

function buildNonGifArgs(
  options: ProcessingOptions,
  filters: string[],
): string[] {
  const inputName = "input" + getExtWithDot(options.input_file.name);
  const outputName = options.output_name;
  const outputExt = getFileExtension(outputName);
  const args: string[] = ["-i", inputName];

  if (filters.length > 0) {
    args.push("-vf", filters.join(","));
  }

  // APNG output options
  if (outputExt === "apng" || outputExt === "png") {
    args.push("-plays", "0", "-f", "apng");
  }

  args.push("-an", "-y", outputName);
  return args;
}

async function processGifOutput(
  ff: FFmpeg,
  inputName: string,
  outputName: string,
  options: { optimize?: ProcessingOptions["optimize"] },
  filters: string[],
  preservePalette: boolean = false,
): Promise<void> {
  const maxColors = options.optimize?.maxColors ?? 256;
  const vfBase = filters.length > 0 ? filters.join(",") + "," : "";

  // 色を変えない操作の場合、元GIFのパレットをそのまま使う
  let usedOriginal = false;
  if (preservePalette && !options.optimize) {
    try {
      const fileData = await ff.readFile(inputName);
      const gct = parseGifPalette(new Uint8Array(fileData as ArrayBuffer));
      if (gct) {
        await writeOriginalPalette(ff, gct);
        usedOriginal = true;
      }
    } catch {}
  }

  if (!usedOriginal) {
    // palettegen で新規パレット生成（色変更あり or 元パレット抽出失敗時）
    const pass1 = [
      "-i",
      inputName,
      "-vf",
      `${vfBase}palettegen=max_colors=${maxColors}:stats_mode=full:reserve_transparent=0`,
      "-y",
      "palette.png",
    ];
    await ff.exec(pass1);
  }

  // Pass 2: Apply palette with diff_mode=rectangle for frame differencing
  const paletteuse = `paletteuse=dither=none:diff_mode=rectangle`;
  let lavfi: string;
  if (filters.length > 0) {
    lavfi = `[0:v]${filters.join(",")}[x];[x][1:v]${paletteuse}`;
  } else {
    lavfi = `[0:v][1:v]${paletteuse}`;
  }
  const pass2 = [
    "-i",
    inputName,
    "-i",
    "palette.png",
    "-lavfi",
    lavfi,
    "-an",
    "-y",
    outputName,
  ];
  await ff.exec(pass2);

  try {
    await ff.deleteFile("palette.png");
  } catch {}
}

async function probeGifInfo(
  ff: FFmpeg,
  fileName: string,
  blobSize: number,
): Promise<GifFileInfo> {
  let width = 0;
  let height = 0;
  let fps = 0;
  let durationMs = 0;
  let frameCount = 0;
  const logHandler = ({ message }: { message: string }) => {
    const streamMatch = message.match(/Video:.*?,\s*(\d+)x(\d+)/);
    if (streamMatch) {
      width = parseInt(streamMatch[1]);
      height = parseInt(streamMatch[2]);
    }
    const fpsMatch = message.match(/([\d.]+)\s*fps/);
    if (fpsMatch) fps = parseFloat(fpsMatch[1]);
    const durMatch = message.match(
      /Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/,
    );
    if (durMatch) {
      const h = parseInt(durMatch[1]);
      const m = parseInt(durMatch[2]);
      const s = parseInt(durMatch[3]);
      const cs = parseInt(durMatch[4].padEnd(2, "0").substring(0, 2));
      durationMs = (h * 3600 + m * 60 + s) * 1000 + cs * 10;
    }
    const frameMatch = message.match(/frame=\s*(\d+)/);
    if (frameMatch) {
      frameCount = parseInt(frameMatch[1]);
    }
  };

  ff.on("log", logHandler);
  await ff.exec(["-i", fileName, "-f", "null", "-"]);
  ff.off("log", logHandler);

  if (frameCount === 0 && fps > 0 && durationMs > 0) {
    frameCount = Math.round((durationMs / 1000) * fps);
  }

  // Count unique colors using palettegen (same algorithm as processGifOutput)
  let colorCount = 256;
  try {
    await ff.exec([
      "-i", fileName,
      "-vf", "palettegen=max_colors=256:stats_mode=full:reserve_transparent=0",
      "-y", "_palette_probe.png",
    ]);
    const paletteData = await ff.readFile("_palette_probe.png");
    const paletteBlob = new Blob([paletteData], { type: "image/png" });
    colorCount = await countColorsFromBlob(paletteBlob);
    await ff.deleteFile("_palette_probe.png");
  } catch {}

  return {
    name: fileName,
    width,
    height,
    frameCount,
    duration_ms: durationMs,
    fps: Math.round(fps * 100) / 100,
    fileSize: blobSize,
    colorCount,
    format: getFileExtension(fileName),
  };
}

export async function processFile(
  options: ProcessingOptions,
  onProgress?: (info: ProgressInfo) => void,
): Promise<ProcessingResult> {
  const ff = getFFmpeg();
  const inputName = "input" + getExtWithDot(options.input_file.name);
  const outputName = options.output_name;

  try {
    const progressHandler = ({
      progress,
    }: {
      progress: number;
      time: number;
    }) => {
      onProgress?.({
        file_name: options.input_file.name,
        percentage: Math.min(Math.round(progress * 100), 99),
        status: "processing",
      });
    };
    ff.on("progress", progressHandler);

    await ff.writeFile(inputName, await fetchFile(options.input_file));

    const filters = buildVideoFilters(options);
    const outputExt = getFileExtension(outputName);

    if (outputExt === "gif") {
      const hasColorChange = !!(options.color || options.filter || options.optimize);
      const inputIsGif = getFileExtension(options.input_file.name) === "gif";
      await processGifOutput(ff, inputName, outputName, options, filters, inputIsGif && !hasColorChange);
    } else {
      const args = buildNonGifArgs(options, filters);
      await ff.exec(args);
    }

    const data = await ff.readFile(outputName);
    const blob = new Blob([data], { type: getGifMimeType(outputName) });

    const outputInfo = await probeGifInfo(ff, outputName, blob.size);

    ff.off("progress", progressHandler);

    onProgress?.({
      file_name: options.input_file.name,
      percentage: 100,
      status: "completed",
    });

    await ff.deleteFile(inputName);
    await ff.deleteFile(outputName);

    return {
      input_name: options.input_file.name,
      output_name: outputName,
      blob,
      success: true,
      error: null,
      outputInfo,
    };
  } catch (e) {
    onProgress?.({
      file_name: options.input_file.name,
      percentage: 0,
      status: "error",
    });

    try {
      await ff.deleteFile(inputName);
    } catch {}
    try {
      await ff.deleteFile(outputName);
    } catch {}

    return {
      input_name: options.input_file.name,
      output_name: outputName,
      blob: null,
      success: false,
      error: e instanceof Error ? e.message : String(e),
      outputInfo: null,
    };
  }
}

export async function getGifInfoFromBlob(
  blob: Blob,
  name: string,
): Promise<GifFileInfo> {
  const ff = getFFmpeg();
  const tempName = "probe_input" + getExtWithDot(name);

  await ff.writeFile(tempName, await fetchFile(blob));

  const info = await probeGifInfo(ff, tempName, blob.size);
  await ff.deleteFile(tempName);

  return { ...info, name };
}

export async function extractFrames(
  blob: Blob,
  name: string,
  frameCount: number,
): Promise<string[]> {
  const ff = getFFmpeg();
  const inputName = "input" + getExtWithDot(name);
  await ff.writeFile(inputName, await fetchFile(blob));

  await ff.exec(["-i", inputName, "-vsync", "0", "frame_%04d.png"]);

  const urls: string[] = [];
  for (let i = 1; i <= frameCount; i++) {
    const frameName = `frame_${String(i).padStart(4, "0")}.png`;
    try {
      const data = await ff.readFile(frameName);
      const frameBlob = new Blob([data], { type: "image/png" });
      urls.push(URL.createObjectURL(frameBlob));
      await ff.deleteFile(frameName);
    } catch {
      break;
    }
  }

  await ff.deleteFile(inputName);
  return urls;
}

async function applyFrameDelete(
  ff: FFmpeg,
  inputName: string,
  outputName: string,
  deleteIndices: number[],
  frameCount: number,
  fps: number,
  optimize?: ProcessingOptions["optimize"],
): Promise<void> {
  // Step 1: Extract all frames
  await ff.exec(["-i", inputName, "-vsync", "0", "frame_%04d.png"]);

  // Step 2: Rename kept frames to sequential numbering
  const deleteSet = new Set(deleteIndices);
  let keptIndex = 1;
  for (let i = 1; i <= frameCount; i++) {
    const srcName = `frame_${String(i).padStart(4, "0")}.png`;
    if (deleteSet.has(i - 1)) {
      try { await ff.deleteFile(srcName); } catch {}
    } else {
      const dstName = `kept_${String(keptIndex).padStart(4, "0")}.png`;
      const data = await ff.readFile(srcName);
      await ff.writeFile(dstName, data);
      await ff.deleteFile(srcName);
      keptIndex++;
    }
  }

  const keptCount = keptIndex - 1;
  const maxColors = optimize?.maxColors ?? 256;

  // Step 3: パレット準備 - 色変更なしなら元GIFパレットを使用
  let usedOriginal = false;
  if (!optimize) {
    try {
      const fileData = await ff.readFile(inputName);
      const gct = parseGifPalette(new Uint8Array(fileData as ArrayBuffer));
      if (gct) {
        await writeOriginalPalette(ff, gct);
        usedOriginal = true;
      }
    } catch {}
  }
  if (!usedOriginal) {
    await ff.exec([
      "-framerate", String(fps),
      "-i", "kept_%04d.png",
      "-vf", `palettegen=max_colors=${maxColors}:stats_mode=full:reserve_transparent=0`,
      "-y", "palette.png",
    ]);
  }

  // Step 4: Reassemble with palette
  await ff.exec([
    "-framerate", String(fps),
    "-i", "kept_%04d.png",
    "-i", "palette.png",
    "-lavfi", `[0:v][1:v]paletteuse=dither=none:diff_mode=rectangle`,
    "-an", "-y", outputName,
  ]);

  // Cleanup
  for (let i = 1; i <= keptCount; i++) {
    try { await ff.deleteFile(`kept_${String(i).padStart(4, "0")}.png`); } catch {}
  }
  try { await ff.deleteFile("palette.png"); } catch {}
}

export async function applyEffect(
  options: ApplyEffectOptions,
): Promise<{ blob: Blob; info: GifFileInfo }> {
  const ff = getFFmpeg();
  const inputName = "input" + getExtWithDot(options.inputName);
  const outputName = options.output_name;

  await ff.writeFile(inputName, await fetchFile(options.inputBlob));

  // Frame deletion: use extract-and-reassemble approach
  if (options.frameDelete && options.frameDelete.frameIndices.length > 0) {
    const frameCount = options.inputInfo?.frameCount ?? 0;
    const fps = options.inputInfo?.fps ?? 10;
    await applyFrameDelete(
      ff, inputName, outputName,
      options.frameDelete.frameIndices,
      frameCount, fps, options.optimize,
    );
  } else {
    // Build filters using the same logic
    const filterOptions: ProcessingOptions = {
      input_file: new File([], options.inputName),
      output_name: outputName,
      resize: options.resize,
      crop: options.crop,
      rotate: options.rotate,
      speed: options.speed,
      reverse: options.reverse,
      frameRate: options.frameRate,
      color: options.color,
      filter: options.filter,
      optimize: options.optimize,
      inputInfo: options.inputInfo,
    };

    const filters = buildVideoFilters(filterOptions);
    const outputExt = getFileExtension(outputName);

    if (outputExt === "gif") {
      const hasColorChange = !!(options.color || options.filter || options.optimize);
      const inputIsGif = getFileExtension(options.inputName) === "gif";
      await processGifOutput(ff, inputName, outputName, options, filters, inputIsGif && !hasColorChange);
    } else {
      const args = buildNonGifArgs(filterOptions, filters);
      await ff.exec(args);
    }
  }

  const data = await ff.readFile(outputName);
  const blob = new Blob([data], { type: getGifMimeType(outputName) });
  const info = await probeGifInfo(ff, outputName, blob.size);

  await ff.deleteFile(inputName);
  await ff.deleteFile(outputName);

  return { blob, info: { ...info, name: outputName } };
}

export async function extractFramesAsZip(
  blob: Blob,
  name: string,
  frameCount: number,
): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const ff = getFFmpeg();
  const inputName = "input" + getExtWithDot(name);
  await ff.writeFile(inputName, await fetchFile(blob));

  await ff.exec(["-i", inputName, "-vsync", "0", "zipframe_%04d.png"]);

  const zip = new JSZip();
  const baseName = name.replace(/\.[^.]+$/, "");

  for (let i = 1; i <= frameCount; i++) {
    const frameName = `zipframe_${String(i).padStart(4, "0")}.png`;
    try {
      const data = await ff.readFile(frameName);
      zip.file(`${baseName}_${String(i).padStart(4, "0")}.png`, data);
      await ff.deleteFile(frameName);
    } catch {
      break;
    }
  }

  await ff.deleteFile(inputName);
  return await zip.generateAsync({ type: "blob" });
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
