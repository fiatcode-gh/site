<script lang="ts">
  import { bytesToBase64, decodeText, encodeText } from "@/lib/tools/base64";
  import CopyButton from "./CopyButton.svelte";

  const MAX_FILE_BYTES = 10 * 1024 * 1024;

  let mode: "encode" | "decode" = $state("encode");
  let urlSafe = $state(false);
  let input = $state("");

  let fileName = $state("");
  let fileBase64 = $state("");
  let fileDataUri = $state("");
  let fileError = $state("");

  const result = $derived.by(() => {
    if (input === "") return { output: "", error: "" };
    try {
      return {
        output:
          mode === "encode" ? encodeText(input, urlSafe) : decodeText(input),
        error: "",
      };
    } catch (err) {
      return {
        output: "",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });

  async function onFileChange(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    fileName = "";
    fileBase64 = "";
    fileDataUri = "";
    fileError = "";
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      fileError = "file too large (max 10 MiB)";
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    fileName = file.name;
    fileBase64 = bytesToBase64(bytes);
    fileDataUri = `data:${file.type || "application/octet-stream"};base64,${fileBase64}`;
  }
</script>

<div class="flex flex-col gap-5">
  <fieldset class="flex flex-wrap items-center gap-4">
    <legend class="sr-only">Mode</legend>
    <label class="flex items-center gap-1.5 font-mono text-xs text-ink-dim">
      <input
        type="radio"
        bind:group={mode}
        value="encode"
        class="accent-(--color-phosphor)"
      />
      encode
    </label>
    <label class="flex items-center gap-1.5 font-mono text-xs text-ink-dim">
      <input
        type="radio"
        bind:group={mode}
        value="decode"
        class="accent-(--color-phosphor)"
      />
      decode
    </label>
    {#if mode === "encode"}
      <label class="flex items-center gap-1.5 font-mono text-xs text-ink-dim">
        <input
          type="checkbox"
          bind:checked={urlSafe}
          class="accent-(--color-phosphor)"
        />
        url-safe
      </label>
    {/if}
  </fieldset>

  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
    <div class="flex flex-col gap-2">
      <label for="b64-input" class="font-mono text-xs text-ink-faint">
        {mode === "encode" ? "text" : "base64"}
      </label>
      <textarea
        id="b64-input"
        bind:value={input}
        placeholder={mode === "encode"
          ? "type or paste text…"
          : "paste base64…"}
        class="min-h-40 w-full resize-y border border-line bg-bg/40 p-3 font-mono text-sm text-ink placeholder:text-ink-faint"
      ></textarea>
    </div>
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <label for="b64-output" class="font-mono text-xs text-ink-faint">
          {mode === "encode" ? "base64" : "text"}
        </label>
        <CopyButton text={result.output} />
      </div>
      <textarea
        id="b64-output"
        readonly
        value={result.output}
        placeholder="output appears here…"
        class="min-h-40 w-full resize-y border border-line bg-bg/40 p-3 font-mono text-sm text-ink placeholder:text-ink-faint"
      ></textarea>
      {#if result.error}
        <p class="font-mono text-xs text-phosphor-deep"># {result.error}</p>
      {/if}
    </div>
  </div>

  <div class="border-t border-line-soft pt-5">
    <label for="b64-file" class="font-mono text-xs text-ink-faint">
      file → base64 (processed locally, never uploaded)
    </label>
    <input
      id="b64-file"
      type="file"
      onchange={onFileChange}
      class="mt-2 block w-full font-mono text-xs text-ink-dim file:mr-3 file:border file:border-line file:bg-surface-2 file:px-3 file:py-1.5 file:font-mono file:text-xs file:text-ink-dim"
    />
    {#if fileError}
      <p class="mt-2 font-mono text-xs text-phosphor-deep"># {fileError}</p>
    {/if}
    {#if fileBase64}
      <div class="mt-3 flex flex-col gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <span class="font-mono text-xs text-ink-dim">{fileName}</span>
          <CopyButton text={fileBase64} label="copy base64" />
          <CopyButton text={fileDataUri} label="copy data URI" />
        </div>
        <textarea
          readonly
          value={fileBase64}
          aria-label="file as base64"
          class="min-h-24 w-full resize-y border border-line bg-bg/40 p-3 font-mono text-xs text-ink"
        ></textarea>
      </div>
    {/if}
  </div>
</div>
