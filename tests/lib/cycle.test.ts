import { describe, expect, it } from "vitest";
import { parseDates } from "../../src/lib/tools/cycle";

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
