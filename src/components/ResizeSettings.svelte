<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import type { EffectPayload } from "$lib/types";

  interface Props {
    onApply: (payload: EffectPayload) => void;
  }

  const { onApply }: Props = $props();
  const appState = getAppState();

  let mode = $state<"dimensions" | "percentage">("dimensions");
  let width = $state(appState.workingInfo?.width ?? 1);
  let height = $state(appState.workingInfo?.height ?? 1);
  let keepAspectRatio = $state(true);
  let percentage = $state(100);

  let canApply = $derived(
    mode === "percentage"
      ? percentage >= 1
      : (width > 0 && height > 0),
  );

  function handleApply() {
    if (!canApply) return;
    const label =
      mode === "percentage" ? `リサイズ (${percentage}%)` : `リサイズ (${width}x${height})`;
    onApply({
      label,
      resize: { mode, width, height, keepAspectRatio, percentage },
    });
  }
</script>

<div class="setting-group">
  <span class="group-title">リサイズ</span>
  <div class="setting-body">
    <div class="radio-row">
      <label>
        <input
          type="radio"
          name="resize-mode"
          value="dimensions"
          bind:group={mode}
          disabled={appState.isProcessing}
        />
        サイズ指定
      </label>
      <label>
        <input
          type="radio"
          name="resize-mode"
          value="percentage"
          bind:group={mode}
          disabled={appState.isProcessing}
        />
        パーセント指定
      </label>
    </div>
    {#if mode === "dimensions"}
      <div class="input-row">
        <label class="input-label">
          幅
          <input
            type="number"
            bind:value={width}
            min="1"
            step="1"
            disabled={appState.isProcessing}
            class="num-input"
          />
        </label>
        <span class="separator">x</span>
        <label class="input-label">
          高さ
          <input
            type="number"
            bind:value={height}
            min="1"
            step="1"
            disabled={appState.isProcessing}
            class="num-input"
          />
        </label>
      </div>
      <label class="sub-toggle">
        <input
          type="checkbox"
          bind:checked={keepAspectRatio}
          disabled={appState.isProcessing}
        />
        アスペクト比を維持
      </label>
    {:else}
      <div class="slider-row">
        <input
          type="range"
          min="1"
          max="400"
          step="1"
          bind:value={percentage}
          disabled={appState.isProcessing}
        />
        <input
          type="number"
          bind:value={percentage}
          min="1"
          max="400"
          step="1"
          disabled={appState.isProcessing}
          class="num-input small"
        />
        <span class="unit">%</span>
      </div>
    {/if}
    <button class="apply-btn" onclick={handleApply} disabled={appState.isProcessing || !canApply}>
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
    gap: 8px;
    padding-left: 4px;
  }
  .radio-row {
    display: flex;
    gap: 16px;
  }
  .radio-row label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.8rem;
    color: #a3a3a3;
    cursor: pointer;
  }
  .radio-row input[type="radio"] {
    accent-color: #a3a825;
  }
  .input-row {
    display: flex;
    align-items: flex-end;
    gap: 8px;
  }
  .input-label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 0.75rem;
    color: #737373;
  }
  .separator {
    font-size: 0.9rem;
    color: #737373;
    padding-bottom: 6px;
  }
  .num-input {
    width: 80px;
    padding: 6px 8px;
    border-radius: 4px;
    border: 1px solid #3f3f36;
    background: #1a1a17;
    color: #e4e4e7;
    font-size: 0.85rem;
  }
  .num-input.small {
    width: 60px;
  }
  .sub-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    color: #737373;
    cursor: pointer;
  }
  .sub-toggle input[type="checkbox"] {
    accent-color: #a3a825;
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
  .unit {
    font-size: 0.8rem;
    color: #737373;
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
