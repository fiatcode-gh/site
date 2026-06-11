import { describe, expect, it } from "vitest";
import {
  MAX_INPUT_LENGTH,
  replacePreview,
  runRegex,
  segments,
} from "../../src/lib/tools/regex";

describe("runRegex", () => {
  it("finds all matches with the g flag", () => {
    const result = runRegex("o", "g", "foo bonobo");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.matches).toHaveLength(5);
      expect(result.matches[0]).toMatchObject({ start: 1, end: 2, text: "o" });
    }
  });

  it("finds only the first match without g", () => {
    const result = runRegex("o", "", "foo");
    expect(result.ok && result.matches).toHaveLength(1);
  });

  it("captures numbered groups", () => {
    const result = runRegex("(\\w+)@(\\w+)", "", "mail me a@b");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.matches[0].groups).toEqual(["a", "b"]);
      expect(result.matches[0].named).toBeNull();
    }
  });

  it("captures named groups", () => {
    const result = runRegex("(?<user>\\w+)@(?<host>\\w+)", "g", "a@b");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.matches[0].named).toEqual({ user: "a", host: "b" });
    }
  });

  it("reports invalid patterns as errors", () => {
    const result = runRegex("(", "g", "abc");
    expect(result.ok).toBe(false);
  });

  it("returns no matches for an empty pattern", () => {
    const result = runRegex("", "g", "abc");
    expect(result.ok && result.matches).toHaveLength(0);
  });

  it("guards against oversized input", () => {
    const result = runRegex("a", "g", "a".repeat(MAX_INPUT_LENGTH + 1));
    expect(result.ok).toBe(false);
  });

  it("caps matches at 1000 and reports truncation", () => {
    const result = runRegex("a", "g", "a".repeat(2000));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.matches).toHaveLength(1000);
      expect(result.truncated).toBe(true);
    }
  });
});

describe("segments", () => {
  it("splits input into hit and non-hit segments", () => {
    const result = runRegex("o", "g", "foo");
    if (!result.ok) throw new Error("unexpected");
    expect(segments("foo", result.matches)).toEqual([
      { text: "f", hit: false },
      { text: "o", hit: true },
      { text: "o", hit: true },
    ]);
  });

  it("returns one non-hit segment when there are no matches", () => {
    expect(segments("abc", [])).toEqual([{ text: "abc", hit: false }]);
  });
});

describe("replacePreview", () => {
  it("replaces with group references", () => {
    const result = replacePreview("(\\w+)", "g", "ab cd", "[$1]");
    expect(result).toEqual({ ok: true, output: "[ab] [cd]" });
  });

  it("replaces only the first match without g", () => {
    const result = replacePreview("a", "", "aaa", "x");
    expect(result).toEqual({ ok: true, output: "xaa" });
  });

  it("passes through on empty pattern", () => {
    expect(replacePreview("", "g", "abc", "x")).toEqual({
      ok: true,
      output: "abc",
    });
  });

  it("reports invalid patterns", () => {
    expect(replacePreview("(", "g", "abc", "x").ok).toBe(false);
  });
});
