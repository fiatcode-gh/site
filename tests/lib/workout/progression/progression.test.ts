import { describe, expect, it } from "vitest";
import type { Reason } from "../../../../src/lib/tools/workout/core/reasons";
import {
  variation,
  variationAt,
} from "../../../../src/lib/tools/workout/library/library";
import { placementProgress } from "../../../../src/lib/tools/workout/placement/placement";
import {
  DECLINE_COOLDOWN,
  LOW_STREAK_FOR_SUGGESTION,
  SHORT_RATIO,
  TOO_HARD_FOR_SUGGESTION,
  TOO_HARD_WINDOW,
  TOP_STREAK_FOR_SUGGESTION,
  evaluateSession,
  formatWork,
  resolveSuggestion,
  setLevel,
  suggestionText,
} from "../../../../src/lib/tools/workout/progression/progression";
import type {
  Change,
  DayType,
  Progress,
  ProgressMap,
  SessionExercise,
  SessionRecord,
  Step,
  Suggestion,
} from "../../../../src/lib/tools/workout/types";

const KINDS = [
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
const CHANGE_REASONS = [
  "met",
  "short",
  "top-of-range",
  "below-range",
  "too-hard",
  "contradicted",
  "accepted",
  "user",
];
const NON_TOO_HARD: Reason[][] = [
  ["pain"],
  ["no-time"],
  ["not-feeling-it"],
  ["other"],
  [],
];

const seenChanges: Change[] = [];

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function evaluate(progress: ProgressMap, rec: SessionRecord) {
  const result = evaluateSession(
    deepFreeze(clone(progress)),
    deepFreeze(clone(rec)),
  );
  seenChanges.push(...result.changes);
  return result;
}

function resolve(progress: ProgressMap, movementId: string, accept: boolean) {
  const result = resolveSuggestion(
    deepFreeze(clone(progress)),
    movementId,
    accept,
  );
  if (result.change) seenChanges.push(result.change);
  return result;
}

function base(entries: Record<string, Partial<Progress>> = {}): ProgressMap {
  const progress = placementProgress(null);
  progress["push-up"] = {
    ...progress["push-up"]!,
    level: 3,
    sets: 3,
    target: 9,
  };
  for (const [id, patch] of Object.entries(entries)) {
    progress[id] = { ...progress[id]!, ...patch };
  }
  return progress;
}

type StepSpec =
  | { status: "logged"; value: number }
  | { status: "skipped"; reasons: Reason[] }
  | { status: "pending" };

const logged = (value: number): StepSpec => ({ status: "logged", value });
const skipped = (...reasons: Reason[]): StepSpec => ({
  status: "skipped",
  reasons,
});
const pending = (): StepSpec => ({ status: "pending" });

interface ExerciseSpec {
  movementId: string;
  target: number;
  level?: number;
  plannedSets?: number;
  values?: number[];
  steps?: StepSpec[];
}

function stepsFor(
  exerciseIndex: number,
  ex: ExerciseSpec,
  perSide: boolean,
): Step[] {
  const specs = ex.steps ?? (ex.values ?? []).map(logged);
  return specs.map((spec, i) => ({
    exerciseIndex,
    setNumber: perSide ? Math.floor(i / 2) + 1 : i + 1,
    side: perSide ? (i % 2 === 0 ? "left" : "right") : null,
    status: spec.status,
    value: spec.status === "logged" ? spec.value : null,
    loggedOn: spec.status === "logged" ? "2026-11-19" : null,
    reasons: spec.status === "skipped" ? spec.reasons : [],
  }));
}

interface RecordSpec {
  dayType?: DayType;
  date?: string;
  exercises: ExerciseSpec[];
  endedEarly?: boolean;
  endReasons?: Reason[];
  endMovementId?: string | null;
}

function record({
  dayType = "training",
  date = "2026-11-19",
  exercises,
  endedEarly = false,
  endReasons = [],
  endMovementId = null,
}: RecordSpec): SessionRecord {
  const sessionExercises: SessionExercise[] = exercises.map((ex) => {
    const level = ex.level ?? 3;
    const v = variationAt(ex.movementId, level) ?? {
      id: "x",
      name: "X",
      type: "reps" as const,
      perSide: false,
    };
    return {
      movementId: ex.movementId,
      movementName: ex.movementId,
      variationId: v.id,
      variationName: v.name,
      pattern: "push",
      level,
      type: v.type,
      perSide: Boolean(v.perSide),
      plannedSets: ex.plannedSets ?? 3,
      target: ex.target,
      restSeconds: 60,
    };
  });
  return {
    id: `${date}T0`,
    date,
    dayType,
    startedAt: 0,
    endedAt: 1,
    exercises: sessionExercises,
    steps: exercises.flatMap((ex, i) =>
      stepsFor(i, ex, sessionExercises[i]!.perSide),
    ),
    endedEarly,
    endReasons,
    endMovementId,
    changes: [],
  };
}

interface PushExtra extends Omit<RecordSpec, "exercises"> {
  exercise?: Partial<ExerciseSpec>;
}

const push = (target: number, values: number[], extra: PushExtra = {}) =>
  record({
    ...extra,
    exercises: [{ movementId: "push-up", target, values, ...extra.exercise }],
  });

function pushSteps(
  target: number,
  steps: StepSpec[],
  extra: Omit<RecordSpec, "exercises"> = {},
) {
  return record({
    ...extra,
    exercises: [{ movementId: "push-up", target, steps }],
  });
}

function evidenceFields(entry: Progress) {
  const { level, sets, target, topStreak, lowStreak, suggestion } = entry;
  return { level, sets, target, topStreak, lowStreak, suggestion };
}

function sameIdentityExcept(
  before: ProgressMap,
  after: ProgressMap,
  movementIds: string[],
) {
  for (const id of Object.keys(before)) {
    if (movementIds.includes(id)) continue;
    expect(after[id], `${id} should keep its identity`).toBe(before[id]);
  }
}

function lunge(target: number, values: number[]) {
  return record({
    exercises: [
      { movementId: "lunge", level: 1, plannedSets: 2, target, values },
    ],
  });
}

function twoAtTop(movementId = "push-up", level = 3) {
  const top = variationAt(movementId, level)!.max;
  const start = base({ [movementId]: { level, sets: 4, target: top } });
  const rec = () =>
    record({
      exercises: [
        {
          movementId,
          level,
          plannedSets: 4,
          target: top,
          values: [top, top, top, top],
        },
      ],
    });
  const first = evaluate(start, rec());
  return { first, second: evaluate(first.progress, rec()) };
}

function twoBelow(level: number) {
  const v = variationAt("push-up", level)!;
  const start = base({ "push-up": { level, sets: 2, target: v.min } });
  const rec = () =>
    record({
      exercises: [
        {
          movementId: "push-up",
          level,
          plannedSets: 2,
          target: v.min,
          values: [1, 1],
        },
      ],
    });
  const first = evaluate(start, rec());
  return { first, second: evaluate(first.progress, rec()) };
}

describe("workout/progression/progression", () => {
  it("constants", () => {
    expect(TOP_STREAK_FOR_SUGGESTION).toBe(2);
    expect(LOW_STREAK_FOR_SUGGESTION).toBe(2);
    expect(TOO_HARD_WINDOW).toBe(3);
    expect(TOO_HARD_FOR_SUGGESTION).toBe(2);
    expect(DECLINE_COOLDOWN).toBe(3);
    expect(SHORT_RATIO).toBe(0.8);
  });

  it("formatWork covers reps, holds and per-side work", () => {
    expect(formatWork(3, 10, variation("push-up")!)).toBe("3 × 10 reps");
    expect(formatWork(3, 30, { type: "hold", perSide: false })).toBe(
      "3 × 30 s",
    );
    expect(formatWork(3, 8, variation("split-squat")!)).toBe(
      "3 × 8 reps each side",
    );
    expect(formatWork(2, 20, { type: "hold", perSide: true })).toBe(
      "2 × 20 s each side",
    );
  });

  it("meeting every set raises the target by one step", () => {
    const before = deepFreeze(base());
    const { progress, changes } = evaluateSession(
      before,
      deepFreeze(push(9, [9, 9, 9])),
    );
    expect(progress["push-up"]!.target).toBe(11);
    expect(progress["push-up"]!.sets).toBe(3);
    expect(changes.map((c) => [c.movementId, c.kind, c.reason])).toStrictEqual([
      ["push-up", "target-up", "met"],
    ]);
    expect(changes[0]!.sentence).toBe(
      "Push-up: you hit every set, so next time is 3 × 11 reps.",
    );
    sameIdentityExcept(before, progress, ["push-up"]);
  });

  it("values above target still count as met", () => {
    expect(
      evaluate(base(), push(9, [11, 9, 9])).progress["push-up"]!.target,
    ).toBe(11);
  });

  it("a target near the top is capped at the variation maximum", () => {
    const { progress } = evaluate(
      base({ "push-up": { target: 14 } }),
      push(14, [14, 14, 14]),
    );
    expect(progress["push-up"]!.target).toBe(15);
  });

  it("falling a little short changes nothing", () => {
    const { progress, changes } = evaluate(base(), push(9, [9, 9, 8]));
    expect(progress["push-up"]!.target).toBe(9);
    expect(progress["push-up"]!.sets).toBe(3);
    expect(changes).toStrictEqual([]);
  });

  it("falling well short lowers the target by one step", () => {
    const { progress, changes } = evaluate(base(), push(9, [9, 6, 5]));
    expect(progress["push-up"]!.target).toBe(7);
    expect(changes.map((c) => c.kind)).toStrictEqual(["target-down"]);
    expect(changes[0]!.reason).toBe("short");
    expect(changes[0]!.sentence).toBe(
      "Push-up: you finished well short of the target, so next time drops to 3 × 7 reps.",
    );
  });

  it("falling well short at the bottom removes a set", () => {
    const { progress, changes } = evaluate(
      base({ "push-up": { target: 5 } }),
      push(5, [3, 3, 2]),
    );
    expect(progress["push-up"]!.sets).toBe(2);
    expect(progress["push-up"]!.target).toBe(5);
    expect(progress["push-up"]!.lowStreak).toBe(1);
    expect(changes.map((c) => [c.kind, c.reason])).toStrictEqual([
      ["sets-down", "short"],
    ]);
    expect(changes[0]!.sentence).toBe(
      "Push-up: still well short at the bottom of the range, so next time is 2 × 5 reps.",
    );
  });

  it("at the bottom with the fewest sets nothing drops further but the low streak rises", () => {
    const start = base({ "push-up": { target: 5, sets: 2, lowStreak: 0 } });
    const { progress } = evaluate(
      start,
      push(5, [2, 2], { exercise: { plannedSets: 2 } }),
    );
    expect(progress["push-up"]!.sets).toBe(2);
    expect(progress["push-up"]!.target).toBe(5);
    expect(progress["push-up"]!.lowStreak).toBe(1);
  });

  it("meeting the top of the range adds a set, then holds at the maximum", () => {
    const first = evaluate(
      base({ "push-up": { target: 15 } }),
      push(15, [15, 15, 15]),
    );
    expect(first.progress["push-up"]!.topStreak).toBe(1);
    expect(first.progress["push-up"]!.sets).toBe(4);
    expect(first.changes.map((c) => [c.kind, c.reason])).toStrictEqual([
      ["sets-up", "met"],
    ]);
    expect(first.changes[0]!.sentence).toBe(
      "Push-up: you hit every set at the top of the range, " +
        "so next time adds a set (4 × 15 reps).",
    );
    const second = evaluate(
      first.progress,
      push(15, [15, 15, 15, 15], { exercise: { plannedSets: 4 } }),
    );
    expect(second.progress["push-up"]!.topStreak).toBe(2);
    expect(second.progress["push-up"]!.sets).toBe(4);
    expect(!second.changes.some((c) => c.kind === "sets-up")).toBeTruthy();
  });

  it("per-side work needs every side at target to count as met", () => {
    const start = base({ lunge: { level: 1, sets: 2, target: 10 } });
    const almost = evaluate(start, lunge(10, [10, 10, 10, 9]));
    expect(almost.progress.lunge!.target).toBe(10);
    expect(almost.changes).toStrictEqual([]);
    const met = evaluate(start, lunge(10, [10, 10, 10, 10]));
    expect(met.progress.lunge!.target).toBe(12);
  });

  it("per-side short uses the total of all steps", () => {
    const start = base({ lunge: { level: 1, sets: 2, target: 10 } });
    expect(
      evaluate(start, lunge(10, [10, 10, 10, 2])).progress.lunge!.target,
    ).toBe(10);
    expect(
      evaluate(start, lunge(10, [10, 10, 10, 1])).progress.lunge!.target,
    ).toBe(8);
  });

  it("a session trimmed by the time cap still counts when its planned steps are logged", () => {
    const { progress } = evaluate(
      base(),
      push(9, [9, 9], { exercise: { plannedSets: 2 } }),
    );
    expect(progress["push-up"]!.target).toBe(11);
    expect(progress["push-up"]!.sets).toBe(3);
  });

  it("two met sessions at the top suggest the next variation", () => {
    const { first, second } = twoAtTop();
    expect(first.progress["push-up"]!.suggestion).toBe(null);
    const entry = second.progress["push-up"]!;
    expect(entry.level).toBe(3);
    expect(entry.suggestion).toStrictEqual({
      kind: "harder",
      reason: "top-of-range",
      createdOn: "2026-11-19",
    });
    const change = second.changes.find((c) => c.kind === "suggest-harder")!;
    expect(change.reason).toBe("top-of-range");
    expect(change.sentence).toMatch(/Diamond push-up/);
    expect(change.sentence).toBe(
      "Push-up: you reached the top of the range twice in a row. " +
        "Ready to try Diamond push-up?",
    );
  });

  it("a held session between two met sessions resets the top streak", () => {
    const start = base({ "push-up": { sets: 4, target: 15 } });
    const met = () =>
      push(15, [15, 15, 15, 15], { exercise: { plannedSets: 4 } });
    const a = evaluate(start, met());
    const b = evaluate(
      a.progress,
      push(15, [15, 15, 15, 14], { exercise: { plannedSets: 4 } }),
    );
    expect(b.progress["push-up"]!.topStreak).toBe(0);
    const c = evaluate(b.progress, met());
    expect(c.progress["push-up"]!.suggestion).toBe(null);
  });

  it("the last rung never suggests a harder variation", () => {
    const v = variationAt("push-up", 7)!;
    expect(v.id).toBe("one-arm-push-up");
    const start = base({
      "push-up": { level: 7, sets: 4, target: v.max, topStreak: 2 },
    });
    const { progress } = evaluate(
      start,
      record({
        exercises: [
          {
            movementId: "push-up",
            level: 7,
            plannedSets: 4,
            target: v.max,
            values: Array<number>(8).fill(v.max),
          },
        ],
      }),
    );
    expect(progress["push-up"]!.suggestion).toBe(null);
    expect(progress["push-up"]!.topStreak).toBe(3);
  });

  it("two sessions below the range suggest the previous variation", () => {
    const { first, second } = twoBelow(3);
    expect(first.progress["push-up"]!.suggestion).toBe(null);
    expect(second.progress["push-up"]!.suggestion).toStrictEqual({
      kind: "easier",
      reason: "below-range",
      createdOn: "2026-11-19",
    });
    const change = second.changes.find((c) => c.kind === "suggest-easier")!;
    expect(change.reason).toBe("below-range");
    expect(change.sentence).toBe(
      "Push-up: two sessions in a row fell below the range. " +
        "Knee push-up may suit you better for now.",
    );
    expect(second.progress["push-up"]!.level).toBe(3);
  });

  it("below the range on the first rung suggests nothing", () => {
    const { second } = twoBelow(0);
    expect(second.progress["push-up"]!.lowStreak).toBe(2);
    expect(second.progress["push-up"]!.suggestion).toBe(null);
  });

  it("a pending suggestion blocks a second one", () => {
    const pendingHarder: Suggestion = {
      kind: "harder",
      reason: "top-of-range",
      createdOn: "2026-11-18",
    };
    const start = base({
      "push-up": { suggestion: pendingHarder, tooHard: [1] },
    });
    const { progress, changes } = evaluate(
      start,
      pushSteps(9, [skipped("too-hard"), pending(), pending()], {
        endedEarly: true,
        endReasons: [],
        endMovementId: "push-up",
      }),
    );
    expect(progress["push-up"]!.suggestion).toStrictEqual(pendingHarder);
    expect(changes).toStrictEqual([]);
  });

  it("a pending harder suggestion is withdrawn by a short session", () => {
    const pendingHarder: Suggestion = {
      kind: "harder",
      reason: "top-of-range",
      createdOn: "2026-11-18",
    };
    const { progress, changes } = evaluate(
      base({ "push-up": { suggestion: pendingHarder } }),
      push(9, [3, 3, 3]),
    );
    expect(progress["push-up"]!.suggestion).toBe(null);
    const change = changes.find((c) => c.kind === "suggestion-withdrawn")!;
    expect(change.reason).toBe("contradicted");
    expect(change.sentence).toBe(
      "Push-up: your latest session changed the picture, " +
        "so the earlier suggestion was dropped.",
    );
  });

  it("a pending easier suggestion is withdrawn by a met session", () => {
    const pendingEasier: Suggestion = {
      kind: "easier",
      reason: "below-range",
      createdOn: "2026-11-18",
    };
    const { progress, changes } = evaluate(
      base({ "push-up": { suggestion: pendingEasier } }),
      push(9, [9, 9, 9]),
    );
    expect(progress["push-up"]!.suggestion).toBe(null);
    expect(changes.map((c) => c.kind)).toStrictEqual([
      "target-up",
      "suggestion-withdrawn",
    ]);
  });

  it("a recovery day never counts as evidence", () => {
    const start = base({ "push-up": { topStreak: 1, lowStreak: 1 } });
    const { progress, changes } = evaluate(
      start,
      push(5, [30, 30], {
        dayType: "recovery",
        exercise: { plannedSets: 2 },
      }),
    );
    expect(evidenceFields(progress["push-up"]!)).toStrictEqual(
      evidenceFields(start["push-up"]!),
    );
    expect(changes).toStrictEqual([]);
  });

  for (const reasons of NON_TOO_HARD) {
    const label = reasons.length ? reasons[0] : "no reason";
    it(`a skipped step with ${label} leaves difficulty alone`, () => {
      const start = base({
        "push-up": { topStreak: 1, lowStreak: 1, tooHard: [1] },
      });
      const { progress, changes } = evaluate(
        start,
        pushSteps(9, [logged(9), logged(9), skipped(...reasons)]),
      );
      expect(evidenceFields(progress["push-up"]!)).toStrictEqual(
        evidenceFields(start["push-up"]!),
      );
      expect(progress["push-up"]!.tooHard).toStrictEqual([1, 0]);
      expect(changes).toStrictEqual([]);
    });

    it(`ending early with ${label} leaves difficulty alone`, () => {
      const start = base({
        "push-up": { topStreak: 1, lowStreak: 1, tooHard: [1] },
      });
      const { progress, changes } = evaluate(
        start,
        pushSteps(9, [logged(20), pending(), pending()], {
          endedEarly: true,
          endReasons: reasons,
          endMovementId: "push-up",
        }),
      );
      expect(evidenceFields(progress["push-up"]!)).toStrictEqual(
        evidenceFields(start["push-up"]!),
      );
      expect(progress["push-up"]!.tooHard).toStrictEqual([1, 0]);
      expect(changes).toStrictEqual([]);
    });
  }

  it("an early end counts fully logged exercises and ignores unreached ones", () => {
    const start = base({ squat: { topStreak: 1, lowStreak: 1 } });
    const squatTarget = start.squat!.target;
    const plank = variationAt("plank", 0)!;
    const rec = record({
      endedEarly: true,
      endReasons: ["no-time"],
      endMovementId: "squat",
      exercises: [
        { movementId: "push-up", target: 9, values: [9, 9, 9] },
        {
          movementId: "squat",
          level: 0,
          target: squatTarget,
          steps: [logged(1), pending(), pending()],
        },
        {
          movementId: "plank",
          level: 0,
          target: plank.min,
          steps: [pending(), pending(), pending()],
        },
      ],
    });
    const { progress } = evaluate(start, rec);
    expect(progress["push-up"]!.target).toBe(11);
    expect(evidenceFields(progress.squat!)).toStrictEqual(
      evidenceFields(start.squat!),
    );
    expect(progress.squat!.tooHard).toStrictEqual([0]);
    const frozen = deepFreeze(clone(start));
    expect(evaluateSession(frozen, deepFreeze(rec)).progress.plank).toBe(
      frozen.plank,
    );
  });

  it("too hard in two of three appearances suggests the previous variation", () => {
    let progress = base();
    const sessions = [
      pushSteps(9, [logged(9), skipped("too-hard"), skipped("too-hard")]),
      pushSteps(9, [logged(9), logged(9), skipped("pain")]),
      pushSteps(9, [logged(9), logged(9), skipped("too-hard")]),
    ];
    let changes: Change[] = [];
    for (const rec of sessions)
      ({ progress, changes } = evaluate(progress, rec));
    const entry = progress["push-up"]!;
    expect(entry.tooHard).toStrictEqual([1, 0, 1]);
    expect(entry.suggestion).toStrictEqual({
      kind: "easier",
      reason: "too-hard",
      createdOn: "2026-11-19",
    });
    expect([entry.level, entry.sets, entry.target]).toStrictEqual([3, 3, 9]);
    const change = changes.find((c) => c.kind === "suggest-easier")!;
    expect(change.reason).toBe("too-hard");
    expect(change.sentence).toBe(
      "Push-up: you marked it Too hard in two recent sessions. " +
        "Knee push-up may suit you better for now.",
    );
  });

  it("too hard twice in one session counts once", () => {
    const { progress } = evaluate(
      base(),
      pushSteps(9, [
        skipped("too-hard"),
        skipped("too-hard"),
        skipped("too-hard"),
      ]),
    );
    expect(progress["push-up"]!.tooHard).toStrictEqual([1]);
    expect(progress["push-up"]!.suggestion).toBe(null);
  });

  it("too hard on the first rung updates the window without a suggestion", () => {
    const start = base({ "push-up": { level: 0, target: 8, tooHard: [1] } });
    const { progress } = evaluate(
      start,
      record({
        exercises: [
          {
            movementId: "push-up",
            level: 0,
            target: 8,
            steps: [skipped("too-hard"), pending(), pending()],
          },
        ],
        endedEarly: true,
        endReasons: [],
        endMovementId: "push-up",
      }),
    );
    expect(progress["push-up"]!.tooHard).toStrictEqual([1, 1]);
    expect(progress["push-up"]!.suggestion).toBe(null);
  });

  it("the window keeps only the last three appearances", () => {
    const start = base({ "push-up": { tooHard: [1, 0, 0] } });
    const { progress } = evaluate(start, push(9, [9, 9, 9]));
    expect(progress["push-up"]!.tooHard).toStrictEqual([0, 0, 0]);
  });

  it("too hard on an early end counts for the movement it ended on only", () => {
    const start = base({
      "push-up": { tooHard: [1] },
      squat: { tooHard: [1] },
    });
    const { progress } = evaluate(
      start,
      record({
        endedEarly: true,
        endReasons: ["too-hard"],
        endMovementId: "squat",
        exercises: [
          { movementId: "push-up", target: 9, values: [9, 9, 9] },
          {
            movementId: "squat",
            level: 0,
            target: start.squat!.target,
            steps: [logged(1), pending(), pending()],
          },
        ],
      }),
    );
    expect(progress["push-up"]!.tooHard).toStrictEqual([1, 0]);
    expect(progress.squat!.tooHard).toStrictEqual([1, 1]);
    expect(progress.squat!.suggestion).toBe(null);
    expect(progress["push-up"]!.suggestion).toBe(null);
  });

  it("a too hard suggestion can arise on a recovery day", () => {
    const start = base({ "push-up": { tooHard: [1] } });
    const { progress, changes } = evaluate(
      start,
      pushSteps(5, [logged(5), skipped("too-hard")], { dayType: "recovery" }),
    );
    expect(progress["push-up"]!.suggestion).toStrictEqual({
      kind: "easier",
      reason: "too-hard",
      createdOn: "2026-11-19",
    });
    expect(changes.map((c) => [c.kind, c.reason])).toStrictEqual([
      ["suggest-easier", "too-hard"],
    ]);
  });

  it("cool-downs drop by one per appearance, not below zero", () => {
    const start = base({
      "push-up": { cooldown: { harder: 2, easier: 0 } },
    });
    const { progress } = evaluate(
      start,
      pushSteps(9, [logged(9), skipped(), pending()]),
    );
    expect(progress["push-up"]!.cooldown).toStrictEqual({
      harder: 1,
      easier: 0,
    });
  });

  it("accepting a harder suggestion moves up a rung at the bottom of its range", () => {
    const { second } = twoAtTop();
    const before = deepFreeze(second.progress);
    const { progress, change } = resolveSuggestion(before, "push-up", true);
    seenChanges.push(change!);
    expect(progress["push-up"]).toStrictEqual({
      level: 4,
      sets: 3,
      target: 5,
      topStreak: 0,
      lowStreak: 0,
      tooHard: [],
      cooldown: { harder: 0, easier: 0 },
      suggestion: null,
    });
    expect(change).toStrictEqual({
      movementId: "push-up",
      kind: "level-up",
      reason: "accepted",
      sentence: "Moved to Diamond push-up, starting at 3 × 5 reps.",
    });
    sameIdentityExcept(before, progress, ["push-up"]);
  });

  it("accepting an easier suggestion moves down a rung at the middle of its range", () => {
    const easier: Suggestion = {
      kind: "easier",
      reason: "below-range",
      createdOn: "2026-11-18",
    };
    const { progress, change } = resolve(
      base({ "push-up": { suggestion: easier } }),
      "push-up",
      true,
    );
    expect(progress["push-up"]!.level).toBe(2);
    expect(progress["push-up"]!.target).toBe(10);
    expect(progress["push-up"]!.suggestion).toBe(null);
    expect(change!.kind).toBe("level-down");
    expect(change!.reason).toBe("accepted");
    expect(change!.sentence).toBe(
      "Moved to Knee push-up, starting at 3 × 10 reps.",
    );
  });

  it("a declined harder suggestion returns only on the fourth appearance", () => {
    const { second } = twoAtTop();
    const declined = resolve(second.progress, "push-up", false);
    expect(declined.progress["push-up"]!.cooldown.harder).toBe(3);
    expect(declined.progress["push-up"]!.topStreak).toBe(0);
    expect(declined.progress["push-up"]!.suggestion).toBe(null);
    expect(declined.change).toStrictEqual({
      movementId: "push-up",
      kind: "declined",
      reason: "user",
      sentence:
        "Staying on Push-up. The app will not ask again for a few sessions.",
    });
    let progress = declined.progress;
    for (let i = 1; i <= 4; i += 1) {
      ({ progress } = evaluate(
        progress,
        push(15, [15, 15, 15, 15], { exercise: { plannedSets: 4 } }),
      ));
      if (i < 4) {
        expect(progress["push-up"]!.suggestion, `appearance ${i}`).toBe(null);
      }
    }
    expect(progress["push-up"]!.suggestion!.kind).toBe("harder");
  });

  it("declining an easier suggestion clears the low streak and the too hard window", () => {
    const easier: Suggestion = {
      kind: "easier",
      reason: "too-hard",
      createdOn: "2026-11-18",
    };
    const start = base({
      "push-up": { suggestion: easier, lowStreak: 2, tooHard: [1, 0, 1] },
    });
    const { progress, change } = resolve(start, "push-up", false);
    expect(progress["push-up"]!.cooldown.easier).toBe(3);
    expect(progress["push-up"]!.lowStreak).toBe(0);
    expect(progress["push-up"]!.tooHard).toStrictEqual([]);
    expect(progress["push-up"]!.suggestion).toBe(null);
    expect(change!.kind).toBe("declined");
  });

  it("resolving with nothing pending returns the same progress", () => {
    const start = deepFreeze(base());
    const result = resolveSuggestion(start, "push-up", true);
    expect(result.progress).toBe(start);
    expect(result.change).toBe(null);
    expect(resolveSuggestion(start, "nope", false).progress).toBe(start);
  });

  it("setLevel moves to any rung at the bottom of its range and resets the rest", () => {
    const start = deepFreeze(
      base({
        "push-up": {
          topStreak: 1,
          lowStreak: 1,
          tooHard: [1],
          cooldown: { harder: 2, easier: 1 },
          suggestion: {
            kind: "harder",
            reason: "top-of-range",
            createdOn: "2026-11-18",
          },
        },
      }),
    );
    const progress = setLevel(start, "push-up", 6);
    expect(progress["push-up"]).toStrictEqual({
      level: 6,
      sets: 3,
      target: 4,
      topStreak: 0,
      lowStreak: 0,
      tooHard: [],
      cooldown: { harder: 0, easier: 0 },
      suggestion: null,
    });
    sameIdentityExcept(start, progress, ["push-up"]);
    expect(setLevel(start, "push-up", 99)).toBe(start);
    expect(setLevel(start, "push-up", -1)).toBe(start);
    expect(setLevel(start, "nope", 1)).toBe(start);
  });

  it("a record whose level differs from the entry leaves the entry untouched", () => {
    const start = deepFreeze(base());
    const rec = deepFreeze(
      record({
        exercises: [
          { movementId: "push-up", level: 2, target: 9, values: [9, 9, 9] },
        ],
      }),
    );
    const { progress, changes } = evaluateSession(start, rec);
    expect(progress["push-up"]).toBe(start["push-up"]);
    expect(changes).toStrictEqual([]);
  });

  it("a record naming an unknown movement is ignored", () => {
    const start = deepFreeze(base());
    const rec = deepFreeze(
      record({
        exercises: [
          { movementId: "nope", target: 9, values: [9, 9, 9] },
          { movementId: "push-up", target: 9, values: [9, 9, 9] },
        ],
      }),
    );
    const { progress } = evaluateSession(start, rec);
    expect(progress.nope).toBe(undefined);
    expect(progress["push-up"]!.target).toBe(11);
  });

  it("changes follow exercise order", () => {
    const start = base({ squat: { sets: 3 } });
    const squatTarget = start.squat!.target;
    const { changes } = evaluate(
      start,
      record({
        exercises: [
          {
            movementId: "squat",
            level: 0,
            target: squatTarget,
            values: Array<number>(3).fill(squatTarget),
          },
          { movementId: "push-up", target: 9, values: [9, 9, 9] },
        ],
      }),
    );
    expect(changes.map((c) => c.movementId)).toStrictEqual([
      "squat",
      "push-up",
    ]);
  });

  it("suggestionText repeats the sentence that created the suggestion", () => {
    const harder = twoAtTop().second;
    const below = twoBelow(3).second;
    let tooHard = base({ "push-up": { tooHard: [1] } });
    const made = evaluate(
      tooHard,
      pushSteps(9, [skipped("too-hard"), logged(9), logged(9)]),
    );
    tooHard = made.progress;
    const cases: [ProgressMap, Change[]][] = [
      [harder.progress, harder.changes],
      [below.progress, below.changes],
      [tooHard, made.changes],
    ];
    for (const [progress, changes] of cases) {
      const created = changes.find((c) => c.kind.startsWith("suggest-"))!;
      expect(suggestionText("push-up", progress["push-up"])).toBe(
        created.sentence,
      );
    }
    expect(suggestionText("push-up", base()["push-up"])).toBe(null);
  });

  it("every change explains itself with a variation name and known codes", () => {
    expect(seenChanges.length > 20).toBeTruthy();
    const names = new Set(
      ["push-up", "lunge", "squat", "plank"]
        .flatMap((id) =>
          [0, 1, 2, 3, 4, 5, 6, 7].map((l) => variationAt(id, l)?.name),
        )
        .filter(Boolean),
    );
    for (const change of seenChanges) {
      expect(KINDS.includes(change.kind), change.kind).toBeTruthy();
      expect(
        CHANGE_REASONS.includes(change.reason),
        change.reason,
      ).toBeTruthy();
      expect(change.sentence.length > 0).toBeTruthy();
      expect(
        [...names].some((name) => change.sentence.includes(name!)),
        change.sentence,
      ).toBeTruthy();
    }
  });
});
