import { describe, expect, it } from "vitest";
import {
  MOVEMENTS,
  movementsFor,
} from "../../../../src/lib/tools/workout/library/library";
import { PATTERNS } from "../../../../src/lib/tools/workout/library/patterns";
import {
  PLACEMENT_TESTS,
  bandFor,
  placementProgress,
} from "../../../../src/lib/tools/workout/placement/placement";

describe("workout/placement/placement", () => {
  it("one placement test per pattern in pattern order", () => {
    expect(PLACEMENT_TESTS.map((t) => t.pattern)).toStrictEqual(PATTERNS);
    const push = PLACEMENT_TESTS[0]!;
    expect(push.title).toBe("Push-ups");
    expect(push.unit).toBe("reps");
    expect(push.variationId).toBe("push-up");
    expect(push.thresholds).toStrictEqual([1, 8, 20, 35]);
    expect(push.maxInput).toBe(200);
    expect(
      PLACEMENT_TESTS.map((t) => [t.unit, t.variationId, t.maxInput]),
    ).toStrictEqual([
      ["reps", "push-up", 200],
      ["reps", "squat", 200],
      ["seconds", "forearm-plank", 900],
      ["seconds", "superman-hold", 900],
      ["reps", "burpee", 200],
    ]);
  });

  it("bandFor counts the thresholds reached", () => {
    const cases = [
      [0, 0],
      [1, 1],
      [7, 1],
      [8, 2],
      [34, 3],
      [35, 4],
      [500, 4],
    ] as const;
    for (const [result, band] of cases) {
      expect(bandFor("push", result), `${result}`).toBe(band);
    }
  });

  it("skipping the whole test starts every movement at the bottom of its easiest variation", () => {
    const progress = placementProgress(null);
    expect(Object.keys(progress)).toStrictEqual(MOVEMENTS.map((m) => m.id));
    for (const m of MOVEMENTS) {
      const entry = progress[m.id]!;
      expect(entry.level, m.id).toBe(0);
      expect(entry.sets, m.id).toBe(3);
      expect(entry.target, m.id).toBe(m.variations[0]!.min);
    }
  });

  it("results map to starting levels and targets", () => {
    const progress = placementProgress({
      push: 12,
      legs: 0,
      core: 100,
      back: null,
      conditioning: 30,
    });
    expect(Object.keys(progress)).toStrictEqual(MOVEMENTS.map((m) => m.id));
    expect(progress["push-up"]!.level).toBe(3);
    expect(progress["push-up"]!.target).toBe(5);
    expect(progress["overhead-push"]!.level).toBe(1);
    expect(progress["triceps-press"]!.level).toBe(1);
    expect(progress.squat!.level).toBe(0);
    expect(progress.squat!.target).toBe(8);
    expect(progress.plank!.level).toBe(3);
    expect(progress["leg-raise"]!.level).toBe(3);
    expect(progress["leg-raise"]!.target).toBe(15);
    expect(progress["back-extension"]!.level).toBe(0);
    expect(progress["back-extension"]!.target).toBe(5);
    expect(progress.burpee!.level).toBe(3);
    expect(progress.burpee!.target).toBe(5);
  });

  it("reaching the band midpoint starts at the middle of the range", () => {
    const progress = placementProgress({ push: 14 });
    expect(progress["push-up"]!.level).toBe(3);
    expect(progress["push-up"]!.target).toBe(10);
  });

  it("different results give different levels in every pattern", () => {
    const low = placementProgress({
      push: 1,
      legs: 10,
      core: 20,
      back: 10,
      conditioning: 5,
    });
    const high = placementProgress({
      push: 35,
      legs: 60,
      core: 150,
      back: 90,
      conditioning: 30,
    });
    for (const pattern of PATTERNS) {
      const differs = movementsFor(pattern).some(
        (m) => low[m.id]!.level !== high[m.id]!.level,
      );
      expect(differs, pattern).toBeTruthy();
    }
  });

  it("garbage values behave as a skipped test", () => {
    const skipped = placementProgress(null);
    for (const value of [-3, 2.5, "12", NaN]) {
      const progress = placementProgress({
        push: value,
        legs: value,
        core: value,
        back: value,
        conditioning: value,
      } as never);
      expect(progress, String(value)).toStrictEqual(skipped);
    }
  });

  it("placementProgress leaves its input unchanged", () => {
    const results = Object.freeze({ push: 20, legs: 40 });
    expect(() => placementProgress(results)).not.toThrow();
  });
});
