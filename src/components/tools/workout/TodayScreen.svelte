<script lang="ts">
  import { beginSession, todayPlan } from "@/lib/tools/workout/app/actions";
  import {
    activeDays,
    currentStreak,
    doneSession,
    todayStatus,
    weekStrip,
  } from "@/lib/tools/workout/tracking/tracking";
  import { answerPendingSuggestion, getWorkoutApp } from "./app.svelte";
  import DayBadge from "./DayBadge.svelte";
  import ExerciseRow from "./ExerciseRow.svelte";
  import SuggestionCard from "./SuggestionCard.svelte";
  import { longDate, reasonText, stepLine, streakText } from "./text";
  import WeekStrip from "./WeekStrip.svelte";

  const uid = $props.id();
  const app = getWorkoutApp();

  const plan = $derived(todayPlan(app.state, app.today));
  const status = $derived(todayStatus(app.state, app.today));
  const days = $derived(activeDays(app.state));
  const streak = $derived(currentStreak(days, app.today));
  const done = $derived(
    status === "done" ? doneSession(app.state, app.today) : null,
  );
  const pending = $derived(
    Object.entries(app.state.progress).filter(([, entry]) => entry.suggestion),
  );

  function start() {
    app.cues.unlock();
    app.dispatch((state) =>
      beginSession(state, { today: app.clock.today(), now: app.clock.now() }),
    );
    app.navigate("session");
  }

  function resume() {
    app.cues.unlock();
    app.navigate("session");
  }
</script>

<div
  class="grid gap-8 min-[900px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] min-[900px]:gap-10"
>
  <div class="flex min-w-0 flex-col gap-4">
    <h2
      tabindex="-1"
      data-wk="screen-title"
      class="text-2xl font-semibold text-fg"
    >
      {longDate(app.today)}
    </h2>
    <DayBadge dayType={plan.dayType} />
    {#if plan.dayType === "recovery"}
      <p class="leading-relaxed text-fg">
        Lighter on purpose: fewer sets, easier targets, no conditioning.
      </p>
    {/if}
    {#if status !== "done"}
      <div class="flex flex-col gap-1 font-mono text-sm text-fg">
        <p>About {Math.ceil(plan.estimateSeconds / 60)} min</p>
        <p class="text-muted">Time cap {plan.capSeconds / 60} min</p>
        {#if plan.trimmed}
          <p class="text-muted">Shortened to fit your time cap.</p>
        {/if}
      </div>
    {/if}
    <p
      class={[
        "font-mono text-sm",
        streak > 0 ? "font-semibold text-fg" : "text-muted",
      ]}
    >
      {streakText(streak)}
    </p>
    <WeekStrip days={weekStrip(days, app.today)} />
    <div data-wk="today-action">
      {#if status === "not-started"}
        <button type="button" class="tool-btn tool-btn-primary" onclick={start}
          >start session</button
        >
      {:else if status === "in-progress"}
        <button type="button" class="tool-btn tool-btn-primary" onclick={resume}
          >resume session</button
        >
      {:else}
        <a
          href="#/progress"
          class="tool-btn tool-btn-primary inline-flex items-center no-underline hover:underline"
          >see progress</a
        >
      {/if}
    </div>
  </div>

  <div class="flex min-w-0 flex-col gap-8">
    {#if done}
      <section aria-labelledby={`${uid}-done`} class="flex flex-col gap-4">
        <h3 id={`${uid}-done`} class="text-lg font-semibold text-fg">
          Done for today
        </h3>
        {#if done.endedEarly}
          {@const reasons = reasonText(done.endReasons)}
          <p class="text-sm text-muted">
            Ended early{reasons ? `: ${reasons}` : "."}
          </p>
        {/if}
        <ol class="flex flex-col gap-2">
          {#each done.exercises as exercise, index (index)}
            <ExerciseRow {exercise}>
              <ul class="mt-1 flex flex-col gap-0.5 font-mono text-xs text-fg">
                {#each done.steps.filter((s) => s.exerciseIndex === index) as step, i (i)}
                  <li class={step.status === "logged" ? "" : "text-muted"}>
                    {stepLine(exercise, step)}
                  </li>
                {/each}
              </ul>
            </ExerciseRow>
          {/each}
        </ol>
        <h4 class="font-semibold text-fg">What changes next time</h4>
        {#if done.changes.length > 0}
          <ul class="flex list-disc flex-col gap-1 pl-5 text-sm text-fg">
            {#each done.changes as change, i (i)}
              <li>{change.sentence}</li>
            {/each}
          </ul>
        {:else}
          <p class="text-sm text-fg">No changes: targets stay the same.</p>
        {/if}
      </section>
    {:else}
      {#if status === "in-progress" && app.state.activeSession}
        {@const session = app.state.activeSession}
        <div
          class="flex flex-col gap-1 border border-line-strong bg-raised p-4"
        >
          <p class="font-semibold text-fg">Session in progress</p>
          {#if session.date !== app.today}
            <p class="text-sm text-muted">
              Started {longDate(session.date)}
            </p>
          {/if}
        </div>
      {/if}
      <section aria-labelledby={`${uid}-plan`} class="flex flex-col gap-4">
        <h3 id={`${uid}-plan`} class="text-lg font-semibold text-fg">
          Your session
        </h3>
        <ol class="flex flex-col gap-2">
          {#each status === "in-progress" && app.state.activeSession ? app.state.activeSession.exercises : plan.exercises as exercise, i (i)}
            <ExerciseRow {exercise} />
          {/each}
        </ol>
      </section>
    {/if}

    {#if pending.length > 0}
      <section
        aria-labelledby={`${uid}-suggestions`}
        class="flex flex-col gap-4"
      >
        <h3 id={`${uid}-suggestions`} class="text-lg font-semibold text-fg">
          Suggestions
        </h3>
        <ul class="flex flex-col gap-2">
          {#each pending as [movementId, entry] (movementId)}
            <SuggestionCard
              {movementId}
              {entry}
              onanswer={(accept) =>
                answerPendingSuggestion(app, movementId, accept)}
            />
          {/each}
        </ul>
      </section>
    {/if}
  </div>
</div>
