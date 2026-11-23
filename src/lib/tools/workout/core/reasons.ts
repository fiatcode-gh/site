export const REASONS = [
  "no-time",
  "too-hard",
  "pain",
  "not-feeling-it",
  "other",
] as const;

export type Reason = (typeof REASONS)[number];

export const REASON_LABELS: Record<Reason, string> = {
  "no-time": "No time",
  "too-hard": "Too hard",
  pain: "Pain or discomfort",
  "not-feeling-it": "Not feeling it",
  other: "Other",
};
