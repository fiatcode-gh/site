import type { DateKey } from "../types";

const DAY_MS = 86400000;
const KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function pad(value: number, width: number): string {
  return String(value).padStart(width, "0");
}

export function toDateKey(date: Date): DateKey {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`;
}

export function dayNumber(key: DateKey): number {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y!, m! - 1, d) / DAY_MS;
}

export function keyFromDayNumber(n: number): DateKey {
  const date = new Date(n * DAY_MS);
  return (
    `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1, 2)}-` +
    pad(date.getUTCDate(), 2)
  );
}

export function isDateKey(text: unknown): text is DateKey {
  if (typeof text !== "string" || !KEY_PATTERN.test(text)) return false;
  return keyFromDayNumber(dayNumber(text)) === text;
}

export function addDays(key: DateKey, n: number): DateKey {
  return keyFromDayNumber(dayNumber(key) + n);
}

export function weekday(key: DateKey): number {
  return (dayNumber(key) + 4) % 7;
}
