export interface FfmpegInfo {
  version: string;
}

export interface GifFileInfo {
  name: string;
  width: number;
  height: number;
  frameCount: number;
  duration_ms: number;
  fps: number;
  fileSize: number;
  format: string;
  colorCount?: number;
}

export type OutputFormat = "gif" | "apng";

export interface ResizeOption {
  mode: "dimensions" | "percentage";
  width: number;
  height: number;
  keepAspectRatio: boolean;
  percentage: number;
}

export interface CropOption {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type RotateAngle = "none" | "90" | "180" | "270";

export interface RotateOption {
  angle: RotateAngle;
  flipH: boolean;
  flipV: boolean;
}

export interface SpeedOption {
  multiplier: number;
}

export interface FrameRateOption {
  fps: number;
}

export interface ColorOption {
  brightness: number;
  contrast: number;
  saturation: number;
}

export interface FilterOption {
  grayscale: boolean;
  sepia: boolean;
  negate: boolean;
  blur: number | null;
  sharpen: boolean;
}

export interface OptimizeOption {
  maxColors: number;
}

export interface FrameDeleteOption {
  frameIndices: number[];
}

export interface ProcessingOptions {
  input_file: File;
  output_name: string;
  output_format?: OutputFormat;
  resize?: ResizeOption;
  crop?: CropOption;
  rotate?: RotateOption;
  speed?: SpeedOption;
  reverse?: boolean;
  frameRate?: FrameRateOption;
  color?: ColorOption;
  filter?: FilterOption;
  optimize?: OptimizeOption;
  frameDelete?: FrameDeleteOption;
  inputInfo?: GifFileInfo;
}

export interface ProgressInfo {
  file_name: string;
  percentage: number;
  status: "processing" | "completed" | "error";
}

export interface ProcessingResult {
  input_name: string;
  output_name: string;
  blob: Blob | null;
  success: boolean;
  error: string | null;
  outputInfo: GifFileInfo | null;
}

export type CompareSelection =
  | { type: "input"; id: string }
  | { type: "output"; id: string };

export interface FileEntry {
  id: string;
  file: GifFileInfo;
  sourceFile: File;
  previewUrl: string | null;
  status: "loading" | "pending" | "processing" | "completed" | "error";
  progress: number;
  error?: string;
}

export interface OutputEntry {
  id: string;
  outputName: string;
  outputInfo: GifFileInfo | null;
  resultBlob: Blob;
  previewUrl: string | null;
  status: "completed";
  error?: undefined;
}

export interface OutputErrorEntry {
  id: string;
  outputName: string;
  outputInfo?: undefined;
  resultBlob?: undefined;
  previewUrl?: undefined;
  status: "error";
  error: string;
}

export type OutputFileEntry = OutputEntry | OutputErrorEntry;

export type WorkflowPhase = "empty" | "loaded" | "previewing" | "preview_ready";

export interface HistoryEntry {
  id: string;
  label: string;
  blob: Blob;
  info: GifFileInfo;
  previewUrl: string;
}

export interface EffectPayload {
  label: string;
  resize?: ResizeOption;
  crop?: CropOption;
  rotate?: RotateOption;
  speed?: SpeedOption;
  reverse?: boolean;
  frameRate?: FrameRateOption;
  color?: ColorOption;
  filter?: FilterOption;
  optimize?: OptimizeOption;
  outputFormat?: OutputFormat;
  frameDelete?: FrameDeleteOption;
  frameDelays?: number[];
}

export interface ApplyEffectOptions {
  inputBlob: Blob;
  inputName: string;
  output_name: string;
  output_format?: OutputFormat;
  resize?: ResizeOption;
  crop?: CropOption;
  rotate?: RotateOption;
  speed?: SpeedOption;
  reverse?: boolean;
  frameRate?: FrameRateOption;
  color?: ColorOption;
  filter?: FilterOption;
  optimize?: OptimizeOption;
  frameDelete?: FrameDeleteOption;
  frameDelays?: number[];
  inputInfo?: GifFileInfo;
}
