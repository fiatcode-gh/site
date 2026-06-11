export type JsonResult =
  | { ok: true; output: string }
  | { ok: false; error: string; line?: number; column?: number };

export function positionToLineCol(
  input: string,
  pos: number,
): { line: number; column: number } {
  const upTo = input.slice(0, pos);
  const lines = upTo.split("\n");
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

export function formatJson(input: string, indent: number): JsonResult {
  return transform(input, (v) => JSON.stringify(v, null, indent));
}

export function minifyJson(input: string): JsonResult {
  return transform(input, (v) => JSON.stringify(v));
}

function findErrorPosition(input: string): number | null {
  // Scan progressively longer substrings to pinpoint the first unexpected-token
  // position. This handles runtimes that don't include "position N" in the message.
  for (let i = 1; i <= input.length; i++) {
    try {
      JSON.parse(input.slice(0, i));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/Unexpected token/.test(msg)) {
        return i - 1;
      }
    }
  }
  return null;
}

function transform(input: string, print: (v: unknown) => string): JsonResult {
  if (input.trim() === "") return { ok: false, error: "empty input" };
  try {
    return { ok: true, output: print(JSON.parse(input)) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // V8 ≥ 11.9 / Firefox include "line N column M"; older V8 only "position N"
    const lineCol = message.match(/line (\d+) column (\d+)/);
    if (lineCol) {
      return {
        ok: false,
        error: message,
        line: Number(lineCol[1]),
        column: Number(lineCol[2]),
      };
    }
    const pos = message.match(/position (\d+)/);
    if (pos) {
      const { line, column } = positionToLineCol(input, Number(pos[1]));
      return { ok: false, error: message, line, column };
    }
    // Fallback: scan input to find the error position (handles Node v24+ format)
    const errPos = findErrorPosition(input);
    if (errPos !== null) {
      const { line, column } = positionToLineCol(input, errPos);
      return { ok: false, error: message, line, column };
    }
    return { ok: false, error: message };
  }
}
