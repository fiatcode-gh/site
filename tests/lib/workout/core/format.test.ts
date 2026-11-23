import { describe, expect, it } from "vitest";
import {
  formatClock,
  formatLoggedValues,
  parseWholeNumber,
} from "../../../../src/lib/tools/workout/core/format";

const RANGE = { min: 0, max: 200 };

describe("workout/core/format", () => {
  it("parseWholeNumber accepts whole numbers inside the range", () => {
    expect(parseWholeNumber("0", RANGE)).toBe(0);
    expect(parseWholeNumber(" 12 ", RANGE)).toBe(12);
    expect(parseWholeNumber("200", RANGE)).toBe(200);
  });

  it("parseWholeNumber rejects empty, non-digit and out-of-range text", () => {
    for (const text of ["", "   ", "-1", "2.5", "1e2", "12a", "201"]) {
      expect(
        parseWholeNumber(text, RANGE),
        `accepted ${JSON.stringify(text)}`,
      ).toBe(null);
    }
  });

  it("parseWholeNumber honours the minimum", () => {
    expect(parseWholeNumber("0", { min: 1, max: 10 })).toBe(null);
    expect(parseWholeNumber("1", { min: 1, max: 10 })).toBe(1);
  });

  it("formatClock renders m:ss", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(9)).toBe("0:09");
    expect(formatClock(75)).toBe("1:15");
    expect(formatClock(599)).toBe("9:59");
    expect(formatClock(3600)).toBe("60:00");
  });

  it("formatClock floors fractions and never goes negative", () => {
    expect(formatClock(12.9)).toBe("0:12");
    expect(formatClock(-5)).toBe("0:00");
  });

  it("formatLoggedValues labels reps once at the end", () => {
    expect(formatLoggedValues([12, 12, 10], "reps")).toBe("12, 12, 10 reps");
    expect(formatLoggedValues([8], "reps")).toBe("8 reps");
  });

  it("formatLoggedValues labels every hold value with its unit", () => {
    expect(formatLoggedValues([45, 45, 40], "hold")).toBe("45 s, 45 s, 40 s");
  });

  it("formatLoggedValues says nothing logged for an empty list", () => {
    expect(formatLoggedValues([], "reps")).toBe("nothing logged");
    expect(formatLoggedValues([], "hold")).toBe("nothing logged");
  });
});
