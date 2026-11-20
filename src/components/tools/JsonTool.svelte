<script lang="ts">
  import { formatJson, minifyJson } from "@/lib/tools/json";
  import CopyButton from "./CopyButton.svelte";

  let input = $state("");
  let indent = $state(2);
  let minified = $state(false);

  const result = $derived(
    minified ? minifyJson(input) : formatJson(input, indent),
  );
  const output = $derived(result.ok ? result.output : "");
</script>

<div class="flex flex-col gap-5">
  <div class="flex flex-wrap items-center gap-4">
    <label
      class="flex items-center gap-1.5 font-mono text-xs text-muted max-[619px]:min-h-10"
    >
      <input
        type="checkbox"
        bind:checked={minified}
        class="accent-(--color-fn)"
      />
      minify
    </label>
    <label
      class="flex items-center gap-1.5 font-mono text-xs text-muted max-[619px]:min-h-10"
      class:opacity-40={minified}
    >
      indent
      <select
        bind:value={indent}
        disabled={minified}
        class="border border-line bg-raised px-2 py-1 font-mono text-xs text-muted max-[619px]:min-h-10"
      >
        <option value={2}>2</option>
        <option value={4}>4</option>
        <option value={8}>8</option>
      </select>
    </label>
  </div>

  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
    <div class="flex flex-col gap-2">
      <!-- min-h-8 matches the output header (CopyButton height) so both textareas align -->
      <div class="flex min-h-8 items-center">
        <label for="json-input" class="font-mono text-xs text-faint"
          >input</label
        >
      </div>
      <textarea
        id="json-input"
        bind:value={input}
        placeholder={'paste JSON… e.g. {"a": 1}'}
        spellcheck="false"
        class="min-h-64 w-full resize-y border border-line bg-raised p-3 font-mono text-sm text-fg placeholder:text-faint"
      ></textarea>
    </div>
    <div class="flex flex-col gap-2">
      <div class="flex min-h-8 items-center justify-between">
        <label for="json-output" class="font-mono text-xs text-faint"
          >output</label
        >
        <CopyButton text={output} />
      </div>
      <textarea
        id="json-output"
        readonly
        value={output}
        placeholder="valid JSON appears here…"
        class="min-h-64 w-full resize-y border border-line bg-raised p-3 font-mono text-sm text-fg placeholder:text-faint"
      ></textarea>
      {#if !result.ok && input.trim() !== ""}
        <p aria-live="polite" class="font-mono text-xs text-fg">
          {result.error}{result.line != null
            ? ` (line ${result.line}, column ${result.column})`
            : ""}
        </p>
      {/if}
    </div>
  </div>
</div>
