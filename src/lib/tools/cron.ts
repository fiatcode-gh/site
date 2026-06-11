import { CronExpressionParser } from "cron-parser";
import cronstrue from "cronstrue";

export type CronResult =
  | { ok: true; description: string; nextRuns: Date[] }
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
  try {
    const interval = CronExpressionParser.parse(expr, { tz, currentDate });
    const description = cronstrue.toString(expr);
    return {
      ok: true,
      description,
      nextRuns: interval.take(count).map((d) => d.toDate()),
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
