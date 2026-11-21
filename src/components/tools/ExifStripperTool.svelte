<script lang="ts">
  import { onDestroy } from "svelte";
  import ExifReader from "exifreader";
  import {
    cleanedFilename,
    summarizeTags,
    targetMime,
    type MetadataField,
  } from "@/lib/tools/exif";

  let original: File | null = $state(null);
  let fields: MetadataField[] = $state([]);
  let cleanedUrl = $state("");
  let cleanedName = $state("");
  let cleanedSize = $state(0);
  let mime = $state("");
  let quality = $state(0.92);
  let error = $state("");
  let busy = $state(false);
  let dragging = $state(false);

  const lossy = $derived(mime === "image/jpeg" || mime === "image/webp");

  // Bumped on every process() call so a superseded run (user dropped a new
  // file mid-processing) bails instead of interleaving its state writes.
  let generation = 0;

  async function process(file: File) {
    const gen = ++generation;
    error = "";
    busy = true;
    fields = [];
    if (cleanedUrl) URL.revokeObjectURL(cleanedUrl);
    cleanedUrl = "";
    original = file;
    try {
      const buffer = await file.arrayBuffer();
      if (gen !== generation) return;
      try {
        fields = summarizeTags(ExifReader.load(buffer));
      } catch {
        fields = []; // unreadable/absent metadata is not an error
      }
      // "from-image" bakes the EXIF orientation into the pixels BEFORE the
      // tag is discarded — otherwise portrait phone photos download sideways
      // on engines whose default resolves to "none".
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      if (gen !== generation) {
        bitmap.close();
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
      bitmap.close();
      mime = targetMime(file.type);
      const isLossy = mime === "image/jpeg" || mime === "image/webp";
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, mime, isLossy ? quality : undefined),
      );
      if (gen !== generation) return;
      if (!blob) throw new Error("re-encode failed");
      cleanedUrl = URL.createObjectURL(blob);
      cleanedName = cleanedFilename(file.name, mime);
      cleanedSize = blob.size;
    } catch (err) {
      if (gen !== generation) return;
      original = null;
      error =
        err instanceof Error
          ? `could not process this file — ${err.message}`
          : "could not process this file";
    } finally {
      if (gen === generation) busy = false;
    }
  }

  onDestroy(() => {
    if (cleanedUrl) URL.revokeObjectURL(cleanedUrl);
  });

  function onFileChange(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (file) process(file);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    dragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) process(file);
  }

  function onQualityChange() {
    if (original) process(original);
  }

  function formatBytes(n: number): string {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KiB`;
    return `${(n / (1024 * 1024)).toFixed(2)} MiB`;
  }
</script>

<div class="flex flex-col gap-5">
  <label
    for="exif-file"
    ondragover={(e) => {
      e.preventDefault();
      dragging = true;
    }}
    ondragleave={() => (dragging = false)}
    ondrop={onDrop}
    class={`block cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-fn border border-dashed p-10 text-center motion-safe:transition-colors ${
      dragging
        ? "border-fg bg-mark"
        : "border-line bg-raised hover:border-line-strong"
    }`}
  >
    <span class="font-mono text-sm text-muted">
      <span class="text-fg" aria-hidden="true">$</span> drop an image here, or click
      to choose
    </span>
    <input
      id="exif-file"
      type="file"
      accept="image/*"
      onchange={onFileChange}
      class="sr-only"
    />
  </label>

  {#if error}
    <p aria-live="polite" class="font-mono text-xs text-fg">{error}</p>
  {/if}
  {#if busy}
    <p class="font-mono text-xs text-faint">processing…</p>
  {/if}

  {#if original && !busy && cleanedUrl}
    <div class="flex flex-col gap-2">
      <h2 class="font-mono text-xs text-faint">
        metadata found: {fields.length} field{fields.length === 1 ? "" : "s"}
      </h2>
      {#if fields.length > 0}
        <div class="max-h-64 overflow-auto border border-line">
          <table class="w-full font-mono text-xs">
            <tbody class="divide-y divide-line">
              {#each fields as field (field.name)}
                <tr>
                  <td class="px-3 py-1.5 align-top whitespace-nowrap text-fg">
                    {field.name}
                  </td>
                  <td class="px-3 py-1.5 align-top break-all text-muted">
                    {field.description}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <p class="font-mono text-xs text-faint">
          no readable metadata — the re-encoded copy is still guaranteed clean
        </p>
      {/if}
    </div>

    <div class="flex flex-col gap-3 border-t border-line pt-5">
      {#if lossy}
        <label
          class="flex items-center gap-3 font-mono text-xs text-muted max-[620px]:min-h-10"
        >
          quality
          <input
            type="range"
            min="0.5"
            max="1"
            step="0.01"
            bind:value={quality}
            onchange={onQualityChange}
            class="accent-(--color-fn)"
          />
          <span class="text-fg">{quality.toFixed(2)}</span>
        </label>
        <p class="font-mono text-xs text-faint">
          {mime === "image/jpeg" ? "JPEG" : "WebP"} re-encoding is lossy — quality
          is kept high by default
        </p>
      {/if}
      <div class="flex flex-wrap items-center gap-3">
        <a
          href={cleanedUrl}
          download={cleanedName}
          class="tool-btn inline-flex items-center border-fg bg-mark text-fg no-underline hover:bg-hover"
        >
          download {cleanedName}
        </a>
        <span class="font-mono text-xs text-faint">
          {formatBytes(original.size)} → {formatBytes(cleanedSize)}
        </span>
      </div>
    </div>
  {/if}
</div>
