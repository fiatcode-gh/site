import { addDays } from "../core/dates";
import { hashString, shuffled } from "../core/rng";
import { movement, movementsFor, variationAt } from "../library/library";
import { PATTERNS, type Pattern } from "../library/patterns";
import type {
  DateKey,
  DayType,
  Movement,
  Plan,
  PlanExercise,
  ProgressMap,
  Variation,
} from "../types";
import { REST_SECONDS, planSeconds } from "./estimate";
import { dayTypeFor, trainingOrdinal } from "./rhythm";

export const RECOVERY_SETS = 2;
export const RECOVERY_TARGET_FACTOR = 0.6;

function blockOrder(pattern: Pattern, block: number): string[] {
  const ids = movementsFor(pattern).map((m) => m.id);
  const order = shuffled(ids, hashString(`${pattern}:${block}`));
  const previous = shuffled(ids, hashString(`${pattern}:${block - 1}`));
  if (order[0] === previous[ids.length - 1])
    [order[0], order[1]] = [order[1]!, order[0]!];
  return order;
}

export function pickMovement(pattern: Pattern, dateKey: DateKey): Movement {
  const ids = movementsFor(pattern).map((m) => m.id);
  if (dayTypeFor(dateKey) === "recovery") {
    const before = pickMovement(pattern, addDays(dateKey, -1)).id;
    const after = pickMovement(pattern, addDays(dateKey, 1)).id;
    return movement(ids.find((id) => id !== before && id !== after)!)!;
  }
  const turn = trainingOrdinal(dateKey) + PATTERNS.indexOf(pattern);
  return movement(
    blockOrder(pattern, Math.floor(turn / ids.length))[turn % ids.length]!,
  )!;
}

export function recoveryTarget(
  variation: Pick<Variation, "type">,
  target: number,
): number {
  if (variation.type === "hold") {
    return Math.max(5, Math.round((target * RECOVERY_TARGET_FACTOR) / 5) * 5);
  }
  return Math.max(1, Math.round(target * RECOVERY_TARGET_FACTOR));
}

function planExercise(
  pattern: Pattern,
  dateKey: DateKey,
  dayType: DayType,
  progress: ProgressMap,
): PlanExercise {
  const picked = pickMovement(pattern, dateKey);
  const p = progress[picked.id]!;
  const v = variationAt(picked.id, p.level)!;
  const recovery = dayType === "recovery";
  return {
    movementId: picked.id,
    pattern,
    level: p.level,
    variationId: v.id,
    type: v.type,
    perSide: v.perSide,
    sets: recovery ? RECOVERY_SETS : p.sets,
    target: recovery ? recoveryTarget(v, p.target) : p.target,
    restSeconds: REST_SECONDS[dayType],
  };
}

function trimOnce(exercises: PlanExercise[]): PlanExercise[] | null {
  let most = -1;
  exercises.forEach((ex, i) => {
    if (ex.sets > 1 && (most < 0 || ex.sets >= exercises[most]!.sets)) most = i;
  });
  if (most >= 0) {
    return exercises.map((ex, i) =>
      i === most ? { ...ex, sets: ex.sets - 1 } : ex,
    );
  }
  if (exercises.some((ex) => ex.pattern === "conditioning")) {
    return exercises.filter((ex) => ex.pattern !== "conditioning");
  }
  return null;
}

export function planDay({
  dateKey,
  progress,
  timeCapMinutes,
}: {
  dateKey: DateKey;
  progress: ProgressMap;
  timeCapMinutes: number;
}): Plan {
  const dayType = dayTypeFor(dateKey);
  const patterns = dayType === "recovery" ? PATTERNS.slice(0, 4) : PATTERNS;
  const restSeconds = REST_SECONDS[dayType];
  const capSeconds = timeCapMinutes * 60;
  let exercises = patterns.map((pattern) =>
    planExercise(pattern, dateKey, dayType, progress),
  );
  let trimmed = false;
  while (planSeconds(exercises, restSeconds) > capSeconds) {
    const next = trimOnce(exercises);
    if (!next) break;
    exercises = next;
    trimmed = true;
  }
  return {
    dateKey,
    dayType,
    exercises,
    estimateSeconds: planSeconds(exercises, restSeconds),
    capSeconds,
    trimmed,
  };
}
