export function formatFileSize(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1000 * 1000) return `${(bytes / 1000).toFixed(1)} KB`;
  return `${(bytes / (1000 * 1000)).toFixed(2)} MB`;
}

export function formatDuration(ms: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds - minutes * 60).toFixed(1);
  return `${minutes}:${seconds.padStart(4, "0")}`;
}

export function getFileExtension(path: string): string {
  const lastDot = path.lastIndexOf(".");
  return lastDot >= 0 ? path.substring(lastDot + 1).toLowerCase() : "";
}

export function replaceExtension(path: string, newExt: string): string {
  const lastDot = path.lastIndexOf(".");
  if (lastDot >= 0) {
    return path.substring(0, lastDot + 1) + newExt;
  }
  return path + "." + newExt;
}

export function getGifMimeType(name: string): string {
  const ext = getFileExtension(name);
  switch (ext) {
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "apng":
    case "png":
      return "image/png";
    default:
      return "image/gif";
  }
}
