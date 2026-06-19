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

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export interface Prediction {
  point: Date;
  earliest: Date;
  latest: Date;
}

export function predictNext(last: Date, stats: CycleStats): Prediction {
  return {
    point: addDays(last, Math.round(stats.mean)),
    earliest: addDays(last, stats.shortest),
    latest: addDays(last, stats.longest),
  };
}

export interface FertilityEstimate {
  fertileStart: Date;
  fertileEnd: Date;
  ovulationEstimate: Date;
  ovulationBandDays: number;
  method: "calendar-rhythm";
  confidence: "low" | "ok";
}

export function estimateFertility(
  last: Date,
  stats: CycleStats,
): FertilityEstimate {
  return {
    fertileStart: addDays(last, stats.shortest - 18),
    fertileEnd: addDays(last, stats.longest - 11),
    ovulationEstimate: addDays(last, Math.round(stats.mean) - 14),
    ovulationBandDays: Math.max(2, Math.ceil(stats.stdDev)),
    method: "calendar-rhythm",
    confidence: stats.cycleCount < 6 ? "low" : "ok",
  };
}

export function sdmBand(
  last: Date,
  stats: CycleStats,
): { start: Date; end: Date } | null {
  if (stats.mean < 26 || stats.mean > 32) return null;
  return { start: addDays(last, 7), end: addDays(last, 18) };
}

export function anomalies(cycles: Cycle[]): Cycle[] {
  return cycles.filter((c) => c.days < 21 || c.days > 35);
}

export function eligibility(stats: CycleStats): {
  sdmEligible: boolean;
  regular: boolean;
  note: string;
} {
  const sdmEligible = stats.mean >= 26 && stats.mean <= 32;
  const regular = stats.longest - stats.shortest <= 7;
  const note = sdmEligible
    ? "Cycles fall in the Standard Days Method range (26–32 days)."
    : "Cycles are outside the Standard Days Method range; estimates are less reliable.";
  return { sdmEligible, regular, note };
}
