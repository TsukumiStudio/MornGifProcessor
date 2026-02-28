<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import type { EffectPayload } from "$lib/types";

  interface Props {
    onApply: (payload: EffectPayload) => void;
  }

  const { onApply }: Props = $props();
  const appState = getAppState();

  let multiplier = $state(1);
  let reverseEnabled = $state(false);

  const presets = [0.5, 1, 2, 4];

  function handleApply() {
    if (multiplier === 1 && !reverseEnabled) return;
    const parts: string[] = [];
    if (multiplier !== 1) parts.push(`速度${multiplier}x`);
    if (reverseEnabled) parts.push("逆再生");
    onApply({
      label: parts.join(" + "),
      speed: multiplier !== 1 ? { multiplier } : undefined,
      reverse: reverseEnabled || undefined,
    });
  }

  let canApply = $derived(multiplier !== 1 || reverseEnabled);
</script>

<div class="setting-group">
  <span class="group-title">速度変更・逆再生</span>
  <div class="setting-body">
    <div class="slider-row">
      <input
        type="range"
        min="0.25"
        max="4"
        step="0.25"
        bind:value={multiplier}
        disabled={appState.isProcessing}
      />
      <input
        type="number"
        bind:value={multiplier}
        min="0.25"
        max="4"
        step="0.25"
        disabled={appState.isProcessing}
        class="num-input"
      />
      <span class="unit">x</span>
    </div>
    <div class="preset-row">
      {#each presets as p}
        <button
          class="preset-btn"
          class:active={multiplier === p}
          onclick={() => (multiplier = p)}
          disabled={appState.isProcessing}
        >
          {p}x
        </button>
      {/each}
    </div>
    <label class="toggle-label">
      <input
        type="checkbox"
        bind:checked={reverseEnabled}
        disabled={appState.isProcessing}
      />
      逆再生
    </label>
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
    gap: 8px;
    padding-left: 4px;
  }
  .toggle-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    color: #a3a3a3;
    cursor: pointer;
  }
  .toggle-label input[type="checkbox"] {
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
  .num-input {
    width: 60px;
    padding: 6px 8px;
    border-radius: 4px;
    border: 1px solid #3f3f36;
    background: #1a1a17;
    color: #e4e4e7;
    font-size: 0.85rem;
  }
  .unit {
    font-size: 0.8rem;
    color: #737373;
  }
  .preset-row {
    display: flex;
    gap: 6px;
  }
  .preset-btn {
    padding: 4px 12px;
    border-radius: 4px;
    border: 1px solid #3f3f36;
    background: #1a1a17;
    color: #a3a3a3;
    font-size: 0.75rem;
    cursor: pointer;
    box-shadow: none;
  }
  .preset-btn:hover:not(:disabled) {
    background: #28281f;
    color: #e4e4e7;
  }
  .preset-btn.active {
    background: #a3a825;
    border-color: #a3a825;
    color: #111110;
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
