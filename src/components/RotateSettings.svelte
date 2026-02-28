<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import type { EffectPayload, RotateAngle } from "$lib/types";

  interface Props {
    onApply: (payload: EffectPayload) => void;
  }

  const { onApply }: Props = $props();
  const appState = getAppState();

  let angle = $state<RotateAngle>("none");
  let flipH = $state(false);
  let flipV = $state(false);

  function handleApply() {
    if (angle === "none" && !flipH && !flipV) return;
    const parts: string[] = [];
    if (angle !== "none") parts.push(`回転${angle}°`);
    if (flipH) parts.push("水平反転");
    if (flipV) parts.push("垂直反転");
    onApply({
      label: parts.join(" + "),
      rotate: { angle, flipH, flipV },
    });
  }

  let canApply = $derived(angle !== "none" || flipH || flipV);
</script>

<div class="setting-group">
  <span class="group-title">回転・反転</span>
  <div class="setting-body">
    <div class="radio-row">
      {#each [
        { value: "none", label: "なし" },
        { value: "90", label: "90°" },
        { value: "180", label: "180°" },
        { value: "270", label: "270°" },
      ] as opt}
        <label>
          <input
            type="radio"
            name="rotate-angle"
            value={opt.value}
            bind:group={angle}
            disabled={appState.isProcessing}
          />
          {opt.label}
        </label>
      {/each}
    </div>
    <div class="check-row">
      <label>
        <input
          type="checkbox"
          bind:checked={flipH}
          disabled={appState.isProcessing}
        />
        水平反転
      </label>
      <label>
        <input
          type="checkbox"
          bind:checked={flipV}
          disabled={appState.isProcessing}
        />
        垂直反転
      </label>
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
    gap: 12px;
    flex-wrap: wrap;
  }
  .radio-row label,
  .check-row label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.8rem;
    color: #a3a3a3;
    cursor: pointer;
  }
  .radio-row input[type="radio"],
  .check-row input[type="checkbox"] {
    accent-color: #a3a825;
  }
  .check-row {
    display: flex;
    gap: 16px;
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
