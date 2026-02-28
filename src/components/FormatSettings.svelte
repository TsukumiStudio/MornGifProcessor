<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import type { EffectPayload } from "$lib/types";

  interface Props {
    onApply: (payload: EffectPayload) => void;
  }

  const { onApply }: Props = $props();
  const appState = getAppState();

  const currentColors = $derived(appState.workingInfo?.colorCount ?? 256);
  let maxColors = $state(256);
  let reduceColors = $state(false);

  $effect(() => {
    maxColors = currentColors;
  });

  function handleApply() {
    const payload: EffectPayload = {
      label: `色数制限 (${maxColors}色)`,
      optimize: { maxColors },
    };
    onApply(payload);
  }

  const canApply = $derived(reduceColors && maxColors < currentColors);
</script>

<div class="setting-group">
  <span class="group-title">色数制限</span>
  <div class="setting-body">
    <label class="checkbox-row">
      <input
        type="checkbox"
        bind:checked={reduceColors}
        disabled={appState.isProcessing}
      />
      <span>色数を制限する</span>
    </label>
    {#if reduceColors}
      <div class="color-info">
        <span class="current-colors">現在の色数: {currentColors}</span>
      </div>
      <div class="slider-row">
        <input
          type="range"
          min="4"
          max={currentColors}
          step="1"
          bind:value={maxColors}
          disabled={appState.isProcessing}
        />
        <input
          type="number"
          bind:value={maxColors}
          min="4"
          max={currentColors}
          step="1"
          disabled={appState.isProcessing}
          class="num-input"
        />
      </div>
    {/if}

    <button
      class="apply-btn"
      onclick={handleApply}
      disabled={appState.isProcessing || !canApply}
    >
      プレビュー
    </button>
  </div>
</div>

<style>
  .setting-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .group-title {
    font-size: 0.8rem;
    font-weight: 500;
    color: #a3a3a3;
  }
  .setting-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-left: 4px;
  }
  .checkbox-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    color: #d4d4d8;
    cursor: pointer;
  }
  .checkbox-row input[type="checkbox"] {
    accent-color: #a3a825;
  }
  .color-info {
    padding-left: 4px;
  }
  .current-colors {
    font-size: 0.75rem;
    color: #737373;
  }
  .slider-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-left: 4px;
  }
  .slider-row input[type="range"] {
    flex: 1;
    accent-color: #a3a825;
  }
  .num-input {
    width: 60px;
    padding: 6px 8px;
    border-radius: 4px;
    border: 1px solid #3f3f36;
    background: #1a1a17;
    color: #e4e4e7;
    font-size: 0.85rem;
  }
  .apply-btn {
    align-self: flex-start;
    padding: 6px 20px;
    border-radius: 6px;
    border: none;
    background: #a3a825;
    color: white;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: none;
  }
  .apply-btn:hover:not(:disabled) {
    background: #8a8c2a;
  }
  .apply-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
