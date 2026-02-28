<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";

  interface Props {
    onChangeFile: () => void;
    onDownloadGif: () => void;
    onDownloadApng: () => void;
    onDownloadFrames: () => void;
  }

  const { onChangeFile, onDownloadGif, onDownloadApng, onDownloadFrames }: Props = $props();
  const appState = getAppState();
</script>

<div class="action-col">
  <span class="file-name">{appState.originalInfo?.name ?? ""}</span>
  <button
    class="btn change-btn"
    onclick={onChangeFile}
    disabled={appState.isProcessing}
  >
    別のファイルを開く
  </button>
  <div class="divider"></div>
  <button
    class="btn download-btn"
    onclick={onDownloadGif}
    disabled={appState.isProcessing || !appState.workingBlob}
  >
    GIFダウンロード
  </button>
  <button
    class="btn download-btn apng-btn"
    onclick={onDownloadApng}
    disabled={appState.isProcessing || !appState.workingBlob}
  >
    APNGダウンロード
  </button>
  <button
    class="btn frames-btn"
    onclick={onDownloadFrames}
    disabled={appState.isProcessing || !appState.workingBlob}
  >
    連番PNG (ZIP)
  </button>
  {#if appState.history.length > 0}
    <div class="divider"></div>
    <button
      class="btn undo-btn"
      onclick={() => appState.undo()}
      disabled={appState.isProcessing}
    >
      元に戻す
    </button>
  {/if}
</div>

<style>
  .action-col {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 160px;
  }
  .file-name {
    font-size: 0.8rem;
    color: #a3a3a3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 0 2px;
  }
  .divider {
    height: 1px;
    background: #2d2d26;
    margin: 4px 0;
  }
  .btn {
    padding: 8px 14px;
    border-radius: 6px;
    font-size: 0.8rem;
    cursor: pointer;
    box-shadow: none;
    font-weight: 500;
    white-space: nowrap;
    text-align: center;
    width: 100%;
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .change-btn {
    background: #28281f;
    color: #a3a3a3;
    border: 1px solid #3f3f36;
  }
  .change-btn:hover:not(:disabled) {
    background: #3f3f36;
    color: #e4e4e7;
  }
  .undo-btn {
    background: #1a1a17;
    color: #a3a3a3;
    border: 1px solid #3f3f36;
  }
  .undo-btn:hover:not(:disabled) {
    background: #28281f;
    color: #e4e4e7;
  }
  .download-btn {
    background: #3b82f622;
    color: #3b82f6;
    border: 1px solid #3b82f633;
    font-weight: 600;
  }
  .download-btn:hover:not(:disabled) {
    background: #3b82f633;
  }
  .apng-btn {
    background: #06b6d422;
    color: #06b6d4;
    border: 1px solid #06b6d433;
  }
  .apng-btn:hover:not(:disabled) {
    background: #06b6d433;
  }
  .frames-btn {
    background: #8b5cf622;
    color: #8b5cf6;
    border: 1px solid #8b5cf633;
    font-weight: 600;
  }
  .frames-btn:hover:not(:disabled) {
    background: #8b5cf633;
  }
</style>
