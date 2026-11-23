import { describe, expect, it } from "vitest";
import { addDays } from "../../../../src/lib/tools/workout/core/dates";
import type { Reason } from "../../../../src/lib/tools/workout/core/reasons";
import { defaultState } from "../../../../src/lib/tools/workout/storage/schema";
import {
  activeDays,
  currentStreak,
  doneSession,
  movementHistory,
  todayStatus,
  weekStrip,
} from "../../../../src/lib/tools/workout/tracking/tracking";
import type {
  AppState,
  SessionExercise,
  SessionRecord,
  SessionState,
  Step,
  StepStatus,
} from "../../../../src/lib/tools/workout/types";

const TODAY = "2026-11-19";

function exercise(movementId: string, variationName: string): SessionExercise {
  return {
    movementId,
    movementName: movementId,
    variationId: movementId,
    variationName,
    pattern: "push",
    level: 0,
    type: "reps",
    perSide: false,
    plannedSets: 2,
    target: 8,
    restSeconds: 60,
  };
}

function step(
  exerciseIndex: number,
  setNumber: number,
  status: StepStatus,
  loggedOn: string | null = null,
  reasons: Reason[] = [],
): Step {
  return {
    exerciseIndex,
    setNumber,
    side: null,
    status,
    value: status === "logged" ? 8 : null,
    loggedOn,
    reasons,
  };
}

function record(
  date: string,
  steps: Step[],
  extra: Partial<SessionRecord> = {},
): SessionRecord {
  return {
    id: `${date}T0`,
    date,
    dayType: "training",
    startedAt: 0,
    endedAt: 1,
    exercises: [exercise("push-up", "Push-up"), exercise("squat", "Squat")],
    steps,
    endedEarly: false,
    endReasons: [],
    endMovementId: null,
    changes: [],
    ...extra,
  };
}

function stateWith(
  history: SessionRecord[],
  activeSession: SessionRecord | null = null,
): AppState {
  return {
    ...defaultState(),
    onboarded: true,
    history,
    activeSession: activeSession as SessionState | null,
  };
}

function daysBack(count: number, from = TODAY): string[] {
  return Array.from({ length: count }, (_, i) => addDays(from, -i));
}

describe("workout/tracking/tracking", () => {
  it("activeDays collects loggedOn from history and the active session only", () => {
    const history = [
      record("2026-11-10", [
        step(0, 1, "logged", "2026-11-10"),
        step(0, 2, "logged", "2026-11-11"),
        step(1, 1, "skipped", null, ["pain"]),
        step(1, 2, "pending"),
      ]),
      record("2026-11-12", [step(0, 1, "skipped"), step(0, 2, "pending")]),
    ];
    const active = {
      ...record("2026-11-13", [step(0, 1, "logged", "2026-11-13")]),
    };
    expect([...activeDays(stateWith(history, active))].sort()).toStrictEqual([
      "2026-11-10",
      "2026-11-11",
      "2026-11-13",
    ]);
    expect(activeDays(stateWith([])).size).toBe(0);
  });

  it("currentStreak counts back from today, or from yesterday when today is not active", () => {
    const cases: [string[], number][] = [
      [[], 0],
      [[TODAY], 1],
      [[TODAY, addDays(TODAY, -1)], 2],
      [[addDays(TODAY, -1)], 1],
      [[addDays(TODAY, -2)], 0],
    ];
    for (const [days, expected] of cases) {
      expect(currentStreak(new Set(days), TODAY), days.join(",")).toBe(
        expected,
      );
    }
  });

  it("currentStreak stops at a gap", () => {
    const days = new Set([...daysBack(2), ...daysBack(5, addDays(TODAY, -3))]);
    expect(days.size).toBe(7);
    expect(currentStreak(days, TODAY)).toBe(2);
  });

  it("currentStreak runs across a month end and a leap day", () => {
    expect(
      currentStreak(new Set(daysBack(4, "2026-12-02")), "2026-12-02"),
    ).toBe(4);
    const leap = new Set([
      "2028-02-27",
      "2028-02-28",
      "2028-02-29",
      "2028-03-01",
      "2028-03-02",
    ]);
    expect(currentStreak(leap, "2028-03-02")).toBe(5);
    expect(
      currentStreak(new Set(["2028-02-29", "2028-03-01"]), "2028-03-02"),
    ).toBe(2);
  });

  it("weekStrip lists seven days ending today with active flags and day types", () => {
    const days = new Set(["2026-11-13", "2026-11-14", "2026-11-17", TODAY]);
    const strip = weekStrip(days, TODAY);
    expect(strip.map((d) => d.dateKey)).toStrictEqual([
      "2026-11-13",
      "2026-11-14",
      "2026-11-15",
      "2026-11-16",
      "2026-11-17",
      "2026-11-18",
      TODAY,
    ]);
    expect(strip.map((d) => d.active)).toStrictEqual([
      true,
      true,
      false,
      false,
      true,
      false,
      true,
    ]);
    expect(
      strip.filter((d) => d.dayType === "recovery").map((d) => d.dateKey),
    ).toStrictEqual(["2026-11-15", "2026-11-18"]);
    expect(strip.filter((d) => d.isToday).map((d) => d.dateKey)).toStrictEqual([
      TODAY,
    ]);
  });

  it("todayStatus is not-started on a fresh state", () => {
    expect(todayStatus(defaultState(), TODAY)).toBe("not-started");
    expect(doneSession(defaultState(), TODAY)).toBe(null);
  });

  it("todayStatus is in-progress while a session is active, whatever its date", () => {
    const active = record("2026-11-18", [step(0, 1, "pending")]);
    expect(todayStatus(stateWith([], active), TODAY)).toBe("in-progress");
  });

  it("todayStatus is done with a record for today holding a logged step", () => {
    const first = record(TODAY, [step(0, 1, "skipped")], { id: "a" });
    const second = record(TODAY, [step(0, 1, "logged", TODAY)], { id: "b" });
    const state = stateWith([first, second]);
    expect(todayStatus(state, TODAY)).toBe("done");
    expect(doneSession(state, TODAY)!.id).toBe("b");
  });

  it("todayStatus is not-started when today's record holds no logged step", () => {
    const state = stateWith([
      record(TODAY, [step(0, 1, "skipped"), step(0, 2, "pending")]),
    ]);
    expect(todayStatus(state, TODAY)).toBe("not-started");
    expect(doneSession(state, TODAY)).toBe(null);
  });

  it("todayStatus is not-started when the only record is yesterday's", () => {
    const yesterday = addDays(TODAY, -1);
    const state = stateWith([
      record(yesterday, [step(0, 1, "logged", yesterday)]),
    ]);
    expect(todayStatus(state, TODAY)).toBe("not-started");
  });

  it("movementHistory lists recent results for one movement, newest first", () => {
    const history = [
      record("2026-11-01", [
        step(0, 1, "logged", "2026-11-01"),
        step(0, 2, "logged", "2026-11-01"),
      ]),
      record("2026-11-02", [
        step(0, 1, "skipped", null, ["too-hard"]),
        step(0, 2, "skipped", null, ["too-hard"]),
      ]),
      record("2026-11-03", [step(0, 1, "pending"), step(0, 2, "pending")], {
        endedEarly: true,
        endReasons: ["no-time"],
        endMovementId: "push-up",
      }),
      record(
        "2026-11-04",
        [step(0, 1, "logged", "2026-11-04"), step(1, 1, "pending")],
        {
          endedEarly: true,
          endReasons: ["pain"],
          endMovementId: "push-up",
        },
      ),
      record(
        "2026-11-05",
        [step(0, 1, "pending"), step(1, 1, "logged", "2026-11-05")],
        {
          exercises: [
            exercise("squat", "Squat"),
            exercise("push-up", "Push-up"),
          ],
        },
      ),
      record(
        "2026-11-06",
        [step(0, 1, "logged", "2026-11-06"), step(1, 1, "pending")],
        {
          exercises: [
            exercise("squat", "Squat"),
            exercise("push-up", "Push-up"),
          ],
          endedEarly: true,
          endReasons: ["other"],
          endMovementId: "squat",
        },
      ),
    ];

    const rows = movementHistory(history, "push-up");
    expect(rows.map((r) => r.date)).toStrictEqual([
      "2026-11-05",
      "2026-11-04",
      "2026-11-03",
      "2026-11-02",
      "2026-11-01",
    ]);
    const [fifth, fourth, third, second, first] = rows as [
      (typeof rows)[number],
      (typeof rows)[number],
      (typeof rows)[number],
      (typeof rows)[number],
      (typeof rows)[number],
    ];
    expect(fifth.steps).toStrictEqual([step(1, 1, "logged", "2026-11-05")]);
    expect(fifth.endedHere).toBe(false);
    expect(fourth.endReasons).toStrictEqual(["pain"]);
    expect(fourth.endedHere).toBe(true);
    expect(third.endedHere).toBe(true);
    expect(third.endReasons).toStrictEqual(["no-time"]);
    expect(second.steps.map((s) => s.reasons)).toStrictEqual([
      ["too-hard"],
      ["too-hard"],
    ]);
    expect(second.endReasons).toStrictEqual([]);
    expect(first).toStrictEqual({
      date: "2026-11-01",
      dayType: "training",
      variationName: "Push-up",
      type: "reps",
      perSide: false,
      plannedSets: 2,
      target: 8,
      steps: [
        step(0, 1, "logged", "2026-11-01"),
        step(0, 2, "logged", "2026-11-01"),
      ],
      endedHere: false,
      endReasons: [],
    });
    expect(
      movementHistory(history, "push-up", 2).map((r) => r.date),
    ).toStrictEqual(["2026-11-05", "2026-11-04"]);
  });
});
