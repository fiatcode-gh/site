import { describe, expect, it } from "vitest";
import {
  hashString,
  mulberry32,
  shuffled,
} from "../../../../src/lib/tools/workout/core/rng";

describe("workout/core/rng", () => {
  it("hashString is FNV-1a 32-bit", () => {
    expect(hashString("")).toBe(2166136261);
    expect(hashString("push:0")).toBe(649196175);
  });

  it("mulberry32 reproduces the reference value", () => {
    expect(Number(mulberry32(1)().toFixed(10))).toBe(0.6270739406);
  });

  it("shuffled is seeded and deterministic", () => {
    expect(shuffled([1, 2, 3, 4, 5], 42)).toStrictEqual([1, 5, 3, 2, 4]);
  });

  it("shuffled leaves its input unchanged and returns a permutation", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffled(input, 7);
    expect(input).toStrictEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(out).not.toBe(input);
    expect([...out].sort((a, b) => a - b)).toStrictEqual(input);
  });
});
