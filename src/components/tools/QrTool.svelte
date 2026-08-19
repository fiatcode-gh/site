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
    // Typed values bypass the input's min/max; an oversized canvas makes
    // toBlob fail silently, so clamp before sizing it.
    const s = Number.isFinite(scale)
      ? Math.max(4, Math.min(40, Math.floor(scale)))
      : 16;
    const { data, size } = qrMatrix(text, { ecc, border });
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size * s;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000000";
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (data[y][x]) ctx.fillRect(x * s, y * s, s, s);
      }
    }
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, "qr.png");
    }, "image/png");
  }
</script>

<div class="flex flex-col gap-5">
  <div class="flex flex-col gap-2">
    <label for="qr-text" class="font-mono text-xs text-ink-55">text / URL</label
    >
    <textarea
      id="qr-text"
      bind:value={text}
      placeholder="https://…"
      spellcheck="false"
      class="min-h-20 w-full resize-y border border-rule bg-code p-3 font-mono text-sm text-ink placeholder:text-ink-55"
    ></textarea>
  </div>

  <div class="flex flex-wrap items-center gap-4">
    <label class="flex items-center gap-1.5 font-mono text-xs text-ink-62">
      error correction
      <select
        bind:value={ecc}
        class="border border-rule bg-code px-2 py-1 font-mono text-xs text-ink-62"
      >
        <option value="L">L (7%)</option>
        <option value="M">M (15%)</option>
        <option value="Q">Q (25%)</option>
        <option value="H">H (30%)</option>
      </select>
    </label>
    <label class="flex items-center gap-1.5 font-mono text-xs text-ink-62">
      margin
      <input
        type="number"
        bind:value={border}
        min="0"
        max="10"
        class="w-16 border border-rule bg-code px-2 py-1 font-mono text-xs text-ink"
      />
    </label>
    <label class="flex items-center gap-1.5 font-mono text-xs text-ink-62">
      PNG scale
      <input
        type="number"
        bind:value={scale}
        min="4"
        max="40"
        class="w-16 border border-rule bg-code px-2 py-1 font-mono text-xs text-ink"
      />
      <span class="text-ink-55">px/module</span>
    </label>
  </div>

  {#if view === null}
    <p class="font-mono text-xs text-ink-55">type something to encode</p>
  {:else if view.error}
    <p aria-live="polite" class="font-mono text-xs text-ink">{view.error}</p>
  {:else}
    <div class="flex flex-col items-start gap-4 sm:flex-row">
      <!--
        Stays pure white rather than paper: the quiet zone around a QR code
        is what scanners key on, so it wants maximum contrast, not the
        surrounding surface colour. The 1px --rule hairline is the same
        border every other output surface and prose image carries.
      -->
      <div
        class="w-full max-w-64 border border-rule bg-white p-2 [&_svg]:h-auto [&_svg]:w-full"
      >
        {@html view.svg}
      </div>
      <div class="flex flex-col gap-2">
        <button
          type="button"
          onclick={downloadSvg}
          class="border border-rule bg-code px-3 py-1.5 font-mono text-xs text-ink-62 transition-colors hover:border-ink hover:text-ink"
        >
          download SVG
        </button>
        <button
          type="button"
          onclick={downloadPng}
          class="border border-rule bg-code px-3 py-1.5 font-mono text-xs text-ink-62 transition-colors hover:border-ink hover:text-ink"
        >
          download PNG
        </button>
      </div>
    </div>
  {/if}
</div>
