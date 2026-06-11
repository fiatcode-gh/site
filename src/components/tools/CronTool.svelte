<script lang="ts">
  import { onMount } from "svelte";
  import { explainCron, type CronResult } from "@/lib/tools/cron";

  let expression = $state("*/15 9-17 * * 1-5");
  // Next-run times depend on the wall clock; computing them during the static
  // build would bake stale timestamps into the HTML. Render only after mount.
  let mounted = $state(false);
  onMount(() => (mounted = true));

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const fmt = new Intl.DateTimeFormat(undefined, {
    dateStyle: "full",
    timeStyle: "medium",
  });

  // No tz option passed: cron-parser computes in the browser's local zone,
  // which is exactly what we display to the user.
  const result: CronResult | null = $derived(
    mounted ? explainCron(expression) : null,
  );
</script>

<div class="flex flex-col gap-5">
  <div class="flex flex-col gap-2">
    <label for="cron-input" class="font-mono text-xs text-ink-faint">
      cron expression (minute hour day-of-month month day-of-week)
    </label>
    <input
      id="cron-input"
      bind:value={expression}
      placeholder="*/15 9-17 * * 1-5"
      spellcheck="false"
      class="w-full border border-line bg-bg/40 p-3 font-mono text-sm text-ink placeholder:text-ink-faint"
    />
  </div>

  {#if result === null}
    <p class="font-mono text-xs text-ink-faint"># …</p>
  {:else if !result.ok}
    {#if expression.trim() !== ""}
      <p aria-live="polite" class="font-mono text-xs text-phosphor-deep">
        # {result.error}
      </p>
    {:else}
      <p class="font-mono text-xs text-ink-faint">
        # type an expression to explain it
      </p>
    {/if}
  {:else}
    <div class="border border-line-soft bg-surface-2/40 p-4">
      <p class="font-serif text-lg text-ink">{result.description}</p>
    </div>

    <div class="flex flex-col gap-2">
      <h2 class="font-mono text-xs text-ink-faint">
        next {result.nextRuns.length} runs — computed in your browser's timezone:
        <span class="text-phosphor">{timeZone}</span>
      </h2>
      <ol
        class="flex flex-col divide-y divide-line-soft border border-line-soft bg-bg/40 font-mono text-sm"
      >
        {#each result.nextRuns as run, i (i)}
          <li class="flex items-baseline gap-3 px-3 py-2">
            <span class="text-ink-faint">{i + 1}.</span>
            <span class="text-ink">{fmt.format(run)}</span>
          </li>
        {/each}
      </ol>
    </div>
  {/if}
</div>
