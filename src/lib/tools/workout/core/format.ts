import type { WorkType } from "../types";

const DIGITS = /^\d+$/;

export function parseWholeNumber(
  text: unknown,
  { min, max }: { min: number; max: number },
): number | null {
  const trimmed = String(text ?? "").trim();
  if (!DIGITS.test(trimmed)) return null;
  const value = Number(trimmed);
  return value >= min && value <= max ? value : null;
}

export function formatClock(totalSeconds: number): string {
  const whole = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(whole / 60);
  return `${minutes}:${String(whole % 60).padStart(2, "0")}`;
}

export function formatLoggedValues(values: number[], type: WorkType): string {
  if (values.length === 0) return "nothing logged";
  if (type === "hold") return values.map((value) => `${value} s`).join(", ");
  return `${values.join(", ")} reps`;
}
