<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import { formatFileSize } from "$lib/utils";

  const appState = getAppState();
</script>

{#if appState.history.length > 0}
  <section class="history-panel">
    <h3>編集履歴 ({appState.history.length})</h3>
    <div class="history-list">
      {#each appState.history as entry, i (entry.id)}
        <div class="history-item">
          <img src={entry.previewUrl} alt={entry.label} class="history-thumb" />
          <div class="history-info">
            <span class="history-step">#{i + 1}</span>
            <span class="history-label">{entry.label}</span>
          </div>
          <span class="history-size">{formatFileSize(entry.info.fileSize)}</span>
        </div>
      {/each}
    </div>
  </section>
{/if}

<style>
  .history-panel {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  h3 {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: #a3a3a3;
  }
  .history-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 250px;
    overflow-y: auto;
  }
  .history-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 10px;
    background: #1a1a16;
    border: 1px solid #2d2d26;
    border-radius: 6px;
  }
  .history-thumb {
    width: 36px;
    height: 36px;
    object-fit: cover;
    border-radius: 4px;
    background: #111110;
  }
  .history-info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    overflow: hidden;
  }
  .history-step {
    font-size: 0.7rem;
    color: #525252;
    font-weight: 600;
  }
  .history-label {
    font-size: 0.8rem;
    color: #d4d4d8;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .history-size {
    font-size: 0.7rem;
    color: #525252;
    white-space: nowrap;
  }
</style>
