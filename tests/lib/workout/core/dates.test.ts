import { describe, expect, it } from "vitest";
import {
  addDays,
  dayNumber,
  isDateKey,
  keyFromDayNumber,
  toDateKey,
  weekday,
} from "../../../../src/lib/tools/workout/core/dates";

describe("workout/core/dates", () => {
  it("toDateKey uses the local calendar date", () => {
    expect(toDateKey(new Date(2026, 10, 19, 23, 59))).toBe("2026-11-19");
    expect(toDateKey(new Date(2026, 10, 19, 24, 0))).toBe("2026-11-20");
  });

  it("weekday counts from Sunday", () => {
    expect(weekday("2026-11-19")).toBe(4);
  });

  it("addDays crosses year ends and leap days", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
  });

  it("dayNumber round-trips over 800 consecutive days", () => {
    const start = dayNumber("2026-01-01");
    expect(Number.isInteger(start)).toBeTruthy();
    for (let n = start; n < start + 800; n += 1) {
      const key = keyFromDayNumber(n);
      expect(isDateKey(key), key).toBeTruthy();
      expect(dayNumber(key)).toBe(n);
    }
  });

  it("isDateKey rejects malformed and impossible dates", () => {
    expect(isDateKey("2026-11-19")).toBe(true);
    expect(isDateKey("2026-02-30")).toBe(false);
    expect(isDateKey("2026-2-3")).toBe(false);
    expect(isDateKey("")).toBe(false);
    expect(isDateKey(20261119)).toBe(false);
  });
});
