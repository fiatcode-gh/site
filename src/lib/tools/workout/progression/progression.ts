import { movement, variationAt } from "../library/library";
import type {
  Change,
  ChangeKind,
  ChangeReason,
  DateKey,
  Progress,
  ProgressMap,
  SessionExercise,
  SessionRecord,
  Step,
  Suggestion,
  Variation,
} from "../types";
import {
  MAX_SETS,
  MIN_SETS,
  midTarget,
  newProgress,
  stepSize,
} from "./progress";

export const TOP_STREAK_FOR_SUGGESTION = 2;
export const LOW_STREAK_FOR_SUGGESTION = 2;
export const TOO_HARD_WINDOW = 3;
export const TOO_HARD_FOR_SUGGESTION = 2;
export const DECLINE_COOLDOWN = 3;
export const SHORT_RATIO = 0.8;

type Work = Pick<Progress, "level" | "sets" | "target">;

export function formatWork(
  sets: number,
  target: number,
  variation: Pick<Variation, "type" | "perSide">,
): string {
  const unit = variation.type === "hold" ? "s" : "reps";
  return `${sets} × ${target} ${unit}${variation.perSide ? " each side" : ""}`;
}

const work = (movementId: string, p: Work) =>
  formatWork(p.sets, p.target, variationAt(movementId, p.level)!);

function sentence(
  movementId: string,
  p: Work,
  kind: ChangeKind,
  reason: ChangeReason,
): string {
  const name = variationAt(movementId, p.level)!.name;
  switch (kind) {
    case "target-up":
      return `${name}: you hit every set, so next time is ${work(movementId, p)}.`;
    case "sets-up":
      return (
        `${name}: you hit every set at the top of the range, so next time adds a set ` +
        `(${work(movementId, p)}).`
      );
    case "target-down":
      return (
        `${name}: you finished well short of the target, so next time drops to ` +
        `${work(movementId, p)}.`
      );
    case "sets-down":
      return (
        `${name}: still well short at the bottom of the range, so next time is ` +
        `${work(movementId, p)}.`
      );
    case "suggest-harder":
      return (
        `${name}: you reached the top of the range twice in a row. Ready to try ` +
        `${variationAt(movementId, p.level + 1)!.name}?`
      );
    case "suggest-easier": {
      const why =
        reason === "too-hard"
          ? "you marked it Too hard in two recent sessions"
          : "two sessions in a row fell below the range";
      return (
        `${name}: ${why}. ${variationAt(movementId, p.level - 1)!.name} may suit you better ` +
        "for now."
      );
    }
    case "suggestion-withdrawn":
      return (
        `${name}: your latest session changed the picture, so the earlier suggestion was ` +
        "dropped."
      );
    case "level-up":
    case "level-down":
      return `Moved to ${name}, starting at ${work(movementId, p)}.`;
    case "declined":
      return `Staying on ${name}. The app will not ask again for a few sessions.`;
    default:
      throw new Error(`Unknown change kind: ${kind as string}`);
  }
}

const change = (
  movementId: string,
  p: Work,
  kind: ChangeKind,
  reason: ChangeReason,
): Change => ({
  movementId,
  kind,
  reason,
  sentence: sentence(movementId, p, kind, reason),
});

const suggestKind = (suggestion: Suggestion): ChangeKind =>
  suggestion.kind === "harder" ? "suggest-harder" : "suggest-easier";

export function suggestionText(
  movementId: string,
  entry: Progress | undefined,
): string | null {
  if (!entry?.suggestion || !variationAt(movementId, entry.level)) return null;
  return sentence(
    movementId,
    entry,
    suggestKind(entry.suggestion),
    entry.suggestion.reason,
  );
}

function appeared(
  record: SessionRecord,
  exercise: SessionExercise,
  steps: Step[],
): boolean {
  const endedHere =
    record.endedEarly && record.endMovementId === exercise.movementId;
  return endedHere || steps.some((s) => s.status !== "pending");
}

function markedTooHard(
  record: SessionRecord,
  exercise: SessionExercise,
  steps: Step[],
): boolean {
  const onStep = steps.some(
    (s) => s.status === "skipped" && s.reasons.includes("too-hard"),
  );
  const onEnd =
    record.endedEarly &&
    record.endMovementId === exercise.movementId &&
    record.endReasons.includes("too-hard");
  return onStep || onEnd;
}

function suggest(
  movementId: string,
  p: Progress,
  kind: Suggestion["kind"],
  reason: Suggestion["reason"],
  date: DateKey,
  changes: Change[],
): void {
  const suggestion: Suggestion = { kind, reason, createdOn: date };
  p.suggestion = suggestion;
  changes.push(change(movementId, p, suggestKind(suggestion), reason));
}

function applyEvidence(
  movementId: string,
  p: Progress,
  exercise: SessionExercise,
  steps: Step[],
  date: DateKey,
  changes: Change[],
): void {
  const v = variationAt(movementId, p.level)!;
  const values = steps.map((s) => s.value as number);
  const n = values.length;
  const sum = values.reduce((a, b) => a + b, 0);
  const step = stepSize(v);
  const met = values.every((x) => x >= exercise.target);
  const short = !met && sum < SHORT_RATIO * n * exercise.target;
  const belowBottom = sum / n < v.min;

  if (met && p.target < v.max) {
    p.target = Math.min(v.max, p.target + step);
    p.topStreak = 0;
    changes.push(change(movementId, p, "target-up", "met"));
  } else if (met) {
    p.topStreak += 1;
    if (p.sets < MAX_SETS) {
      p.sets += 1;
      changes.push(change(movementId, p, "sets-up", "met"));
    }
  } else {
    p.topStreak = 0;
    if (short && p.target > v.min) {
      p.target = Math.max(v.min, p.target - step);
      changes.push(change(movementId, p, "target-down", "short"));
    } else if (short && p.sets > MIN_SETS) {
      p.sets -= 1;
      changes.push(change(movementId, p, "sets-down", "short"));
    }
  }
  p.lowStreak = belowBottom ? p.lowStreak + 1 : 0;

  const pending = p.suggestion?.kind;
  if ((pending === "harder" && short) || (pending === "easier" && met)) {
    p.suggestion = null;
    changes.push(change(movementId, p, "suggestion-withdrawn", "contradicted"));
  }

  if (p.suggestion !== null) return;
  if (
    p.topStreak >= TOP_STREAK_FOR_SUGGESTION &&
    variationAt(movementId, p.level + 1) &&
    p.cooldown.harder === 0
  ) {
    suggest(movementId, p, "harder", "top-of-range", date, changes);
  } else if (
    p.lowStreak >= LOW_STREAK_FOR_SUGGESTION &&
    p.level > 0 &&
    p.cooldown.easier === 0
  ) {
    suggest(movementId, p, "easier", "below-range", date, changes);
  }
}

function evaluateExercise(
  entry: Progress,
  record: SessionRecord,
  exercise: SessionExercise,
  steps: Step[],
  changes: Change[],
): Progress {
  const { movementId } = exercise;
  const p: Progress = {
    ...entry,
    tooHard: [...entry.tooHard],
    cooldown: { ...entry.cooldown },
  };
  const tooHardNow = markedTooHard(record, exercise, steps);
  p.tooHard = [...p.tooHard, tooHardNow ? 1 : 0].slice(
    -TOO_HARD_WINDOW,
  ) as Progress["tooHard"];

  const evidence =
    record.dayType === "training" &&
    steps.length > 0 &&
    steps.every((s) => s.status === "logged");
  if (evidence) {
    applyEvidence(movementId, p, exercise, steps, record.date, changes);
  }

  const tooHardCount = p.tooHard.reduce<number>((a, b) => a + b, 0);
  if (
    p.suggestion === null &&
    tooHardCount >= TOO_HARD_FOR_SUGGESTION &&
    p.level > 0 &&
    p.cooldown.easier === 0
  ) {
    suggest(movementId, p, "easier", "too-hard", record.date, changes);
  }

  p.cooldown = {
    harder: Math.max(0, p.cooldown.harder - 1),
    easier: Math.max(0, p.cooldown.easier - 1),
  };
  return p;
}

export function evaluateSession(
  progress: ProgressMap,
  record: SessionRecord,
): { progress: ProgressMap; changes: Change[] } {
  const next: ProgressMap = { ...progress };
  const changes: Change[] = [];
  record.exercises.forEach((exercise, index) => {
    const entry = next[exercise.movementId];
    if (!entry || exercise.level !== entry.level) return;
    if (!variationAt(exercise.movementId, entry.level)) return;
    const steps = record.steps.filter((s) => s.exerciseIndex === index);
    if (!appeared(record, exercise, steps)) return;
    next[exercise.movementId] = evaluateExercise(
      entry,
      record,
      exercise,
      steps,
      changes,
    );
  });
  return { progress: next, changes };
}

export function resolveSuggestion(
  progress: ProgressMap,
  movementId: string,
  accept: boolean,
): { progress: ProgressMap; change: Change | null } {
  const entry = progress[movementId];
  const suggestion = entry?.suggestion;
  if (!entry || !suggestion) return { progress, change: null };

  if (accept) {
    const harder = suggestion.kind === "harder";
    const level = entry.level + (harder ? 1 : -1);
    const v = variationAt(movementId, level);
    if (!v) return { progress, change: null };
    const p = newProgress(level, harder ? v.min : midTarget(v));
    return {
      progress: { ...progress, [movementId]: p },
      change: change(
        movementId,
        p,
        harder ? "level-up" : "level-down",
        "accepted",
      ),
    };
  }

  const p: Progress = {
    ...entry,
    suggestion: null,
    cooldown: { ...entry.cooldown, [suggestion.kind]: DECLINE_COOLDOWN },
    ...(suggestion.kind === "harder"
      ? { topStreak: 0 }
      : { lowStreak: 0, tooHard: [] }),
  };
  return {
    progress: { ...progress, [movementId]: p },
    change: change(movementId, p, "declined", "user"),
  };
}

export function setLevel(
  progress: ProgressMap,
  movementId: string,
  level: number,
): ProgressMap {
  if (!movement(movementId) || !progress[movementId]) return progress;
  const v = variationAt(movementId, level);
  if (!v) return progress;
  return { ...progress, [movementId]: newProgress(level, v.min) };
}
