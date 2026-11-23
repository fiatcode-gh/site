import { describe, expect, it } from "vitest";
import {
  answerSuggestion,
  beginSession,
  chooseVariation,
  finishPlacement,
  previewSession,
  restoreOnLoad,
  saveSession,
  sessionAction,
  setMuted,
  setTimeCap,
  todayPlan,
} from "../../../../src/lib/tools/workout/app/actions";
import {
  MOVEMENTS,
  variationAt,
} from "../../../../src/lib/tools/workout/library/library";
import { placementProgress } from "../../../../src/lib/tools/workout/placement/placement";
import { createSession } from "../../../../src/lib/tools/workout/session/session";
import { defaultState } from "../../../../src/lib/tools/workout/storage/schema";
import type { AppState, Plan } from "../../../../src/lib/tools/workout/types";

const TODAY = "2026-11-19";
const NOW = 1_800_000_000_000;

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

function onboarded(): AppState {
  return deepFreeze(finishPlacement(defaultState(), null));
}

function planWith(
  movementId: string,
  level: number,
  sets: number,
  target: number,
): Plan {
  const v = variationAt(movementId, level)!;
  return {
    dateKey: TODAY,
    dayType: "training",
    exercises: [
      {
        movementId,
        pattern: "push",
        level,
        variationId: v.id,
        type: v.type,
        perSide: v.perSide,
        sets,
        target,
        restSeconds: 60,
      },
    ],
    estimateSeconds: 0,
    capSeconds: 2400,
    trimmed: false,
  };
}

function withSession(state: AppState, plan: Plan): AppState {
  return deepFreeze({
    ...state,
    activeSession: createSession(plan, { now: NOW }),
  });
}

function pushUpAt(target: number): AppState {
  const state = onboarded();
  const progress = {
    ...state.progress,
    "push-up": { ...state.progress["push-up"]!, level: 3, target },
  };
  return { ...state, progress };
}

function logReps(state: AppState, values: number[]): AppState {
  let next = state;
  values.forEach((value, i) => {
    const at = NOW + i * 1000;
    if (next.activeSession!.phase === "rest") {
      next = sessionAction(next, { type: "skipRest", at });
    }
    next = sessionAction(next, { type: "log", value, at, today: TODAY });
  });
  return deepFreeze(next);
}

function inSummary(values = [9, 9, 9]): AppState {
  return logReps(
    withSession(pushUpAt(9), planWith("push-up", 3, 3, 9)),
    values,
  );
}

describe("workout/app/actions", () => {
  it("finishPlacement with null onboards at the easiest variation of every movement", () => {
    const state = finishPlacement(deepFreeze(defaultState()), null);
    expect(state.onboarded).toBe(true);
    for (const m of MOVEMENTS)
      expect(state.progress[m.id]!.level, m.id).toBe(0);
  });

  it("finishPlacement with results uses the placement mapping", () => {
    const results = {
      push: 12,
      legs: 0,
      core: 100,
      back: null,
      conditioning: 30,
    };
    const state = finishPlacement(deepFreeze(defaultState()), results);
    expect(state.onboarded).toBe(true);
    expect(state.progress).toStrictEqual(placementProgress(results));
    expect(state.progress["push-up"]!.level).toBe(3);
    expect(state.progress.plank!.level).toBe(3);
    expect(state.progress.squat!.level).toBe(0);
  });

  it("setTimeCap accepts whole multiples of 5 from 10 to 90 only", () => {
    const state = onboarded();
    for (const minutes of [10, 40, 90]) {
      expect(setTimeCap(state, minutes).settings.timeCapMinutes).toBe(minutes);
    }
    for (const minutes of [5, 95, 42, "40"]) {
      expect(setTimeCap(state, minutes as never)).toBe(state);
    }
  });

  it("setMuted stores the flag", () => {
    const state = onboarded();
    expect(setMuted(state, true).settings.muted).toBe(true);
    expect(setMuted(setMuted(state, true), false).settings.muted).toBe(false);
  });

  it("beginSession needs onboarding, no active session and an unfinished day", () => {
    const fresh = deepFreeze(defaultState());
    expect(beginSession(fresh, { today: TODAY, now: NOW })).toBe(fresh);

    const state = onboarded();
    const begun = deepFreeze(beginSession(state, { today: TODAY, now: NOW }));
    const plan = todayPlan(state, TODAY);
    expect(
      begun.activeSession!.exercises.map((e) => [
        e.variationId,
        e.plannedSets,
        e.target,
      ]),
    ).toStrictEqual(
      plan.exercises.map((e) => [e.variationId, e.sets, e.target]),
    );
    expect(begun.activeSession!.date).toBe(TODAY);
    expect(beginSession(begun, { today: TODAY, now: NOW + 1 })).toBe(begun);

    const done = deepFreeze(saveSession(inSummary(), { now: NOW + 60000 }));
    expect(beginSession(done, { today: TODAY, now: NOW + 70000 })).toBe(done);
  });

  it("sessionAction returns the same state when the action does not apply", () => {
    const state = withSession(onboarded(), planWith("push-up", 3, 3, 9));
    expect(sessionAction(state, { type: "skipRest", at: NOW })).toBe(state);
    const idle = onboarded();
    expect(sessionAction(idle, { type: "pause", at: NOW })).toBe(idle);
  });

  it("saveSession outside the summary returns the same state", () => {
    const state = withSession(onboarded(), planWith("push-up", 3, 3, 9));
    expect(saveSession(state, { now: NOW })).toBe(state);
    expect(previewSession(state, { now: NOW })).toBe(null);
    const idle = onboarded();
    expect(saveSession(idle, { now: NOW })).toBe(idle);
  });

  it("saveSession applies exactly the preview", () => {
    const state = inSummary();
    const preview = previewSession(state, { now: NOW + 60000 })!;
    const saved = saveSession(state, { now: NOW + 60000 });
    expect(saved.history.length).toBe(1);
    expect(saved.history[0]).toStrictEqual({
      ...preview.record,
      changes: preview.changes,
    });
    expect(saved.history[0]!.endedAt).toBe(NOW + 60000);
    expect(saved.progress).toStrictEqual(preview.progress);
    expect(saved.activeSession).toBe(null);
  });

  it("correcting a value in the summary changes the previewed changes", () => {
    const state = inSummary();
    const rise = previewSession(state, { now: NOW })!;
    expect(rise.changes.map((c) => c.kind)).toStrictEqual(["target-up"]);
    expect(rise.progress["push-up"]!.target > 9).toBeTruthy();

    const corrected = sessionAction(state, {
      type: "correct",
      stepIndex: 2,
      value: 3,
    });
    const after = previewSession(corrected, { now: NOW })!;
    expect(!after.changes.some((c) => c.kind === "target-up")).toBeTruthy();
    expect(after.progress["push-up"]!.target <= 9).toBeTruthy();
  });

  it("answerSuggestion accepts or declines the pending suggestion", () => {
    const base = onboarded();
    const entry = {
      ...base.progress["push-up"]!,
      suggestion: {
        kind: "harder" as const,
        reason: "top-of-range" as const,
        createdOn: TODAY,
      },
    };
    const state = deepFreeze({
      ...base,
      progress: { ...base.progress, "push-up": entry },
    });

    const accepted = answerSuggestion(state, "push-up", true);
    expect(accepted.progress["push-up"]!.level).toBe(1);
    expect(accepted.progress["push-up"]!.suggestion).toBe(null);

    const declined = answerSuggestion(state, "push-up", false);
    expect(declined.progress["push-up"]!.level).toBe(0);
    expect(declined.progress["push-up"]!.suggestion).toBe(null);
    expect(declined.progress["push-up"]!.cooldown.harder > 0).toBeTruthy();

    expect(answerSuggestion(base, "push-up", true)).toBe(base);
  });

  it("chooseVariation resets only that movement's entry", () => {
    const state = onboarded();
    const next = chooseVariation(state, "squat", 2);
    expect(next.progress.squat!.level).toBe(2);
    expect(next.progress.squat!.target).toBe(variationAt("squat", 2)!.min);
    for (const m of MOVEMENTS.filter((x) => x.id !== "squat")) {
      expect(next.progress[m.id], m.id).toBe(state.progress[m.id]);
    }
    expect(chooseVariation(state, "squat", 99)).toBe(state);
  });

  it("restoreOnLoad pauses an active session and drops the running hold segment", () => {
    const state = withSession(
      onboarded(),
      planWith("plank", 0, 3, variationAt("plank", 0)!.min),
    );
    const holding = deepFreeze(
      sessionAction(state, { type: "startHold", at: NOW }),
    );
    const restored = restoreOnLoad(holding);
    expect(restored.activeSession!.paused).toBe(true);
    expect(restored.activeSession!.hold.runningSince).toBe(null);

    const idle = onboarded();
    expect(restoreOnLoad(idle)).toBe(idle);
  });

  it("no action mutates its input", () => {
    const state = onboarded();
    const summary = inSummary();
    expect(() => {
      finishPlacement(state, { push: 10 });
      setTimeCap(state, 25);
      setMuted(state, true);
      chooseVariation(state, "plank", 1);
      answerSuggestion(state, "plank", true);
      todayPlan(state, TODAY);
      beginSession(state, { today: TODAY, now: NOW });
      sessionAction(summary, { type: "correct", stepIndex: 0, value: 4 });
      previewSession(summary, { now: NOW });
      saveSession(summary, { now: NOW });
      restoreOnLoad(withSession(state, planWith("push-up", 3, 3, 9)));
    }).not.toThrow();
  });
});
