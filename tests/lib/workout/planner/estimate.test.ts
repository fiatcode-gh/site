import { describe, expect, it } from "vitest";
import { variationAt } from "../../../../src/lib/tools/workout/library/library";
import type { Pattern } from "../../../../src/lib/tools/workout/library/patterns";
import { placementProgress } from "../../../../src/lib/tools/workout/placement/placement";
import {
  REST_SECONDS,
  TIME_CAP,
  exerciseSeconds,
  planSeconds,
  workSeconds,
} from "../../../../src/lib/tools/workout/planner/estimate";
import type { WorkType } from "../../../../src/lib/tools/workout/types";

const ex = (
  pattern: Pattern,
  type: WorkType,
  perSide: boolean,
  target: number,
  sets = 1,
) => ({ pattern, type, perSide, target, sets });

describe("workout/planner/estimate", () => {
  it("constants", () => {
    expect(REST_SECONDS).toStrictEqual({ training: 60, recovery: 45 });
    expect(TIME_CAP).toStrictEqual({ default: 40, min: 10, max: 90, step: 5 });
  });

  it("workSeconds by pattern, type and side", () => {
    expect(workSeconds(ex("push", "reps", false, 10))).toBe(30);
    expect(workSeconds(ex("conditioning", "reps", false, 20))).toBe(40);
    expect(workSeconds(ex("core", "hold", false, 30))).toBe(30);
    expect(workSeconds(ex("legs", "reps", true, 8))).toBe(53);
    expect(workSeconds(ex("core", "hold", true, 30))).toBe(65);
  });

  it("exerciseSeconds multiplies by sets and adds overhead per set", () => {
    expect(exerciseSeconds(ex("push", "reps", false, 10, 3))).toBe(
      3 * (30 + 10),
    );
    expect(exerciseSeconds(ex("legs", "reps", true, 8, 2))).toBe(2 * (53 + 10));
  });

  it("planSeconds of the beginner plan for 2026-11-19", () => {
    const progress = placementProgress(null);
    const exercises = (
      [
        ["push", "overhead-push"],
        ["legs", "lunge"],
        ["core", "leg-raise"],
        ["back", "back-extension"],
        ["conditioning", "jumps"],
      ] as const
    ).map(([pattern, id]) => {
      const p = progress[id]!;
      const v = variationAt(id, p.level)!;
      return {
        pattern,
        type: v.type,
        perSide: v.perSide,
        sets: p.sets,
        target: p.target,
      };
    });
    expect(planSeconds(exercises, 60)).toBe(1458);
  });

  it("planSeconds of an empty list is 0", () => {
    expect(planSeconds([], 60)).toBe(0);
  });
});
