<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import type { EffectPayload } from "$lib/types";

  interface Props {
    onApply: (payload: EffectPayload) => void;
  }

  const { onApply }: Props = $props();
  const appState = getAppState();

  let brightness = $state(0);
  let contrast = $state(0);
  let saturation = $state(0);

  function handleApply() {
    if (brightness === 0 && contrast === 0 && saturation === 0) return;
    onApply({
      label: "色調補正",
      color: { brightness, contrast, saturation },
    });
  }

  let canApply = $derived(brightness !== 0 || contrast !== 0 || saturation !== 0);
</script>

<div class="setting-group">
  <span class="group-title">色調補正</span>
  <div class="setting-body">
    {#each [
      { label: "明るさ", get: () => brightness, set: (v: number) => (brightness = v) },
      { label: "コントラスト", get: () => contrast, set: (v: number) => (contrast = v) },
      { label: "彩度", get: () => saturation, set: (v: number) => (saturation = v) },
    ] as item}
      <div class="slider-group">
        <div class="slider-header">
          <span class="slider-label">{item.label}</span>
          <button
            class="reset-btn"
            onclick={() => item.set(0)}
            disabled={appState.isProcessing || item.get() === 0}
          >
            リセット
          </button>
        </div>
        <div class="slider-row">
          <input
            type="range"
            min="-100"
            max="100"
            step="1"
            value={item.get()}
            oninput={(e) => item.set(parseInt((e.target as HTMLInputElement).value))}
            disabled={appState.isProcessing}
          />
          <span class="value">{item.get()}</span>
        </div>
      </div>
    {/each}
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
    gap: 12px;
    padding-left: 4px;
  }
  .slider-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .slider-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .slider-label {
    font-size: 0.75rem;
    color: #737373;
  }
  .reset-btn {
    background: none;
    border: none;
    color: #525252;
    font-size: 0.7rem;
    cursor: pointer;
    padding: 0;
  }
  .reset-btn:hover:not(:disabled) {
    color: #a3a3a3;
  }
  .reset-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .slider-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .slider-row input[type="range"] {
    flex: 1;
    accent-color: #a3a825;
  }
  .value {
    font-size: 0.8rem;
    color: #a3a3a3;
    min-width: 32px;
    text-align: right;
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
