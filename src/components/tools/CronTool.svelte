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
    <label for="cron-input" class="font-mono text-xs text-faint">
      cron expression (minute hour day-of-month month day-of-week)
    </label>
    <input
      id="cron-input"
      bind:value={expression}
      placeholder="*/15 9-17 * * 1-5"
      spellcheck="false"
      class="w-full border border-line bg-raised p-3 font-mono text-sm text-fg placeholder:text-faint"
    />
  </div>

  {#if result === null}
    <p class="font-mono text-xs text-faint">…</p>
  {:else if !result.ok}
    {#if expression.trim() !== ""}
      <p aria-live="polite" class="font-mono text-xs text-fg">
        {result.error}
      </p>
    {:else}
      <p class="font-mono text-xs text-faint">
        type an expression to explain it
      </p>
    {/if}
  {:else}
    {#if result.description}
      <div class="border border-line bg-raised p-4">
        <p class="text-lg text-fg">{result.description}</p>
      </div>
    {:else}
      <p class="font-mono text-xs text-faint">
        no plain-language description available for this syntax
      </p>
    {/if}

    {#if result.nextRuns}
      <div class="flex flex-col gap-2">
        <h2 class="font-mono text-xs text-faint">
          next {result.nextRuns.length} runs — computed in your browser's timezone:
          <span class="text-fg">{timeZone}</span>
        </h2>
        <ol
          class="flex flex-col divide-y divide-line border border-line bg-raised font-mono text-sm"
        >
          {#each result.nextRuns as run, i (run.getTime())}
            <li class="flex items-baseline gap-3 px-3 py-2">
              <span class="text-faint">{i + 1}.</span>
              <span class="text-fg">{fmt.format(run)}</span>
            </li>
          {/each}
        </ol>
      </div>
    {:else}
      <p class="font-mono text-xs text-faint">
        next-run times unavailable for this expression
      </p>
    {/if}
  {/if}
</div>
