import { describe, expect, it } from "vitest";
import {
  formatJson,
  minifyJson,
  positionToLineCol,
} from "../../src/lib/tools/json";

describe("formatJson", () => {
  it("pretty-prints with the given indent", () => {
    const result = formatJson('{"a":1}', 2);
    expect(result).toEqual({ ok: true, output: '{\n  "a": 1\n}' });
  });

  it("supports indent of 4", () => {
    const result = formatJson('{"a":1}', 4);
    expect(result).toEqual({ ok: true, output: '{\n    "a": 1\n}' });
  });

  it("reports empty input", () => {
    expect(formatJson("   ", 2)).toEqual({
      ok: false,
      error: "empty input",
    });
  });

  it("reports parse errors with a line number", () => {
    const result = formatJson('{\n"a": oops\n}', 2);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeTruthy();
      expect(result.line).toBe(2);
    }
  });
});

describe("minifyJson", () => {
  it("minifies", () => {
    expect(minifyJson('{ "a" : [1, 2] }')).toEqual({
      ok: true,
      output: '{"a":[1,2]}',
    });
  });
});

describe("positionToLineCol", () => {
  it("maps a character offset to line and column", () => {
    expect(positionToLineCol("ab\ncd\nef", 0)).toEqual({ line: 1, column: 1 });
    expect(positionToLineCol("ab\ncd\nef", 4)).toEqual({ line: 2, column: 2 });
    expect(positionToLineCol("ab\ncd\nef", 6)).toEqual({ line: 3, column: 1 });
  });
});

describe("error-position fallback", () => {
  it("reports line and column for token errors without engine position info", () => {
    const result = formatJson('{\n"a": oops\n}', 2);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.line).toBe(2);
      expect(result.column).toBe(6);
    }
  });

  it("reports position 1:1 for an immediately-bad input", () => {
    const result = formatJson("oops", 2);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.line).toBe(1);
      expect(result.column).toBe(1);
    }
  });

  it("returns promptly without line/column for oversized invalid input", () => {
    const big = "[" + "1,".repeat(10_000) + "x]";
    const start = performance.now();
    const result = formatJson(big, 2);
    const elapsed = performance.now() - start;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.line).toBeUndefined();
    }
    expect(elapsed).toBeLessThan(500);
  });
});
