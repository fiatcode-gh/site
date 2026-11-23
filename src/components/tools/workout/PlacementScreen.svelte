<script lang="ts">
  import { finishPlacement } from "@/lib/tools/workout/app/actions";
  import {
    formatClock,
    parseWholeNumber,
  } from "@/lib/tools/workout/core/format";
  import {
    movementsFor,
    variationAt,
  } from "@/lib/tools/workout/library/library";
  import {
    PATTERN_LABELS,
    PATTERNS,
    type Pattern,
  } from "@/lib/tools/workout/library/patterns";
  import {
    PLACEMENT_TESTS,
    placementProgress,
  } from "@/lib/tools/workout/placement/placement";
  import {
    elapsedMs,
    newStopwatch,
    startWatch,
    stopWatch,
  } from "@/lib/tools/workout/session/stopwatch";
  import type { Stopwatch } from "@/lib/tools/workout/types";
  import { tick } from "svelte";
  import { getWorkoutApp, showFocusTarget } from "./app.svelte";
  import Figure from "./Figure.svelte";
  import { workText } from "./text";

  type Stage = "intro" | "result" | number;

  const uid = $props.id();
  const app = getWorkoutApp();
  const LAST = PLACEMENT_TESTS.length - 1;
  const TICK_MS = 250;

  let stage: Stage = $state("intro");
  let results: Partial<Record<Pattern, number | null>> = $state.raw({});
  let text = $state("");
  let error = $state(false);
  let watch: Stopwatch | null = $state.raw(null);
  let now = $state(0);
  let title: HTMLElement | undefined = $state();

  const test = $derived(
    typeof stage === "number" ? PLACEMENT_TESTS[stage] : null,
  );
  const running = $derived(watch !== null && watch.runningSince !== null);
  const shownSeconds = $derived(watch ? elapsedMs(watch, now) / 1000 : 0);
  const progress = $derived(
    stage === "result" ? placementProgress(results) : null,
  );

  $effect(() => {
    if (!running) return;
    now = app.clock.now();
    const timer = setInterval(() => (now = app.clock.now()), TICK_MS);
    return () => clearInterval(timer);
  });

  async function goTo(next: Stage) {
    const nextTest = typeof next === "number" ? PLACEMENT_TESTS[next] : null;
    const saved = nextTest ? results[nextTest.pattern] : null;
    stage = next;
    text = saved === null || saved === undefined ? "" : String(saved);
    error = false;
    watch = null;
    await tick();
    showFocusTarget(title);
  }

  const following = (index: number): Stage =>
    index < LAST ? index + 1 : "result";

  function next() {
    if (typeof stage !== "number" || !test) return;
    const value = parseWholeNumber(text, { min: 0, max: test.maxInput });
    if (value === null) {
      error = true;
      return;
    }
    results = { ...results, [test.pattern]: value };
    goTo(following(stage));
  }

  function skipOne() {
    if (typeof stage !== "number" || !test) return;
    results = { ...results, [test.pattern]: null };
    goTo(following(stage));
  }

  function toggleTimer() {
    const at = app.clock.now();
    if (watch && running) {
      const stopped = stopWatch(watch, at);
      watch = stopped;
      text = String(Math.floor(elapsedMs(stopped, at) / 1000));
      error = false;
    } else {
      watch = startWatch(newStopwatch(), at);
      now = at;
    }
  }

  function skipAll() {
    app.dispatch((state) => finishPlacement(state, null));
    app.navigate("today");
    app.announce("Starting every movement at its easiest variation.");
  }

  function finish() {
    const chosen = results;
    app.dispatch((state) => finishPlacement(state, chosen));
    app.navigate("today");
  }
</script>

<div class="flex flex-col gap-6">
  {#if stage === "intro"}
    <div class="flex max-w-[68ch] flex-col gap-3">
      <h2
        bind:this={title}
        tabindex="-1"
        data-wk="screen-title"
        class="text-2xl font-semibold text-fg"
      >
        Find your starting level
      </h2>
      <p class="text-lg leading-relaxed text-fg">
        Five short tests, one per area. Give each your honest best, then rest a
        minute before the next. It takes about ten minutes.
      </p>
    </div>
    <div>
      <button
        type="button"
        class="tool-btn tool-btn-primary"
        onclick={() => goTo(0)}>start the test</button
      >
    </div>
    <div class="flex flex-col items-start gap-2">
      <button type="button" class="tool-btn" onclick={skipAll}
        >skip the test</button
      >
      <p class="text-sm text-muted">
        Skipping starts every movement at its easiest variation.
      </p>
    </div>
  {:else if test && typeof stage === "number"}
    {@const index = stage}
    <h2
      bind:this={title}
      tabindex="-1"
      data-wk="screen-title"
      class="text-2xl font-semibold text-fg"
    >
      Test {index + 1} of {PLACEMENT_TESTS.length}: {test.title}
    </h2>
    <div class="flex max-w-[68ch] flex-col gap-5">
      <div class="w-[200px] min-[620px]:w-[240px]">
        <Figure variationId={test.variationId} size="large" />
      </div>
      <p class="leading-relaxed text-fg">{test.prompt}</p>
      {#if test.unit === "seconds"}
        <div class="flex flex-wrap items-center gap-4">
          <p
            role="timer"
            class="min-w-[5ch] font-mono text-3xl font-semibold text-fg tabular-nums"
          >
            {formatClock(shownSeconds)}
          </p>
          <button type="button" class="tool-btn" onclick={toggleTimer}
            >{running ? "stop timer" : "start timer"}</button
          >
        </div>
      {/if}
      <div class="flex flex-col gap-2">
        <label for={`${uid}-value`} class="font-mono text-xs text-muted"
          >{test.unit === "seconds" ? "seconds held" : "reps done"}</label
        >
        <input
          id={`${uid}-value`}
          type="text"
          inputmode="numeric"
          autocomplete="off"
          bind:value={text}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${uid}-error` : undefined}
          onkeydown={(event) => {
            if (event.key === "Enter") next();
          }}
          class="pane w-32 py-2 text-base max-[620px]:min-h-10"
        />
        {#if error}
          <p id={`${uid}-error`} role="alert" class="tool-error">
            Enter a whole number from 0 to {test.maxInput}, or skip this one.
          </p>
        {/if}
      </div>
      <div>
        <button type="button" class="tool-btn tool-btn-primary" onclick={next}
          >next</button
        >
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="tool-btn" onclick={skipOne}
          >skip this one</button
        >
        <button
          type="button"
          class="tool-btn"
          onclick={() => goTo(index === 0 ? "intro" : index - 1)}>back</button
        >
      </div>
    </div>
  {:else if progress}
    <div class="flex max-w-[68ch] flex-col gap-3">
      <h2
        bind:this={title}
        tabindex="-1"
        data-wk="screen-title"
        class="text-2xl font-semibold text-fg"
      >
        Your starting point
      </h2>
      <p class="text-lg leading-relaxed text-fg">
        You can change any of these later.
      </p>
    </div>
    <div class="grid gap-4 min-[620px]:grid-cols-2">
      {#each PATTERNS as pattern (pattern)}
        <section
          aria-labelledby={`${uid}-start-${pattern}`}
          class="flex flex-col gap-3 border border-line bg-raised p-4"
        >
          <h3
            id={`${uid}-start-${pattern}`}
            class="text-lg font-semibold text-fg"
          >
            {PATTERN_LABELS[pattern]}
          </h3>
          <ul class="flex flex-col gap-3">
            {#each movementsFor(pattern) as movement (movement.id)}
              {@const entry = progress[movement.id]!}
              {@const v = variationAt(movement.id, entry.level)!}
              <li class="flex flex-col gap-0.5">
                <p class="font-mono text-xs text-faint">{movement.name}</p>
                <p class="font-semibold text-fg">{v.name}</p>
                <p class="font-mono text-sm text-muted">
                  {workText({ ...v, sets: entry.sets, target: entry.target })}
                </p>
              </li>
            {/each}
          </ul>
        </section>
      {/each}
    </div>
    <div>
      <button type="button" class="tool-btn tool-btn-primary" onclick={finish}
        >see today's session</button
      >
    </div>
    <div>
      <button type="button" class="tool-btn" onclick={() => goTo(LAST)}
        >back</button
      >
    </div>
  {/if}
</div>
