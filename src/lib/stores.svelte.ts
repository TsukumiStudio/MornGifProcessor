import type {
  FfmpegInfo,
  GifFileInfo,
  WorkflowPhase,
  HistoryEntry,
} from "./types";

let ffmpegInfo = $state<FfmpegInfo | null>(null);
let ffmpegError = $state<string | null>(null);

// Workflow state
let phase = $state<WorkflowPhase>("empty");
let originalFile = $state<File | null>(null);
let originalInfo = $state<GifFileInfo | null>(null);
let originalPreviewUrl = $state<string | null>(null);

let workingBlob = $state<Blob | null>(null);
let workingInfo = $state<GifFileInfo | null>(null);
let workingPreviewUrl = $state<string | null>(null);

let previewBlob = $state<Blob | null>(null);
let previewInfo = $state<GifFileInfo | null>(null);
let previewPreviewUrl = $state<string | null>(null);

let history = $state<HistoryEntry[]>([]);
let pendingLabel = $state<string | null>(null);

let isProcessing = $state(false);
let isDragging = $state(false);

export function getAppState() {
  return {
    get ffmpegInfo() {
      return ffmpegInfo;
    },
    set ffmpegInfo(v) {
      ffmpegInfo = v;
    },
    get ffmpegError() {
      return ffmpegError;
    },
    set ffmpegError(v) {
      ffmpegError = v;
    },

    // Workflow state
    get phase() {
      return phase;
    },
    set phase(v) {
      phase = v;
    },
    get originalFile() {
      return originalFile;
    },
    get originalInfo() {
      return originalInfo;
    },
    get originalPreviewUrl() {
      return originalPreviewUrl;
    },
    get workingBlob() {
      return workingBlob;
    },
    get workingInfo() {
      return workingInfo;
    },
    get workingPreviewUrl() {
      return workingPreviewUrl;
    },
    get previewBlob() {
      return previewBlob;
    },
    get previewInfo() {
      return previewInfo;
    },
    get previewPreviewUrl() {
      return previewPreviewUrl;
    },
    get history() {
      return history;
    },
    get pendingLabel() {
      return pendingLabel;
    },
    set pendingLabel(v) {
      pendingLabel = v;
    },

    get isProcessing() {
      return isProcessing;
    },
    set isProcessing(v) {
      isProcessing = v;
    },
    get isDragging() {
      return isDragging;
    },
    set isDragging(v) {
      isDragging = v;
    },

    loadFile(file: File, info: GifFileInfo) {
      if (originalPreviewUrl) URL.revokeObjectURL(originalPreviewUrl);
      if (workingPreviewUrl) URL.revokeObjectURL(workingPreviewUrl);
      if (previewPreviewUrl) URL.revokeObjectURL(previewPreviewUrl);
      for (const h of history) URL.revokeObjectURL(h.previewUrl);

      const blob = new Blob([file], { type: file.type || "image/gif" });
      const url = URL.createObjectURL(blob);

      originalFile = file;
      originalInfo = info;
      originalPreviewUrl = url;
      workingBlob = blob;
      workingInfo = info;
      workingPreviewUrl = url;
      previewBlob = null;
      previewInfo = null;
      previewPreviewUrl = null;
      history = [];
      pendingLabel = null;
      phase = "loaded";
    },

    setPreview(blob: Blob, info: GifFileInfo) {
      if (previewPreviewUrl) URL.revokeObjectURL(previewPreviewUrl);
      previewBlob = blob;
      previewInfo = info;
      previewPreviewUrl = URL.createObjectURL(blob);
      phase = "preview_ready";
    },

    acceptPreview() {
      if (!previewBlob || !previewInfo || !previewPreviewUrl) return;
      if (!workingBlob || !workingInfo || !workingPreviewUrl) return;

      history = [
        ...history,
        {
          id: crypto.randomUUID(),
          label: pendingLabel ?? "変換",
          blob: workingBlob,
          info: workingInfo,
          previewUrl: workingPreviewUrl,
        },
      ];

      workingBlob = previewBlob;
      workingInfo = previewInfo;
      workingPreviewUrl = previewPreviewUrl;

      previewBlob = null;
      previewInfo = null;
      previewPreviewUrl = null;
      pendingLabel = null;
      phase = "loaded";
    },

    rejectPreview() {
      if (previewPreviewUrl) URL.revokeObjectURL(previewPreviewUrl);
      previewBlob = null;
      previewInfo = null;
      previewPreviewUrl = null;
      pendingLabel = null;
      phase = "loaded";
    },

    undo() {
      if (history.length === 0) return;
      if (workingPreviewUrl && workingPreviewUrl !== originalPreviewUrl) {
        URL.revokeObjectURL(workingPreviewUrl);
      }
      if (previewPreviewUrl) URL.revokeObjectURL(previewPreviewUrl);

      const last = history[history.length - 1];
      workingBlob = last.blob;
      workingInfo = last.info;
      workingPreviewUrl = last.previewUrl;
      history = history.slice(0, -1);

      previewBlob = null;
      previewInfo = null;
      previewPreviewUrl = null;
      pendingLabel = null;
      phase = "loaded";
    },

    resetAll() {
      if (originalPreviewUrl) URL.revokeObjectURL(originalPreviewUrl);
      if (workingPreviewUrl && workingPreviewUrl !== originalPreviewUrl) {
        URL.revokeObjectURL(workingPreviewUrl);
      }
      if (previewPreviewUrl) URL.revokeObjectURL(previewPreviewUrl);
      for (const h of history) {
        if (h.previewUrl !== originalPreviewUrl)
          URL.revokeObjectURL(h.previewUrl);
      }

      originalFile = null;
      originalInfo = null;
      originalPreviewUrl = null;
      workingBlob = null;
      workingInfo = null;
      workingPreviewUrl = null;
      previewBlob = null;
      previewInfo = null;
      previewPreviewUrl = null;
      history = [];
      pendingLabel = null;
      phase = "empty";
    },
  };
}
