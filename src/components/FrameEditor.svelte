<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { getAppState } from "$lib/stores.svelte";
  import { extractFrames, resetFFmpeg } from "$lib/commands";
  import type { EffectPayload } from "$lib/types";

  interface Props {
    onApply: (payload: EffectPayload) => void;
  }

  const { onApply }: Props = $props();
  const appState = getAppState();

  let frameUrls = $state<string[]>([]);
  let similarities = $state<number[]>([]);
  let selectedFrames = $state<Set<number>>(new Set());
  let isExtracting = $state(false);
  let currentFrame = $state(0);
  let nthValue = $state(2);
  let similarityThreshold = $state(95.0);

  let selectedCount = $derived(selectedFrames.size);
  let canApply = $derived(selectedCount > 0 && selectedCount < frameUrls.length);
  let aboveThresholdCount = $derived(() => {
    return similarities.filter((s) => s >= similarityThreshold).length;
  });

  function handleKeydown(e: KeyboardEvent) {
    if (frameUrls.length === 0) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevFrame();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      nextFrame();
    }
  }

  onMount(() => {
    if (appState.workingBlob && appState.workingInfo && frameUrls.length === 0) {
      handleExtract();
    }
    window.addEventListener("keydown", handleKeydown);
  });

  onDestroy(() => {
    window.removeEventListener("keydown", handleKeydown);
  });

  async function loadImage(url: string): Promise<HTMLImageElement> {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  }

  function getPixelData(
    img: HTMLImageElement,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
  ): Uint8ClampedArray {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  }

  function computePixelSimilarity(
    data1: Uint8ClampedArray,
    data2: Uint8ClampedArray,
  ): number {
    if (data1.length !== data2.length) return 0;
    const totalPixels = data1.length / 4;
    let matching = 0;
    for (let i = 0; i < data1.length; i += 4) {
      const dr = Math.abs(data1[i] - data2[i]);
      const dg = Math.abs(data1[i + 1] - data2[i + 1]);
      const db = Math.abs(data1[i + 2] - data2[i + 2]);
      if (dr <= 3 && dg <= 3 && db <= 3) matching++;
    }
    return (matching / totalPixels) * 100;
  }

  async function computeSimilarities(urls: string[]) {
    if (urls.length < 2) {
      similarities = [];
      return;
    }
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const result: number[] = [];

    let prevData = getPixelData(await loadImage(urls[0]), canvas, ctx);
    for (let i = 1; i < urls.length; i++) {
      const curData = getPixelData(await loadImage(urls[i]), canvas, ctx);
      result.push(Math.round(computePixelSimilarity(prevData, curData) * 10) / 10);
      prevData = curData;
    }
    similarities = result;
  }

  async function handleExtract() {
    if (!appState.workingBlob || !appState.workingInfo) return;
    isExtracting = true;
    try {
      await resetFFmpeg();
      const urls = await extractFrames(
        appState.workingBlob,
        appState.workingInfo.name,
        appState.workingInfo.frameCount,
      );
      for (const url of frameUrls) URL.revokeObjectURL(url);
      frameUrls = urls;
      selectedFrames = new Set();
      currentFrame = 0;
      await computeSimilarities(urls);
    } catch (e) {
      console.error("フレーム抽出に失敗:", e);
    } finally {
      isExtracting = false;
    }
  }

  function toggleFrame(index: number) {
    const next = new Set(selectedFrames);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    selectedFrames = next;
  }

  function selectEveryNth() {
    if (nthValue < 2) return;
    const next = new Set(selectedFrames);
    for (let i = 0; i < frameUrls.length; i++) {
      if ((i + 1) % nthValue === 0) {
        next.add(i);
      }
    }
    selectedFrames = next;
  }

  function selectSimilar() {
    const next = new Set(selectedFrames);
    for (let i = 0; i < similarities.length; i++) {
      if (similarities[i] >= similarityThreshold) {
        next.add(i + 1);
      }
    }
    selectedFrames = next;
  }

  function clearSelection() {
    selectedFrames = new Set();
  }

  function prevFrame() {
    if (currentFrame > 0) currentFrame--;
  }

  function nextFrame() {
    if (currentFrame < frameUrls.length - 1) currentFrame++;
  }

  function handleApply() {
    if (!canApply) return;
    const indices = Array.from(selectedFrames).sort((a, b) => a - b);
    const remaining = frameUrls.length - indices.length;
    onApply({
      label: `フレーム削除 (${indices.length}フレーム削除, 残り${remaining})`,
      frameDelete: { frameIndices: indices },
    });
  }
</script>

<div class="frame-editor">
  {#if isExtracting}
    <div class="loading">
      <p>フレームを読み込み中...</p>
    </div>
  {:else if frameUrls.length === 0}
    <div class="loading">
      <p>フレームデータがありません</p>
    </div>
  {:else}
    <!-- Current frame preview -->
    <div class="preview-section">
      <div class="preview-nav">
        <button class="nav-btn" onclick={prevFrame} disabled={currentFrame === 0}>
          ←
        </button>
        <div class="preview-center">
          <div class="preview-image">
            <img src={frameUrls[currentFrame]} alt="Frame {currentFrame + 1}" />
          </div>
          <div class="preview-info">
            <span class="frame-counter">
              フレーム {currentFrame + 1} / {frameUrls.length}
            </span>
            {#if selectedFrames.has(currentFrame)}
              <span class="delete-badge">削除対象</span>
            {/if}
            {#if currentFrame > 0 && similarities[currentFrame - 1] !== undefined}
              <span class="similarity-badge">
                類似度: {similarities[currentFrame - 1]}%
              </span>
            {/if}
          </div>
        </div>
        <button class="nav-btn" onclick={nextFrame} disabled={currentFrame === frameUrls.length - 1}>
          →
        </button>
      </div>
      <p class="tips">← → キーでもフレーム送りできます</p>
    </div>

    <!-- Thumbnail grid with checkboxes -->
    <div class="grid-section">
      <div class="grid-header">
        <span class="grid-label">
          {selectedCount > 0 ? `${selectedCount}フレームを削除対象に選択中` : "削除するフレームにチェックを入れてください"}
        </span>
      </div>
      <div class="frame-grid">
        {#each frameUrls as url, i}
          <div
            class="frame-item"
            class:current={currentFrame === i}
          >
            <button class="thumb-btn" onclick={() => { currentFrame = i; }}>
              <img src={url} alt="Frame {i + 1}" />
              {#if selectedFrames.has(i)}
                <div class="thumb-overlay"></div>
              {/if}
            </button>
            <label class="frame-check">
              <input
                type="checkbox"
                checked={selectedFrames.has(i)}
                onchange={() => toggleFrame(i)}
              />
              <span class="thumb-number">{i + 1}</span>
              {#if i > 0 && similarities[i - 1] !== undefined}
                <span class="thumb-sim">{similarities[i - 1]}%</span>
              {/if}
            </label>
          </div>
        {/each}
      </div>
    </div>

    <!-- Auto-selection controls -->
    <div class="controls">
      <span class="controls-title">自動選択</span>

      <div class="auto-group">
        <div class="auto-row">
          <input
            type="number"
            bind:value={nthValue}
            min="2"
            max={frameUrls.length}
            step="1"
            class="num-input"
          />
          <span class="auto-label">フレームおきに選択</span>
          <button class="ctrl-btn" onclick={selectEveryNth}>
            実行
          </button>
        </div>
      </div>

      <div class="auto-group">
        <div class="auto-row">
          <span class="auto-label">前フレームとの類似度</span>
          <input
            type="number"
            bind:value={similarityThreshold}
            min="0"
            max="100"
            step="0.1"
            class="num-input wide"
          />
          <span class="auto-label">%以上を選択</span>
          <button class="ctrl-btn" onclick={selectSimilar} disabled={aboveThresholdCount() === 0}>
            実行{#if aboveThresholdCount() > 0}（{aboveThresholdCount()}件）{/if}
          </button>
        </div>
      </div>

      <div class="action-row">
        <button class="ctrl-btn" onclick={clearSelection} disabled={selectedCount === 0}>
          選択をすべて解除
        </button>
        <button class="ctrl-btn" onclick={handleExtract} disabled={appState.isProcessing}>
          再読み込み
        </button>
      </div>
    </div>

    <button
      class="apply-btn"
      onclick={handleApply}
      disabled={appState.isProcessing || !canApply}
    >
      プレビュー ({selectedCount}フレーム削除)
    </button>
  {/if}
</div>

<style>
  .frame-editor {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .loading {
    padding: 20px;
    text-align: center;
    color: #737373;
    font-size: 0.85rem;
  }

  .tips {
    margin: 0;
    text-align: center;
    font-size: 0.7rem;
    color: #525252;
  }

  /* Preview nav: arrows stay fixed, center area is flexible */
  .preview-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .preview-nav {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .nav-btn {
    padding: 8px 14px;
    border-radius: 4px;
    border: 1px solid #3f3f36;
    background: #1a1a17;
    color: #a3a3a3;
    font-size: 1rem;
    cursor: pointer;
    flex-shrink: 0;
    align-self: center;
  }
  .nav-btn:hover:not(:disabled) {
    background: #28281f;
    color: #e4e4e7;
  }
  .nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .preview-center {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .preview-info {
    display: flex;
    align-items: center;
    gap: 6px;
    justify-content: center;
    flex-wrap: wrap;
    min-height: 22px;
  }
  .frame-counter {
    font-size: 0.8rem;
    color: #a3a3a3;
  }
  .delete-badge {
    font-size: 0.7rem;
    background: #ef444422;
    color: #ef4444;
    border: 1px solid #ef444433;
    padding: 1px 6px;
    border-radius: 4px;
  }
  .similarity-badge {
    font-size: 0.7rem;
    background: #3b82f622;
    color: #3b82f6;
    border: 1px solid #3b82f633;
    padding: 1px 6px;
    border-radius: 4px;
  }
  .preview-image {
    display: flex;
    justify-content: center;
    background: #0a0a09;
    border: 1px solid #28281f;
    border-radius: 6px;
    padding: 8px;
    min-height: 120px;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
  }
  .preview-image img {
    max-width: 100%;
    max-height: 200px;
    image-rendering: pixelated;
  }

  /* Grid */
  .grid-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .grid-header {
    display: flex;
    align-items: center;
  }
  .grid-label {
    font-size: 0.75rem;
    color: #737373;
  }
  .frame-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
    gap: 4px;
    max-height: 300px;
    overflow-y: auto;
    background: #0a0a09;
    border: 1px solid #28281f;
    border-radius: 6px;
    padding: 6px;
  }
  .frame-item {
    position: relative;
    border: 2px solid transparent;
    border-radius: 4px;
    background: #1a1a17;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .frame-item.current {
    border-color: #a3a825;
  }
  .thumb-btn {
    position: relative;
    border: none;
    background: none;
    padding: 0;
    cursor: pointer;
    aspect-ratio: 1;
    overflow: hidden;
  }
  .thumb-btn img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
  .thumb-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    pointer-events: none;
  }
  .frame-check {
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 2px 4px;
    background: #111110;
    cursor: pointer;
    font-size: 0.6rem;
    color: #a3a3a3;
  }
  .frame-check input[type="checkbox"] {
    accent-color: #ef4444;
    margin: 0;
    width: 12px;
    height: 12px;
  }
  .thumb-number {
    line-height: 1;
  }
  .thumb-sim {
    margin-left: auto;
    font-size: 0.55rem;
    color: #525252;
  }

  /* Controls */
  .controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px 0;
    border-top: 1px solid #28281f;
  }
  .controls-title {
    font-size: 0.8rem;
    font-weight: 500;
    color: #a3a3a3;
  }
  .auto-group {
    padding-left: 4px;
  }
  .auto-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .auto-label {
    font-size: 0.8rem;
    color: #a3a3a3;
  }
  .num-input {
    width: 50px;
    padding: 4px 6px;
    border-radius: 4px;
    border: 1px solid #3f3f36;
    background: #1a1a17;
    color: #e4e4e7;
    font-size: 0.85rem;
  }
  .num-input.wide {
    width: 60px;
  }
  .action-row {
    display: flex;
    gap: 6px;
    padding-left: 4px;
  }
  .ctrl-btn {
    padding: 4px 12px;
    border-radius: 4px;
    border: 1px solid #3f3f36;
    background: #1a1a17;
    color: #a3a3a3;
    font-size: 0.75rem;
    cursor: pointer;
    white-space: nowrap;
  }
  .ctrl-btn:hover:not(:disabled) {
    background: #28281f;
    color: #e4e4e7;
  }
  .ctrl-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
