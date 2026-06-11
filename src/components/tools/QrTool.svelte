<script lang="ts">
  import { qrMatrix, qrSvg, type Ecc } from "@/lib/tools/qr";

  let text = $state("https://fiatcode.dev");
  let ecc: Ecc = $state("M");
  let border = $state(2);
  let scale = $state(16); // px per module, for the PNG export

  const view = $derived.by(() => {
    if (text === "") return null;
    try {
      return { svg: qrSvg(text, { ecc, border }), error: "" };
    } catch (err) {
      return {
        svg: "",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadSvg() {
    if (!view?.svg) return;
    downloadBlob(new Blob([view.svg], { type: "image/svg+xml" }), "qr.svg");
  }

  function downloadPng() {
    if (!view?.svg) return;
    const { data, size } = qrMatrix(text, { ecc, border });
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000000";
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (data[y][x]) ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, "qr.png");
    }, "image/png");
  }
</script>

<div class="flex flex-col gap-5">
  <div class="flex flex-col gap-2">
    <label for="qr-text" class="font-mono text-xs text-ink-faint"
      >text / URL</label
    >
    <textarea
      id="qr-text"
      bind:value={text}
      placeholder="https://…"
      spellcheck="false"
      class="min-h-20 w-full resize-y border border-line bg-bg/40 p-3 font-mono text-sm text-ink placeholder:text-ink-faint"
    ></textarea>
  </div>

  <div class="flex flex-wrap items-center gap-4">
    <label class="flex items-center gap-1.5 font-mono text-xs text-ink-dim">
      error correction
      <select
        bind:value={ecc}
        class="border border-line bg-surface-2 px-2 py-1 font-mono text-xs text-ink-dim"
      >
        <option value="L">L (7%)</option>
        <option value="M">M (15%)</option>
        <option value="Q">Q (25%)</option>
        <option value="H">H (30%)</option>
      </select>
    </label>
    <label class="flex items-center gap-1.5 font-mono text-xs text-ink-dim">
      margin
      <input
        type="number"
        bind:value={border}
        min="0"
        max="10"
        class="w-16 border border-line bg-bg/40 px-2 py-1 font-mono text-xs text-ink"
      />
    </label>
    <label class="flex items-center gap-1.5 font-mono text-xs text-ink-dim">
      PNG scale
      <input
        type="number"
        bind:value={scale}
        min="4"
        max="40"
        class="w-16 border border-line bg-bg/40 px-2 py-1 font-mono text-xs text-ink"
      />
      <span class="text-ink-faint">px/module</span>
    </label>
  </div>

  {#if view === null}
    <p class="font-mono text-xs text-ink-faint"># type something to encode</p>
  {:else if view.error}
    <p aria-live="polite" class="font-mono text-xs text-phosphor-deep">
      # {view.error}
    </p>
  {:else}
    <div class="flex flex-col items-start gap-4 sm:flex-row">
      <!-- White backing panel keeps the code scannable on the dark theme -->
      <div class="w-full max-w-64 bg-white p-2 [&_svg]:h-auto [&_svg]:w-full">
        {@html view.svg}
      </div>
      <div class="flex flex-col gap-2">
        <button
          type="button"
          onclick={downloadSvg}
          class="border border-line bg-surface-2 px-3 py-1.5 font-mono text-xs text-ink-dim transition-colors hover:border-phosphor/60 hover:text-phosphor"
        >
          download SVG
        </button>
        <button
          type="button"
          onclick={downloadPng}
          class="border border-line bg-surface-2 px-3 py-1.5 font-mono text-xs text-ink-dim transition-colors hover:border-phosphor/60 hover:text-phosphor"
        >
          download PNG
        </button>
      </div>
    </div>
  {/if}
</div>
