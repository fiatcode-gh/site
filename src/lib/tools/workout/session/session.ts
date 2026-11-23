import { isDateKey } from "../core/dates";
import type { Reason } from "../core/reasons";
import { REASONS } from "../core/reasons";
import { movement, variation } from "../library/library";
import type {
  DateKey,
  Plan,
  PlanExercise,
  SessionExercise,
  SessionRecord,
  SessionState,
  Side,
  Step,
  Stopwatch,
} from "../types";
import { elapsedMs, newStopwatch, startWatch, stopWatch } from "./stopwatch";

export type SessionAction =
  | { type: "startHold"; at: number }
  | { type: "log"; at: number; today: DateKey; value?: number }
  | { type: "skip"; at: number; reasons: Reason[] }
  | { type: "pause"; at: number }
  | { type: "resume"; at: number }
  | { type: "end"; at: number; reasons: Reason[] }
  | { type: "tick"; at: number }
  | { type: "skipRest"; at: number }
  | { type: "addRest" }
  | { type: "correct"; stepIndex: number; value: number };

export type CueName = "set-start" | "rest-end" | "hold-target" | "session-end";

type ActionOf<K extends SessionAction["type"]> = Extract<
  SessionAction,
  { type: K }
>;

export const REST_ADD_MS = 15000;
export const REST_MAX_MS = 600000;

const MAX_REPS = 999;
const MAX_HOLD_SECONDS = 3600;

function sessionExercise(exercise: PlanExercise): SessionExercise {
  return {
    movementId: exercise.movementId,
    movementName: movement(exercise.movementId)!.name,
    variationId: exercise.variationId,
    variationName: variation(exercise.variationId)!.name,
    pattern: exercise.pattern,
    level: exercise.level,
    type: exercise.type,
    perSide: exercise.perSide,
    plannedSets: exercise.sets,
    target: exercise.target,
    restSeconds: exercise.restSeconds,
  };
}

function pendingStep(
  exerciseIndex: number,
  setNumber: number,
  side: Side | null,
): Step {
  return {
    exerciseIndex,
    setNumber,
    side,
    status: "pending",
    value: null,
    loggedOn: null,
    reasons: [],
  };
}

function expandSteps(exercises: SessionExercise[]): Step[] {
  return exercises.flatMap((exercise, exerciseIndex) => {
    const steps: Step[] = [];
    for (let setNumber = 1; setNumber <= exercise.plannedSets; setNumber += 1) {
      if (exercise.perSide) {
        steps.push(pendingStep(exerciseIndex, setNumber, "left"));
        steps.push(pendingStep(exerciseIndex, setNumber, "right"));
      } else {
        steps.push(pendingStep(exerciseIndex, setNumber, null));
      }
    }
    return steps;
  });
}

export function createSession(
  plan: Plan,
  { now }: { now: number },
): SessionState {
  const exercises = plan.exercises.map(sessionExercise);
  return {
    id: `${plan.dateKey}T${now}`,
    date: plan.dateKey,
    dayType: plan.dayType,
    startedAt: now,
    exercises,
    steps: expandSteps(exercises),
    cursor: 0,
    phase: "work",
    paused: false,
    holdStarted: false,
    hold: newStopwatch(),
    rest: null,
    endedEarly: false,
    endReasons: [],
    endMovementId: null,
  };
}

function sanitizeReasons(reasons: unknown): Reason[] {
  if (!Array.isArray(reasons)) return [];
  const known: readonly unknown[] = REASONS;
  return [
    ...new Set(
      reasons.filter((reason): reason is Reason => known.includes(reason)),
    ),
  ];
}

function isWholeIn(value: unknown, min: number, max: number): value is number {
  return (
    Number.isInteger(value) &&
    (value as number) >= min &&
    (value as number) <= max
  );
}

function exerciseOf(state: SessionState, stepIndex: number): SessionExercise {
  return state.exercises[state.steps[stepIndex].exerciseIndex];
}

function nextPendingIndex(state: SessionState): number {
  return state.steps.findIndex(
    (s, index) => index > state.cursor && s.status === "pending",
  );
}

function isOtherSide(a: Step, b: Step): boolean {
  return (
    a.side !== null &&
    b.side !== null &&
    a.side !== b.side &&
    a.exerciseIndex === b.exerciseIndex &&
    a.setNumber === b.setNumber
  );
}

function workAt(state: SessionState, cursor: number): SessionState {
  return {
    ...state,
    cursor,
    phase: "work",
    rest: null,
    hold: newStopwatch(),
    holdStarted: false,
  };
}

function advance(
  state: SessionState,
  at: number,
  withRest: boolean,
): SessionState {
  const next = nextPendingIndex(state);
  if (next === -1) {
    return {
      ...state,
      phase: "summary",
      rest: null,
      hold: newStopwatch(),
      holdStarted: false,
    };
  }
  if (!withRest || isOtherSide(state.steps[state.cursor], state.steps[next])) {
    return workAt(state, next);
  }
  return {
    ...state,
    phase: "rest",
    rest: {
      durationMs: exerciseOf(state, state.cursor).restSeconds * 1000,
      watch: startWatch(newStopwatch(), at),
    },
    hold: newStopwatch(),
    holdStarted: false,
  };
}

function leaveRest(state: SessionState): SessionState {
  return workAt(state, nextPendingIndex(state));
}

function replaceStep(
  state: SessionState,
  index: number,
  changes: Partial<Step>,
): Step[] {
  return state.steps.map((s, i) => (i === index ? { ...s, ...changes } : s));
}

function loggedValue(
  state: SessionState,
  action: ActionOf<"log">,
): number | null {
  if (exerciseOf(state, state.cursor).type === "hold") {
    if (!state.holdStarted) return null;
    const seconds = Math.floor(elapsedMs(state.hold, action.at) / 1000);
    const value = Math.min(seconds, MAX_HOLD_SECONDS);
    return value >= 1 ? value : null;
  }
  return isWholeIn(action.value, 1, MAX_REPS) ? action.value : null;
}

function log(state: SessionState, action: ActionOf<"log">): SessionState {
  if (!isDateKey(action.today)) return state;
  const value = loggedValue(state, action);
  if (value === null) return state;
  const steps = replaceStep(state, state.cursor, {
    status: "logged",
    value,
    loggedOn: action.today,
  });
  return advance({ ...state, steps }, action.at, true);
}

function skip(state: SessionState, action: ActionOf<"skip">): SessionState {
  const current = state.steps[state.cursor];
  const reasons = sanitizeReasons(action.reasons);
  const steps = state.steps.map((s, index): Step => {
    const inSet =
      index === state.cursor ||
      (index > state.cursor &&
        s.status === "pending" &&
        s.exerciseIndex === current.exerciseIndex &&
        s.setNumber === current.setNumber);
    return inSet
      ? { ...s, status: "skipped", value: null, loggedOn: null, reasons }
      : s;
  });
  return advance({ ...state, steps }, action.at, false);
}

function stopWatches(state: SessionState, at: number): SessionState {
  return {
    ...state,
    hold: stopWatch(state.hold, at),
    rest: state.rest && {
      ...state.rest,
      watch: stopWatch(state.rest.watch, at),
    },
  };
}

function resume(state: SessionState, at: number): SessionState {
  if (state.phase === "rest") {
    const rest = state.rest!;
    return {
      ...state,
      paused: false,
      rest: { ...rest, watch: startWatch(rest.watch, at) },
    };
  }
  const hold = state.holdStarted ? startWatch(state.hold, at) : state.hold;
  return { ...state, paused: false, hold };
}

function end(state: SessionState, action: ActionOf<"end">): SessionState {
  return {
    ...stopWatches(state, action.at),
    phase: "summary",
    paused: false,
    rest: null,
    endedEarly: true,
    endReasons: sanitizeReasons(action.reasons),
    endMovementId: exerciseOf(state, state.cursor).movementId,
  };
}

function correct(
  state: SessionState,
  action: ActionOf<"correct">,
): SessionState {
  const target = state.steps[action.stepIndex] as Step | undefined;
  if (!target || target.status !== "logged") return state;
  const max =
    state.exercises[target.exerciseIndex].type === "hold"
      ? MAX_HOLD_SECONDS
      : MAX_REPS;
  if (!isWholeIn(action.value, 1, max)) return state;
  return {
    ...state,
    steps: replaceStep(state, action.stepIndex, { value: action.value }),
  };
}

function reduceWork(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "startHold":
      if (state.holdStarted || exerciseOf(state, state.cursor).type !== "hold")
        return state;
      return {
        ...state,
        holdStarted: true,
        hold: startWatch(state.hold, action.at),
      };
    case "log":
      return log(state, action);
    case "skip":
      return skip(state, action);
    default:
      return state;
  }
}

function reduceRest(state: SessionState, action: SessionAction): SessionState {
  const rest = state.rest!;
  switch (action.type) {
    case "tick":
      return elapsedMs(rest.watch, action.at) >= rest.durationMs
        ? leaveRest(state)
        : state;
    case "skipRest":
      return leaveRest(state);
    case "addRest":
      return {
        ...state,
        rest: {
          ...rest,
          durationMs: Math.min(rest.durationMs + REST_ADD_MS, REST_MAX_MS),
        },
      };
    default:
      return state;
  }
}

export function reduce(
  state: SessionState,
  action: SessionAction,
): SessionState {
  if (state.phase === "summary") {
    return action.type === "correct" ? correct(state, action) : state;
  }
  if (action.type === "end") return end(state, action);
  if (state.paused)
    return action.type === "resume" ? resume(state, action.at) : state;
  if (action.type === "pause")
    return { ...stopWatches(state, action.at), paused: true };
  return state.phase === "rest"
    ? reduceRest(state, action)
    : reduceWork(state, action);
}

function dropOpenSegment(watch: Stopwatch): Stopwatch {
  return { accumulatedMs: watch.accumulatedMs, runningSince: null };
}

export function restoreSession(state: SessionState): SessionState {
  if (state.phase === "summary") return state;
  return {
    ...state,
    paused: true,
    hold: dropOpenSegment(state.hold),
    rest: state.rest && {
      ...state.rest,
      watch: dropOpenSegment(state.rest.watch),
    },
  };
}

export function toRecord(
  state: SessionState,
  { endedAt }: { endedAt: number },
): SessionRecord {
  return {
    id: state.id,
    date: state.date,
    dayType: state.dayType,
    startedAt: state.startedAt,
    endedAt,
    exercises: state.exercises,
    steps: state.steps,
    endedEarly: state.endedEarly,
    endReasons: state.endReasons,
    endMovementId: state.endMovementId,
    changes: [],
  };
}

export function currentStep(state: SessionState): Step {
  return state.steps[state.cursor];
}

export function currentExercise(state: SessionState): SessionExercise {
  return exerciseOf(state, state.cursor);
}

export function position(state: SessionState): {
  stepNumber: number;
  stepCount: number;
  exerciseNumber: number;
  exerciseCount: number;
  setNumber: number;
  setCount: number;
} {
  const current = currentStep(state);
  return {
    stepNumber: state.cursor + 1,
    stepCount: state.steps.length,
    exerciseNumber: current.exerciseIndex + 1,
    exerciseCount: state.exercises.length,
    setNumber: current.setNumber,
    setCount: state.exercises[current.exerciseIndex].plannedSets,
  };
}

export function nextUp(
  state: SessionState,
):
  | null
  | { kind: "finish"; stepIndex: null }
  | { kind: "side" | "set" | "exercise"; stepIndex: number } {
  if (state.phase === "summary") return null;
  const stepIndex = nextPendingIndex(state);
  if (stepIndex === -1) return { kind: "finish", stepIndex: null };
  const current = currentStep(state);
  const next = state.steps[stepIndex];
  if (isOtherSide(current, next)) return { kind: "side", stepIndex };
  return {
    kind: current.exerciseIndex === next.exerciseIndex ? "set" : "exercise",
    stepIndex,
  };
}

export function holdElapsedMs(state: SessionState, at: number): number {
  return elapsedMs(state.hold, at);
}

export function restRemainingMs(state: SessionState, at: number): number {
  if (state.phase !== "rest" || !state.rest) return 0;
  return Math.max(0, state.rest.durationMs - elapsedMs(state.rest.watch, at));
}

export function loggedCount(state: SessionState): number {
  return state.steps.filter((s) => s.status === "logged").length;
}

export function transitionCue(
  previous: SessionState,
  next: SessionState,
): CueName | null {
  if (next.phase === "summary")
    return previous.phase === "summary" ? null : "session-end";
  if (previous.phase === "rest" && next.phase === "work") return "rest-end";
  if (
    previous.phase === "work" &&
    next.phase === "work" &&
    previous.cursor !== next.cursor
  ) {
    return "set-start";
  }
  return null;
}
