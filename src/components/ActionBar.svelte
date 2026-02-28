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

{#if appState.phase !== "empty"}
  <div class="action-bar">
    <div class="left">
      <span class="file-name">{appState.originalInfo?.name ?? ""}</span>
      <button
        class="btn change-btn"
        onclick={onChangeFile}
        disabled={appState.isProcessing}
      >
        別のファイルを開く
      </button>
    </div>
    <div class="right">
      {#if appState.history.length > 0}
        <button
          class="btn undo-btn"
          onclick={() => appState.undo()}
          disabled={appState.isProcessing}
        >
          元に戻す
        </button>
      {/if}
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
    </div>
  </div>
{/if}

<style>
  .action-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .file-name {
    font-size: 0.85rem;
    color: #d4d4d8;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .btn {
    padding: 8px 18px;
    border-radius: 6px;
    font-size: 0.85rem;
    cursor: pointer;
    box-shadow: none;
    font-weight: 500;
    white-space: nowrap;
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .change-btn {
    padding: 6px 14px;
    background: #28281f;
    color: #a3a3a3;
    border: 1px solid #3f3f36;
    font-size: 0.8rem;
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
