import { describe, expect, it } from "vitest";
import {
  HOLD_STEP_SECONDS,
  MAX_SETS,
  MIN_SETS,
  START_SETS,
  midTarget,
  newProgress,
  stepSize,
} from "../../../../src/lib/tools/workout/progression/progress";

const reps = (min: number, max: number) => ({
  type: "reps" as const,
  min,
  max,
});
const hold = (min: number, max: number) => ({
  type: "hold" as const,
  min,
  max,
});

describe("workout/progression/progress", () => {
  it("set and step constants", () => {
    expect(MIN_SETS).toBe(2);
    expect(START_SETS).toBe(3);
    expect(MAX_SETS).toBe(4);
    expect(HOLD_STEP_SECONDS).toBe(5);
  });

  it("stepSize scales with the rep range and is fixed for holds", () => {
    expect(stepSize(reps(8, 20))).toBe(2);
    expect(stepSize(reps(5, 15))).toBe(2);
    expect(stepSize(reps(3, 8))).toBe(1);
    expect(stepSize(reps(20, 50))).toBe(5);
    expect(stepSize(hold(15, 45))).toBe(5);
    expect(stepSize(hold(5, 20))).toBe(5);
  });

  it("midTarget is the middle of the range, rounded down to a 5 s step for holds", () => {
    expect(midTarget(reps(8, 20))).toBe(14);
    expect(midTarget(reps(3, 8))).toBe(5);
    expect(midTarget(hold(15, 45))).toBe(30);
    expect(midTarget(hold(10, 25))).toBe(15);
    expect(midTarget(hold(5, 20))).toBe(10);
  });

  it("newProgress builds a fresh entry", () => {
    expect(newProgress(2, 9)).toStrictEqual({
      level: 2,
      sets: 3,
      target: 9,
      topStreak: 0,
      lowStreak: 0,
      tooHard: [],
      cooldown: { harder: 0, easier: 0 },
      suggestion: null,
    });
  });

  it("newProgress entries share no mutable state", () => {
    const a = newProgress(0, 5);
    const b = newProgress(0, 5);
    expect(a.tooHard).not.toBe(b.tooHard);
    expect(a.cooldown).not.toBe(b.cooldown);
  });
});
