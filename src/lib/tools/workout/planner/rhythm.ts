import { dayNumber, weekday } from "../core/dates";
import type { DateKey, DayType } from "../types";

export const RECOVERY_WEEKDAYS = [0, 3];

export function dayTypeFor(dateKey: DateKey): DayType {
  return RECOVERY_WEEKDAYS.includes(weekday(dateKey)) ? "recovery" : "training";
}

export function trainingOrdinal(dateKey: DateKey): number {
  const n = dayNumber(dateKey);
  const weeks = Math.floor(n / 7);
  let count = weeks * 5;
  for (let d = weeks * 7; d < n; d += 1) {
    if (!RECOVERY_WEEKDAYS.includes((d + 4) % 7)) count += 1;
  }
  return count;
}
