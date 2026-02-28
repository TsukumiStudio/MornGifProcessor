<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";

  interface Props {
    onFileSelected: (file: File) => void;
  }

  const { onFileSelected }: Props = $props();
  const appState = getAppState();

  const SUPPORTED_EXTENSIONS = [".gif", ".apng", ".png"];

  let fileInput: HTMLInputElement;

  function handleFile(file: File) {
    const ext = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) return;
    onFileSelected(file);
  }

  function handleFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      handleFile(input.files[0]);
      input.value = "";
    }
  }

  export function openFileDialog() {
    fileInput.click();
  }
</script>

<input
  bind:this={fileInput}
  type="file"
  accept=".gif,.apng,.png"
  onchange={handleFileInput}
  style="display: none;"
/>

{#if appState.phase === "empty"}
  <div
    class="dropzone"
    class:drag-over={appState.isDragging}
    role="button"
    tabindex="0"
    onclick={openFileDialog}
    onkeydown={(e) => {
      if (e.key === "Enter" || e.key === " ") openFileDialog();
    }}
  >
    <div class="dropzone-content">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
      {#if appState.isDragging}
        <p class="main-text">ここにドロップ</p>
      {:else}
        <p class="main-text">ドラッグ&ドロップ または クリックしてファイルを選択</p>
      {/if}
      <p class="sub-text">対応形式: GIF, APNG</p>
    </div>
  </div>
{/if}

<style>
  .dropzone {
    border: 2px dashed #404040;
    border-radius: 12px;
    padding: 32px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: #1a1a16;
  }
  .dropzone:hover,
  .dropzone.drag-over {
    border-color: #a3a825;
    background: #1a1c0f;
  }
  .dropzone-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: #a3a3a3;
  }
  .main-text {
    font-size: 1rem;
    font-weight: 500;
    color: #d4d4d8;
    margin: 0;
  }
  .sub-text {
    font-size: 0.8rem;
    color: #737373;
    margin: 0;
  }
</style>
