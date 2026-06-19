export interface ParseIssue {
  line: number;
  raw: string;
  reason: string;
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
