<script lang="ts">
  import { generateUlids } from "@/lib/tools/ulid";
  import { generateUuids } from "@/lib/tools/uuid";
  import CopyButton from "./CopyButton.svelte";

  let kind: "uuid" | "ulid" = $state("uuid");
  let count = $state(5);
  let ids: string[] = $state([]);
  let error = $state("");

  function generate() {
    try {
      ids = kind === "uuid" ? generateUuids(count) : generateUlids(count);
      error = "";
    } catch (err) {
      ids = [];
      error = err instanceof Error ? err.message : String(err);
    }
  }

  generate();
</script>

<div class="flex flex-col gap-5">
  <div class="flex flex-wrap items-center gap-4">
    <fieldset class="flex items-center gap-4">
      <legend class="sr-only">Identifier type</legend>
      <label class="flex items-center gap-1.5 font-mono text-xs text-ink-dim">
        <input
          type="radio"
          bind:group={kind}
          value="uuid"
          onchange={generate}
          class="accent-(--color-phosphor)"
        />
        UUID v4
      </label>
      <label class="flex items-center gap-1.5 font-mono text-xs text-ink-dim">
        <input
          type="radio"
          bind:group={kind}
          value="ulid"
          onchange={generate}
          class="accent-(--color-phosphor)"
        />
        ULID
      </label>
    </fieldset>
    <label class="flex items-center gap-1.5 font-mono text-xs text-ink-dim">
      count
      <input
        type="number"
        bind:value={count}
        min="1"
        max="1000"
        class="w-20 border border-line bg-bg/40 px-2 py-1 font-mono text-xs text-ink"
      />
    </label>
    <button
      type="button"
      onclick={generate}
      class="border border-line bg-surface-2 px-3 py-1.5 font-mono text-xs text-ink-dim transition-colors hover:border-phosphor/60 hover:text-phosphor"
    >
      generate
    </button>
    <CopyButton text={ids.join("\n")} label="copy all" />
  </div>

  {#if error}
    <p aria-live="polite" class="font-mono text-xs text-phosphor-deep">
      # {error}
    </p>
  {/if}

  {#if ids.length > 0}
    <ul
      class="flex flex-col divide-y divide-line-soft border border-line-soft bg-bg/40"
    >
      {#each ids as id (id)}
        <li class="flex items-center justify-between gap-3 px-3 py-2">
          <code class="font-mono text-sm break-all text-ink">{id}</code>
          <CopyButton text={id} />
        </li>
      {/each}
    </ul>
  {/if}
</div>
