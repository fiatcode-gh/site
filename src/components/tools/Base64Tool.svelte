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
  let fileInput: HTMLInputElement | undefined = $state();

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

<!-- Mode strip. url-safe is a toggle, not a mode, so it reports pressed state. -->
<div class="ruled-flex band">
  <button
    type="button"
    class="mode"
    data-active={mode === "encode" ? "" : undefined}
    aria-pressed={mode === "encode"}
    onclick={() => (mode = "encode")}
  >
    encode
  </button>
  <button
    type="button"
    class="mode"
    data-active={mode === "decode" ? "" : undefined}
    aria-pressed={mode === "decode"}
    onclick={() => (mode = "decode")}
  >
    decode
  </button>
  <button
    type="button"
    class="mode"
    data-active={urlSafe ? "" : undefined}
    aria-pressed={urlSafe}
    disabled={mode === "decode"}
    onclick={() => (urlSafe = !urlSafe)}
  >
    url-safe
  </button>
  <button type="button" class="mode" onclick={() => fileInput?.click()}>
    from file…
  </button>
</div>

<div class="ruled band grid-cols-2 max-[619px]:grid-cols-1">
  <div class="cell px-[26px] py-4">
    <div class="pane-head">
      <label for="b64-input">{mode === "encode" ? "Input" : "Base64"}</label>
      <span class="text-ink-55">{input.length} chars</span>
    </div>
    <textarea
      id="b64-input"
      bind:value={input}
      spellcheck="false"
      placeholder={mode === "encode" ? "type or paste text…" : "paste base64…"}
      class="pane min-h-[200px]"></textarea>
  </div>

  <div class="cell px-[26px] py-4">
    <div class="pane-head">
      <span>Output</span>
      <CopyButton text={result.output} />
    </div>
    <div class="pane-out">{result.output}</div>
    {#if result.error}
      <p aria-live="polite" class="tool-error mt-3">{result.error}</p>
    {/if}
  </div>
</div>

<!-- File input is driven by the `from file…` mode button above. -->
<input
  bind:this={fileInput}
  id="b64-file"
  type="file"
  onchange={onFileChange}
  class="sr-only"
  aria-label="Encode a file as base64, processed locally"
/>

{#if fileError || fileBase64}
  <div class="band px-[26px] py-4">
    {#if fileError}
      <p aria-live="polite" class="tool-error">{fileError}</p>
    {/if}
    {#if fileBase64}
      <div class="pane-head">
        <span>{fileName}</span>
        <span class="flex gap-2">
          <CopyButton text={fileBase64} label="copy base64" />
          <CopyButton text={fileDataUri} label="copy data URI" />
        </span>
      </div>
      <div class="pane-out min-h-24">{fileBase64}</div>
    {/if}
  </div>
{/if}
