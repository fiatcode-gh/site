import { MOVEMENTS } from "../library/library";
import type { Pattern } from "../library/patterns";
import { midTarget, newProgress } from "../progression/progress";
import type { Movement, Progress, ProgressMap } from "../types";

interface PlacementTest {
  pattern: Pattern;
  title: string;
  prompt: string;
  unit: "reps" | "seconds";
  variationId: string;
  thresholds: readonly number[];
  maxInput: number;
}

export type PlacementResults =
  Partial<Record<Pattern, number | null>> | null | undefined;

export const PLACEMENT_TESTS: readonly Readonly<PlacementTest>[] =
  Object.freeze(
    (
      [
        {
          pattern: "push",
          title: "Push-ups",
          prompt:
            "Do as many full push-ups as you can in one go, on your toes with your chest reaching " +
            "near the floor. Enter 0 if you cannot do one yet.",
          unit: "reps",
          variationId: "push-up",
          thresholds: [1, 8, 20, 35],
          maxInput: 200,
        },
        {
          pattern: "legs",
          title: "Squats",
          prompt:
            "Do as many squats as you can in one go, thighs down to level each time. Stop at 80.",
          unit: "reps",
          variationId: "squat",
          thresholds: [10, 25, 40, 60],
          maxInput: 200,
        },
        {
          pattern: "core",
          title: "Plank",
          prompt:
            "Hold a forearm plank for as long as you can keep a straight line. Enter the seconds.",
          unit: "seconds",
          variationId: "forearm-plank",
          thresholds: [20, 45, 90, 150],
          maxInput: 900,
        },
        {
          pattern: "back",
          title: "Superman hold",
          prompt:
            "Lie face down and hold your arms, chest and legs off the floor for as long as you " +
            "can. Enter the seconds.",
          unit: "seconds",
          variationId: "superman-hold",
          thresholds: [10, 30, 60, 90],
          maxInput: 900,
        },
        {
          pattern: "conditioning",
          title: "Burpees",
          prompt:
            "Do as many burpees as you can without stopping, with no push-up. Step back instead " +
            "of jumping if you need to. Stop at 40.",
          unit: "reps",
          variationId: "burpee",
          thresholds: [5, 10, 20, 30],
          maxInput: 200,
        },
      ] satisfies PlacementTest[]
    ).map((t) =>
      Object.freeze({ ...t, thresholds: Object.freeze(t.thresholds) }),
    ),
  );

const testFor = (pattern: Pattern) =>
  PLACEMENT_TESTS.find((t) => t.pattern === pattern)!;

export function bandFor(pattern: Pattern, result: number): number {
  return testFor(pattern).thresholds.filter((t) => t <= result).length;
}

function validResult(
  results: PlacementResults,
  pattern: Pattern,
): number | null {
  const value: unknown = results?.[pattern];
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;
}

function startFor(movement: Movement, result: number | null): Progress {
  if (result === null) return newProgress(0, movement.variations[0]!.min);
  const { thresholds } = testFor(movement.pattern);
  const band = bandFor(movement.pattern, result);
  const level = movement.startLevels[band]!;
  const variation = movement.variations[level]!;
  const lo = band === 0 ? 0 : thresholds[band - 1]!;
  const hi = thresholds[band];
  const upperHalf = hi !== undefined && result >= (lo + hi) / 2;
  return newProgress(level, upperHalf ? midTarget(variation) : variation.min);
}

export function placementProgress(results: PlacementResults): ProgressMap {
  return Object.fromEntries(
    MOVEMENTS.map((m) => [m.id, startFor(m, validResult(results, m.pattern))]),
  );
}
