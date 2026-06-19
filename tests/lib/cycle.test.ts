import { describe, expect, it } from "vitest";
import { buildCycles, computeStats, estimateFertility, parseDates, predictNext } from "../../src/lib/tools/cycle";

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

describe("predictNext", () => {
  // Prototype fixture: 19 starts → mean 28.17, shortest 26, longest 30.
  const { dates } = parseDates(
    [
      "2025-01-14","2025-02-11","2025-03-10","2025-04-08","2025-05-05",
      "2025-06-03","2025-06-30","2025-07-29","2025-08-26","2025-09-24",
      "2025-10-23","2025-11-19","2025-12-18","2026-01-15","2026-02-14",
      "2026-03-13","2026-04-08","2026-05-08","2026-06-05",
    ].join("\n"),
  );
  const stats = computeStats(buildCycles(dates));
  const last = dates[dates.length - 1]; // 2026-06-05

  it("predicts point + range from the last start", () => {
    const p = predictNext(last, stats);
    expect(ymd(p.point)).toBe("2026-07-03"); // +round(28.17)=28
    expect(ymd(p.earliest)).toBe("2026-07-01"); // +26
    expect(ymd(p.latest)).toBe("2026-07-05"); // +30
  });
});

describe("estimateFertility", () => {
  const { dates } = parseDates(
    [
      "2025-01-14","2025-02-11","2025-03-10","2025-04-08","2025-05-05",
      "2025-06-03","2025-06-30","2025-07-29","2025-08-26","2025-09-24",
      "2025-10-23","2025-11-19","2025-12-18","2026-01-15","2026-02-14",
      "2026-03-13","2026-04-08","2026-05-08","2026-06-05",
    ].join("\n"),
  );
  const stats = computeStats(buildCycles(dates));
  const last = dates[dates.length - 1]; // 2026-06-05, shortest 26, longest 30, mean~28.17

  it("computes the calendar-rhythm band and banded ovulation", () => {
    const f = estimateFertility(last, stats);
    expect(ymd(f.fertileStart)).toBe("2026-06-13"); // +26-18 = +8
    expect(ymd(f.fertileEnd)).toBe("2026-06-24"); // +30-11 = +19
    expect(ymd(f.ovulationEstimate)).toBe("2026-06-19"); // +28-14 = +14
    expect(f.ovulationBandDays).toBe(2); // ceil(stdDev~1.07) floored at 2
    expect(f.method).toBe("calendar-rhythm");
    expect(f.confidence).toBe("ok");
  });

  it("flags low confidence under 6 cycles", () => {
    const few = parseDates("2026-01-01\n2026-01-29\n2026-02-26").dates; // 2 cycles
    const f = estimateFertility(few[few.length - 1], computeStats(buildCycles(few)));
    expect(f.confidence).toBe("low");
  });
});
