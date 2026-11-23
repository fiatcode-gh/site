import { describe, expect, it } from "vitest";
import { addDays } from "../../../../src/lib/tools/workout/core/dates";
import { mulberry32 } from "../../../../src/lib/tools/workout/core/rng";
import {
  MOVEMENTS,
  movement,
  variationAt,
} from "../../../../src/lib/tools/workout/library/library";
import { PATTERNS } from "../../../../src/lib/tools/workout/library/patterns";
import { placementProgress } from "../../../../src/lib/tools/workout/placement/placement";
import { planSeconds } from "../../../../src/lib/tools/workout/planner/estimate";
import {
  RECOVERY_SETS,
  RECOVERY_TARGET_FACTOR,
  pickMovement,
  planDay,
  recoveryTarget,
} from "../../../../src/lib/tools/workout/planner/planner";
import { dayTypeFor } from "../../../../src/lib/tools/workout/planner/rhythm";
import type {
  DateKey,
  ProgressMap,
} from "../../../../src/lib/tools/workout/types";

const beginner = placementProgress(null);
const START = "2026-11-19";
const days = (count: number) =>
  Array.from({ length: count }, (_, i) => addDays(START, i));
const picks = (dateKey: DateKey) => {
  const patterns =
    dayTypeFor(dateKey) === "recovery" ? PATTERNS.slice(0, 4) : PATTERNS;
  return patterns.map((p) => pickMovement(p, dateKey).id);
};

function randomProgress(seed: number): ProgressMap {
  const next = mulberry32(seed);
  const pick = (n: number) => Math.floor(next() * n);
  return Object.fromEntries(
    MOVEMENTS.map((m) => {
      const level = pick(m.variations.length);
      const v = m.variations[level]!;
      const target =
        v.type === "hold"
          ? v.min + 5 * pick((v.max - v.min) / 5 + 1)
          : v.min + pick(v.max - v.min + 1);
      return [m.id, { ...beginner[m.id]!, level, target, sets: 2 + pick(3) }];
    }),
  );
}

const randomMaps = Array.from({ length: 30 }, (_, i) =>
  randomProgress(1000 + i),
);

describe("workout/planner/planner", () => {
  it("recovery constants", () => {
    expect(RECOVERY_SETS).toBe(2);
    expect(RECOVERY_TARGET_FACTOR).toBe(0.6);
  });

  it("golden picks", () => {
    expect(picks("2026-11-19")).toStrictEqual([
      "overhead-push",
      "lunge",
      "leg-raise",
      "back-extension",
      "jumps",
    ]);
    expect(picks("2026-11-20")).toStrictEqual([
      "triceps-press",
      "wall-sit",
      "plank",
      "hip-bridge",
      "burpee",
    ]);
    expect(picks("2026-11-21")).toStrictEqual([
      "overhead-push",
      "squat",
      "side-plank",
      "back-extension",
      "mountain-climber",
    ]);
    expect(picks("2026-11-22")).toStrictEqual([
      "triceps-press",
      "lunge",
      "plank",
      "hip-bridge",
    ]);
    expect(picks("2026-11-23")).toStrictEqual([
      "push-up",
      "wall-sit",
      "leg-raise",
      "back-bridge",
      "jumps",
    ]);
  });

  it("beginner plan for 2026-11-19", () => {
    const plan = planDay({
      dateKey: START,
      progress: beginner,
      timeCapMinutes: 40,
    });
    expect(plan.dateKey).toBe(START);
    expect(plan.dayType).toBe("training");
    expect(plan.exercises.map((e) => e.sets)).toStrictEqual([3, 3, 3, 3, 3]);
    expect(plan.exercises.map((e) => e.target)).toStrictEqual([
      15, 6, 5, 5, 15,
    ]);
    expect(plan.exercises.map((e) => e.pattern)).toStrictEqual(PATTERNS);
    expect(plan.exercises.every((e) => e.restSeconds === 60)).toBeTruthy();
    const first = plan.exercises[0];
    const v = variationAt("overhead-push", beginner["overhead-push"]!.level)!;
    expect(first).toStrictEqual({
      movementId: "overhead-push",
      pattern: "push",
      level: beginner["overhead-push"]!.level,
      variationId: v.id,
      type: v.type,
      perSide: v.perSide,
      sets: 3,
      target: 15,
      restSeconds: 60,
    });
    expect(plan.estimateSeconds).toBe(1458);
    expect(plan.trimmed).toBe(false);
    expect(plan.capSeconds).toBe(2400);
  });

  it("planDay is deterministic and does not mutate progress", () => {
    const progress = structuredClone(beginner);
    const a = planDay({ dateKey: START, progress, timeCapMinutes: 40 });
    const b = planDay({ dateKey: START, progress, timeCapMinutes: 40 });
    expect(a).toStrictEqual(b);
    expect(progress).toStrictEqual(beginner);
  });

  it("time cap trims sets, later exercise first on ties", () => {
    const cases: [number, number[], number][] = [
      [20, [3, 3, 2, 2, 2], 1148],
      [15, [2, 2, 2, 2, 1], 852],
      [10, [2, 1, 1, 1, 1], 531],
    ];
    for (const [cap, sets, seconds] of cases) {
      const plan = planDay({
        dateKey: START,
        progress: beginner,
        timeCapMinutes: cap,
      });
      expect(
        plan.exercises.map((e) => e.sets),
        `cap ${cap}`,
      ).toStrictEqual(sets);
      expect(plan.estimateSeconds, `cap ${cap}`).toBe(seconds);
      expect(plan.trimmed).toBe(true);
      expect(plan.estimateSeconds <= plan.capSeconds).toBeTruthy();
    }
  });

  it("recovery plan for 2026-11-22", () => {
    const plan = planDay({
      dateKey: "2026-11-22",
      progress: beginner,
      timeCapMinutes: 40,
    });
    expect(plan.dayType).toBe("recovery");
    expect(plan.exercises.map((e) => e.pattern)).toStrictEqual(
      PATTERNS.slice(0, 4),
    );
    expect(plan.exercises.map((e) => e.sets)).toStrictEqual([2, 2, 2, 2]);
    expect(plan.exercises.map((e) => e.target)).toStrictEqual([5, 4, 10, 6]);
    expect(plan.exercises.every((e) => e.restSeconds === 45)).toBeTruthy();
    expect(plan.estimateSeconds).toBe(539);
    expect(plan.trimmed).toBe(false);
  });

  it("recoveryTarget lightens reps and holds", () => {
    const reps = { type: "reps" } as const;
    const hold = { type: "hold" } as const;
    expect(recoveryTarget(reps, 15)).toBe(9);
    expect(recoveryTarget(reps, 2)).toBe(1);
    expect(recoveryTarget(hold, 45)).toBe(25);
    expect(recoveryTarget(hold, 20)).toBe(10);
    expect(recoveryTarget(hold, 5)).toBe(5);
  });

  it("variety over 365 days", () => {
    const keys = days(365);
    const sessions = keys.map(picks);
    for (let i = 0; i < keys.length; i += 1) {
      const expected =
        dayTypeFor(keys[i]!) === "recovery" ? PATTERNS.slice(0, 4) : PATTERNS;
      expect(
        sessions[i]!.map((id) => movement(id)!.pattern),
        keys[i],
      ).toStrictEqual(expected);
    }
    for (const pattern of PATTERNS) {
      for (let i = 1; i < keys.length; i += 1) {
        expect(
          pickMovement(pattern, keys[i]!).id,
          `${pattern} on ${keys[i]}`,
        ).not.toBe(pickMovement(pattern, keys[i - 1]!).id);
      }
    }
    const identities = sessions.map((s) => s.join(","));
    const distinct = (from: number, length: number) =>
      new Set(identities.slice(from, from + length)).size;
    for (let i = 0; i + 7 <= keys.length; i += 1) {
      expect(distinct(i, 7) >= 5, `7-day window at ${keys[i]}`).toBeTruthy();
    }
    for (let i = 0; i + 28 <= keys.length; i += 1) {
      expect(distinct(i, 28) >= 20, `28-day window at ${keys[i]}`).toBeTruthy();
    }
    for (let i = 0; i + 8 <= keys.length; i += 1) {
      const seen = new Set<string>();
      for (let d = i; d < i + 8; d += 1) {
        if (dayTypeFor(keys[d]!) === "training")
          sessions[d]!.forEach((id) => seen.add(id));
      }
      expect(seen.size, `8-day window at ${keys[i]}`).toBe(MOVEMENTS.length);
    }
  });

  it("recovery plans are lighter than training at the same movements", () => {
    const recoveryDays = days(28).filter(
      (key) => dayTypeFor(key) === "recovery",
    );
    for (const progress of randomMaps) {
      for (const dateKey of recoveryDays) {
        const plan = planDay({ dateKey, progress, timeCapMinutes: 90 });
        const training = plan.exercises.map((e) => {
          const p = progress[e.movementId]!;
          expect(e.sets).toBe(2);
          expect(e.sets <= p.sets).toBeTruthy();
          expect(e.target <= p.target).toBeTruthy();
          if (p.target >= (e.type === "hold" ? 10 : 2))
            expect(e.target < p.target).toBeTruthy();
          expect(e.restSeconds).toBe(45);
          return { ...e, sets: p.sets, target: p.target };
        });
        expect(
          plan.estimateSeconds < planSeconds(training, 60),
          dateKey,
        ).toBeTruthy();
      }
    }
  });

  it("every cap fits push, legs, core and back", () => {
    const keys = days(14);
    for (const progress of randomMaps) {
      for (let cap = 10; cap <= 90; cap += 5) {
        for (const dateKey of keys) {
          const plan = planDay({ dateKey, progress, timeCapMinutes: cap });
          expect(
            plan.estimateSeconds <= plan.capSeconds,
            `${dateKey} cap ${cap}`,
          ).toBeTruthy();
          expect(plan.exercises.every((e) => e.sets >= 1)).toBeTruthy();
          const patterns = plan.exercises.map((e) => e.pattern);
          for (const p of PATTERNS.slice(0, 4))
            expect(patterns.includes(p)).toBeTruthy();
        }
      }
    }
  });

  it("a level change affects only days the movement is picked", () => {
    const progress = structuredClone(beginner);
    progress["overhead-push"]!.level += 1;
    const args = (dateKey: DateKey, p: ProgressMap) => ({
      dateKey,
      progress: p,
      timeCapMinutes: 40,
    });
    expect(planDay(args("2026-11-19", progress))).not.toStrictEqual(
      planDay(args("2026-11-19", beginner)),
    );
    expect(planDay(args("2026-11-20", progress))).toStrictEqual(
      planDay(args("2026-11-20", beginner)),
    );
  });
});
