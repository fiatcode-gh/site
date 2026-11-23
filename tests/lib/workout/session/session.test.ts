import { describe, expect, it } from "vitest";
import type { SessionAction } from "../../../../src/lib/tools/workout/session/session";
import {
  REST_ADD_MS,
  REST_MAX_MS,
  createSession,
  currentExercise,
  currentStep,
  holdElapsedMs,
  loggedCount,
  nextUp,
  position,
  reduce,
  restRemainingMs,
  restoreSession,
  toRecord,
  transitionCue,
} from "../../../../src/lib/tools/workout/session/session";
import type {
  Plan,
  SessionState,
} from "../../../../src/lib/tools/workout/types";

const T = 1763550000000;
const TODAY = "2026-11-19";

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

const PLAN: Plan = deepFreeze({
  dateKey: TODAY,
  dayType: "training",
  exercises: [
    {
      movementId: "push-up",
      pattern: "push",
      level: 3,
      variationId: "push-up",
      type: "reps",
      perSide: false,
      sets: 2,
      target: 9,
      restSeconds: 60,
    },
    {
      movementId: "side-plank",
      pattern: "core",
      level: 1,
      variationId: "side-plank",
      type: "hold",
      perSide: true,
      sets: 1,
      target: 20,
      restSeconds: 60,
    },
    {
      movementId: "plank",
      pattern: "core",
      level: 1,
      variationId: "forearm-plank",
      type: "hold",
      perSide: false,
      sets: 1,
      target: 30,
      restSeconds: 60,
    },
  ],
  estimateSeconds: 600,
  capSeconds: 2400,
  trimmed: false,
});

function assertRoundTrip(state: unknown): void {
  expect(JSON.parse(JSON.stringify(state))).toStrictEqual(state);
}

function start(): SessionState {
  const state = deepFreeze(createSession(PLAN, { now: T }));
  assertRoundTrip(state);
  return state;
}

function step(state: SessionState, action: SessionAction): SessionState {
  const next = deepFreeze(reduce(state, action));
  assertRoundTrip(next);
  return next;
}

function walk(state: SessionState, ...actions: SessionAction[]): SessionState {
  return actions.reduce(step, state);
}

const logReps = (at: number, value = 9, today = TODAY): SessionAction => ({
  type: "log",
  at,
  today,
  value,
});
const logHold = (at: number, today = TODAY): SessionAction => ({
  type: "log",
  at,
  today,
});

// Logs both push-up sets with rest, landing in work on the left side plank (step 2) at T + 200 s.
function atSidePlank(): SessionState {
  return walk(
    start(),
    logReps(T),
    { type: "skipRest", at: T + 100000 },
    logReps(T + 150000),
    { type: "skipRest", at: T + 200000 },
  );
}

// Logs everything up to the plank (step 4), landing in work there at T + 400 s.
function atPlank(): SessionState {
  return walk(
    atSidePlank(),
    { type: "startHold", at: T + 200000 },
    logHold(T + 220000),
    { type: "startHold", at: T + 230000 },
    logHold(T + 250000),
    { type: "skipRest", at: T + 400000 },
  );
}

function summaryState(): SessionState {
  return walk(
    start(),
    logReps(T),
    { type: "skipRest", at: T + 1000 },
    { type: "skip", at: T + 2000, reasons: [] },
    { type: "end", at: T + 3000, reasons: [] },
  );
}

describe("workout/session/session", () => {
  it("rest constants", () => {
    expect(REST_ADD_MS).toBe(15000);
    expect(REST_MAX_MS).toBe(600000);
  });

  it("createSession expands sets and sides into pending steps", () => {
    const state = start();
    expect(state.id).toBe(`${TODAY}T${T}`);
    expect(state.date).toBe(TODAY);
    expect(state.dayType).toBe("training");
    expect(state.startedAt).toBe(T);
    expect(
      state.steps.map((s) => [s.exerciseIndex, s.setNumber, s.side]),
    ).toStrictEqual([
      [0, 1, null],
      [0, 2, null],
      [1, 1, "left"],
      [1, 1, "right"],
      [2, 1, null],
    ]);
    for (const s of state.steps) {
      expect({
        status: s.status,
        value: s.value,
        loggedOn: s.loggedOn,
        reasons: s.reasons,
      }).toStrictEqual({
        status: "pending",
        value: null,
        loggedOn: null,
        reasons: [],
      });
    }
    expect(state.exercises[0]).toStrictEqual({
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
    });
    expect(state.exercises[1]!.movementName).toBe("Side plank");
    expect(state.exercises[2]!.movementName).toBe("Plank");
    expect(state.exercises[2]!.variationName).toBe("Forearm plank");
    expect(state.cursor).toBe(0);
    expect(state.phase).toBe("work");
    expect(state.paused).toBe(false);
    expect(state.holdStarted).toBe(false);
    expect(state.hold).toStrictEqual({ accumulatedMs: 0, runningSince: null });
    expect(state.rest).toBe(null);
    expect(state.endedEarly).toBe(false);
    expect(state.endReasons).toStrictEqual([]);
    expect(state.endMovementId).toBe(null);
    expect(currentStep(state)).toStrictEqual(state.steps[0]);
    expect(currentExercise(state).movementId).toBe("push-up");
  });

  it("one-tap log records the target and starts the rest", () => {
    const state = step(start(), logReps(T));
    expect(state.steps[0]).toStrictEqual({
      exerciseIndex: 0,
      setNumber: 1,
      side: null,
      status: "logged",
      value: 9,
      loggedOn: TODAY,
      reasons: [],
    });
    expect(state.phase).toBe("rest");
    expect(state.cursor).toBe(0);
    expect(restRemainingMs(state, T)).toBe(60000);
    expect(loggedCount(state)).toBe(1);
  });

  it("an edited log stores the edited value", () => {
    expect(step(start(), logReps(T, 7)).steps[0]!.value).toBe(7);
  });

  it("invalid rep values and a missing date are ignored", () => {
    const state = start();
    for (const value of [0, 1000, 2.5, "9"]) {
      expect(reduce(state, logReps(T, value as never))).toBe(state);
    }
    expect(reduce(state, { type: "log", at: T, value: 9 } as never)).toBe(
      state,
    );
    expect(reduce(state, logReps(T, 9, "2026-02-30"))).toBe(state);
  });

  it("rest advances by itself when its time is up", () => {
    const resting = step(start(), logReps(T));
    expect(reduce(resting, { type: "tick", at: T + 59999 })).toBe(resting);
    const working = step(resting, { type: "tick", at: T + 60000 });
    expect(working.phase).toBe("work");
    expect(working.cursor).toBe(1);
    expect(working.rest).toBe(null);
    expect(transitionCue(resting, working)).toBe("rest-end");
  });

  it("addRest extends the rest and is capped", () => {
    const longer = step(step(start(), logReps(T)), { type: "addRest" });
    expect(longer.rest!.durationMs).toBe(75000);
    expect(reduce(longer, { type: "tick", at: T + 60000 })).toBe(longer);
    expect(step(longer, { type: "tick", at: T + 75000 }).phase).toBe("work");
    let capped = longer;
    for (let i = 0; i < 40; i += 1) capped = step(capped, { type: "addRest" });
    expect(capped.rest!.durationMs).toBe(REST_MAX_MS);
  });

  it("skipRest advances at once", () => {
    const working = step(step(start(), logReps(T)), {
      type: "skipRest",
      at: T + 1,
    });
    expect(working.phase).toBe("work");
    expect(working.cursor).toBe(1);
  });

  it("pausing in rest freezes the countdown", () => {
    const paused = walk(start(), logReps(T), { type: "pause", at: T + 20000 });
    expect(paused.paused).toBe(true);
    expect(reduce(paused, { type: "tick", at: T + 400000 })).toBe(paused);
    expect(restRemainingMs(paused, T + 320000)).toBe(40000);
    const resumed = step(paused, { type: "resume", at: T + 320000 });
    expect(resumed.paused).toBe(false);
    expect(restRemainingMs(resumed, T + 320000)).toBe(40000);
    expect(reduce(resumed, { type: "tick", at: T + 359999 })).toBe(resumed);
    expect(step(resumed, { type: "tick", at: T + 360000 }).phase).toBe("work");
  });

  it("a hold counts wall-clock time across pause and resume", () => {
    const ready = atPlank();
    expect(reduce(ready, logHold(T + 500000))).toBe(ready);
    const t = T + 500000;
    const held = step(ready, { type: "startHold", at: t });
    expect(held.holdStarted).toBe(true);
    expect(reduce(held, { type: "startHold", at: t + 1000 })).toBe(held);
    const paused = step(held, { type: "pause", at: t + 7000 });
    expect(holdElapsedMs(paused, t + 30000)).toBe(7000);
    const resumed = step(paused, { type: "resume", at: t + 60000 });
    expect(holdElapsedMs(resumed, t + 60000)).toBe(7000);
    const logged = step(resumed, {
      type: "log",
      at: t + 65000,
      today: TODAY,
      value: 99,
    });
    expect(logged.steps[4]!.value).toBe(12);
    expect(logged.steps[4]!.status).toBe("logged");
  });

  it("a hold past its target stays in work until logged", () => {
    const held = step(atPlank(), { type: "startHold", at: T + 500000 });
    const late = T + 500000 + 120000;
    expect(reduce(held, { type: "tick", at: late })).toBe(held);
    expect(held.phase).toBe("work");
    expect(holdElapsedMs(held, late)).toBe(120000);
  });

  it("a hold value is capped at an hour", () => {
    const held = step(atPlank(), { type: "startHold", at: T });
    expect(step(held, logHold(T + 5000000)).steps[4]!.value).toBe(3600);
  });

  it("a hold under one second is not logged", () => {
    const held = step(atPlank(), { type: "startHold", at: T + 500000 });
    expect(reduce(held, logHold(T + 500999))).toBe(held);
  });

  it("per side: left goes straight to right, right starts a rest", () => {
    const left = step(atSidePlank(), { type: "startHold", at: T + 200000 });
    expect(nextUp(left)).toStrictEqual({ kind: "side", stepIndex: 3 });
    const right = step(left, logHold(T + 220000));
    expect(right.steps[2]!.value).toBe(20);
    expect(right.phase).toBe("work");
    expect(right.cursor).toBe(3);
    expect(right.rest).toBe(null);
    expect(right.holdStarted).toBe(false);
    expect(right.hold).toStrictEqual({ accumulatedMs: 0, runningSince: null });
    expect(transitionCue(left, right)).toBe("set-start");
    const rest = walk(
      right,
      { type: "startHold", at: T + 230000 },
      logHold(T + 250000),
    );
    expect(rest.phase).toBe("rest");
    expect(rest.cursor).toBe(3);
  });

  it("skip marks the step skipped with sanitised reasons and moves on without rest", () => {
    const state = step(start(), {
      type: "skip",
      at: T,
      reasons: ["too-hard", "pain", "bogus", "pain"] as never,
    });
    expect(state.steps[0]).toStrictEqual({
      exerciseIndex: 0,
      setNumber: 1,
      side: null,
      status: "skipped",
      value: null,
      loggedOn: null,
      reasons: ["too-hard", "pain"],
    });
    expect(state.phase).toBe("work");
    expect(state.cursor).toBe(1);
    expect(state.rest).toBe(null);
    expect(
      step(start(), { type: "skip", at: T } as never).steps[0]!.reasons.length,
    ).toBe(0);
  });

  it("skipping the left side also skips the right side", () => {
    const state = step(atSidePlank(), {
      type: "skip",
      at: T + 210000,
      reasons: [],
    });
    expect(state.steps[2]!.status).toBe("skipped");
    expect(state.steps[3]!.status).toBe("skipped");
    expect(state.cursor).toBe(4);
    expect(state.phase).toBe("work");
  });

  it("skipping the right side leaves the logged left side alone", () => {
    const state = walk(
      atSidePlank(),
      { type: "startHold", at: T + 200000 },
      logHold(T + 220000),
      { type: "skip", at: T + 230000, reasons: ["pain"] },
    );
    expect(state.steps[2]!.status).toBe("logged");
    expect(state.steps[2]!.value).toBe(20);
    expect(state.steps[3]!.status).toBe("skipped");
    expect(state.cursor).toBe(4);
  });

  it("while paused only resume and end apply", () => {
    const inWork = step(atSidePlank(), { type: "pause", at: T + 201000 });
    const inRest = walk(start(), logReps(T), { type: "pause", at: T + 1000 });
    for (const paused of [inWork, inRest]) {
      const actions: SessionAction[] = [
        logReps(T + 2000),
        logHold(T + 2000),
        { type: "skip", at: T + 2000, reasons: [] },
        { type: "startHold", at: T + 2000 },
        { type: "skipRest", at: T + 2000 },
        { type: "addRest" },
        { type: "tick", at: T + 900000 },
        { type: "pause", at: T + 2000 },
      ];
      for (const action of actions) {
        expect(reduce(paused, action)).toBe(paused);
      }
    }
  });

  it("resume does not apply when not paused", () => {
    const state = start();
    expect(reduce(state, { type: "resume", at: T })).toBe(state);
  });

  it("rest-only actions do not apply in work and work actions do not apply in rest", () => {
    const working = start();
    const restOnly: SessionAction[] = [
      { type: "tick", at: T + 900000 },
      { type: "skipRest", at: T },
      { type: "addRest" },
    ];
    for (const action of restOnly) {
      expect(reduce(working, action)).toBe(working);
    }
    const resting = step(start(), logReps(T));
    const workOnly: SessionAction[] = [
      logReps(T + 1),
      { type: "skip", at: T + 1 } as never,
      { type: "startHold", at: T + 1 },
    ];
    for (const action of workOnly) {
      expect(reduce(resting, action)).toBe(resting);
    }
    expect(reduce(working, { type: "startHold", at: T })).toBe(working);
    expect(reduce(working, { type: "unknown" } as never)).toBe(working);
  });

  it("logging the last step ends the session", () => {
    const ready = step(atPlank(), { type: "startHold", at: T + 500000 });
    const done = step(ready, logHold(T + 530000));
    expect(done.phase).toBe("summary");
    expect(done.rest).toBe(null);
    expect(done.holdStarted).toBe(false);
    expect(done.hold).toStrictEqual({ accumulatedMs: 0, runningSince: null });
    expect(done.endedEarly).toBe(false);
    expect(transitionCue(ready, done)).toBe("session-end");
    expect(nextUp(done)).toBe(null);
    expect(loggedCount(done)).toBe(5);
    const actions: SessionAction[] = [
      logReps(T + 600000),
      { type: "skip", at: T + 600000 } as never,
      { type: "pause", at: T + 600000 },
      { type: "end", at: T + 600000, reasons: [] },
    ];
    for (const action of actions) {
      expect(reduce(done, action)).toBe(done);
    }
  });

  it("end from work stores reasons and keeps later steps pending", () => {
    const state = step(atSidePlank(), {
      type: "end",
      at: T + 210000,
      reasons: ["no-time", "nope", "no-time"] as never,
    });
    expect(state.phase).toBe("summary");
    expect(state.endedEarly).toBe(true);
    expect(state.endReasons).toStrictEqual(["no-time"]);
    expect(state.endMovementId).toBe("side-plank");
    expect(state.paused).toBe(false);
    expect(state.rest).toBe(null);
    expect(state.steps.slice(2).map((s) => s.status)).toStrictEqual([
      "pending",
      "pending",
      "pending",
    ]);
  });

  it("end during rest names the movement just finished", () => {
    const state = walk(start(), logReps(T), {
      type: "end",
      at: T + 1000,
      reasons: ["pain"],
    });
    expect(state.endMovementId).toBe("push-up");
    expect(state.rest).toBe(null);
    expect(state.steps[1]!.status).toBe("pending");
  });

  it("end while paused works and stops every watch", () => {
    const state = walk(
      atPlank(),
      { type: "startHold", at: T + 500000 },
      { type: "pause", at: T + 505000 },
      { type: "end", at: T + 600000, reasons: [] },
    );
    expect(state.phase).toBe("summary");
    expect(state.paused).toBe(false);
    expect(state.endedEarly).toBe(true);
    expect(state.endMovementId).toBe("plank");
    expect(state.hold.runningSince).toBe(null);
    expect(state.steps[4]!.status).toBe("pending");
  });

  it("correct changes a logged value in the summary only", () => {
    const summary = summaryState();
    const corrected = step(summary, {
      type: "correct",
      stepIndex: 0,
      value: 12,
    });
    expect(corrected.steps[0]!.value).toBe(12);
    expect(corrected.steps[0]!.loggedOn).toBe(TODAY);
    expect(corrected.steps[0]!.status).toBe("logged");
    const actions: SessionAction[] = [
      { type: "correct", stepIndex: 1, value: 5 },
      { type: "correct", stepIndex: 2, value: 5 },
      { type: "correct", stepIndex: 0, value: 0 },
      { type: "correct", stepIndex: 0, value: 1000 },
      { type: "correct", stepIndex: 0, value: 4.5 },
      { type: "correct", stepIndex: 9, value: 5 },
    ];
    for (const action of actions) {
      expect(reduce(summary, action)).toBe(summary);
    }
    const resting = step(start(), logReps(T));
    expect(reduce(resting, { type: "correct", stepIndex: 0, value: 5 })).toBe(
      resting,
    );
  });

  it("correct allows up to an hour on a hold step", () => {
    const done = walk(
      atPlank(),
      { type: "startHold", at: T + 500000 },
      logHold(T + 530000),
    );
    expect(
      step(done, { type: "correct", stepIndex: 4, value: 3600 }).steps[4]!
        .value,
    ).toBe(3600);
    expect(reduce(done, { type: "correct", stepIndex: 4, value: 3601 })).toBe(
      done,
    );
    expect(reduce(done, { type: "correct", stepIndex: 0, value: 1000 })).toBe(
      done,
    );
  });

  it("position and nextUp follow the cursor", () => {
    const first = start();
    expect(position(first)).toStrictEqual({
      stepNumber: 1,
      stepCount: 5,
      exerciseNumber: 1,
      exerciseCount: 3,
      setNumber: 1,
      setCount: 2,
    });
    expect(nextUp(first)).toStrictEqual({ kind: "set", stepIndex: 1 });
    const mid = step(first, { type: "skip", at: T, reasons: [] });
    expect(position(mid)).toStrictEqual({
      stepNumber: 2,
      stepCount: 5,
      exerciseNumber: 1,
      exerciseCount: 3,
      setNumber: 2,
      setCount: 2,
    });
    expect(nextUp(mid)).toStrictEqual({ kind: "exercise", stepIndex: 2 });
    const last = atPlank();
    expect(position(last)).toStrictEqual({
      stepNumber: 5,
      stepCount: 5,
      exerciseNumber: 3,
      exerciseCount: 3,
      setNumber: 1,
      setCount: 1,
    });
    expect(nextUp(last)).toStrictEqual({ kind: "finish", stepIndex: null });
  });

  it("steps logged after midnight keep their own date", () => {
    const state = walk(
      start(),
      logReps(T),
      { type: "skipRest", at: T + 1000 },
      logReps(T + 2000, 9, "2026-11-20"),
    );
    expect(state.steps[0]!.loggedOn).toBe("2026-11-19");
    expect(state.steps[1]!.loggedOn).toBe("2026-11-20");
    expect(state.date).toBe("2026-11-19");
  });

  it("restoreSession pauses and drops the open time segment", () => {
    const running = walk(
      atPlank(),
      { type: "startHold", at: T + 500000 },
      { type: "pause", at: T + 504000 },
      { type: "resume", at: T + 510000 },
    );
    const restored = deepFreeze(restoreSession(running));
    assertRoundTrip(restored);
    expect(restored.paused).toBe(true);
    expect(restored.hold).toStrictEqual({
      accumulatedMs: 4000,
      runningSince: null,
    });
    const resumed = step(restored, { type: "resume", at: T + 900000 });
    expect(holdElapsedMs(resumed, T + 906000)).toBe(10000);
    expect(step(resumed, logHold(T + 906000)).steps[4]!.value).toBe(10);
  });

  it("restoreSession freezes a running rest", () => {
    const resting = walk(
      start(),
      logReps(T),
      { type: "pause", at: T + 10000 },
      { type: "resume", at: T + 20000 },
    );
    const restored = restoreSession(resting);
    expect(restored.paused).toBe(true);
    expect(restored.rest!.watch).toStrictEqual({
      accumulatedMs: 10000,
      runningSince: null,
    });
    expect(restRemainingMs(restored, T + 999999)).toBe(50000);
  });

  it("restoreSession returns a summary as is", () => {
    const summary = summaryState();
    expect(restoreSession(summary)).toBe(summary);
  });

  it("restRemainingMs is never negative and zero outside rest", () => {
    const resting = step(start(), logReps(T));
    expect(restRemainingMs(resting, T + 999999)).toBe(0);
    expect(restRemainingMs(start(), T)).toBe(0);
  });

  it("transitionCue is null when nothing moved", () => {
    const state = start();
    const paused = step(state, { type: "pause", at: T });
    expect(transitionCue(state, paused)).toBe(null);
    expect(transitionCue(state, step(state, logReps(T)))).toBe(null);
  });

  it("toRecord keeps only the record fields", () => {
    const summary = summaryState();
    const record = toRecord(summary, { endedAt: T + 4000 });
    expect(Object.keys(record).sort()).toStrictEqual([
      "changes",
      "date",
      "dayType",
      "endMovementId",
      "endReasons",
      "endedAt",
      "endedEarly",
      "exercises",
      "id",
      "startedAt",
      "steps",
    ]);
    expect(record.endedAt).toBe(T + 4000);
    expect(record.changes).toStrictEqual([]);
    expect(record.steps).toStrictEqual(summary.steps);
    expect(record.id).toBe(summary.id);
    assertRoundTrip(record);
  });
});
