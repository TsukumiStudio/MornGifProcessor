<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import { formatFileSize } from "$lib/utils";

  const appState = getAppState();
</script>

{#if appState.phase === "previewing" || appState.phase === "preview_ready"}
  <div class="overlay" role="dialog" aria-modal="true">
    <div class="modal">
      {#if appState.phase === "previewing"}
        <div class="modal-loading">
          <p>処理中...</p>
        </div>
      {:else if appState.previewPreviewUrl && appState.previewInfo}
        <div class="modal-header">
          <span class="modal-title">{appState.pendingLabel ?? "プレビュー"}</span>
        </div>
        <div class="modal-preview">
          <img src={appState.previewPreviewUrl} alt="プレビュー" class="preview-img" />
        </div>
        <div class="modal-info">
          <span>{appState.previewInfo.width}x{appState.previewInfo.height}</span>
          <span>{appState.previewInfo.frameCount}フレーム</span>
          <span>{appState.previewInfo.colorCount ?? "?"}色</span>
          <span>{formatFileSize(appState.previewInfo.fileSize)}</span>
        </div>
        <div class="modal-actions">
          <button class="btn cancel-btn" onclick={() => appState.rejectPreview()}>
            やめる
          </button>
          <button class="btn apply-btn" onclick={() => appState.acceptPreview()}>
            適用
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .modal {
    background: #1a1a16;
    border: 1px solid #3f3f36;
    border-radius: 12px;
    padding: 24px;
    max-width: 700px;
    width: 90vw;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow: hidden;
  }
  .modal-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 0;
    color: #a3a825;
    font-size: 1rem;
    font-weight: 500;
  }
  .modal-loading p {
    margin: 0;
  }
  .modal-header {
    display: flex;
    align-items: center;
  }
  .modal-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: #d4d4d8;
  }
  .modal-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #111110;
    border: 1px solid #2d2d26;
    border-radius: 8px;
    overflow: hidden;
    min-height: 150px;
  }
  .preview-img {
    max-width: 100%;
    max-height: 50vh;
    object-fit: contain;
  }
  .modal-info {
    display: flex;
    gap: 16px;
    font-size: 0.75rem;
    color: #737373;
    justify-content: center;
  }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
  .btn {
    padding: 10px 24px;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: none;
  }
  .cancel-btn {
    background: #28281f;
    color: #a3a3a3;
    border: 1px solid #3f3f36;
  }
  .cancel-btn:hover {
    background: #3f3f36;
    color: #e4e4e7;
  }
  .apply-btn {
    background: #a3a825;
    color: white;
    border: none;
  }
  .apply-btn:hover {
    background: #8a8c2a;
  }
</style>
