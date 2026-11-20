import { describe, expect, it } from "vitest";
import { groupByYear, isoDate, newestFirst, tagCounts } from "./posts";

const post = (id: string, date: string, tags?: string[]) => ({
  id,
  data: { date: new Date(date), tags },
});

describe("isoDate", () => {
  // Posts are written at +07:00. Midnight there is the previous day in UTC,
  // so a UTC (or build-machine) calendar would print the wrong date.
  it("formats in the site's +07:00 time zone, not UTC", () => {
    expect(isoDate(new Date("2026-03-25T00:00:00+07:00"))).toBe("2026-03-25");
  });

  it("zero-pads month and day", () => {
    expect(isoDate(new Date("2024-03-08T14:16:19+07:00"))).toBe("2024-03-08");
  });
});

describe("newestFirst", () => {
  it("orders posts by date, newest first", () => {
    const posts = [
      post("old", "2024-01-01T10:00:00+07:00"),
      post("new", "2026-01-01T10:00:00+07:00"),
      post("mid", "2025-01-01T10:00:00+07:00"),
    ];
    expect(posts.sort(newestFirst).map((p) => p.id)).toEqual([
      "new",
      "mid",
      "old",
    ]);
  });
});

describe("groupByYear", () => {
  it("groups posts by year, newest year first, keeping the input order", () => {
    const posts = [
      post("c", "2026-07-17T18:45:00+07:00"),
      post("b", "2026-02-17T12:50:32+07:00"),
      post("a", "2024-03-18T14:16:19+07:00"),
    ];
    expect(
      groupByYear(posts).map((g) => [g.year, g.posts.map((p) => p.id)]),
    ).toEqual([
      [2026, ["c", "b"]],
      [2024, ["a"]],
    ]);
  });

  // 00:30 on New Year's Day at +07:00 is still 31 December in UTC.
  it("assigns the year in the site's time zone", () => {
    const groups = groupByYear([post("ny", "2025-01-01T00:30:00+07:00")]);
    expect(groups.map((g) => g.year)).toEqual([2025]);
  });

  it("returns no groups for no posts", () => {
    expect(groupByYear([])).toEqual([]);
  });
});

describe("tagCounts", () => {
  it("counts each tag across posts, most used first", () => {
    const posts = [
      post("a", "2026-01-01", ["linux", "git"]),
      post("b", "2026-01-02", ["linux"]),
    ];
    expect(tagCounts(posts)).toEqual([
      ["linux", 2],
      ["git", 1],
    ]);
  });

  // Alphabetical within a count, so the order is stable between builds.
  it("breaks ties alphabetically", () => {
    const posts = [post("a", "2026-01-01", ["windows", "ai", "go"])];
    expect(tagCounts(posts).map(([tag]) => tag)).toEqual([
      "ai",
      "go",
      "windows",
    ]);
  });

  it("skips posts without tags", () => {
    const posts = [post("a", "2026-01-01"), post("b", "2026-01-02", ["misc"])];
    expect(tagCounts(posts)).toEqual([["misc", 1]]);
  });
});
