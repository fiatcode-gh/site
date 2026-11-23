import { formatLoggedValues } from "@/lib/tools/workout/core/format";
import { REASON_LABELS, type Reason } from "@/lib/tools/workout/core/reasons";
import { variationAt } from "@/lib/tools/workout/library/library";
import { formatWork } from "@/lib/tools/workout/progression/progression";
import {
  currentExercise,
  nextUp,
  position,
  type SessionAction,
} from "@/lib/tools/workout/session/session";
import type { WeekDay } from "@/lib/tools/workout/tracking/tracking";
import { movementHistory } from "@/lib/tools/workout/tracking/tracking";
import type {
  DateKey,
  DayType,
  Progress,
  SessionExercise,
  SessionRecord,
  SessionState,
  Side,
  Step,
  Variation,
  WorkType,
} from "@/lib/tools/workout/types";

export const DAY_TYPE_LABELS: Readonly<Record<DayType, string>> = {
  training: "Training day",
  recovery: "Recovery day",
};

export const SAFETY_NOTE =
  "Workout is not medical advice. Stop if something hurts, and check with a professional if you are unsure.";

export const PAIN_NOTE =
  "Pain is a reason to stop. Rest, and get it checked if it does not settle. Marking pain never changes your plan.";

const LONG_DATE = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const WEEKDAY = new Intl.DateTimeFormat("en-GB", { weekday: "long" });
const WEEKDAY_SHORT = new Intl.DateTimeFormat("en-GB", { weekday: "short" });

export function dateFromKey(dateKey: DateKey): Date {
  const [y, m, d] = dateKey.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}

export const longDate = (dateKey: DateKey): string =>
  LONG_DATE.format(dateFromKey(dateKey));

export const shortWeekday = (dateKey: DateKey): string =>
  WEEKDAY_SHORT.format(dateFromKey(dateKey));

export interface WorkShape {
  sets?: number;
  plannedSets?: number;
  target: number;
  type: WorkType;
  perSide: boolean;
}

export function workText(exercise: WorkShape): string {
  return formatWork(
    exercise.sets ?? exercise.plannedSets ?? 0,
    exercise.target,
    exercise,
  );
}

export const reasonText = (reasons: readonly Reason[]): string =>
  reasons.map((r) => REASON_LABELS[r]).join(", ");

export const reasonChipLabel = (reason: Reason): string =>
  REASON_LABELS[reason].toLowerCase();

export const summaryStepLabel = (step: Step): string =>
  `Set ${step.setNumber}${step.side ? `, ${step.side} side` : ""}`;

export const PLAYER_SIDE_LABELS: Readonly<Record<Side, string>> = {
  left: "Left side",
  right: "Right side",
};

export function exerciseAt(
  session: SessionState,
  stepIndex: number,
): SessionExercise {
  return session.exercises[session.steps[stepIndex].exerciseIndex];
}

export function targetText(exercise: SessionExercise, unit?: string): string {
  const each = exercise.perSide ? " each side" : "";
  return `${exercise.target} ${unit ?? (exercise.type === "hold" ? "s" : "reps")}${each}`;
}

export function positionText(session: SessionState): string {
  const p = position(session);
  const side = session.steps[session.cursor].side;
  return (
    `Exercise ${p.exerciseNumber} of ${p.exerciseCount} · Set ${p.setNumber} of ` +
    `${p.setCount}${side ? ` · ${PLAYER_SIDE_LABELS[side]}` : ""}`
  );
}

export function nextText(session: SessionState): string {
  const next = nextUp(session);
  if (!next || next.kind === "finish") return "Next: summary";
  const step = session.steps[next.stepIndex];
  const exercise = exerciseAt(session, next.stepIndex);
  if (next.kind === "side") return `Next: ${step.side} side`;
  if (next.kind === "set") {
    return `Next: rest, then set ${step.setNumber} of ${exercise.plannedSets}`;
  }
  return `Next: rest, then ${exercise.variationName}`;
}

function stepAnnouncement(session: SessionState, afterRest: boolean): string {
  const exercise = currentExercise(session);
  const { setNumber, setCount } = position(session);
  const step = session.steps[session.cursor];
  const side = step.side ? `, ${step.side} side` : "";
  const target = targetText(
    exercise,
    exercise.type === "hold" ? "seconds" : "reps",
  );
  return (
    `${afterRest ? "Rest over. " : ""}${exercise.variationName}, set ${setNumber} of ` +
    `${setCount}${side}, target ${target}.`
  );
}

/** The sentence the player announces for a change of session state, or null for none. */
export function transitionAnnouncement(
  before: SessionState,
  after: SessionState,
  action: SessionAction,
): string | null {
  if (action.type === "pause") return "Paused.";
  if (action.type === "resume") return "Resumed.";
  if (after.phase === "summary") return "Session finished.";
  if (after.phase === "rest" && before.phase !== "rest") {
    const next = nextUp(after);
    const name =
      next && next.stepIndex !== null
        ? exerciseAt(after, next.stepIndex).variationName
        : "";
    const seconds = Math.round((after.rest?.durationMs ?? 0) / 1000);
    return `Rest, ${seconds} seconds. Next: ${name}.`;
  }
  if (
    after.phase === "work" &&
    (before.phase !== "work" || before.cursor !== after.cursor)
  ) {
    return stepAnnouncement(after, before.phase === "rest");
  }
  return null;
}

const SIDE_LABELS: Readonly<Record<string, string>> = {
  left: " left",
  right: " right",
};

export function stepLine(exercise: { type: WorkType }, step: Step): string {
  const label = `Set ${step.setNumber}${SIDE_LABELS[step.side ?? ""] ?? ""}`;
  if (step.status === "logged") {
    return `${label}: ${step.value} ${exercise.type === "hold" ? "s" : "reps"}`;
  }
  if (step.status === "skipped") {
    const reasons = reasonText(step.reasons);
    return `${label}: skipped${reasons ? ` (${reasons})` : ""}`;
  }
  return `${label}: not done`;
}

export function streakText(count: number): string {
  if (count === 1) return "Streak: 1 day";
  if (count > 1) return `Streak: ${count} days`;
  return "No streak yet";
}

export function weekDayLabel({
  dateKey,
  dayType,
  active,
  isToday,
}: WeekDay): string {
  const date = dateFromKey(dateKey);
  return (
    `${WEEKDAY.format(date)} ${date.getDate()}${isToday ? " (today)" : ""}, ` +
    `${active ? "trained" : "no session"}${dayType === "recovery" ? ", recovery day" : ""}`
  );
}

const SHORT_DATE = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

export const shortDate = (dateKey: DateKey): string =>
  SHORT_DATE.format(dateFromKey(dateKey));

export function currentWork(movementId: string, entry: Progress): string {
  const v = variationAt(movementId, entry.level)!;
  return workText({
    sets: entry.sets,
    target: entry.target,
    type: v.type,
    perSide: v.perSide,
  });
}

export function rangeText(v: Variation): string {
  return `${v.min}–${v.max} ${v.type === "hold" ? "s" : "reps"}${v.perSide ? " each side" : ""}`;
}

export function lastLine(
  history: readonly SessionRecord[],
  movementId: string,
): string {
  const [last] = movementHistory(history, movementId, 1);
  if (!last) return "Not trained yet";
  const values = last.steps
    .filter((s) => s.status === "logged")
    .map((s) => s.value ?? 0);
  return `Last: ${shortDate(last.date)} · ${formatLoggedValues(values, last.type)}`;
}
