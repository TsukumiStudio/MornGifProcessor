<script lang="ts">
  import ResizeSettings from "./ResizeSettings.svelte";
  import CropSettings from "./CropSettings.svelte";
  import RotateSettings from "./RotateSettings.svelte";
  import SpeedSettings from "./SpeedSettings.svelte";
  import FrameEditor from "./FrameEditor.svelte";
  import ColorSettings from "./ColorSettings.svelte";
  import FilterSettings from "./FilterSettings.svelte";
  import FormatSettings from "./FormatSettings.svelte";
  import { getAppState } from "$lib/stores.svelte";
  import type { EffectPayload } from "$lib/types";

  interface Props {
    onApply: (payload: EffectPayload) => void;
  }

  const { onApply }: Props = $props();
  const appState = getAppState();

  type Tab = "basic" | "frame" | "color";
  let activeTab = $state<Tab>("basic");

  const tabs: { id: Tab; label: string }[] = [
    { id: "basic", label: "基本編集" },
    { id: "color", label: "色調・フィルタ" },
    { id: "frame", label: "フレーム編集" },
  ];
</script>

<section class="processing-form">
  <div class="tab-bar">
    {#each tabs as tab}
      <button
        class="tab-btn"
        class:active={activeTab === tab.id}
        onclick={() => (activeTab = tab.id)}
        disabled={appState.isProcessing}
      >
        {tab.label}
      </button>
    {/each}
  </div>
  <div class="tab-content" class:hidden={activeTab !== "basic"}>
    <div class="settings-grid">
      <div class="settings-col">
        <ResizeSettings {onApply} />
        <CropSettings {onApply} />
        <RotateSettings {onApply} />
      </div>
      <div class="settings-col">
        <SpeedSettings {onApply} />
        <FormatSettings {onApply} />
      </div>
    </div>
  </div>
  <div class="tab-content" class:hidden={activeTab !== "color"}>
    <div class="settings-grid">
      <div class="settings-col">
        <ColorSettings {onApply} />
      </div>
      <div class="settings-col">
        <FilterSettings {onApply} />
      </div>
    </div>
  </div>
  {#if activeTab === "frame"}
    <div class="tab-content">
      <FrameEditor {onApply} />
    </div>
  {/if}
</section>

<style>
  .processing-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .tab-bar {
    display: flex;
    gap: 0;
    border-bottom: 1px solid #3f3f36;
  }
  .tab-btn {
    padding: 8px 20px;
    border: 1px solid #3f3f36;
    border-bottom: none;
    border-radius: 6px 6px 0 0;
    background: #1a1a17;
    color: #71717a;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    margin-bottom: -1px;
    transition:
      color 0.15s,
      background 0.15s;
  }
  .tab-btn:hover:not(:disabled):not(.active) {
    color: #a3a3a3;
    background: #222220;
  }
  .tab-btn.active {
    background: #28281f;
    color: #e4e4e7;
    border-bottom: 1px solid #28281f;
  }
  .tab-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  .tab-content {
    padding: 16px 0 0;
  }
  .tab-content.hidden {
    display: none;
  }
  .settings-grid {
    display: flex;
    gap: 16px;
  }
  .settings-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
</style>
