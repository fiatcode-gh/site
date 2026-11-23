import { addDays } from "../core/dates";
import type { Reason } from "../core/reasons";
import { dayTypeFor } from "../planner/rhythm";
import type {
  AppState,
  DateKey,
  DayType,
  SessionExercise,
  SessionRecord,
  Step,
  WorkType,
} from "../types";

export interface WeekDay {
  dateKey: DateKey;
  dayType: DayType;
  active: boolean;
  isToday: boolean;
}

export type TodayStatus = "in-progress" | "done" | "not-started";

export interface MovementHistoryRow {
  date: DateKey;
  dayType: DayType;
  variationName: string;
  type: WorkType;
  perSide: boolean;
  plannedSets: number;
  target: number;
  steps: Step[];
  endedHere: boolean;
  endReasons: Reason[];
}

function addLoggedDays(days: Set<DateKey>, steps: readonly Step[]): void {
  for (const s of steps) {
    if (s.status === "logged" && s.loggedOn) days.add(s.loggedOn);
  }
}

export function activeDays(
  state: Pick<AppState, "history" | "activeSession">,
): Set<DateKey> {
  const days = new Set<DateKey>();
  for (const record of state.history) addLoggedDays(days, record.steps);
  if (state.activeSession) addLoggedDays(days, state.activeSession.steps);
  return days;
}

export function currentStreak(days: Set<DateKey>, today: DateKey): number {
  let day = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(day)) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}

export function weekStrip(days: Set<DateKey>, today: DateKey): WeekDay[] {
  return Array.from({ length: 7 }, (_, i) => {
    const dateKey = addDays(today, i - 6);
    return {
      dateKey,
      dayType: dayTypeFor(dateKey),
      active: days.has(dateKey),
      isToday: dateKey === today,
    };
  });
}

export function doneSession(
  state: Pick<AppState, "history">,
  today: DateKey,
): SessionRecord | null {
  return (
    state.history.findLast(
      (record) =>
        record.date === today &&
        record.steps.some((s) => s.status === "logged"),
    ) ?? null
  );
}

export function todayStatus(
  state: Pick<AppState, "history" | "activeSession">,
  today: DateKey,
): TodayStatus {
  if (state.activeSession) return "in-progress";
  return doneSession(state, today) ? "done" : "not-started";
}

function historyRow(
  record: SessionRecord,
  exercise: SessionExercise,
  steps: Step[],
  movementId: string,
): MovementHistoryRow {
  const endedHere = record.endedEarly && record.endMovementId === movementId;
  return {
    date: record.date,
    dayType: record.dayType,
    variationName: exercise.variationName,
    type: exercise.type,
    perSide: exercise.perSide,
    plannedSets: exercise.plannedSets,
    target: exercise.target,
    steps,
    endedHere,
    endReasons: endedHere ? record.endReasons : [],
  };
}

export function movementHistory(
  history: readonly SessionRecord[],
  movementId: string,
  limit = 8,
): MovementHistoryRow[] {
  const rows: MovementHistoryRow[] = [];
  for (let i = history.length - 1; i >= 0 && rows.length < limit; i -= 1) {
    const record = history[i]!;
    const index = record.exercises.findIndex(
      (e) => e.movementId === movementId,
    );
    if (index === -1) continue;
    const steps = record.steps.filter((s) => s.exerciseIndex === index);
    const reached =
      steps.some((s) => s.status !== "pending") ||
      record.endMovementId === movementId;
    if (reached) {
      rows.push(
        historyRow(record, record.exercises[index]!, steps, movementId),
      );
    }
  }
  return rows;
}
