<script lang="ts">
  import { sessionAction, setMuted } from "@/lib/tools/workout/app/actions";
  import {
    formatClock,
    parseWholeNumber,
  } from "@/lib/tools/workout/core/format";
  import type { Reason } from "@/lib/tools/workout/core/reasons";
  import { variation } from "@/lib/tools/workout/library/library";
  import {
    currentExercise,
    holdElapsedMs,
    nextUp,
    reduce,
    restRemainingMs,
    transitionCue,
    type SessionAction,
  } from "@/lib/tools/workout/session/session";
  import type { SessionState } from "@/lib/tools/workout/types";
  import { onDestroy, tick, untrack } from "svelte";
  import { getWorkoutApp, showStage } from "./app.svelte";
  import ConfirmDialog from "./ConfirmDialog.svelte";
  import Figure from "./Figure.svelte";
  import ReasonChips from "./ReasonChips.svelte";
  import Stepper from "./Stepper.svelte";
  import {
    exerciseAt,
    nextText,
    PLAYER_SIDE_LABELS,
    positionText,
    targetText,
    transitionAnnouncement,
  } from "./text";

  type Dialog = "pause" | "skip" | "end";

  const GUARD_MS = 500;
  const MIN_HOLD_MS = 1000;
  const MAX_REPS = 999;
  const TICK_MS = 250;
  const BUTTON = "tool-btn min-h-12 min-w-12";

  const uid = $props.id();
  const app = getWorkoutApp();

  const stepKey = (s: SessionState) => `${s.id}|${s.cursor}|${s.phase}`;

  const session = $derived(app.state.activeSession!);
  const key = $derived(stepKey(session));
  const exercise = $derived(currentExercise(session));
  const working = $derived(session.phase === "work");
  const isHold = $derived(working && exercise.type === "hold");
  const muted = $derived(app.state.settings.muted);
  const doneCount = $derived(
    session.steps.filter((s) => s.status !== "pending").length,
  );
  const timerRunning = $derived(
    !session.paused &&
      (session.phase === "rest" || (isHold && session.holdStarted)),
  );

  let stage: HTMLElement;
  let now = $state(app.clock.now());
  let since = 0;
  let draftKey = "";
  let targetReachedKey = "";
  let text = $state("");
  let repsError = $state(false);
  let restOverKey = $state("");
  let dialog: Dialog | null = $state(null);
  let reasons: Reason[] = [];

  const holdMs = $derived(holdElapsedMs(session, now));
  const reached = $derived(isHold && holdMs >= exercise.target * 1000);
  const restMs = $derived(restRemainingMs(session, now));
  const upNext = $derived.by(() => {
    if (session.phase !== "rest") return null;
    const next = nextUp(session);
    if (!next || next.stepIndex === null) return null;
    return {
      step: session.steps[next.stepIndex],
      exercise: exerciseAt(session, next.stepIndex),
    };
  });
  const primaryLabel = $derived(
    !working
      ? "skip rest"
      : isHold && !session.holdStarted
        ? "start hold"
        : "done",
  );

  $effect.pre(() => {
    const current = key;
    if (current === draftKey) return;
    untrack(() => {
      draftKey = current;
      since = app.clock.now();
      text = String(exercise.target);
      repsError = false;
      if (isHold && holdElapsedMs(session, since) >= exercise.target * 1000) {
        targetReachedKey = current;
      }
    });
  });

  $effect(() => {
    if (!timerRunning) return;
    now = app.clock.now();
    const timer = setInterval(onTick, TICK_MS);
    return () => clearInterval(timer);
  });

  $effect(() => {
    if (session.paused && session.phase !== "summary" && dialog === null) {
      dialog = "pause";
    }
  });

  onDestroy(() => {
    // Teardown reads state as it was before the update that removed the
    // player, so a session that just reached its summary would look unfinished.
    queueMicrotask(() => {
      const current = app.state.activeSession;
      if (current && !current.paused && current.phase !== "summary") {
        send({ type: "pause", at: app.clock.now() });
      }
    });
  });

  function send(action: SessionAction): boolean {
    const before = app.state.activeSession;
    if (!before) return false;
    const after = reduce(before, action);
    if (after === before) return false;
    if (before.phase === "rest" && after.phase === "work") {
      restOverKey = stepKey(after);
    }
    if ("at" in action) now = action.at;
    app.dispatch((state) => sessionAction(state, action));
    const cue = transitionCue(before, after);
    if (cue) app.cues.play(cue);
    const message = transitionAnnouncement(before, after, action);
    if (message) app.announce(message);
    if (after.phase !== "summary") {
      if (stepKey(after) !== stepKey(before)) {
        tick().then(() => showStage(stage));
      } else if (action.type === "resume") {
        // A pause dialog opened on load has no opener to return focus to.
        tick().then(() =>
          document.activeElement === document.body
            ? showStage(stage)
            : stage?.scrollIntoView({ block: "start" }),
        );
      }
    }
    return true;
  }

  function onTick() {
    const at = app.clock.now();
    now = at;
    const current = app.state.activeSession;
    if (!current || current.paused) return;
    if (current.phase === "rest") {
      if (restRemainingMs(current, at) === 0) send({ type: "tick", at });
      return;
    }
    const currentKey = stepKey(current);
    const target = currentExercise(current);
    if (
      target.type === "hold" &&
      current.holdStarted &&
      targetReachedKey !== currentKey &&
      holdElapsedMs(current, at) >= target.target * 1000
    ) {
      targetReachedKey = currentKey;
      app.cues.play("hold-target");
      app.announce("Target reached. Keep going or press Done.");
    }
  }

  const press = (handler: () => void) => () => {
    app.cues.unlock();
    handler();
  };

  function primaryPress() {
    app.cues.unlock();
    const at = app.clock.now();
    if (at - since < GUARD_MS) return;
    const current = app.state.activeSession;
    if (!current) return;
    if (current.phase === "rest") {
      send({ type: "skipRest", at });
      return;
    }
    if (currentExercise(current).type === "hold") {
      if (!current.holdStarted) send({ type: "startHold", at });
      else if (holdElapsedMs(current, at) >= MIN_HOLD_MS) {
        send({ type: "log", at, today: app.clock.today() });
      }
      return;
    }
    const value = parseWholeNumber(text, { min: 1, max: MAX_REPS });
    if (value === null) {
      repsError = true;
      return;
    }
    send({ type: "log", at, today: app.clock.today(), value });
  }

  function openDialog(next: Dialog) {
    reasons = [];
    dialog = next;
    send({ type: "pause", at: app.clock.now() });
  }

  function closePause(value: string | null) {
    if (value === "end") {
      reasons = [];
      dialog = "end";
      return;
    }
    dialog = null;
    app.cues.unlock();
    send({ type: "resume", at: app.clock.now() });
  }

  function closeSkip(value: string | null) {
    const chosen = reasons;
    dialog = null;
    app.cues.unlock();
    const at = app.clock.now();
    send({ type: "resume", at });
    if (value === "skip") send({ type: "skip", at, reasons: chosen });
  }

  function closeEnd(value: string | null) {
    const chosen = reasons;
    dialog = null;
    app.cues.unlock();
    const at = app.clock.now();
    if (value === "end") send({ type: "end", at, reasons: chosen });
    else send({ type: "resume", at });
  }

  function toggleMute() {
    app.dispatch((state) => setMuted(state, !state.settings.muted));
  }
</script>

<div
  bind:this={stage}
  data-wk="stage"
  class="flex flex-col gap-5 pb-3 max-[620px]:min-h-[calc(100dvh-var(--chrome-h)-var(--status-h)-24px)] [&_dialog_button]:min-h-12 [&_dialog_button]:min-w-12"
>
  <div data-wk="bar" class="flex flex-col gap-2">
    {#if working}
      <p class="font-mono text-xs text-muted">{positionText(session)}</p>
    {/if}
    <div class="flex items-center gap-2">
      <progress
        class="h-2.5 min-w-0 flex-1 appearance-none border border-field bg-raised accent-fn [&::-moz-progress-bar]:bg-fn [&::-webkit-progress-bar]:bg-raised [&::-webkit-progress-value]:bg-fn"
        max={session.steps.length}
        value={doneCount}
        aria-label="Session progress"
      ></progress>
      <button
        type="button"
        class={BUTTON}
        aria-pressed={!muted}
        onclick={press(toggleMute)}>{muted ? "sound off" : "sound on"}</button
      >
      <button
        type="button"
        class={BUTTON}
        onclick={press(() => openDialog("pause"))}>pause</button
      >
    </div>
  </div>

  <div
    class={[
      "flex flex-1 flex-col gap-4",
      working
        ? "min-[900px]:grid min-[900px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] min-[900px]:gap-10"
        : "min-[900px]:w-full min-[900px]:max-w-[36rem]",
    ]}
  >
    {#if working}
      <div class="flex justify-center min-[900px]:justify-start">
        <div class="w-[200px] min-[620px]:w-[240px] min-[900px]:w-[260px]">
          <Figure variationId={exercise.variationId} size="large" />
        </div>
      </div>
    {/if}

    <div class="flex min-w-0 flex-1 flex-col gap-4">
      {#if working}
        {#if restOverKey === key}
          <p class="font-mono text-xs font-semibold text-fg">Rest over</p>
        {/if}
        <h2
          tabindex="-1"
          data-wk="screen-title"
          class="text-2xl font-semibold text-fg"
        >
          {exercise.variationName}
        </h2>
        {#if isHold}
          <p data-wk="target" class="font-mono text-base text-fg">
            Target: {targetText(exercise)}
          </p>
          <div class="flex flex-col gap-1">
            <p
              role="timer"
              aria-label="Time held"
              data-wk="timer"
              class="font-mono text-fg tabular-nums"
            >
              <span class="text-5xl leading-none font-semibold"
                >{formatClock(holdMs / 1000)}</span
              >
              <span class="text-xl text-muted"
                >/ {formatClock(exercise.target)}</span
              >
            </p>
            <p class="min-h-5 font-mono text-sm font-semibold text-fg">
              {reached ? "Target reached" : ""}
            </p>
          </div>
        {:else}
          <p data-wk="target" class="font-mono text-fg">
            <span class="text-sm text-muted">Target:</span>
            <span class="text-5xl leading-none font-semibold tabular-nums"
              >{exercise.target}</span
            >
            <span class="text-base"
              >reps{exercise.perSide ? " each side" : ""}</span
            >
          </p>
          <div data-wk="reps">
            <Stepper
              id={`${uid}-reps`}
              label="reps done"
              bind:value={text}
              min={1}
              max={MAX_REPS}
              error={repsError ? "Enter a whole number from 1 to 999." : null}
              decreaseLabel="one fewer rep"
              increaseLabel="one more rep"
              onenter={primaryPress}
              onpress={() => app.cues.unlock()}
            />
          </div>
        {/if}
        <p class="font-mono text-xs text-muted">{nextText(session)}</p>
      {:else}
        <h2
          tabindex="-1"
          data-wk="screen-title"
          class="text-2xl font-semibold text-fg"
        >
          Rest
        </h2>
        <p
          role="timer"
          aria-label="Rest left"
          data-wk="timer"
          class="font-mono text-6xl leading-none font-semibold text-fg tabular-nums"
        >
          {formatClock(Math.ceil(restMs / 1000))}
        </p>
        {#if upNext}
          <section
            aria-labelledby={`${uid}-up-next`}
            class="flex items-center gap-4 border border-line bg-raised p-4"
          >
            <Figure variationId={upNext.exercise.variationId} size="thumb" />
            <div class="flex min-w-0 flex-col gap-1">
              <h3 id={`${uid}-up-next`} class="font-mono text-xs text-muted">
                Up next
              </h3>
              <p class="font-semibold text-fg">
                {upNext.exercise.variationName}
              </p>
              <p class="font-mono text-sm text-muted">
                Set {upNext.step.setNumber} of {upNext.exercise.plannedSets} · {targetText(
                  upNext.exercise,
                )}{upNext.step.side
                  ? ` · ${PLAYER_SIDE_LABELS[upNext.step.side]}`
                  : ""}
              </p>
            </div>
          </section>
        {/if}
      {/if}

      <div
        data-wk="dock"
        class="mt-auto flex flex-col gap-2 pt-2 min-[900px]:max-w-[24rem]"
      >
        <button
          type="button"
          data-wk="primary"
          class="tool-btn tool-btn-primary min-h-14 w-full text-sm"
          onclick={primaryPress}>{primaryLabel}</button
        >
        <div class="flex gap-2">
          {#if working}
            <button
              type="button"
              class="{BUTTON} flex-1"
              onclick={press(() => openDialog("skip"))}>skip set</button
            >
          {:else}
            <button
              type="button"
              class="{BUTTON} flex-1"
              aria-label="add 15 seconds"
              onclick={press(() => send({ type: "addRest" }))}>+15 s</button
            >
          {/if}
          <button
            type="button"
            class="{BUTTON} flex-1"
            onclick={press(() => openDialog("end"))}>end session</button
          >
        </div>
      </div>
      {#if working}
        <p class="leading-relaxed text-fg">
          {variation(exercise.variationId)?.cue}
        </p>
      {/if}
    </div>
  </div>

  {#if dialog === "pause"}
    <ConfirmDialog
      title="Paused"
      actions={[
        { label: "resume", value: "resume", primary: true },
        { label: "end session", value: "end" },
      ]}
      onclose={closePause}
    >
      <p>Timers are frozen. Pausing never counts against you.</p>
    </ConfirmDialog>
  {:else if dialog === "skip"}
    <ConfirmDialog
      title="Skip this set?"
      actions={[
        { label: "cancel", value: "cancel" },
        { label: "skip set", value: "skip", primary: true },
      ]}
      initialFocus="last"
      onclose={closeSkip}
    >
      <p>Nothing is logged for a skipped set. If you like, say why.</p>
      <ReasonChips onchange={(list) => (reasons = list)} />
    </ConfirmDialog>
  {:else if dialog === "end"}
    <ConfirmDialog
      title="End session early?"
      actions={[
        { label: "keep going", value: "keep" },
        { label: "end session", value: "end", primary: true },
      ]}
      onclose={closeEnd}
    >
      <p>What you logged is kept. One logged set is enough to count today.</p>
      <ReasonChips onchange={(list) => (reasons = list)} />
    </ConfirmDialog>
  {/if}
</div>
