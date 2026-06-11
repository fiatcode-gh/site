<script lang="ts">
  import { replacePreview, runRegex, segments } from "@/lib/tools/regex";
  import CopyButton from "./CopyButton.svelte";

  const FLAG_NAMES: Record<string, string> = {
    g: "global",
    i: "ignore case",
    m: "multiline",
    s: "dotall",
    u: "unicode",
    y: "sticky",
  };

  let pattern = $state("");
  let input = $state("");
  let replacement = $state("");
  let flags: Record<string, boolean> = $state({
    g: true,
    i: false,
    m: false,
    s: false,
    u: false,
    y: false,
  });

  const flagString = $derived(
    Object.entries(flags)
      .filter(([, on]) => on)
      .map(([f]) => f)
      .join(""),
  );
  const result = $derived(runRegex(pattern, flagString, input));
  const segs = $derived(
    result.ok ? segments(input, result.matches) : [{ text: input, hit: false }],
  );
  const replaced = $derived(
    replacement === "" || pattern === ""
      ? null
      : replacePreview(pattern, flagString, input, replacement),
  );
</script>

<div class="flex flex-col gap-5">
  <p class="font-mono text-xs text-ink-faint">
    <span class="text-phosphor" aria-hidden="true">#</span> runs on the main thread
    — extremely backtrack-heavy patterns on large input can stall this tab (input
    capped at 100k chars)
  </p>

  <div class="flex flex-col gap-2">
    <label for="re-pattern" class="font-mono text-xs text-ink-faint"
      >pattern</label
    >
    <div
      class="flex items-center gap-0 border border-line bg-bg/40 font-mono text-sm"
    >
      <span class="pl-3 text-ink-faint" aria-hidden="true">/</span>
      <input
        id="re-pattern"
        bind:value={pattern}
        placeholder="(?<word>\w+)"
        spellcheck="false"
        class="min-w-0 flex-1 bg-transparent p-3 pl-1 text-ink placeholder:text-ink-faint focus:outline-none"
      />
      <span class="pr-3 text-ink-faint" aria-hidden="true">/{flagString}</span>
    </div>
  </div>

  <fieldset class="flex flex-wrap items-center gap-4">
    <legend class="sr-only">Flags</legend>
    {#each Object.keys(flags) as flag (flag)}
      <label class="flex items-center gap-1.5 font-mono text-xs text-ink-dim">
        <input
          type="checkbox"
          bind:checked={flags[flag]}
          class="accent-(--color-phosphor)"
        />
        {flag}
        <span class="text-ink-faint">({FLAG_NAMES[flag]})</span>
      </label>
    {/each}
  </fieldset>

  <div class="flex flex-col gap-2">
    <label for="re-input" class="font-mono text-xs text-ink-faint"
      >test input</label
    >
    <textarea
      id="re-input"
      bind:value={input}
      placeholder="paste text to test against…"
      spellcheck="false"
      class="min-h-32 w-full resize-y border border-line bg-bg/40 p-3 font-mono text-sm text-ink placeholder:text-ink-faint"
    ></textarea>
  </div>

  {#if !result.ok}
    <p aria-live="polite" class="font-mono text-xs text-phosphor-deep">
      # {result.error}
    </p>
  {:else if input !== ""}
    <div class="flex flex-col gap-2">
      <h2 class="font-mono text-xs text-ink-faint">
        matches: {result.matches.length}{result.truncated
          ? " (truncated at 1000)"
          : ""}
      </h2>
      <pre
        class="max-h-64 overflow-auto border border-line bg-bg/40 p-3 font-mono text-sm whitespace-pre-wrap text-ink-dim">{#each segs as seg, i (i)}{#if seg.hit}<mark
              class="bg-phosphor-soft text-phosphor">{seg.text}</mark
            >{:else}{seg.text}{/if}{/each}</pre>
    </div>

    {#if result.matches.length > 0 && result.matches.some((m) => m.groups.length > 0 || m.named)}
      <div class="flex flex-col gap-2">
        <h2 class="font-mono text-xs text-ink-faint">capture groups</h2>
        <ul
          class="flex max-h-64 flex-col gap-1 overflow-auto border border-line-soft bg-bg/40 p-3 font-mono text-xs"
        >
          {#each result.matches.slice(0, 50) as m, i (i)}
            <li class="text-ink-dim">
              <span class="text-ink-faint">[{i}]</span>
              "{m.text}"
              {#each m.groups as g, gi (gi)}
                <span class="text-ink-faint">${gi + 1}=</span>{g ?? "∅"}
              {/each}
              {#if m.named}
                {#each Object.entries(m.named) as [name, value] (name)}
                  <span class="text-phosphor">{name}=</span>{value ?? "∅"}
                {/each}
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  {/if}

  <div class="flex flex-col gap-2 border-t border-line-soft pt-5">
    <label for="re-replace" class="font-mono text-xs text-ink-faint">
      replace with (optional — supports $1, $&lt;name&gt;)
    </label>
    <input
      id="re-replace"
      bind:value={replacement}
      placeholder="[$1]"
      spellcheck="false"
      class="w-full border border-line bg-bg/40 p-3 font-mono text-sm text-ink placeholder:text-ink-faint"
    />
    {#if replaced}
      {#if replaced.ok}
        <div class="flex items-center justify-between">
          <span class="font-mono text-xs text-ink-faint">result</span>
          <CopyButton text={replaced.output} />
        </div>
        <pre
          class="max-h-48 overflow-auto border border-line bg-bg/40 p-3 font-mono text-sm whitespace-pre-wrap text-ink">{replaced.output}</pre>
      {:else}
        <p aria-live="polite" class="font-mono text-xs text-phosphor-deep">
          # {replaced.error}
        </p>
      {/if}
    {/if}
  </div>
</div>
