<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import type { EffectPayload } from "$lib/types";

  interface Props {
    onApply: (payload: EffectPayload) => void;
  }

  const { onApply }: Props = $props();
  const appState = getAppState();

  let x = $state(0);
  let y = $state(0);
  let w = $state(appState.workingInfo?.width ?? 1);
  let h = $state(appState.workingInfo?.height ?? 1);

  function handleApply() {
    if (w <= 0 || h <= 0) return;
    onApply({
      label: `クロップ (${w}x${h})`,
      crop: { x, y, width: w, height: h },
    });
  }
</script>

<div class="setting-group">
  <span class="group-title">クロップ（切り抜き）</span>
  <div class="setting-body">
    <div class="input-grid">
      <label class="input-label">
        X
        <input
          type="number"
          bind:value={x}
          min="0"
          step="1"
          disabled={appState.isProcessing}
          class="num-input"
        />
      </label>
      <label class="input-label">
        Y
        <input
          type="number"
          bind:value={y}
          min="0"
          step="1"
          disabled={appState.isProcessing}
          class="num-input"
        />
      </label>
      <label class="input-label">
        幅
        <input
          type="number"
          bind:value={w}
          min="0"
          step="1"
          disabled={appState.isProcessing}
          class="num-input"
        />
      </label>
      <label class="input-label">
        高さ
        <input
          type="number"
          bind:value={h}
          min="0"
          step="1"
          disabled={appState.isProcessing}
          class="num-input"
        />
      </label>
    </div>
    <p class="hint">現在の画像の座標系で指定してください</p>
    <button
      class="apply-btn"
      onclick={handleApply}
      disabled={appState.isProcessing || w <= 0 || h <= 0}
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
    gap: 8px;
    padding-left: 4px;
  }
  .input-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .input-label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 0.75rem;
    color: #737373;
  }
  .num-input {
    width: 100%;
    padding: 6px 8px;
    border-radius: 4px;
    border: 1px solid #3f3f36;
    background: #1a1a17;
    color: #e4e4e7;
    font-size: 0.85rem;
    box-sizing: border-box;
  }
  .hint {
    font-size: 0.7rem;
    color: #525252;
    margin: 0;
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
