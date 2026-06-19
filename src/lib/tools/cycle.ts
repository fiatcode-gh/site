export interface ParseIssue {
  line: number;
  raw: string;
  reason: string;
}

export interface Cycle {
  from: Date;
  to: Date;
  days: number;
}

export interface CycleStats {
  cycleCount: number;
  mean: number;
  shortest: number;
  longest: number;
  stdDev: number;
  distribution: Record<number, number>;
}

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDates(text: string): {
  dates: Date[];
  issues: ParseIssue[];
} {
  const issues: ParseIssue[] = [];
  const seen = new Set<string>();
  const dates: Date[] = [];

  text.split("\n").forEach((rawLine, idx) => {
    const raw = rawLine.trim();
    if (raw === "") return;
    const m = ISO.exec(raw);
    if (!m) {
      issues.push({ line: idx + 1, raw, reason: "expected YYYY-MM-DD" });
      return;
    }
    const [, y, mo, d] = m;
    const year = +y;
    const monthIndex = +mo - 1;
    const day = +d;
    const date = new Date(year, monthIndex, day);
    // Reject impossible dates (e.g. 2025-13-40 rolls over).
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== monthIndex ||
      date.getDate() !== day
    ) {
      issues.push({ line: idx + 1, raw, reason: "not a real date" });
      return;
    }
    const key = raw;
    if (seen.has(key)) return;
    seen.add(key);
    dates.push(date);
  });

  dates.sort((a, b) => a.getTime() - b.getTime());
  return { dates, issues };
}

const MS_PER_DAY = 86_400_000;
const diffDays = (a: Date, b: Date) =>
  Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);

export function buildCycles(dates: Date[]): Cycle[] {
  const cycles: Cycle[] = [];
  for (let i = 1; i < dates.length; i++) {
    cycles.push({
      from: dates[i - 1],
      to: dates[i],
      days: diffDays(dates[i - 1], dates[i]),
    });
  }
  return cycles;
}

export function computeStats(cycles: Cycle[]): CycleStats {
  if (cycles.length === 0) {
    return {
      cycleCount: 0,
      mean: 0,
      shortest: 0,
      longest: 0,
      stdDev: 0,
      distribution: {},
    };
  }
  const lengths = cycles.map((c) => c.days);
  const mean = lengths.reduce((s, n) => s + n, 0) / lengths.length;
  const variance =
    lengths.reduce((s, n) => s + (n - mean) ** 2, 0) / lengths.length;
  const distribution: Record<number, number> = {};
  for (const n of lengths) distribution[n] = (distribution[n] ?? 0) + 1;
  return {
    cycleCount: lengths.length,
    mean,
    shortest: Math.min(...lengths),
    longest: Math.max(...lengths),
    stdDev: Math.sqrt(variance),
    distribution,
  };
}
