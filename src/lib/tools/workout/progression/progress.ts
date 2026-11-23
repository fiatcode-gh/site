import type { Progress, Variation } from "../types";

export const MIN_SETS = 2;
export const START_SETS = 3;
export const MAX_SETS = 4;
export const HOLD_STEP_SECONDS = 5;

type Range = Pick<Variation, "type" | "min" | "max">;

export function stepSize(variation: Range): number {
  if (variation.type === "hold") return HOLD_STEP_SECONDS;
  return Math.max(1, Math.round((variation.max - variation.min) / 6));
}

export function midTarget(variation: Range): number {
  const { min, max } = variation;
  if (variation.type === "hold") {
    return (
      min + Math.floor((max - min) / 2 / HOLD_STEP_SECONDS) * HOLD_STEP_SECONDS
    );
  }
  return min + Math.floor((max - min) / 2);
}

export function newProgress(level: number, target: number): Progress {
  return {
    level,
    sets: START_SETS,
    target,
    topStreak: 0,
    lowStreak: 0,
    tooHard: [],
    cooldown: { harder: 0, easier: 0 },
    suggestion: null,
  };
}
