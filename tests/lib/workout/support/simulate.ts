import {
  answerSuggestion,
  beginSession,
  finishPlacement,
  saveSession,
  sessionAction,
} from "../../../../src/lib/tools/workout/app/actions";
import {
  addDays,
  dayNumber,
} from "../../../../src/lib/tools/workout/core/dates";
import {
  currentExercise,
  currentStep,
  type SessionAction,
} from "../../../../src/lib/tools/workout/session/session";
import { defaultState } from "../../../../src/lib/tools/workout/storage/schema";
import type {
  AppState,
  DateKey,
  SessionExercise,
  Step,
} from "../../../../src/lib/tools/workout/types";

const DAY_MS = 86400000;
const EVENING_MS = 64800000;
const ACTION_GAP_MS = 1000;

export type Behaviour =
  | "meet"
  | "short"
  | "none"
  | ((step: Step, exercise: SessionExercise) => number | "skip");

export interface DayOptions {
  behaviour?: Behaviour;
  accept?: (movementId: string) => boolean;
}

export function startOf(dateKey: DateKey): number {
  return dayNumber(dateKey) * DAY_MS + EVENING_MS;
}

function valueFor(
  behaviour: Behaviour,
  step: Step,
  exercise: SessionExercise,
): number | "skip" {
  if (typeof behaviour === "function") return behaviour(step, exercise);
  if (behaviour === "short") {
    return Math.max(1, Math.floor(exercise.target / 2));
  }
  return exercise.target;
}

function apply(state: AppState, action: SessionAction): AppState {
  const next = sessionAction(state, action);
  if (next === state) {
    throw new Error(`Session action did not apply: ${action.type}`);
  }
  return next;
}

// Resolves work steps of the active session until the summary, or until `steps` were resolved.
// `today` is a date key, or a function of the number of steps already resolved.
export function driveSession(
  state: AppState,
  {
    at,
    today,
    behaviour = "meet",
    steps = Infinity,
  }: {
    at: number;
    today: DateKey | ((resolved: number) => DateKey);
    behaviour?: Behaviour;
    steps?: number;
  },
): { state: AppState; at: number } {
  let next = state;
  let t = at;
  let resolved = 0;
  while (next.activeSession!.phase !== "summary" && resolved < steps) {
    const session = next.activeSession!;
    if (session.phase === "rest") {
      next = apply(next, { type: "skipRest", at: t });
    } else {
      const exercise = currentExercise(session);
      const value = valueFor(behaviour, currentStep(session), exercise);
      const day = typeof today === "function" ? today(resolved) : today;
      if (value === "skip") {
        next = apply(next, { type: "skip", reasons: [], at: t });
      } else if (exercise.type === "hold") {
        next = apply(next, { type: "startHold", at: t });
        t += value * 1000;
        next = apply(next, { type: "log", at: t, today: day });
      } else {
        next = apply(next, { type: "log", value, at: t, today: day });
      }
      resolved += 1;
    }
    t += ACTION_GAP_MS;
  }
  return { state: next, at: t };
}

function answerPending(
  state: AppState,
  accept: (movementId: string) => boolean,
): AppState {
  let next = state;
  for (const [movementId, entry] of Object.entries(state.progress)) {
    if (entry.suggestion && accept(movementId)) {
      next = answerSuggestion(next, movementId, true);
    }
  }
  return next;
}

export function simulateDay(
  state: AppState,
  dateKey: DateKey,
  options: DayOptions = {},
): AppState {
  const { behaviour = "meet", accept = () => true } = options;
  if (behaviour === "none") return state;
  const now = startOf(dateKey);
  const begun = beginSession(state, { today: dateKey, now });
  if (begun === state) return state;
  const driven = driveSession(begun, { at: now, today: dateKey, behaviour });
  return answerPending(saveSession(driven.state, { now: driven.at }), accept);
}

export function simulateDays(
  state: AppState,
  firstDateKey: DateKey,
  count: number,
  optionsFor: DayOptions | ((dateKey: DateKey, i: number) => DayOptions) = {},
): AppState {
  let next = state;
  for (let i = 0; i < count; i += 1) {
    const dateKey = addDays(firstDateKey, i);
    const options =
      typeof optionsFor === "function" ? optionsFor(dateKey, i) : optionsFor;
    next = simulateDay(next, dateKey, options);
  }
  return next;
}

export function buildDemoState(endDateKey: DateKey): AppState {
  const start = finishPlacement(defaultState(), {
    push: 0,
    legs: 30,
    core: 50,
    back: 20,
    conditioning: 12,
  });
  const gap = addDays(endDateKey, -2);
  return simulateDays(start, addDays(endDateKey, -59), 60, (dateKey) => ({
    behaviour: dateKey === gap ? "none" : "meet",
    accept: (id) => id !== "push-up",
  }));
}
