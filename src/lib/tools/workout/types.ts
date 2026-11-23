import type { Reason } from "./core/reasons";
import type { Pattern } from "./library/patterns";

export type DateKey = string; // "YYYY-MM-DD", local calendar date
export type WorkType = "reps" | "hold";
export type DayType = "training" | "recovery";
export type Side = "left" | "right";
export type StepStatus = "pending" | "logged" | "skipped";
export type SessionPhase = "work" | "rest" | "summary";

export interface Variation {
  id: string;
  name: string;
  cue: string;
  type: WorkType;
  min: number;
  max: number;
  perSide: boolean;
}
export interface PlacedVariation extends Variation {
  movementId: string;
  level: number;
}
export interface Movement {
  id: string;
  pattern: Pattern;
  name: string;
  startLevels: number[];
  variations: Variation[];
}

export interface Suggestion {
  kind: "harder" | "easier";
  reason: "top-of-range" | "below-range" | "too-hard";
  createdOn: DateKey;
}
export interface Progress {
  level: number;
  sets: number;
  target: number;
  topStreak: number;
  lowStreak: number;
  tooHard: (0 | 1)[];
  cooldown: { harder: number; easier: number };
  suggestion: Suggestion | null;
}
export type ProgressMap = Record<string, Progress>;

export interface PlanExercise {
  movementId: string;
  pattern: Pattern;
  level: number;
  variationId: string;
  type: WorkType;
  perSide: boolean;
  sets: number;
  target: number;
  restSeconds: number;
}
export interface Plan {
  dateKey: DateKey;
  dayType: DayType;
  exercises: PlanExercise[];
  estimateSeconds: number;
  capSeconds: number;
  trimmed: boolean;
}

export interface SessionExercise {
  movementId: string;
  movementName: string;
  variationId: string;
  variationName: string;
  pattern: Pattern;
  level: number;
  type: WorkType;
  perSide: boolean;
  plannedSets: number;
  target: number;
  restSeconds: number;
}
export interface Step {
  exerciseIndex: number;
  setNumber: number;
  side: Side | null;
  status: StepStatus;
  value: number | null;
  loggedOn: DateKey | null;
  reasons: Reason[];
}
export interface Stopwatch {
  accumulatedMs: number;
  runningSince: number | null;
}
export interface SessionCore {
  id: string;
  date: DateKey;
  dayType: DayType;
  startedAt: number;
  exercises: SessionExercise[];
  steps: Step[];
  endedEarly: boolean;
  endReasons: Reason[];
  endMovementId: string | null;
}
export interface SessionState extends SessionCore {
  cursor: number;
  phase: SessionPhase;
  paused: boolean;
  holdStarted: boolean;
  hold: Stopwatch;
  rest: { durationMs: number; watch: Stopwatch } | null;
}
export type ChangeKind =
  | "target-up"
  | "target-down"
  | "sets-up"
  | "sets-down"
  | "suggest-harder"
  | "suggest-easier"
  | "suggestion-withdrawn"
  | "level-up"
  | "level-down"
  | "declined";
export type ChangeReason =
  | "met"
  | "short"
  | "top-of-range"
  | "below-range"
  | "too-hard"
  | "contradicted"
  | "accepted"
  | "user";
export interface Change {
  movementId: string;
  kind: ChangeKind;
  reason: ChangeReason;
  sentence: string;
}
export interface SessionRecord extends SessionCore {
  endedAt: number;
  changes: Change[];
}

export interface Settings {
  timeCapMinutes: number;
  muted: boolean;
}
export interface AppState {
  schemaVersion: 1;
  onboarded: boolean;
  settings: Settings;
  progress: ProgressMap;
  history: SessionRecord[];
  activeSession: SessionState | null;
}
