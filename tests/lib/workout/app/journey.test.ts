import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  answerSuggestion,
  beginSession,
  chooseVariation,
  finishPlacement,
  saveSession,
  sessionAction,
  setTimeCap,
  todayPlan,
} from "../../../../src/lib/tools/workout/app/actions";
import { createAppStore } from "../../../../src/lib/tools/workout/app/app-store";
import {
  buildBackup,
  parseBackup,
} from "../../../../src/lib/tools/workout/backup/backup";
import { addDays, weekday } from "../../../../src/lib/tools/workout/core/dates";
import {
  MOVEMENTS,
  variationAt,
} from "../../../../src/lib/tools/workout/library/library";
import { PATTERNS } from "../../../../src/lib/tools/workout/library/patterns";
import type { PlacementResults } from "../../../../src/lib/tools/workout/placement/placement";
import { RECOVERY_SETS } from "../../../../src/lib/tools/workout/planner/planner";
import {
  STORAGE_KEY,
  defaultState,
} from "../../../../src/lib/tools/workout/storage/schema";
import { createStore } from "../../../../src/lib/tools/workout/storage/store";
import {
  activeDays,
  currentStreak,
  todayStatus,
  weekStrip,
} from "../../../../src/lib/tools/workout/tracking/tracking";
import type {
  AppState,
  DateKey,
  PlanExercise,
  Progress,
} from "../../../../src/lib/tools/workout/types";
import {
  buildDemoState,
  driveSession,
  simulateDay,
  simulateDays,
  startOf,
} from "../support/simulate";

const START = "2026-11-19";
const EVIDENCE_FIELDS: (keyof Progress)[] = [
  "level",
  "sets",
  "target",
  "topStreak",
  "lowStreak",
];
const FIXTURE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "standalone-backup-1757a98.json.txt",
);

function placed(results: PlacementResults = null): AppState {
  return setTimeCap(finishPlacement(defaultState(), results), 90);
}

const streakOn = (state: AppState, day: DateKey) =>
  currentStreak(activeDays(state), day);

let longRun: AppState | undefined;
function seventyDays(): AppState {
  longRun ??= simulateDays(placed(), START, 70);
  return longRun;
}

function nextTrainingPlanWith(
  state: AppState,
  from: DateKey,
  movementId: string,
): PlanExercise {
  for (let i = 0; i < 30; i += 1) {
    const plan = todayPlan(state, addDays(from, i));
    const exercise = plan.exercises.find((e) => e.movementId === movementId);
    if (plan.dayType === "training" && exercise) return exercise;
  }
  throw new Error(`no plan with ${movementId}`);
}

function untilPushUpSuggested(
  state: AppState,
  from: DateKey,
): { state: AppState; day: DateKey } {
  const keepPushUp = { accept: (id: string) => id !== "push-up" };
  let next = state;
  for (let i = 0; i < 200; i += 1) {
    next = simulateDay(next, addDays(from, i), keepPushUp);
    if (next.progress["push-up"]!.suggestion?.kind === "harder") {
      return { state: next, day: addDays(from, i + 1) };
    }
  }
  throw new Error("push-up never reached a harder suggestion");
}

function fakeStorage() {
  const items = new Map<string, string>();
  return {
    items,
    getItem(key: string): string | null {
      return items.has(key) ? items.get(key)! : null;
    },
    setItem(key: string, value: string) {
      items.set(key, String(value));
    },
    removeItem(key: string) {
      items.delete(key);
    },
  };
}

describe("workout/app/journey", () => {
  it("70 days of meeting every target follow the rhythm and keep progressing", () => {
    const state = seventyDays();
    expect(state.history.length).toBe(70);
    for (const record of state.history) {
      const patterns = record.exercises.map((e) => e.pattern);
      const recoveryWeekday = [0, 3].includes(weekday(record.date));
      expect(record.dayType === "recovery", record.date).toBe(recoveryWeekday);
      if (record.dayType === "training") {
        expect(patterns, record.date).toStrictEqual(PATTERNS);
      } else {
        expect(patterns, record.date).toStrictEqual([
          "push",
          "legs",
          "core",
          "back",
        ]);
        expect(
          record.exercises.every((e) => e.plannedSets === RECOVERY_SETS),
          record.date,
        ).toBeTruthy();
        expect(record.changes, record.date).toStrictEqual([]);
      }
    }
    expect(streakOn(state, addDays(START, 69))).toBe(70);
    for (const m of MOVEMENTS) {
      expect(state.progress[m.id]!.level >= 1, m.id).toBeTruthy();
    }
    const distinct = new Set(
      state.history
        .slice(0, 28)
        .map((r) => r.exercises.map((e) => e.variationId).join("|")),
    );
    expect(distinct.size >= 20, `${distinct.size}`).toBeTruthy();
  });

  it("the plan is stable for a day and follows the cap and chosen variations", () => {
    const state = seventyDays();
    const day = addDays(START, 70);
    const plan = todayPlan(state, day);
    expect(todayPlan(state, day)).toStrictEqual(plan);

    const short = todayPlan(setTimeCap(state, 10), day);
    expect(
      short.estimateSeconds <= 600,
      `${short.estimateSeconds}`,
    ).toBeTruthy();
    expect(short).not.toStrictEqual(plan);

    const { movementId, level } = plan.exercises[0]!;
    const other = variationAt(movementId, level + 1) ? level + 1 : level - 1;
    expect(
      todayPlan(chooseVariation(state, movementId, other), day),
    ).not.toStrictEqual(plan);
  });

  it("14 days of skipping every step change nothing and count no day", () => {
    const start = placed();
    let state = start;
    for (let i = 0; i < 14; i += 1) {
      const day = addDays(START, i);
      state = simulateDay(state, day, { behaviour: () => "skip" });
      expect(state.history.length).toBe(i + 1);
      expect(todayStatus(state, day), day).toBe("not-started");
    }
    for (const m of MOVEMENTS) {
      for (const field of EVIDENCE_FIELDS) {
        expect(state.progress[m.id]![field], `${m.id} ${field}`).toBe(
          start.progress[m.id]![field],
        );
      }
    }
    expect(streakOn(state, addDays(START, 13))).toBe(0);
  });

  it("a week of clearly short sessions only lowers the work", () => {
    const start = placed({
      push: 14,
      legs: 35,
      core: 70,
      back: 45,
      conditioning: 15,
    });
    const state = simulateDays(start, START, 7, {
      behaviour: "short",
      accept: () => false,
    });
    let lowered = 0;
    for (const m of MOVEMENTS) {
      const before = start.progress[m.id]!;
      const after = state.progress[m.id]!;
      expect(after.target <= before.target, m.id).toBeTruthy();
      expect(after.sets <= before.sets, m.id).toBeTruthy();
      if (after.target < before.target) lowered += 1;
    }
    expect(lowered >= 1).toBeTruthy();
  });

  it("ending early with one logged set counts the day", () => {
    const now = startOf(START);
    const begun = beginSession(placed(), { today: START, now });
    const driven = driveSession(begun, { at: now, today: START, steps: 1 });
    const ended = sessionAction(driven.state, {
      type: "end",
      reasons: ["no-time"],
      at: driven.at,
    });
    const state = saveSession(ended, { now: driven.at + 1000 });
    expect(activeDays(state).has(START)).toBeTruthy();
    expect(todayStatus(state, START)).toBe("done");
    expect(beginSession(state, { today: START, now: now + 5000 })).toBe(state);
  });

  it("ending early with nothing logged keeps the reasons and leaves Start available", () => {
    const now = startOf(START);
    const begun = beginSession(placed(), { today: START, now });
    const ended = sessionAction(begun, {
      type: "end",
      reasons: ["not-feeling-it"],
      at: now + 1,
    });
    const state = saveSession(ended, { now: now + 2 });
    expect(activeDays(state).has(START)).toBe(false);
    expect(todayStatus(state, START)).toBe("not-started");
    expect(state.history.at(-1)!.endReasons).toStrictEqual(["not-feeling-it"]);
    const again = beginSession(state, { today: START, now: now + 3 });
    expect(again).not.toBe(state);
    expect(again.activeSession!.date).toBe(START);
  });

  it("a gap breaks the streak", () => {
    const day = (n: number) => addDays(START, n - 1);
    const state = simulateDays(placed(), day(1), 6, (_, i) => ({
      behaviour: i === 3 ? "none" : "meet",
    }));
    expect(streakOn(state, day(6))).toBe(2);
    expect(streakOn(state, day(7))).toBe(2);
    expect(streakOn(state, day(8))).toBe(0);
  });

  it("a session across midnight counts both days and keeps its start date", () => {
    const next = addDays(START, 1);
    const now = startOf(START);
    const begun = beginSession(placed(), { today: START, now });
    const driven = driveSession(begun, {
      at: now,
      today: (resolved) => (resolved === 0 ? START : next),
    });
    const state = saveSession(driven.state, { now: driven.at });
    const days = activeDays(state);
    expect(days.has(START) && days.has(next)).toBeTruthy();
    expect(state.history[0]!.date).toBe(START);
    expect(todayStatus(state, next)).toBe("not-started");
    const again = beginSession(state, { today: next, now: driven.at + 1000 });
    expect(again.activeSession!.date).toBe(next);
  });

  it("a declined suggestion keeps the variation and an accepted one moves up", () => {
    const first = untilPushUpSuggested(placed({ push: 30 }), START);
    const level = first.state.progress["push-up"]!.level;
    const current = variationAt("push-up", level)!;

    const declined = answerSuggestion(first.state, "push-up", false);
    expect(declined.progress["push-up"]!.level).toBe(level);
    expect(
      nextTrainingPlanWith(declined, first.day, "push-up").variationId,
    ).toBe(current.id);

    const second = untilPushUpSuggested(declined, first.day);
    const accepted = answerSuggestion(second.state, "push-up", true);
    const harder = variationAt("push-up", level + 1)!;
    const exercise = nextTrainingPlanWith(accepted, second.day, "push-up");
    expect(exercise.variationId).toBe(harder.id);
    expect(exercise.sets).toBe(3);
    expect(exercise.target).toBe(harder.min);
  });

  it("a backup of a long history restores the same state and streak", () => {
    const state = seventyDays();
    const parsed = parseBackup(
      buildBackup(state, { exportedAt: "2027-01-28T10:00:00.000Z" }),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.state).toStrictEqual(state);
    const last = addDays(START, 69);
    expect(streakOn(parsed.state, last)).toBe(streakOn(state, last));
  });

  it("the demo state shows a pending push-up suggestion, a streak of 2 and one gap", () => {
    for (let i = 0; i < 30; i += 1) {
      const end = addDays("2026-11-18", i);
      const today = addDays(end, 1);
      const state = buildDemoState(end);
      expect(state.progress["push-up"]!.suggestion?.kind, end).toBe("harder");
      const days = activeDays(state);
      expect(currentStreak(days, today), end).toBe(2);
      const before = weekStrip(days, today).filter((d) => !d.isToday);
      expect(before.filter((d) => !d.active).length, end).toBe(1);
    }
  });

  it("the standalone backup keeps its streak, history and variations", () => {
    const parsed = parseBackup(fs.readFileSync(FIXTURE, "utf8"));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const storage = fakeStorage();
    createAppStore({ store: createStore({ storage }) }).replaceAll(
      parsed.state,
    );
    const state = createAppStore({
      store: createStore({ storage }),
    }).getState();

    expect(state.history.length).toBe(13);
    const days = activeDays(state);
    expect(currentStreak(days, "2026-11-20")).toBe(3);
    expect(currentStreak(days, "2026-11-21")).toBe(3);
    expect(currentStreak(days, "2026-11-22")).toBe(0);
    expect(weekStrip(days, "2026-11-20").map((d) => d.active)).toStrictEqual([
      true,
      true,
      true,
      false,
      true,
      true,
      true,
    ]);
    const expected: Record<string, string> = {
      "push-up": "wall-push-up",
      "overhead-push": "pike-hold",
      "triceps-press": "cobra-press",
      squat: "close-squat",
      lunge: "reverse-lunge",
      "wall-sit": "wall-sit",
      plank: "long-lever-plank",
      "leg-raise": "lying-leg-raise",
      "side-plank": "side-plank",
      "back-extension": "prone-chest-lift",
      "hip-bridge": "glute-bridge",
      "back-bridge": "tabletop-hold",
      burpee: "burpee",
      jumps: "squat-jack",
      "mountain-climber": "mountain-climber",
    };
    expect(
      Object.fromEntries(
        MOVEMENTS.map((m) => [
          m.id,
          variationAt(m.id, state.progress[m.id]!.level)!.id,
        ]),
      ),
    ).toStrictEqual(expected);
    expect([...storage.items.keys()]).toStrictEqual([STORAGE_KEY]);
  });
});
