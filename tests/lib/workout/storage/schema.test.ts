import { describe, expect, it } from "vitest";
import { MOVEMENTS } from "../../../../src/lib/tools/workout/library/library";
import { placementProgress } from "../../../../src/lib/tools/workout/placement/placement";
import { newProgress } from "../../../../src/lib/tools/workout/progression/progress";
import {
  MIGRATIONS,
  SCHEMA_VERSION,
  STORAGE_KEY,
  defaultState,
  migrateState,
  readState,
  validateState,
} from "../../../../src/lib/tools/workout/storage/schema";
import type {
  AppState,
  Progress,
  SessionExercise,
  SessionRecord,
  SessionState,
  Step,
} from "../../../../src/lib/tools/workout/types";

const T = 1763550000000;

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

const PUSH_UP: SessionExercise = {
  movementId: "push-up",
  movementName: "Push-up",
  variationId: "push-up",
  variationName: "Push-up",
  pattern: "push",
  level: 3,
  type: "reps",
  perSide: false,
  plannedSets: 2,
  target: 9,
  restSeconds: 60,
};

const SIDE_PLANK: SessionExercise = {
  movementId: "side-plank",
  movementName: "Side plank",
  variationId: "side-plank",
  variationName: "Side plank",
  pattern: "core",
  level: 1,
  type: "hold",
  perSide: true,
  plannedSets: 1,
  target: 20,
  restSeconds: 60,
};

const step = (
  exerciseIndex: number,
  setNumber: number,
  side: Step["side"],
  status: Step["status"],
  value: number | null,
  loggedOn: string | null,
  reasons: Step["reasons"] = [],
): Step => ({
  exerciseIndex,
  setNumber,
  side,
  status,
  value,
  loggedOn,
  reasons,
});

function fullState(): AppState {
  const progress = placementProgress(null);
  progress["push-up"] = {
    level: 3,
    sets: 3,
    target: 9,
    topStreak: 2,
    lowStreak: 0,
    tooHard: [0, 1],
    cooldown: { harder: 0, easier: 2 },
    suggestion: {
      kind: "harder",
      reason: "top-of-range",
      createdOn: "2026-11-17",
    },
  };
  return {
    schemaVersion: 1,
    onboarded: true,
    settings: { timeCapMinutes: 35, muted: true },
    progress,
    history: [
      {
        id: `2026-11-17T${T - 2 * 86400000}`,
        date: "2026-11-17",
        dayType: "training",
        startedAt: T - 2 * 86400000,
        endedAt: T - 2 * 86400000 + 1500000,
        exercises: [{ ...PUSH_UP }, { ...SIDE_PLANK }],
        steps: [
          step(0, 1, null, "logged", 10, "2026-11-17"),
          step(0, 2, null, "skipped", null, null, ["too-hard", "pain"]),
          step(1, 1, "left", "logged", 20, "2026-11-17"),
          step(1, 1, "right", "logged", 18, "2026-11-18"),
        ],
        endedEarly: false,
        endReasons: [],
        endMovementId: null,
        changes: [
          {
            movementId: "push-up",
            kind: "suggest-harder",
            reason: "top-of-range",
            sentence: "Ready to try a harder push-up.",
          },
        ],
      },
      {
        id: `2026-11-15T${T - 4 * 86400000}`,
        date: "2026-11-15",
        dayType: "recovery",
        startedAt: T - 4 * 86400000,
        endedAt: T - 4 * 86400000 + 600000,
        exercises: [{ ...PUSH_UP }],
        steps: [
          step(0, 1, null, "logged", 6, "2026-11-15"),
          step(0, 2, null, "pending", null, null),
        ],
        endedEarly: true,
        endReasons: ["no-time"],
        endMovementId: "push-up",
        changes: [],
      },
    ],
    activeSession: {
      id: `2026-11-19T${T}`,
      date: "2026-11-19",
      dayType: "training",
      startedAt: T,
      exercises: [{ ...PUSH_UP }, { ...SIDE_PLANK }],
      steps: [
        step(0, 1, null, "logged", 9, "2026-11-19"),
        step(0, 2, null, "pending", null, null),
        step(1, 1, "left", "pending", null, null),
        step(1, 1, "right", "pending", null, null),
      ],
      cursor: 0,
      phase: "rest",
      paused: false,
      holdStarted: false,
      hold: { accumulatedMs: 0, runningSince: null },
      rest: {
        durationMs: 60000,
        watch: { accumulatedMs: 1200, runningSince: T + 30000 },
      },
      endedEarly: false,
      endReasons: [],
      endMovementId: null,
    },
  };
}

function broken(mutate: (state: AppState) => void) {
  const state = fullState();
  mutate(state);
  return validateState(state);
}

const LONG_ID = "x".repeat(65);
const record = (s: AppState): SessionRecord => s.history[0]!;
const session = (s: AppState): SessionState => s.activeSession!;
const pushUp = (s: AppState): Progress => s.progress["push-up"]!;
const rest = (s: AppState) => session(s).rest!;

type RuleCase =
  [string, (state: AppState) => void] | [string, null, () => unknown];

const RULE_CASES: RuleCase[] = [
  [
    "schemaVersion",
    (s) => {
      s.schemaVersion = 2 as never;
    },
  ],
  ["state", null, () => validateState([])],
  [
    "onboarded",
    (s) => {
      s.onboarded = "yes" as never;
    },
  ],
  [
    "settings",
    (s) => {
      s.settings = null as never;
    },
  ],
  [
    "settings.muted",
    (s) => {
      s.settings.muted = 1 as never;
    },
  ],
  [
    "settings.timeCapMinutes",
    (s) => {
      s.settings.timeCapMinutes = 95;
    },
  ],
  [
    "settings.timeCapMinutes",
    (s) => {
      s.settings.timeCapMinutes = 9;
    },
  ],
  [
    "settings.timeCapMinutes",
    (s) => {
      s.settings.timeCapMinutes = 12.5;
    },
  ],
  [
    "progress",
    (s) => {
      s.progress = [] as never;
    },
  ],
  [
    "progress.push-up",
    (s) => {
      s.progress["push-up"] = 5 as never;
    },
  ],
  [
    "progress.push-up.level",
    (s) => {
      pushUp(s).level = -1;
    },
  ],
  [
    "progress.push-up.level",
    (s) => {
      pushUp(s).level = "3" as never;
    },
  ],
  [
    "progress.push-up.sets",
    (s) => {
      pushUp(s).sets = 5;
    },
  ],
  [
    "progress.push-up.sets",
    (s) => {
      pushUp(s).sets = 1;
    },
  ],
  [
    "progress.push-up.target",
    (s) => {
      pushUp(s).target = 0;
    },
  ],
  [
    "progress.push-up.target",
    (s) => {
      pushUp(s).target = 3601;
    },
  ],
  [
    "progress.push-up.topStreak",
    (s) => {
      pushUp(s).topStreak = 10001;
    },
  ],
  [
    "progress.push-up.lowStreak",
    (s) => {
      pushUp(s).lowStreak = -1;
    },
  ],
  [
    "progress.push-up.tooHard",
    (s) => {
      pushUp(s).tooHard = [0, 1, 1, 0];
    },
  ],
  [
    "progress.push-up.tooHard",
    (s) => {
      pushUp(s).tooHard = [2] as never;
    },
  ],
  [
    "progress.push-up.cooldown",
    (s) => {
      pushUp(s).cooldown = null as never;
    },
  ],
  [
    "progress.push-up.cooldown.harder",
    (s) => {
      pushUp(s).cooldown.harder = 4;
    },
  ],
  [
    "progress.push-up.cooldown.easier",
    (s) => {
      pushUp(s).cooldown.easier = "1" as never;
    },
  ],
  [
    "progress.push-up.suggestion",
    (s) => {
      pushUp(s).suggestion = "harder" as never;
    },
  ],
  [
    "progress.push-up.suggestion.kind",
    (s) => {
      pushUp(s).suggestion!.kind = "sideways" as never;
    },
  ],
  [
    "progress.push-up.suggestion.reason",
    (s) => {
      pushUp(s).suggestion!.reason = "bored" as never;
    },
  ],
  [
    "progress.push-up.suggestion.createdOn",
    (s) => {
      pushUp(s).suggestion!.createdOn = "2026-02-30";
    },
  ],
  [
    "history",
    (s) => {
      s.history = {} as never;
    },
  ],
  [
    "history",
    (s) => {
      s.history = new Array(5001).fill(null);
    },
  ],
  [
    "history[1]",
    (s) => {
      s.history[1] = "record" as never;
    },
  ],
  [
    "history[0].id",
    (s) => {
      record(s).id = "";
    },
  ],
  [
    "history[0].id",
    (s) => {
      record(s).id = LONG_ID;
    },
  ],
  [
    "history[0].date",
    (s) => {
      record(s).date = "2026-13-01";
    },
  ],
  [
    "history[0].dayType",
    (s) => {
      record(s).dayType = "rest" as never;
    },
  ],
  [
    "history[0].startedAt",
    (s) => {
      record(s).startedAt = -1;
    },
  ],
  [
    "history[0].endedAt",
    (s) => {
      record(s).endedAt = Infinity;
    },
  ],
  [
    "history[0].endedAt",
    (s) => {
      record(s).endedAt = "5" as never;
    },
  ],
  [
    "history[0].endedEarly",
    (s) => {
      record(s).endedEarly = "no" as never;
    },
  ],
  [
    "history[0].endReasons",
    (s) => {
      record(s).endReasons = ["bored"] as never;
    },
  ],
  [
    "history[0].endReasons",
    (s) => {
      record(s).endReasons = ["pain", "pain"];
    },
  ],
  [
    "history[0].endMovementId",
    (s) => {
      record(s).endMovementId = 5 as never;
    },
  ],
  [
    "history[0].endMovementId",
    (s) => {
      record(s).endMovementId = "";
    },
  ],
  [
    "history[0].exercises",
    (s) => {
      record(s).exercises = [];
    },
  ],
  [
    "history[0].exercises",
    (s) => {
      record(s).exercises = new Array(6).fill(record(s).exercises[0]);
    },
  ],
  [
    "history[0].steps",
    (s) => {
      record(s).steps = [];
    },
  ],
  [
    "history[0].steps",
    (s) => {
      record(s).steps = new Array(41).fill(record(s).steps[0]);
    },
  ],
  [
    "history[0].changes",
    (s) => {
      record(s).changes = "none" as never;
    },
  ],
  [
    "history[0].changes",
    (s) => {
      record(s).changes = new Array(41).fill(record(s).changes[0]);
    },
  ],
  [
    "history[0].exercises[1]",
    (s) => {
      record(s).exercises[1] = [] as never;
    },
  ],
  [
    "history[0].exercises[1].movementId",
    (s) => {
      record(s).exercises[1]!.movementId = LONG_ID;
    },
  ],
  [
    "history[0].exercises[1].variationId",
    (s) => {
      record(s).exercises[1]!.variationId = "";
    },
  ],
  [
    "history[0].exercises[1].movementName",
    (s) => {
      record(s).exercises[1]!.movementName = "m".repeat(81);
    },
  ],
  [
    "history[0].exercises[1].variationName",
    (s) => {
      record(s).exercises[1]!.variationName = "";
    },
  ],
  [
    "history[0].exercises[1].pattern",
    (s) => {
      record(s).exercises[1]!.pattern = "arms" as never;
    },
  ],
  [
    "history[0].exercises[1].level",
    (s) => {
      record(s).exercises[1]!.level = 1.5;
    },
  ],
  [
    "history[0].exercises[1].type",
    (s) => {
      record(s).exercises[1]!.type = "time" as never;
    },
  ],
  [
    "history[0].exercises[1].perSide",
    (s) => {
      record(s).exercises[1]!.perSide = "yes" as never;
    },
  ],
  [
    "history[0].exercises[1].plannedSets",
    (s) => {
      record(s).exercises[1]!.plannedSets = 5;
    },
  ],
  [
    "history[0].exercises[1].plannedSets",
    (s) => {
      record(s).exercises[1]!.plannedSets = 0;
    },
  ],
  [
    "history[0].exercises[1].target",
    (s) => {
      record(s).exercises[1]!.target = 3601;
    },
  ],
  [
    "history[0].exercises[1].restSeconds",
    (s) => {
      record(s).exercises[1]!.restSeconds = 601;
    },
  ],
  [
    "history[0].steps[2]",
    (s) => {
      record(s).steps[2] = null as never;
    },
  ],
  [
    "history[0].steps[2].exerciseIndex",
    (s) => {
      record(s).steps[2]!.exerciseIndex = 2;
    },
  ],
  [
    "history[0].steps[2].exerciseIndex",
    (s) => {
      record(s).steps[2]!.exerciseIndex = -1;
    },
  ],
  [
    "history[0].steps[2].setNumber",
    (s) => {
      record(s).steps[2]!.setNumber = 0;
    },
  ],
  [
    "history[0].steps[2].side",
    (s) => {
      record(s).steps[2]!.side = "up" as never;
    },
  ],
  [
    "history[0].steps[2].status",
    (s) => {
      record(s).steps[2]!.status = "done" as never;
    },
  ],
  [
    "history[0].steps[2].value",
    (s) => {
      record(s).steps[2]!.value = null;
    },
  ],
  [
    "history[0].steps[2].value",
    (s) => {
      record(s).steps[2]!.value = 3601;
    },
  ],
  [
    "history[0].steps[2].value",
    (s) => {
      record(s).steps[2]!.value = 0;
    },
  ],
  [
    "history[0].steps[2].loggedOn",
    (s) => {
      record(s).steps[2]!.loggedOn = null;
    },
  ],
  [
    "history[0].steps[2].loggedOn",
    (s) => {
      record(s).steps[2]!.loggedOn = "19-11-2026";
    },
  ],
  [
    "history[0].steps[2].reasons",
    (s) => {
      record(s).steps[2]!.reasons = ["pain"];
    },
  ],
  [
    "history[0].steps[1].value",
    (s) => {
      record(s).steps[1]!.value = 5;
    },
  ],
  [
    "history[0].steps[1].loggedOn",
    (s) => {
      record(s).steps[1]!.loggedOn = "2026-11-17";
    },
  ],
  [
    "history[0].steps[1].reasons",
    (s) => {
      record(s).steps[1]!.reasons = ["pain", "nope"] as never;
    },
  ],
  [
    "history[0].steps[1].reasons",
    (s) => {
      record(s).steps[1]!.reasons = ["pain", "pain"];
    },
  ],
  [
    "history[1].steps[1].reasons",
    (s) => {
      s.history[1]!.steps[1]!.reasons = ["no-time"];
    },
  ],
  [
    "history[0].changes[0]",
    (s) => {
      record(s).changes[0] = "up" as never;
    },
  ],
  [
    "history[0].changes[0].movementId",
    (s) => {
      record(s).changes[0]!.movementId = "";
    },
  ],
  [
    "history[0].changes[0].kind",
    (s) => {
      record(s).changes[0]!.kind = "big" as never;
    },
  ],
  [
    "history[0].changes[0].reason",
    (s) => {
      record(s).changes[0]!.reason = "why" as never;
    },
  ],
  [
    "history[0].changes[0].sentence",
    (s) => {
      record(s).changes[0]!.sentence = "s".repeat(301);
    },
  ],
  [
    "history[0].changes[0].sentence",
    (s) => {
      record(s).changes[0]!.sentence = "";
    },
  ],
  [
    "activeSession",
    (s) => {
      s.activeSession = 5 as never;
    },
  ],
  [
    "activeSession.id",
    (s) => {
      session(s).id = 7 as never;
    },
  ],
  [
    "activeSession.steps[0].exerciseIndex",
    (s) => {
      session(s).steps[0]!.exerciseIndex = 9;
    },
  ],
  [
    "activeSession.cursor",
    (s) => {
      session(s).cursor = 4;
    },
  ],
  [
    "activeSession.cursor",
    (s) => {
      session(s).cursor = -1;
    },
  ],
  [
    "activeSession.phase",
    (s) => {
      session(s).phase = "warmup" as never;
    },
  ],
  [
    "activeSession.paused",
    (s) => {
      session(s).paused = "no" as never;
    },
  ],
  [
    "activeSession.holdStarted",
    (s) => {
      session(s).holdStarted = 1 as never;
    },
  ],
  [
    "activeSession.hold",
    (s) => {
      session(s).hold = null as never;
    },
  ],
  [
    "activeSession.hold.accumulatedMs",
    (s) => {
      session(s).hold.accumulatedMs = -1;
    },
  ],
  [
    "activeSession.hold.runningSince",
    (s) => {
      session(s).hold.runningSince = "now" as never;
    },
  ],
  [
    "activeSession.rest",
    (s) => {
      session(s).rest = 5 as never;
    },
  ],
  [
    "activeSession.rest.durationMs",
    (s) => {
      rest(s).durationMs = 600001;
    },
  ],
  [
    "activeSession.rest.durationMs",
    (s) => {
      rest(s).durationMs = 1.5;
    },
  ],
  [
    "activeSession.rest.watch",
    (s) => {
      Reflect.deleteProperty(rest(s), "watch");
    },
  ],
  [
    "activeSession.rest.watch.runningSince",
    (s) => {
      rest(s).watch.runningSince = -5;
    },
  ],
];

function reconciled(movementId: string, entry: Progress): Progress {
  const state = fullState();
  state.progress[movementId] = entry;
  const result = validateState(state);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("expected a valid state");
  return result.state.progress[movementId]!;
}

function validState(raw: unknown): AppState {
  const result = validateState(raw);
  if (!result.ok) throw new Error(`invalid at ${result.path}`);
  return result.state;
}

const addField = (raw: unknown) => ({
  ...(raw as object),
  schemaVersion: 2,
  added: true,
});
const renameField = (raw: unknown) => {
  const { added, ...rest } = raw as Record<string, unknown>;
  return { ...rest, schemaVersion: 3, renamed: added };
};

describe("workout/storage/schema", () => {
  it("defaultState validates to itself and every call is a fresh object", () => {
    const state = defaultState();
    expect(state).toStrictEqual({
      schemaVersion: SCHEMA_VERSION,
      onboarded: false,
      settings: { timeCapMinutes: 40, muted: false },
      progress: placementProgress(null),
      history: [],
      activeSession: null,
    });
    expect(validateState(state)).toStrictEqual({ ok: true, state });
    const other = defaultState();
    expect(other).not.toBe(state);
    expect(other.settings).not.toBe(state.settings);
    expect(other.progress).not.toBe(state.progress);
    expect(other.progress["push-up"]).not.toBe(state.progress["push-up"]);
    expect(other.history).not.toBe(state.history);
  });

  it("constants match the shared contract", () => {
    expect(SCHEMA_VERSION).toBe(1);
    expect(STORAGE_KEY).toBe("fiatcode.workout.state");
    expect(MIGRATIONS).toStrictEqual({});
    expect(Object.isFrozen(MIGRATIONS)).toBeTruthy();
  });

  it("a full state round-trips through JSON and readState", () => {
    const state = fullState();
    expect(readState(JSON.stringify(state))).toStrictEqual({ ok: true, state });
  });

  it("validateState never mutates or returns parts of its input", () => {
    const state = deepFreeze(fullState());
    const result = validState(state);
    expect(result).toStrictEqual(state);
    expect(result.history[0]).not.toBe(state.history[0]);
    expect(result.activeSession!.rest).not.toBe(state.activeSession!.rest);
    expect(result.progress["push-up"]!.cooldown).not.toBe(
      state.progress["push-up"]!.cooldown,
    );
  });

  for (const [path, mutate, run] of RULE_CASES) {
    it(`a broken ${path} is invalid with its path`, () => {
      const result = run ? run() : broken(mutate!);
      expect(result).toStrictEqual({ ok: false, error: "invalid", path });
    });
  }

  it("unknown keys at every level are dropped", () => {
    const state = fullState();
    const tag = (obj: object) => Object.assign(obj, { extra: "x" });
    tag(state);
    tag(state.settings);
    tag(state.progress);
    tag(pushUp(state));
    tag(pushUp(state).cooldown);
    tag(pushUp(state).suggestion!);
    const rec = record(state);
    [rec, rec.exercises[0]!, rec.steps[0]!, rec.changes[0]!].forEach(tag);
    const active = session(state);
    [
      active,
      active.exercises[1]!,
      active.steps[3]!,
      active.hold,
      active.rest!,
      active.rest!.watch,
    ].forEach(tag);
    expect(validateState(state)).toStrictEqual({
      ok: true,
      state: fullState(),
    });
  });

  it("__proto__ keys from JSON text pollute nothing and add no key", () => {
    const text = JSON.stringify(fullState())
      .replace("{", '{"__proto__":{"polluted":true},')
      .replace(
        '"progress":{',
        '"progress":{"__proto__":{"level":1,"polluted":true},',
      );
    expect(text.includes('"progress":{"__proto__"')).toBeTruthy();
    const result = readState(text);
    expect(result).toStrictEqual({ ok: true, state: fullState() });
    if (!result.ok) throw new Error("expected a valid state");
    expect(({} as Record<string, unknown>).polluted).toBe(undefined);
    expect((Object.prototype as Record<string, unknown>).polluted).toBe(
      undefined,
    );
    expect(Object.getPrototypeOf(result.state)).toBe(Object.prototype);
    expect(Object.getPrototypeOf(result.state.progress)).toBe(Object.prototype);
    expect(!Object.hasOwn(result.state, "__proto__")).toBeTruthy();
    expect(!Object.hasOwn(result.state.progress, "__proto__")).toBeTruthy();
    expect(Object.keys(result.state.progress)).toStrictEqual(
      MOVEMENTS.map((m) => m.id),
    );
  });

  it("reconcile: a missing movement entry gets the default", () => {
    const state = fullState();
    delete state.progress.squat;
    expect(validState(state).progress.squat).toStrictEqual(newProgress(0, 8));
  });

  it("reconcile: an unknown movement entry is dropped", () => {
    const state = fullState();
    state.progress["bench-press"] = newProgress(0, 5);
    const result = validState(state);
    expect(!Object.hasOwn(result.progress, "bench-press")).toBeTruthy();
    expect(result).toStrictEqual(fullState());
  });

  it("reconcile: a level beyond the ladder resets to the last rung", () => {
    expect(
      reconciled("push-up", {
        ...newProgress(99, 12),
        sets: 4,
        topStreak: 3,
      }),
    ).toStrictEqual(newProgress(7, 3));
  });

  it("reconcile: a reps target above the range clamps to its max", () => {
    expect(reconciled("push-up", { ...newProgress(3, 400) }).target).toBe(15);
  });

  it("reconcile: a reps target below the range clamps to its min", () => {
    expect(reconciled("push-up", { ...newProgress(3, 1) }).target).toBe(5);
  });

  it("reconcile: a hold target is rounded down to a multiple of 5", () => {
    expect(reconciled("plank", { ...newProgress(1, 23) }).target).toBe(20);
  });

  it("reconcile: a hold target rounded below the range clamps to its min", () => {
    expect(reconciled("plank", { ...newProgress(1, 12) }).target).toBe(20);
  });

  it("reconcile: a harder suggestion on the last rung is nulled", () => {
    const suggestion = {
      kind: "harder",
      reason: "top-of-range",
      createdOn: "2026-11-17",
    } as const;
    expect(
      reconciled("push-up", { ...newProgress(7, 3), suggestion }).suggestion,
    ).toBe(null);
  });

  it("reconcile: an easier suggestion on rung 0 is nulled", () => {
    const suggestion = {
      kind: "easier",
      reason: "too-hard",
      createdOn: "2026-11-17",
    } as const;
    expect(
      reconciled("push-up", { ...newProgress(0, 8), suggestion }).suggestion,
    ).toBe(null);
  });

  it("reconcile: an in-range suggestion is kept", () => {
    const suggestion = {
      kind: "easier",
      reason: "below-range",
      createdOn: "2026-11-17",
    } as const;
    expect(
      reconciled("push-up", { ...newProgress(2, 6), suggestion }).suggestion,
    ).toStrictEqual(suggestion);
  });

  it("history records are not checked against the library", () => {
    const state = fullState();
    Object.assign(record(state).exercises[0]!, {
      movementId: "retired-move",
      movementName: "Retired move",
      variationId: "retired-variation",
      variationName: "Retired variation",
      level: 42,
    });
    record(state).changes[0]!.movementId = "retired-move";
    expect(validateState(state)).toStrictEqual({ ok: true, state });
  });

  it("migrateState passes the current version through", () => {
    const raw = deepFreeze(fullState());
    expect(migrateState(raw)).toStrictEqual({ ok: true, raw });
  });

  it("migrateState rejects a newer version as unsupported", () => {
    expect(migrateState({ ...fullState(), schemaVersion: 2 })).toStrictEqual({
      ok: false,
      error: "unsupported",
    });
  });

  it("migrateState rejects a bad or missing version as invalid", () => {
    for (const schemaVersion of [0, "1", undefined, 1.5, -1]) {
      expect(migrateState({ schemaVersion })).toStrictEqual({
        ok: false,
        error: "invalid",
      });
    }
    expect(migrateState({})).toStrictEqual({ ok: false, error: "invalid" });
    for (const raw of [null, [], "text", 1]) {
      expect(migrateState(raw)).toStrictEqual({ ok: false, error: "invalid" });
    }
  });

  it("migrateState applies each migration step in order", () => {
    const raw = deepFreeze({ schemaVersion: 1, keep: "me" });
    expect(
      migrateState(raw, {
        migrations: { 1: addField, 2: renameField },
        current: 3,
      }),
    ).toStrictEqual({
      ok: true,
      raw: { schemaVersion: 3, keep: "me", renamed: true },
    });
    expect(raw).toStrictEqual({ schemaVersion: 1, keep: "me" });
  });

  it("migrateState with a missing step is unsupported", () => {
    expect(
      migrateState(
        { schemaVersion: 1 },
        { migrations: { 1: addField }, current: 3 },
      ),
    ).toStrictEqual({ ok: false, error: "unsupported" });
  });

  it("migrateState with a step that forgets the version bump is invalid", () => {
    const forgetful = (raw: unknown) => ({ ...(raw as object), added: true });
    expect(
      migrateState(
        { schemaVersion: 1 },
        { migrations: { 1: forgetful }, current: 2 },
      ),
    ).toStrictEqual({ ok: false, error: "invalid" });
  });

  it("readState reports corrupt JSON and non-object JSON", () => {
    expect(readState("{oops")).toStrictEqual({ ok: false, error: "corrupt" });
    expect(readState("null")).toStrictEqual({ ok: false, error: "invalid" });
    expect(readState("[]")).toStrictEqual({ ok: false, error: "invalid" });
  });

  it("readState reports a newer version as unsupported and a broken field as invalid", () => {
    expect(
      readState(JSON.stringify({ ...fullState(), schemaVersion: 2 })),
    ).toStrictEqual({ ok: false, error: "unsupported" });
    expect(
      readState(JSON.stringify({ ...fullState(), onboarded: "yes" })),
    ).toStrictEqual({ ok: false, error: "invalid" });
  });
});
