export const PATTERNS = Object.freeze([
  "push",
  "legs",
  "core",
  "back",
  "conditioning",
] as const);

export type Pattern = (typeof PATTERNS)[number];

export const PATTERN_LABELS: Readonly<Record<Pattern, string>> = Object.freeze({
  push: "Push",
  legs: "Legs",
  core: "Core",
  back: "Back",
  conditioning: "Conditioning",
});
