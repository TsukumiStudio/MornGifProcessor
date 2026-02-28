<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import { formatFileSize } from "$lib/utils";

  const appState = getAppState();
</script>

{#if appState.phase !== "empty" && appState.workingPreviewUrl}
  <div class="preview-panel">
    <div class="preview-area">
      <img src={appState.workingPreviewUrl} alt="現在の画像" class="preview-img" />
    </div>
    {#if appState.workingInfo}
      <div class="info-row">
        <span>{appState.workingInfo.width}x{appState.workingInfo.height}</span>
        <span>{appState.workingInfo.frameCount}フレーム</span>
        <span>{appState.workingInfo.colorCount ?? "?"}色</span>
        <span>{formatFileSize(appState.workingInfo.fileSize)}</span>
      </div>
    {/if}
  </div>
{/if}

<style>
  .preview-panel {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .preview-area {
    background: #1a1a16;
    border: 1px solid #2d2d26;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    overflow: hidden;
  }
  .preview-img {
    max-width: 100%;
    max-height: 400px;
    object-fit: contain;
  }
  .info-row {
    display: flex;
    gap: 16px;
    font-size: 0.75rem;
    color: #737373;
    padding: 0 4px;
  }
</style>
