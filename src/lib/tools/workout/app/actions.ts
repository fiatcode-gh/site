import {
  placementProgress,
  type PlacementResults,
} from "../placement/placement";
import { TIME_CAP } from "../planner/estimate";
import { planDay } from "../planner/planner";
import {
  evaluateSession,
  resolveSuggestion,
  setLevel,
} from "../progression/progression";
import {
  createSession,
  reduce,
  restoreSession,
  toRecord,
  type SessionAction,
} from "../session/session";
import { todayStatus } from "../tracking/tracking";
import type {
  AppState,
  Change,
  DateKey,
  Plan,
  ProgressMap,
  SessionRecord,
  SessionState,
} from "../types";

function withProgress(state: AppState, progress: ProgressMap): AppState {
  return progress === state.progress ? state : { ...state, progress };
}

function withSession(
  state: AppState,
  activeSession: SessionState | null,
): AppState {
  return activeSession === state.activeSession
    ? state
    : { ...state, activeSession };
}

export function finishPlacement(
  state: AppState,
  results: PlacementResults,
): AppState {
  return { ...state, progress: placementProgress(results), onboarded: true };
}

export function setTimeCap(state: AppState, minutes: number): AppState {
  const valid =
    Number.isInteger(minutes) &&
    minutes >= TIME_CAP.min &&
    minutes <= TIME_CAP.max &&
    minutes % TIME_CAP.step === 0;
  if (!valid) return state;
  return { ...state, settings: { ...state.settings, timeCapMinutes: minutes } };
}

export function setMuted(state: AppState, muted: boolean): AppState {
  if (typeof muted !== "boolean") return state;
  return { ...state, settings: { ...state.settings, muted } };
}

export function chooseVariation(
  state: AppState,
  movementId: string,
  level: number,
): AppState {
  return withProgress(state, setLevel(state.progress, movementId, level));
}

export function answerSuggestion(
  state: AppState,
  movementId: string,
  accept: boolean,
): AppState {
  return withProgress(
    state,
    resolveSuggestion(state.progress, movementId, accept).progress,
  );
}

export function todayPlan(state: AppState, today: DateKey): Plan {
  return planDay({
    dateKey: today,
    progress: state.progress,
    timeCapMinutes: state.settings.timeCapMinutes,
  });
}

export function beginSession(
  state: AppState,
  { today, now }: { today: DateKey; now: number },
): AppState {
  if (!state.onboarded || state.activeSession) return state;
  if (todayStatus(state, today) !== "not-started") return state;
  return {
    ...state,
    activeSession: createSession(todayPlan(state, today), { now }),
  };
}

export function sessionAction(
  state: AppState,
  action: SessionAction,
): AppState {
  if (!state.activeSession) return state;
  return withSession(state, reduce(state.activeSession, action));
}

export function previewSession(
  state: AppState,
  { now }: { now: number },
): { record: SessionRecord; progress: ProgressMap; changes: Change[] } | null {
  if (state.activeSession?.phase !== "summary") return null;
  const record = toRecord(state.activeSession, { endedAt: now });
  const { progress, changes } = evaluateSession(state.progress, record);
  return { record, progress, changes };
}

export function saveSession(
  state: AppState,
  { now }: { now: number },
): AppState {
  const preview = previewSession(state, { now });
  if (!preview) return state;
  return {
    ...state,
    progress: preview.progress,
    history: [
      ...state.history,
      { ...preview.record, changes: preview.changes },
    ],
    activeSession: null,
  };
}

export function restoreOnLoad(state: AppState): AppState {
  if (!state.activeSession) return state;
  return withSession(state, restoreSession(state.activeSession));
}
