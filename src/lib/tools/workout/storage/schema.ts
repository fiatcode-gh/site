import { isDateKey } from "../core/dates";
import { REASONS, type Reason } from "../core/reasons";
import { MOVEMENTS } from "../library/library";
import { PATTERNS } from "../library/patterns";
import { placementProgress } from "../placement/placement";
import {
  HOLD_STEP_SECONDS,
  MAX_SETS,
  MIN_SETS,
  newProgress,
} from "../progression/progress";
import type {
  AppState,
  Change,
  ChangeKind,
  ChangeReason,
  DayType,
  Movement,
  Progress,
  ProgressMap,
  SessionCore,
  SessionExercise,
  SessionPhase,
  SessionRecord,
  SessionState,
  Side,
  Step,
  StepStatus,
  Stopwatch,
  Suggestion,
  WorkType,
} from "../types";

export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = "fiatcode.workout.state";
export const MIGRATIONS: Readonly<Record<number, Migration>> = Object.freeze(
  {},
);

type Migration = (value: unknown) => unknown;
type Obj = Record<string, unknown>;
type Guard<T> = (value: unknown) => value is T;

const DAY_TYPES: readonly DayType[] = ["training", "recovery"];
const EXERCISE_TYPES: readonly WorkType[] = ["reps", "hold"];
const SIDES: readonly (Side | null)[] = [null, "left", "right"];
const STEP_STATUSES: readonly StepStatus[] = ["pending", "logged", "skipped"];
const PHASES: readonly SessionPhase[] = ["work", "rest", "summary"];
const SUGGESTION_KINDS: readonly Suggestion["kind"][] = ["harder", "easier"];
const SUGGESTION_REASONS: readonly Suggestion["reason"][] = [
  "top-of-range",
  "below-range",
  "too-hard",
];
const CHANGE_KINDS: readonly ChangeKind[] = [
  "target-up",
  "target-down",
  "sets-up",
  "sets-down",
  "suggest-harder",
  "suggest-easier",
  "suggestion-withdrawn",
  "level-up",
  "level-down",
  "declined",
];
const CHANGE_REASONS: readonly ChangeReason[] = [
  "met",
  "short",
  "top-of-range",
  "below-range",
  "too-hard",
  "contradicted",
  "accepted",
  "user",
];
const MAX_HISTORY = 5000;
const MAX_EXERCISES = 5;
const MAX_STEPS = 40;
const MAX_CHANGES = 40;
const MAX_VALUE = 3600;

export function defaultState(): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    onboarded: false,
    settings: { timeCapMinutes: 40, muted: false },
    progress: placementProgress(null),
    history: [],
    activeSession: null,
  };
}

function isPlainObject(value: unknown): value is Obj {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function field(value: Obj, key: string): unknown {
  return Object.hasOwn(value, key) ? value[key] : undefined;
}

export function migrateState(
  raw: unknown,
  {
    migrations = MIGRATIONS,
    current = SCHEMA_VERSION,
  }: { migrations?: Record<number, Migration>; current?: number } = {},
):
  { ok: true; raw: unknown } | { ok: false; error: "invalid" | "unsupported" } {
  const versionOf = (value: unknown) =>
    isPlainObject(value) ? field(value, "schemaVersion") : undefined;
  let value = raw;
  const found = versionOf(value);
  if (typeof found !== "number" || !Number.isInteger(found) || found < 1) {
    return { ok: false, error: "invalid" };
  }
  let version = found;
  if (version > current) return { ok: false, error: "unsupported" };
  while (version < current) {
    const migrate = Object.hasOwn(migrations, version)
      ? migrations[version]
      : undefined;
    if (typeof migrate !== "function")
      return { ok: false, error: "unsupported" };
    value = migrate(value);
    if (versionOf(value) !== version + 1)
      return { ok: false, error: "invalid" };
    version += 1;
  }
  return { ok: true, raw: value };
}

class InvalidPath {
  constructor(readonly path: string) {}
}

function check(ok: boolean, path: string): void {
  if (!ok) throw new InvalidPath(path);
}

function objectAt(value: unknown, path: string): Obj {
  check(isPlainObject(value), path);
  return value as Obj;
}

function read<T>(obj: Obj, key: string, path: string, test: Guard<T>): T {
  const value = field(obj, key);
  check(test(value), path);
  return value as T;
}

const isInt =
  (min: number, max = Infinity): Guard<number> =>
  (v): v is number =>
    typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
const isText =
  (min: number, max: number): Guard<string> =>
  (v): v is string =>
    typeof v === "string" && v.length >= min && v.length <= max;
const isBool: Guard<boolean> = (v): v is boolean => typeof v === "boolean";
const isTime: Guard<number> = (v): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0;
const isNull: Guard<null> = (v): v is null => v === null;
const isOneOf =
  <T>(list: readonly T[]): Guard<T> =>
  (v): v is T =>
    (list as readonly unknown[]).includes(v);
const isId = isText(1, 64);
const isIdOrNull: Guard<string | null> = (v): v is string | null =>
  v === null || isId(v);
const isTimeOrNull: Guard<number | null> = (v): v is number | null =>
  v === null || isTime(v);

function readArray(
  obj: Obj,
  key: string,
  path: string,
  min: number,
  max: number,
): unknown[] {
  const value = field(obj, key);
  check(
    Array.isArray(value) && value.length >= min && value.length <= max,
    path,
  );
  return value as unknown[];
}

function readReasons(obj: Obj, key: string, path: string): Reason[] {
  const value = readArray(obj, key, path, 0, REASONS.length);
  check(
    value.every(isOneOf(REASONS)) && new Set(value).size === value.length,
    path,
  );
  return [...(value as Reason[])];
}

function readSuggestion(value: unknown, path: string): Suggestion | null {
  if (value === null) return null;
  const s = objectAt(value, path);
  return {
    kind: read(s, "kind", `${path}.kind`, isOneOf(SUGGESTION_KINDS)),
    reason: read(s, "reason", `${path}.reason`, isOneOf(SUGGESTION_REASONS)),
    createdOn: read(s, "createdOn", `${path}.createdOn`, isDateKey),
  };
}

function readProgressEntry(value: unknown, path: string): Progress {
  const p = objectAt(value, path);
  const tooHard = readArray(p, "tooHard", `${path}.tooHard`, 0, 3);
  check(
    tooHard.every((v) => v === 0 || v === 1),
    `${path}.tooHard`,
  );
  const cooldown = objectAt(field(p, "cooldown"), `${path}.cooldown`);
  return {
    level: read(p, "level", `${path}.level`, isInt(0)),
    sets: read(p, "sets", `${path}.sets`, isInt(MIN_SETS, MAX_SETS)),
    target: read(p, "target", `${path}.target`, isInt(1, MAX_VALUE)),
    topStreak: read(p, "topStreak", `${path}.topStreak`, isInt(0, 10000)),
    lowStreak: read(p, "lowStreak", `${path}.lowStreak`, isInt(0, 10000)),
    tooHard: [...(tooHard as (0 | 1)[])],
    cooldown: {
      harder: read(cooldown, "harder", `${path}.cooldown.harder`, isInt(0, 3)),
      easier: read(cooldown, "easier", `${path}.cooldown.easier`, isInt(0, 3)),
    },
    suggestion: readSuggestion(field(p, "suggestion"), `${path}.suggestion`),
  };
}

function reconcile(movement: Movement, entry: Progress | undefined): Progress {
  const last = movement.variations.length - 1;
  if (entry === undefined) {
    return newProgress(0, movement.variations[0]!.min);
  }
  if (entry.level > last) {
    return newProgress(last, movement.variations[last]!.min);
  }
  const { type, min, max } = movement.variations[entry.level]!;
  const rounded =
    type === "hold"
      ? Math.floor(entry.target / HOLD_STEP_SECONDS) * HOLD_STEP_SECONDS
      : entry.target;
  const kind = entry.suggestion?.kind;
  const stale =
    (kind === "harder" && entry.level === last) ||
    (kind === "easier" && entry.level === 0);
  return {
    ...entry,
    target: Math.min(max, Math.max(min, rounded)),
    suggestion: stale ? null : entry.suggestion,
  };
}

function readProgress(value: unknown): ProgressMap {
  const progress = objectAt(value, "progress");
  return Object.fromEntries(
    MOVEMENTS.map((m) => {
      const entry = Object.hasOwn(progress, m.id)
        ? readProgressEntry(progress[m.id], `progress.${m.id}`)
        : undefined;
      return [m.id, reconcile(m, entry)];
    }),
  );
}

function readStopwatch(value: unknown, path: string): Stopwatch {
  const w = objectAt(value, path);
  return {
    accumulatedMs: read(w, "accumulatedMs", `${path}.accumulatedMs`, isTime),
    runningSince: read(w, "runningSince", `${path}.runningSince`, isTimeOrNull),
  };
}

function readExercise(value: unknown, path: string): SessionExercise {
  const e = objectAt(value, path);
  return {
    movementId: read(e, "movementId", `${path}.movementId`, isId),
    movementName: read(
      e,
      "movementName",
      `${path}.movementName`,
      isText(1, 80),
    ),
    variationId: read(e, "variationId", `${path}.variationId`, isId),
    variationName: read(
      e,
      "variationName",
      `${path}.variationName`,
      isText(1, 80),
    ),
    pattern: read(e, "pattern", `${path}.pattern`, isOneOf(PATTERNS)),
    level: read(e, "level", `${path}.level`, isInt(0)),
    type: read(e, "type", `${path}.type`, isOneOf(EXERCISE_TYPES)),
    perSide: read(e, "perSide", `${path}.perSide`, isBool),
    plannedSets: read(
      e,
      "plannedSets",
      `${path}.plannedSets`,
      isInt(1, MAX_SETS),
    ),
    target: read(e, "target", `${path}.target`, isInt(1, MAX_VALUE)),
    restSeconds: read(e, "restSeconds", `${path}.restSeconds`, isInt(0, 600)),
  };
}

function readStep(value: unknown, path: string, exerciseCount: number): Step {
  const s = objectAt(value, path);
  const status = read(s, "status", `${path}.status`, isOneOf(STEP_STATUSES));
  const logged = status === "logged";
  const step: Step = {
    exerciseIndex: read(
      s,
      "exerciseIndex",
      `${path}.exerciseIndex`,
      isInt(0, exerciseCount - 1),
    ),
    setNumber: read(s, "setNumber", `${path}.setNumber`, isInt(1, MAX_SETS)),
    side: read(s, "side", `${path}.side`, isOneOf(SIDES)),
    status,
    value: read<number | null>(
      s,
      "value",
      `${path}.value`,
      logged ? isInt(1, MAX_VALUE) : isNull,
    ),
    loggedOn: read<string | null>(
      s,
      "loggedOn",
      `${path}.loggedOn`,
      logged ? isDateKey : isNull,
    ),
    reasons: readReasons(s, "reasons", `${path}.reasons`),
  };
  check(status === "skipped" || step.reasons.length === 0, `${path}.reasons`);
  return step;
}

function readChange(value: unknown, path: string): Change {
  const c = objectAt(value, path);
  return {
    movementId: read(c, "movementId", `${path}.movementId`, isId),
    kind: read(c, "kind", `${path}.kind`, isOneOf(CHANGE_KINDS)),
    reason: read(c, "reason", `${path}.reason`, isOneOf(CHANGE_REASONS)),
    sentence: read(c, "sentence", `${path}.sentence`, isText(1, 300)),
  };
}

function readSessionCore(r: Obj, path: string): SessionCore {
  const exercises = readArray(
    r,
    "exercises",
    `${path}.exercises`,
    1,
    MAX_EXERCISES,
  ).map((e, i) => readExercise(e, `${path}.exercises[${i}]`));
  const steps = readArray(r, "steps", `${path}.steps`, 1, MAX_STEPS).map(
    (s, i) => readStep(s, `${path}.steps[${i}]`, exercises.length),
  );
  return {
    id: read(r, "id", `${path}.id`, isId),
    date: read(r, "date", `${path}.date`, isDateKey),
    dayType: read(r, "dayType", `${path}.dayType`, isOneOf(DAY_TYPES)),
    startedAt: read(r, "startedAt", `${path}.startedAt`, isTime),
    exercises,
    steps,
    endedEarly: read(r, "endedEarly", `${path}.endedEarly`, isBool),
    endReasons: readReasons(r, "endReasons", `${path}.endReasons`),
    endMovementId: read(
      r,
      "endMovementId",
      `${path}.endMovementId`,
      isIdOrNull,
    ),
  };
}

function readRecord(value: unknown, path: string): SessionRecord {
  const r = objectAt(value, path);
  const core = readSessionCore(r, path);
  return {
    ...core,
    endedAt: read(r, "endedAt", `${path}.endedAt`, isTime),
    changes: readArray(r, "changes", `${path}.changes`, 0, MAX_CHANGES).map(
      (c, i) => readChange(c, `${path}.changes[${i}]`),
    ),
  };
}

function readRest(value: unknown, path: string): SessionState["rest"] {
  if (value === null) return null;
  const r = objectAt(value, path);
  return {
    durationMs: read(r, "durationMs", `${path}.durationMs`, isInt(0, 600000)),
    watch: readStopwatch(field(r, "watch"), `${path}.watch`),
  };
}

function readActiveSession(value: unknown): SessionState | null {
  const path = "activeSession";
  if (value === null) return null;
  const s = objectAt(value, path);
  const core = readSessionCore(s, path);
  return {
    ...core,
    cursor: read(
      s,
      "cursor",
      `${path}.cursor`,
      isInt(0, core.steps.length - 1),
    ),
    phase: read(s, "phase", `${path}.phase`, isOneOf(PHASES)),
    paused: read(s, "paused", `${path}.paused`, isBool),
    holdStarted: read(s, "holdStarted", `${path}.holdStarted`, isBool),
    hold: readStopwatch(field(s, "hold"), `${path}.hold`),
    rest: readRest(field(s, "rest"), `${path}.rest`),
  };
}

function readAppState(raw: unknown): AppState {
  const root = objectAt(raw, "state");
  read(
    root,
    "schemaVersion",
    "schemaVersion",
    (v): v is typeof SCHEMA_VERSION => v === SCHEMA_VERSION,
  );
  const settings = objectAt(field(root, "settings"), "settings");
  return {
    schemaVersion: SCHEMA_VERSION,
    onboarded: read(root, "onboarded", "onboarded", isBool),
    settings: {
      timeCapMinutes: read(
        settings,
        "timeCapMinutes",
        "settings.timeCapMinutes",
        isInt(10, 90),
      ),
      muted: read(settings, "muted", "settings.muted", isBool),
    },
    progress: readProgress(field(root, "progress")),
    history: readArray(root, "history", "history", 0, MAX_HISTORY).map((r, i) =>
      readRecord(r, `history[${i}]`),
    ),
    activeSession: readActiveSession(field(root, "activeSession")),
  };
}

export function validateState(
  raw: unknown,
):
  | { ok: true; state: AppState }
  | { ok: false; error: "invalid"; path: string } {
  try {
    return { ok: true, state: readAppState(raw) };
  } catch (error) {
    if (error instanceof InvalidPath) {
      return { ok: false, error: "invalid", path: error.path };
    }
    throw error;
  }
}

export function readState(
  text: string,
):
  | { ok: true; state: AppState }
  | { ok: false; error: "corrupt" | "invalid" | "unsupported" } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "corrupt" };
  }
  const migrated = migrateState(raw);
  if (!migrated.ok) return migrated;
  const validated = validateState(migrated.raw);
  return validated.ok ? validated : { ok: false, error: "invalid" };
}
