<script lang="ts">
  import {
    movementsFor,
    variationAt,
  } from "@/lib/tools/workout/library/library";
  import {
    PATTERN_LABELS,
    PATTERNS,
  } from "@/lib/tools/workout/library/patterns";
  import {
    activeDays,
    currentStreak,
    weekStrip,
  } from "@/lib/tools/workout/tracking/tracking";
  import { getWorkoutApp } from "./app.svelte";
  import Figure from "./Figure.svelte";
  import { currentWork, lastLine } from "./text";
  import WeekStrip from "./WeekStrip.svelte";

  const uid = $props.id();
  const app = getWorkoutApp();

  const days = $derived(activeDays(app.state));
  const streak = $derived(currentStreak(days, app.today));
</script>

<div class="flex flex-col gap-8">
  <div class="flex max-w-[40rem] flex-col gap-4">
    <h2
      tabindex="-1"
      data-wk="screen-title"
      class="text-2xl font-semibold text-fg"
    >
      Progress
    </h2>
    <div class="flex flex-col gap-1">
      <p class="font-mono text-sm text-fg">
        <span class="text-3xl font-semibold tabular-nums">{streak}</span> day streak
      </p>
      {#if streak > 0 && !days.has(app.today)}
        <p class="text-sm text-muted">Train today to keep it going.</p>
      {/if}
    </div>
    <WeekStrip days={weekStrip(days, app.today)} />
  </div>

  {#each PATTERNS as pattern (pattern)}
    <section aria-labelledby={`${uid}-${pattern}`} class="flex flex-col gap-3">
      <h3 id={`${uid}-${pattern}`} class="text-lg font-semibold text-fg">
        {PATTERN_LABELS[pattern]}
      </h3>
      <ul class="grid gap-2 min-[620px]:grid-cols-2">
        {#each movementsFor(pattern) as m (m.id)}
          {@const entry = app.state.progress[m.id]}
          {#if entry}
            {@const v = variationAt(m.id, entry.level)}
            <li class="flex">
              <a
                href={`#/progress/${m.id}`}
                data-wk="movement-card"
                class="group flex w-full min-w-0 items-start gap-4 border border-line bg-raised p-3 text-fg no-underline hover:border-line-strong motion-safe:transition-colors"
              >
                {#if v}
                  <Figure variationId={v.id} size="thumb" />
                {/if}
                <span class="flex min-w-0 flex-col gap-1">
                  <span class="font-semibold group-hover:underline"
                    >{m.name}</span
                  >
                  <span class="text-sm">{v?.name}</span>
                  <span class="font-mono text-sm text-muted"
                    >{currentWork(m.id, entry)}</span
                  >
                  <span class="font-mono text-xs text-muted"
                    >{lastLine(app.state.history, m.id)}</span
                  >
                  {#if entry.suggestion}
                    <span
                      class="mt-1 self-start border border-line-strong px-2 py-0.5 font-mono text-xs font-semibold"
                      >Suggestion waiting</span
                    >
                  {/if}
                </span>
              </a>
            </li>
          {/if}
        {/each}
      </ul>
    </section>
  {/each}
</div>
