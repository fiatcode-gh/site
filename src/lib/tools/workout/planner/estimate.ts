import type { Pattern } from "../library/patterns";
import type { DayType, PlanExercise } from "../types";

type WorkFields = Pick<PlanExercise, "pattern" | "type" | "perSide" | "target">;
type ExerciseFields = WorkFields & Pick<PlanExercise, "sets">;

export const REST_SECONDS: Readonly<Record<DayType, number>> = Object.freeze({
  training: 60,
  recovery: 45,
});
export const REP_SECONDS = 3;
export const CONDITIONING_REP_SECONDS = 2;
export const SET_OVERHEAD_SECONDS = 10;
export const SIDE_SWITCH_SECONDS = 5;
export const TIME_CAP = Object.freeze({
  default: 40,
  min: 10,
  max: 90,
  step: 5,
});

function repSeconds(pattern: Pattern): number {
  return pattern === "conditioning" ? CONDITIONING_REP_SECONDS : REP_SECONDS;
}

export function workSeconds(ex: WorkFields): number {
  const once =
    ex.type === "hold" ? ex.target : ex.target * repSeconds(ex.pattern);
  return once * (ex.perSide ? 2 : 1) + (ex.perSide ? SIDE_SWITCH_SECONDS : 0);
}

export function exerciseSeconds(ex: ExerciseFields): number {
  return ex.sets * (workSeconds(ex) + SET_OVERHEAD_SECONDS);
}

export function planSeconds(
  exercises: readonly ExerciseFields[],
  restSeconds: number,
): number {
  if (exercises.length === 0) return 0;
  const sets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const work = exercises.reduce((sum, ex) => sum + exerciseSeconds(ex), 0);
  return work + restSeconds * (sets - 1);
}
