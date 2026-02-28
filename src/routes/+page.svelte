<script lang="ts">
  import { onMount } from "svelte";
  import { initFFmpeg, getGifInfoFromBlob, applyEffect, resetFFmpeg, downloadBlob, extractFramesAsZip } from "$lib/commands";
  import { base } from "$app/paths";
  import { getAppState } from "$lib/stores.svelte";
  import type { EffectPayload, OutputFormat } from "$lib/types";
  import { getFileExtension, replaceExtension, getGifMimeType } from "$lib/utils";
  import GifPreview from "../components/GifPreview.svelte";
  import FileDropZone from "../components/FileDropZone.svelte";
  import ActionBar from "../components/ActionBar.svelte";
  import ProcessingForm from "../components/ProcessingForm.svelte";
  import HistoryPanel from "../components/HistoryPanel.svelte";
  import PreviewModal from "../components/PreviewModal.svelte";

  const appState = getAppState();
  let loadingMessage = $state("ffmpeg.wasm を読み込み中...");
  let fileDropZone = $state<FileDropZone>();

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    appState.isDragging = true;
  }

  function handleDragLeave(e: DragEvent) {
    if (
      e.relatedTarget === null ||
      !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)
    ) {
      appState.isDragging = false;
    }
  }

  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    appState.isDragging = false;
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0 && appState.ffmpegInfo) {
      const file = e.dataTransfer.files[0];
      await loadFile(file);
    }
  }

  async function loadFile(file: File) {
    try {
      appState.isProcessing = true;
      const blob = new Blob([file], { type: file.type || "image/gif" });
      const ext = getFileExtension(file.name);

      if (ext === "gif") {
        // GIFは一度ffmpegで再エンコードし、以降の処理で色数・サイズが安定するようにする
        await resetFFmpeg();
        const result = await applyEffect({
          inputBlob: blob,
          inputName: file.name,
          output_name: file.name,
          inputInfo: undefined,
        });
        const info = await getGifInfoFromBlob(result.blob, file.name);
        // loadFileにはFileが必要なので、変換後blobからFileを作る
        const normalizedFile = new File([result.blob], file.name, { type: "image/gif" });
        appState.loadFile(normalizedFile, info);
      } else {
        const info = await getGifInfoFromBlob(blob, file.name);
        appState.loadFile(file, info);
      }
    } catch (e) {
      console.error("ファイル情報取得失敗:", e);
    } finally {
      appState.isProcessing = false;
    }
  }

  function buildOutputName(outputFormat?: OutputFormat): string {
    const name = appState.workingInfo?.name ?? appState.originalInfo?.name ?? "output.gif";
    if (outputFormat) {
      return replaceExtension(name, outputFormat);
    }
    const ext = getFileExtension(name);
    return name.substring(0, name.length - ext.length - 1) + "_output." + ext;
  }

  async function handleApply(payload: EffectPayload) {
    if (!appState.workingBlob || !appState.workingInfo) return;
    appState.isProcessing = true;
    appState.phase = "previewing";
    appState.pendingLabel = payload.label;

    try {
      await resetFFmpeg();

      const outputName = buildOutputName(payload.outputFormat);
      const result = await applyEffect({
        inputBlob: appState.workingBlob,
        inputName: appState.workingInfo.name,
        output_name: outputName,
        output_format: payload.outputFormat,
        resize: payload.resize,
        crop: payload.crop,
        rotate: payload.rotate,
        speed: payload.speed,
        reverse: payload.reverse,
        frameRate: payload.frameRate,
        color: payload.color,
        filter: payload.filter,
        optimize: payload.optimize,
        frameDelete: payload.frameDelete,
        inputInfo: appState.workingInfo,
      });

      appState.setPreview(result.blob, result.info);
    } catch (e) {
      console.error("プレビュー処理に失敗:", e);
      appState.phase = "loaded";
    } finally {
      appState.isProcessing = false;
    }
  }

  async function handleDownloadAs(format: OutputFormat) {
    if (!appState.workingBlob || !appState.workingInfo) return;
    const currentExt = getFileExtension(appState.workingInfo.name);
    const targetExt = format === "apng" ? "apng" : "gif";

    if (currentExt === targetExt || (format === "apng" && currentExt === "png")) {
      downloadBlob(appState.workingBlob, replaceExtension(appState.workingInfo.name, targetExt));
      return;
    }

    appState.isProcessing = true;
    try {
      await resetFFmpeg();
      const outputName = replaceExtension(appState.workingInfo.name, targetExt);
      const result = await applyEffect({
        inputBlob: appState.workingBlob,
        inputName: appState.workingInfo.name,
        output_name: outputName,
        output_format: format,
        inputInfo: appState.workingInfo,
      });
      downloadBlob(result.blob, outputName);
    } catch (e) {
      console.error("フォーマット変換に失敗:", e);
    } finally {
      appState.isProcessing = false;
    }
  }

  async function handleDownloadFrames() {
    if (!appState.workingBlob || !appState.workingInfo) return;
    appState.isProcessing = true;
    try {
      await resetFFmpeg();
      const zipBlob = await extractFramesAsZip(
        appState.workingBlob,
        appState.workingInfo.name,
        appState.workingInfo.frameCount,
      );
      const baseName = appState.workingInfo.name.replace(/\.[^.]+$/, "");
      downloadBlob(zipBlob, `${baseName}_frames.zip`);
    } catch (e) {
      console.error("連番画像の書き出しに失敗:", e);
    } finally {
      appState.isProcessing = false;
    }
  }

  onMount(async () => {
    try {
      loadingMessage = "コアファイルをダウンロード中...";
      appState.ffmpegInfo = await initFFmpeg((msg) => {
        loadingMessage = msg;
      });
    } catch (e: unknown) {
      appState.ffmpegError = String(e);
    }
  });
</script>

<main
  class="app"
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
>
  <header>
    <div class="header-title">
      <img
        src="{base}/icon.png"
        alt="MornGifProcessor"
        class="header-icon"
      />
      <h1>MornGifProcessor</h1>
      <span class="version">v{__APP_VERSION__}</span>
    </div>
    <a
      class="studio-link"
      href="https://tsukumistudio.com/"
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        src="{base}/tsukumi-logo.png"
        alt="TSUKUMI STUDIO"
        class="studio-icon"
      />
      <span class="studio-name">TSUKUMI STUDIO</span>
    </a>
  </header>

  <div class="privacy-notice">
    <p>
      すべての画像処理はお使いのブラウザ上で完結します。ファイルがサーバーにアップロード・保存されることはありません。
      ソースコードは
      <a
        href="https://github.com/TsukumiStudio/MornGifProcessor"
        target="_blank"
        rel="noopener noreferrer"
      >
        GitHub
      </a>
      で完全に公開されています。
    </p>
  </div>

  {#if appState.ffmpegInfo}
    <div class="content">
      <FileDropZone bind:this={fileDropZone} onFileSelected={loadFile} />
      <GifPreview />
      <ActionBar
        onChangeFile={() => fileDropZone?.openFileDialog()}
        onDownloadGif={() => handleDownloadAs("gif")}
        onDownloadApng={() => handleDownloadAs("apng")}
        onDownloadFrames={handleDownloadFrames}
      />
      {#if appState.phase !== "empty"}
        <ProcessingForm onApply={handleApply} />
        <HistoryPanel />
      {/if}
      <PreviewModal />
    </div>
  {:else if appState.ffmpegError}
    <div class="error-container">
      <p>
        ffmpeg.wasm
        の読み込みに失敗しました。ページを再読み込みしてください。
      </p>
    </div>
  {:else}
    <div class="loading">
      <p>{loadingMessage}</p>
    </div>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family:
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      sans-serif;
    background: #111110;
    color: #e4e4e7;
  }

  .app {
    max-width: 1300px;
    margin: 0 auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-height: 100vh;
    box-sizing: border-box;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 16px;
    border-bottom: 1px solid #28281f;
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .studio-link {
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    color: #a3a3a3;
    transition: color 0.15s;
  }
  .studio-link:hover {
    color: #e4e4e7;
  }
  .studio-icon {
    width: 28px;
    height: 28px;
    border-radius: 6px;
  }
  .studio-name {
    font-size: 0.8rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .header-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
  }

  .version {
    font-size: 0.7rem;
    color: #737373;
    align-self: flex-end;
    margin-bottom: 2px;
  }

  h1 {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 700;
    background: linear-gradient(135deg, #a3a825, #c5c94b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .privacy-notice {
    background: #1c1c17;
    border: 1px solid #28281f;
    border-radius: 8px;
    padding: 10px 16px;
    font-size: 0.8rem;
    color: #a3a3a3;
    line-height: 1.5;
  }
  .privacy-notice p {
    margin: 0;
  }
  .privacy-notice a {
    color: #c5c94b;
    text-decoration: none;
  }
  .privacy-notice a:hover {
    text-decoration: underline;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .error-container {
    text-align: center;
    padding: 40px;
    color: #a3a3a3;
  }

  .loading {
    text-align: center;
    padding: 40px;
    color: #737373;
  }
</style>
