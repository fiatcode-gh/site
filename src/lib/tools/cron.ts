import { CronExpressionParser } from "cron-parser";
import cronstrue from "cronstrue";

// cronstrue (description) and cron-parser (next runs) have independent
// parsers that accept slightly different syntax (e.g. cronstrue can describe
// "@reboot", which has no computable next run). Each is attempted on its
// own so one failing never suppresses what the other can offer; the result
// is only an error when BOTH reject the expression.
export type CronResult =
  | { ok: true; description: string | null; nextRuns: Date[] | null }
  | { ok: false; error: string };

export interface CronOptions {
  count?: number;
  tz?: string;
  currentDate?: Date;
}

export function explainCron(
  expression: string,
  { count = 5, tz, currentDate }: CronOptions = {},
): CronResult {
  const expr = expression.trim();
  if (expr === "") return { ok: false, error: "empty expression" };

  let description: string | null = null;
  try {
    description = cronstrue.toString(expr);
  } catch {
    description = null; // cronstrue can throw non-Error values; message unused
  }

  let nextRuns: Date[] | null = null;
  let parseError: string | null = null;
  try {
    const interval = CronExpressionParser.parse(expr, { tz, currentDate });
    nextRuns = interval.take(count).map((d) => d.toDate());
  } catch (err) {
    parseError = err instanceof Error ? err.message : String(err);
  }

  if (description === null && nextRuns === null) {
    return { ok: false, error: parseError ?? "invalid cron expression" };
  }
  return { ok: true, description, nextRuns };
}
