import { describe, expect, it } from "vitest";
import {
  MOVEMENTS,
  movement,
  movementsFor,
  variation,
  variationAt,
} from "../../../../src/lib/tools/workout/library/library";
import {
  PATTERNS,
  type Pattern,
} from "../../../../src/lib/tools/workout/library/patterns";
import type { Movement } from "../../../../src/lib/tools/workout/types";

const ORDER: Record<Pattern, string[]> = {
  push: ["push-up", "overhead-push", "triceps-press"],
  legs: ["squat", "lunge", "wall-sit"],
  core: ["plank", "leg-raise", "side-plank"],
  back: ["back-extension", "hip-bridge", "back-bridge"],
  conditioning: ["burpee", "jumps", "mountain-climber"],
};
const COUNTS: Record<Pattern, number> = {
  push: 20,
  legs: 18,
  core: 17,
  back: 17,
  conditioning: 15,
};
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const EQUIPMENT_WORDS = [
  "bar",
  "barbell",
  "band",
  "bench",
  "chair",
  "table",
  "box",
  "dumbbell",
  "kettlebell",
  "weights",
  "rings",
  "towel",
  "door",
  "couch",
  "sofa",
  "bed",
  "pull-up",
  "row",
];
const EQUIPMENT = new RegExp(`\\b(${EQUIPMENT_WORDS.join("|")})\\b`, "i");

const allVariations = MOVEMENTS.flatMap((m) =>
  m.variations.map((v) => ({ m, v })),
);

describe("workout/library/library", () => {
  it("five patterns with three movements each in library order", () => {
    expect(PATTERNS).toStrictEqual([
      "push",
      "legs",
      "core",
      "back",
      "conditioning",
    ]);
    expect(MOVEMENTS.map((m) => m.id)).toStrictEqual(
      PATTERNS.flatMap((p) => ORDER[p]),
    );
    for (const pattern of PATTERNS) {
      expect(movementsFor(pattern).map((m) => m.id)).toStrictEqual(
        ORDER[pattern],
      );
      expect(
        movementsFor(pattern).every((m) => m.pattern === pattern),
      ).toBeTruthy();
    }
  });

  it("87 variations split across patterns as planned", () => {
    expect(allVariations.length).toBe(87);
    for (const pattern of PATTERNS) {
      const count = movementsFor(pattern).reduce(
        (sum, m) => sum + m.variations.length,
        0,
      );
      expect(count, pattern).toBe(COUNTS[pattern]);
    }
  });

  it("ids are kebab-case and unique within movements and within variations", () => {
    const movementIds = MOVEMENTS.map((m) => m.id);
    const variationIds = allVariations.map(({ v }) => v.id);
    for (const id of [...movementIds, ...variationIds])
      expect(id).toMatch(KEBAB);
    expect(new Set(movementIds).size).toBe(movementIds.length);
    expect(new Set(variationIds).size).toBe(variationIds.length);
  });

  it("ladders are long enough and ranges are valid", () => {
    for (const m of MOVEMENTS) {
      expect(m.variations.length >= 5, m.id).toBeTruthy();
    }
    for (const { v } of allVariations) {
      expect(v.type === "reps" || v.type === "hold", v.id).toBeTruthy();
      expect(typeof v.perSide, v.id).toBe("boolean");
      expect(typeof v.name, v.id).toBe("string");
      expect(Number.isInteger(v.min) && v.min >= 1, v.id).toBeTruthy();
      expect(Number.isInteger(v.max) && v.max >= 1, v.id).toBeTruthy();
      expect(v.min < v.max, v.id).toBeTruthy();
      if (v.type === "hold") {
        expect(v.min % 5, v.id).toBe(0);
        expect(v.max % 5, v.id).toBe(0);
      }
    }
  });

  it("cues are one sentence-like line of 20 to 140 characters", () => {
    for (const { v } of allVariations) {
      expect(
        v.cue.length >= 20 && v.cue.length <= 140,
        `${v.id} cue length ${v.cue.length}`,
      ).toBeTruthy();
      expect(v.cue.endsWith("."), v.id).toBeTruthy();
      expect(!/[\r\n]/.test(v.cue), v.id).toBeTruthy();
    }
  });

  it("startLevels are five non-decreasing valid ladder indexes from 0", () => {
    for (const m of MOVEMENTS) {
      expect(m.startLevels.length, m.id).toBe(5);
      expect(m.startLevels[0], m.id).toBe(0);
      m.startLevels.forEach((level, i) => {
        expect(Number.isInteger(level), m.id).toBeTruthy();
        expect(level >= 0 && level < m.variations.length, m.id).toBeTruthy();
        if (i > 0) expect(level >= m.startLevels[i - 1]!, m.id).toBeTruthy();
      });
    }
  });

  it("no name or cue mentions equipment", () => {
    for (const m of MOVEMENTS) expect(m.name, m.id).not.toMatch(EQUIPMENT);
    for (const { v } of allVariations) {
      expect(v.name, v.id).not.toMatch(EQUIPMENT);
      expect(v.cue, v.id).not.toMatch(EQUIPMENT);
    }
  });

  it("lookups return the right objects", () => {
    expect(movement("lunge")).toBe(MOVEMENTS.find((m) => m.id === "lunge"));
    expect(variationAt("push-up", 4)!.id).toBe("diamond-push-up");
    expect(variationAt("plank", 0)!.id).toBe("knee-plank");
    const diamond = variation("diamond-push-up")!;
    expect(diamond.movementId).toBe("push-up");
    expect(diamond.level).toBe(4);
    expect(diamond.name).toBe("Diamond push-up");
    expect(diamond.type).toBe("reps");
    expect(diamond.min).toBe(5);
    expect(diamond.max).toBe(12);
    expect(variation("push-up")!.movementId).toBe("push-up");
    expect(variation("push-up")!.level).toBe(3);
  });

  it("unknown ids return undefined", () => {
    expect(movement("pull-up")).toBe(undefined);
    expect(variation("nope")).toBe(undefined);
    expect(variationAt("nope", 0)).toBe(undefined);
    expect(variationAt("push-up", 99)).toBe(undefined);
    expect(variationAt("push-up", -1)).toBe(undefined);
    expect(movementsFor("pull" as never)).toStrictEqual([]);
  });

  it("library data is deeply frozen", () => {
    expect(() => {
      (MOVEMENTS as Movement[]).push({} as never);
    }).toThrow(TypeError);
    expect(() => {
      MOVEMENTS[0]!.name = "x";
    }).toThrow(TypeError);
    expect(() => {
      MOVEMENTS[0]!.startLevels[1] = 9;
    }).toThrow(TypeError);
    expect(() => {
      MOVEMENTS[0]!.variations[0]!.min = 99;
    }).toThrow(TypeError);
  });

  it("D17 fit bound: core patterns fit a 10-minute cap at full volume", () => {
    const REP_SECONDS = 3;
    const SET_OVERHEAD_SECONDS = 10;
    const SIDE_SWITCH_SECONDS = 5;
    const MAX_SET_SECONDS = 105;
    expect(4 * MAX_SET_SECONDS + 3 * 60 <= 600).toBeTruthy();
    for (const { m, v } of allVariations) {
      if (m.pattern === "conditioning") continue;
      const work = v.type === "hold" ? v.max : v.max * REP_SECONDS;
      const seconds =
        work * (v.perSide ? 2 : 1) +
        (v.perSide ? SIDE_SWITCH_SECONDS : 0) +
        SET_OVERHEAD_SECONDS;
      expect(
        seconds <= MAX_SET_SECONDS,
        `${v.id} takes ${seconds} s`,
      ).toBeTruthy();
    }
  });
});
