export const MAX_INPUT_LENGTH = 100_000;
const MAX_MATCHES = 1000;

export interface RegexMatch {
  start: number;
  end: number;
  text: string;
  groups: (string | undefined)[];
  named: Record<string, string | undefined> | null;
}

export type RegexResult =
  | { ok: true; matches: RegexMatch[]; truncated: boolean }
  | { ok: false; error: string };

export type ReplaceResult =
  { ok: true; output: string } | { ok: false; error: string };

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function toMatch(m: RegExpMatchArray): RegexMatch {
  const start = m.index ?? 0;
  return {
    start,
    end: start + m[0].length,
    text: m[0],
    groups: m.slice(1),
    named: m.groups ? { ...m.groups } : null,
  };
}

export function runRegex(
  pattern: string,
  flags: string,
  input: string,
): RegexResult {
  if (pattern === "") return { ok: true, matches: [], truncated: false };
  if (input.length > MAX_INPUT_LENGTH) {
    return {
      ok: false,
      error: `input too large (max ${MAX_INPUT_LENGTH.toLocaleString()} chars)`,
    };
  }
  let re: RegExp;
  try {
    re = new RegExp(pattern, flags);
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
  const matches: RegexMatch[] = [];
  let truncated = false;
  if (re.global) {
    for (const m of input.matchAll(re)) {
      if (matches.length >= MAX_MATCHES) {
        truncated = true;
        break;
      }
      matches.push(toMatch(m));
    }
  } else {
    const m = re.exec(input);
    if (m) matches.push(toMatch(m));
  }
  return { ok: true, matches, truncated };
}

export function segments(
  input: string,
  matches: RegexMatch[],
): { text: string; hit: boolean }[] {
  const segs: { text: string; hit: boolean }[] = [];
  let pos = 0;
  for (const m of matches) {
    if (m.start > pos)
      segs.push({ text: input.slice(pos, m.start), hit: false });
    if (m.end > m.start) {
      segs.push({ text: input.slice(m.start, m.end), hit: true });
    }
    pos = Math.max(pos, m.end);
  }
  if (pos < input.length) segs.push({ text: input.slice(pos), hit: false });
  return segs;
}

export function replacePreview(
  pattern: string,
  flags: string,
  input: string,
  replacement: string,
): ReplaceResult {
  if (pattern === "") return { ok: true, output: input };
  if (input.length > MAX_INPUT_LENGTH) {
    return {
      ok: false,
      error: `input too large (max ${MAX_INPUT_LENGTH.toLocaleString()} chars)`,
    };
  }
  try {
    return {
      ok: true,
      output: input.replace(new RegExp(pattern, flags), replacement),
    };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}
