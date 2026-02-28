<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import type { EffectPayload } from "$lib/types";

  interface Props {
    onApply: (payload: EffectPayload) => void;
  }

  const { onApply }: Props = $props();
  const appState = getAppState();

  let grayscale = $state(false);
  let sepia = $state(false);
  let negate = $state(false);
  let blurEnabled = $state(false);
  let blurSigma = $state(2);
  let sharpen = $state(false);

  function handleApply() {
    if (!grayscale && !sepia && !negate && !blurEnabled && !sharpen) return;
    const parts: string[] = [];
    if (grayscale) parts.push("グレースケール");
    if (sepia) parts.push("セピア");
    if (negate) parts.push("色反転");
    if (blurEnabled) parts.push(`ぼかし(${blurSigma.toFixed(1)})`);
    if (sharpen) parts.push("シャープ");
    onApply({
      label: parts.join(" + "),
      filter: {
        grayscale,
        sepia,
        negate,
        blur: blurEnabled ? blurSigma : null,
        sharpen,
      },
    });
  }

  let canApply = $derived(grayscale || sepia || negate || blurEnabled || sharpen);
</script>

<div class="setting-group">
  <span class="group-title">フィルタ</span>
  <div class="filter-list">
    <label class="filter-item">
      <input
        type="checkbox"
        bind:checked={grayscale}
        disabled={appState.isProcessing}
      />
      グレースケール
    </label>
    <label class="filter-item">
      <input
        type="checkbox"
        bind:checked={sepia}
        disabled={appState.isProcessing}
      />
      セピア
    </label>
    <label class="filter-item">
      <input
        type="checkbox"
        bind:checked={negate}
        disabled={appState.isProcessing}
      />
      色反転
    </label>
    <label class="filter-item">
      <input
        type="checkbox"
        bind:checked={sharpen}
        disabled={appState.isProcessing}
      />
      シャープ化
    </label>
    <div class="blur-group">
      <label class="filter-item">
        <input
          type="checkbox"
          bind:checked={blurEnabled}
          disabled={appState.isProcessing}
        />
        ぼかし
      </label>
      {#if blurEnabled}
        <div class="slider-row">
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            bind:value={blurSigma}
            disabled={appState.isProcessing}
          />
          <span class="value">{blurSigma.toFixed(1)}</span>
        </div>
      {/if}
    </div>
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
    gap: 8px;
  }
  .group-title {
    font-size: 0.8rem;
    font-weight: 500;
    color: #a3a3a3;
  }
  .filter-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-left: 4px;
  }
  .filter-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    color: #a3a3a3;
    cursor: pointer;
  }
  .filter-item input[type="checkbox"] {
    accent-color: #a3a825;
  }
  .blur-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .slider-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-left: 22px;
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
