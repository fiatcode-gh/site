import { describe, expect, it } from "vitest";
import { buildCycles, computeStats, parseDates } from "../../src/lib/tools/cycle";

// Helper to convert Date to YYYY-MM-DD string
const ymd = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

describe("parseDates", () => {
  it("parses ISO dates, sorts, ignores blanks, dedupes", () => {
    const { dates, issues } = parseDates(
      "2025-02-11\n\n2025-01-14\n2025-02-11\n  2025-03-10  ",
    );
    expect(dates.map(ymd)).toEqual(["2025-01-14", "2025-02-11", "2025-03-10"]);
    expect(issues).toEqual([]);
  });

  it("reports bad lines without throwing", () => {
    const { dates, issues } = parseDates("2025-01-14\nnope\n2025-13-40");
    expect(dates.map(ymd)).toEqual(["2025-01-14"]);
    expect(issues.map((i) => i.line)).toEqual([2, 3]);
    expect(issues[0].raw).toBe("nope");
  });

  it("returns empty for empty input", () => {
    expect(parseDates("   \n  ")).toEqual({ dates: [], issues: [] });
  });
});

describe("buildCycles + computeStats", () => {
  const { dates } = parseDates(
    "2025-01-01\n2025-01-29\n2025-02-28\n2025-03-26\n2025-04-23",
  );

  it("builds consecutive cycles with day counts", () => {
    const cycles = buildCycles(dates);
    expect(cycles.map((c) => c.days)).toEqual([28, 30, 26, 28]);
    expect(ymd(cycles[0].from)).toBe("2025-01-01");
    expect(ymd(cycles[0].to)).toBe("2025-01-29");
  });

  it("computes mean, range, stdDev, distribution", () => {
    const stats = computeStats(buildCycles(dates));
    expect(stats.cycleCount).toBe(4);
    expect(stats.mean).toBeCloseTo(28, 5);
    expect(stats.shortest).toBe(26);
    expect(stats.longest).toBe(30);
    expect(stats.stdDev).toBeCloseTo(Math.sqrt(2), 5); // ~1.414
    expect(stats.distribution).toEqual({ 26: 1, 28: 2, 30: 1 });
  });

  it("handles empty/short input", () => {
    expect(buildCycles([])).toEqual([]);
    expect(computeStats([]).cycleCount).toBe(0);
  });
});
