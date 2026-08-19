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
    <label class="flex items-center gap-1.5 font-mono text-xs text-ink-62">
      <input
        type="checkbox"
        bind:checked={minified}
        class="accent-(--color-ink)"
      />
      minify
    </label>
    <label
      class="flex items-center gap-1.5 font-mono text-xs text-ink-62"
      class:opacity-40={minified}
    >
      indent
      <select
        bind:value={indent}
        disabled={minified}
        class="border border-rule bg-code px-2 py-1 font-mono text-xs text-ink-62"
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
        <label for="json-input" class="font-mono text-xs text-ink-55"
          >input</label
        >
      </div>
      <textarea
        id="json-input"
        bind:value={input}
        placeholder={'paste JSON… e.g. {"a": 1}'}
        spellcheck="false"
        class="min-h-64 w-full resize-y border border-rule bg-code p-3 font-mono text-sm text-ink placeholder:text-ink-55"
      ></textarea>
    </div>
    <div class="flex flex-col gap-2">
      <div class="flex min-h-8 items-center justify-between">
        <label for="json-output" class="font-mono text-xs text-ink-55"
          >output</label
        >
        <CopyButton text={output} />
      </div>
      <textarea
        id="json-output"
        readonly
        value={output}
        placeholder="valid JSON appears here…"
        class="min-h-64 w-full resize-y border border-rule bg-code p-3 font-mono text-sm text-ink placeholder:text-ink-55"
      ></textarea>
      {#if !result.ok && input.trim() !== ""}
        <p aria-live="polite" class="font-mono text-xs text-ink">
          {result.error}{result.line != null
            ? ` (line ${result.line}, column ${result.column})`
            : ""}
        </p>
      {/if}
    </div>
  </div>
</div>
