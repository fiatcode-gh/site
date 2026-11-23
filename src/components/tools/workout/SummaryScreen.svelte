<script lang="ts">
  import {
    previewSession,
    saveSession,
    sessionAction,
  } from "@/lib/tools/workout/app/actions";
  import { parseWholeNumber } from "@/lib/tools/workout/core/format";
  import { loggedCount } from "@/lib/tools/workout/session/session";
  import type { WorkType } from "@/lib/tools/workout/types";
  import { getWorkoutApp } from "./app.svelte";
  import DayBadge from "./DayBadge.svelte";
  import {
    longDate,
    PAIN_NOTE,
    reasonText,
    summaryStepLabel,
    workText,
  } from "./text";

  const MAX_VALUE: Readonly<Record<WorkType, number>> = {
    reps: 999,
    hold: 3600,
  };
  const UNIT: Readonly<Record<WorkType, string>> = { reps: "reps", hold: "s" };

  const uid = $props.id();
  const app = getWorkoutApp();

  let drafts: Record<number, string> = $state({});

  const session = $derived(app.state.activeSession!);
  const endReasons = $derived(reasonText(session.endReasons));
  const pain = $derived(
    session.endReasons.includes("pain") ||
      session.steps.some((step) => step.reasons.includes("pain")),
  );
  const counts = $derived(loggedCount(session) >= 1);
  const changes = $derived(
    previewSession(app.state, { now: app.clock.now() })?.changes ?? [],
  );

  function edit(index: number, max: number, text: string) {
    const value = parseWholeNumber(text, { min: 1, max });
    if (value === null) {
      drafts[index] = text;
      return;
    }
    delete drafts[index];
    if (value === session.steps[index].value) return;
    app.dispatch((state) =>
      sessionAction(state, { type: "correct", stepIndex: index, value }),
    );
  }

  function save() {
    app.dispatch((state) => saveSession(state, { now: app.clock.now() }));
    app.navigate("today");
    app.announce("Session saved.");
  }
</script>

<div class="flex max-w-[68ch] flex-col gap-6">
  <div class="flex flex-col gap-3">
    <h2
      tabindex="-1"
      data-wk="screen-title"
      class="text-2xl font-semibold text-fg"
    >
      Session summary
    </h2>
    <p class="text-fg">{longDate(session.date)}</p>
    <DayBadge dayType={session.dayType} />
    {#if session.endedEarly}
      <p class="text-sm text-muted">
        Ended early{endReasons ? `: ${endReasons}` : ""}
      </p>
    {/if}
    {#if pain}
      <p class="tool-error">{PAIN_NOTE}</p>
    {/if}
  </div>

  <ol class="flex flex-col gap-3">
    {#each session.exercises as exercise, exerciseIndex (exerciseIndex)}
      {@const max = MAX_VALUE[exercise.type]}
      <li class="flex flex-col gap-2 border border-line bg-raised p-4">
        <h3 class="text-lg font-semibold text-fg">{exercise.variationName}</h3>
        <p class="font-mono text-xs text-muted">
          Planned {workText(exercise)}
        </p>
        <ul class="flex flex-col gap-2">
          {#each session.steps as step, index (index)}
            {#if step.exerciseIndex === exerciseIndex}
              {#if step.status === "logged"}
                {@const id = `${uid}-step-${index}`}
                {@const invalid = drafts[index] !== undefined}
                <li class="flex flex-col gap-1">
                  <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <label
                      for={id}
                      class="min-w-[17ch] font-mono text-sm text-fg"
                      >{summaryStepLabel(step)}</label
                    >
                    <input
                      {id}
                      type="text"
                      inputmode="numeric"
                      autocomplete="off"
                      value={drafts[index] ?? String(step.value)}
                      aria-invalid={invalid ? "true" : undefined}
                      aria-describedby={invalid ? `${id}-error` : undefined}
                      oninput={(event) =>
                        edit(index, max, event.currentTarget.value)}
                      class="h-10 w-16 border border-field bg-surface px-2 text-center font-mono text-base text-fg tabular-nums"
                    />
                    <span class="font-mono text-sm text-muted"
                      >{UNIT[exercise.type]}</span
                    >
                  </div>
                  {#if invalid}
                    <p id={`${id}-error`} class="tool-error">
                      Enter a whole number from 1 to {max}.
                    </p>
                  {/if}
                </li>
              {:else if step.status === "skipped"}
                {@const why = reasonText(step.reasons)}
                <li class="font-mono text-sm text-muted">
                  {summaryStepLabel(step)}: skipped{why ? ` · ${why}` : ""}
                </li>
              {:else}
                <li class="font-mono text-sm text-muted">
                  {summaryStepLabel(step)}: not done
                </li>
              {/if}
            {/if}
          {/each}
        </ul>
      </li>
    {/each}
  </ol>

  <section aria-labelledby={`${uid}-changes`} class="flex flex-col gap-3">
    <h3 id={`${uid}-changes`} class="text-lg font-semibold text-fg">
      What changes next time
    </h3>
    <div aria-live="polite" class="flex flex-col gap-2 text-fg">
      {#if changes.length > 0}
        <ul class="flex list-disc flex-col gap-1 pl-5">
          {#each changes as change, i (i)}
            <li>{change.sentence}</li>
          {/each}
        </ul>
      {:else}
        <p>No changes: targets stay the same.</p>
      {/if}
      {#if session.dayType === "recovery"}
        <p>Recovery days never change your targets.</p>
      {/if}
    </div>
  </section>

  <p class={counts ? "font-semibold text-fg" : "text-muted"}>
    {counts
      ? "Today counts toward your streak."
      : "Nothing was logged, so today does not count."}
  </p>
  <div>
    <button
      type="button"
      data-wk="primary"
      class="tool-btn tool-btn-primary"
      onclick={save}>save session</button
    >
  </div>
</div>
