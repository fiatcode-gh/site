<script lang="ts">
  import { chooseVariation } from "@/lib/tools/workout/app/actions";
  import { movement, variationAt } from "@/lib/tools/workout/library/library";
  import { START_SETS } from "@/lib/tools/workout/progression/progress";
  import { movementHistory } from "@/lib/tools/workout/tracking/tracking";
  import { tick } from "svelte";
  import { answerPendingSuggestion, getWorkoutApp } from "./app.svelte";
  import ConfirmDialog from "./ConfirmDialog.svelte";
  import Figure from "./Figure.svelte";
  import SuggestionCard from "./SuggestionCard.svelte";
  import {
    currentWork,
    rangeText,
    reasonText,
    shortDate,
    stepLine,
    workText,
  } from "./text";

  const uid = $props.id();
  const app = getWorkoutApp();

  let ladder: HTMLOListElement;
  let switching: number | null = $state(null);

  const m = $derived(movement(app.route.param ?? "")!);
  const entry = $derived(app.state.progress[m.id]!);
  const current = $derived(variationAt(m.id, entry.level)!);
  const rows = $derived(movementHistory(app.state.history, m.id));
  const target = $derived(
    switching === null ? null : variationAt(m.id, switching)!,
  );

  async function onSwitch(value: string | null) {
    const level = switching;
    const v = target;
    switching = null;
    if (value !== "switch" || level === null || !v) return;
    app.dispatch((state) => chooseVariation(state, m.id, level));
    app.announce(`Now on ${v.name}.`);
    await tick();
    ladder
      ?.querySelector<HTMLElement>('[aria-current="step"]')
      ?.focus({ preventScroll: true });
  }
</script>

<div class="flex flex-col gap-6">
  <div class="flex flex-col gap-3">
    <a
      href="#/progress"
      class="inline-flex items-center self-start font-mono text-sm max-[620px]:min-h-10"
      >back to progress</a
    >
    <h2
      tabindex="-1"
      data-wk="screen-title"
      class="text-2xl font-semibold text-fg"
    >
      {m.name}
    </h2>
  </div>

  <div
    class="grid gap-8 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] min-[900px]:gap-10"
  >
    <div class="flex min-w-0 flex-col gap-4">
      <section
        aria-label="Current variation"
        class="flex flex-col gap-4 border border-line bg-raised p-5 max-[620px]:p-4"
      >
        <Figure variationId={current.id} size="large" />
        <div class="flex flex-col gap-2">
          <p class="text-lg font-semibold text-fg">{current.name}</p>
          <p class="leading-relaxed text-fg">{current.cue}</p>
          <p class="font-mono text-sm text-fg">
            Now: {currentWork(m.id, entry)}
          </p>
          <p class="font-mono text-xs text-muted">
            Range: {rangeText(current)}
          </p>
        </div>
      </section>
      {#if entry.suggestion}
        <ul class="flex flex-col gap-2">
          <SuggestionCard
            movementId={m.id}
            {entry}
            onanswer={(accept) => answerPendingSuggestion(app, m.id, accept)}
          />
        </ul>
      {/if}
    </div>

    <section
      aria-labelledby={`${uid}-ladder`}
      class="flex min-w-0 flex-col gap-3 min-[900px]:col-start-2 min-[900px]:row-span-2 min-[900px]:row-start-1"
    >
      <h3 id={`${uid}-ladder`} class="text-lg font-semibold text-fg">Ladder</h3>
      <ol bind:this={ladder} class="flex flex-col gap-2">
        {#each m.variations as v, level (v.id)}
          {@const isCurrent = level === entry.level}
          <li
            aria-current={isCurrent ? "step" : undefined}
            tabindex={isCurrent ? -1 : undefined}
            class={[
              "flex items-start gap-4 border border-line p-3",
              isCurrent
                ? "bg-select font-semibold shadow-[inset_2px_0_0_var(--color-active)]"
                : "bg-raised",
            ]}
          >
            <Figure variationId={v.id} size="thumb" />
            <div class="flex min-w-0 flex-col items-start gap-1">
              <p class="text-fg">{v.name}</p>
              <p class="font-mono text-xs font-normal text-muted">
                {rangeText(v)}
              </p>
              {#if isCurrent}
                <p class="font-mono text-xs font-semibold text-fg">Current</p>
              {:else}
                <button
                  type="button"
                  class="tool-btn mt-1 max-[620px]:min-h-10"
                  aria-label={`start at ${v.name}`}
                  onclick={() => (switching = level)}>start here</button
                >
              {/if}
            </div>
          </li>
        {/each}
      </ol>
    </section>

    <section
      aria-labelledby={`${uid}-history`}
      class="flex min-w-0 flex-col gap-3"
    >
      <h3 id={`${uid}-history`} class="text-lg font-semibold text-fg">
        Recent sessions
      </h3>
      {#if rows.length > 0}
        <ol class="flex flex-col gap-2">
          {#each rows as row, i (i)}
            {@const ended = reasonText(row.endReasons)}
            <li class="flex flex-col gap-1 border border-line bg-raised p-3">
              <p class="flex flex-wrap items-center gap-2">
                <span class="font-mono text-xs text-muted"
                  >{shortDate(row.date)}</span
                >
                {#if row.dayType === "recovery"}
                  <span
                    class="border border-dashed border-fg px-1.5 font-mono text-xs text-fg"
                    >Recovery</span
                  >
                {/if}
              </p>
              <p class="text-sm text-fg">
                {row.variationName} · {workText({
                  type: row.type,
                  perSide: row.perSide,
                  plannedSets: row.plannedSets,
                  target: row.target,
                })}
              </p>
              <ul class="flex flex-col gap-0.5 font-mono text-xs text-fg">
                {#each row.steps as step, j (j)}
                  <li class={step.status === "logged" ? "" : "text-muted"}>
                    {stepLine(row, step)}
                  </li>
                {/each}
              </ul>
              {#if row.endedHere}
                <p class="text-xs text-muted">
                  Ended here{ended ? `: ${ended}` : ""}
                </p>
              {/if}
            </li>
          {/each}
        </ol>
      {:else}
        <p class="text-sm text-fg">No sessions yet.</p>
      {/if}
    </section>
  </div>
</div>

{#if switching !== null && target}
  <ConfirmDialog
    title={`Switch ${m.name} to ${target.name}?`}
    actions={[
      { label: "cancel", value: "cancel" },
      { label: "switch", value: "switch", primary: true },
    ]}
    initialFocus="last"
    onclose={onSwitch}
  >
    <p>
      Targets restart at {workText({
        sets: START_SETS,
        target: target.min,
        type: target.type,
        perSide: target.perSide,
      })}. Your history is kept.
    </p>
  </ConfirmDialog>
{/if}
