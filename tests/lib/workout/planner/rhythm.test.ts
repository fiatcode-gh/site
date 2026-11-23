import { describe, expect, it } from "vitest";
import { addDays } from "../../../../src/lib/tools/workout/core/dates";
import {
  RECOVERY_WEEKDAYS,
  dayTypeFor,
  trainingOrdinal,
} from "../../../../src/lib/tools/workout/planner/rhythm";

describe("workout/planner/rhythm", () => {
  it("recovery days are Sunday and Wednesday", () => {
    expect(RECOVERY_WEEKDAYS).toStrictEqual([0, 3]);
    const week = [
      "2026-11-22",
      "2026-11-23",
      "2026-11-24",
      "2026-11-25",
      "2026-11-26",
      "2026-11-27",
      "2026-11-28",
    ];
    expect(week.map(dayTypeFor)).toStrictEqual([
      "recovery",
      "training",
      "training",
      "recovery",
      "training",
      "training",
      "training",
    ]);
  });

  it("every 7-day window has two non-adjacent recovery days", () => {
    const types = Array.from({ length: 400 }, (_, i) =>
      dayTypeFor(addDays("2026-11-19", i)),
    );
    for (let start = 0; start + 7 <= types.length; start += 1) {
      const count = types
        .slice(start, start + 7)
        .filter((t) => t === "recovery").length;
      expect(count, `window at ${start}`).toBe(2);
    }
    for (let i = 1; i < types.length; i += 1) {
      expect(
        !(types[i] === "recovery" && types[i - 1] === "recovery"),
        `adjacent at ${i}`,
      ).toBeTruthy();
    }
  });

  it("trainingOrdinal counts training days before the date", () => {
    let key = "2026-11-19";
    for (let i = 0; i < 400; i += 1) {
      const next = addDays(key, 1);
      const step = dayTypeFor(key) === "training" ? 1 : 0;
      expect(trainingOrdinal(next), key).toBe(trainingOrdinal(key) + step);
      key = next;
    }
  });
});
