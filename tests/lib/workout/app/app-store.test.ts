import { describe, expect, it } from "vitest";
import {
  finishPlacement,
  sessionAction,
  setMuted,
  setTimeCap,
} from "../../../../src/lib/tools/workout/app/actions";
import { createAppStore } from "../../../../src/lib/tools/workout/app/app-store";
import { variationAt } from "../../../../src/lib/tools/workout/library/library";
import { createSession } from "../../../../src/lib/tools/workout/session/session";
import {
  STORAGE_KEY,
  defaultState,
} from "../../../../src/lib/tools/workout/storage/schema";
import {
  createStore,
  type StorageLike,
} from "../../../../src/lib/tools/workout/storage/store";
import type { AppState, Plan } from "../../../../src/lib/tools/workout/types";

const NOW = 1_800_000_000_000;

type Method = keyof StorageLike;

function fakeStorage(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  const throwing = new Set<Method>();
  const guard = (method: Method) => {
    if (throwing.has(method)) throw new Error(`${method} failed`);
  };
  return {
    items,
    throwing,
    getItem(key: string): string | null {
      guard("getItem");
      return items.has(key) ? items.get(key)! : null;
    },
    setItem(key: string, value: string) {
      guard("setItem");
      items.set(key, String(value));
    },
    removeItem(key: string) {
      guard("removeItem");
      items.delete(key);
    },
  };
}

function appStoreOver(storage: StorageLike) {
  return createAppStore({ store: createStore({ storage }) });
}

function holdPlan(): Plan {
  const v = variationAt("plank", 0)!;
  return {
    dateKey: "2026-11-19",
    dayType: "training",
    exercises: [
      {
        movementId: "plank",
        pattern: "core",
        level: 0,
        variationId: v.id,
        type: v.type,
        perSide: v.perSide,
        sets: 3,
        target: v.min,
        restSeconds: 60,
      },
    ],
    estimateSeconds: 0,
    capSeconds: 2400,
    trimmed: false,
  };
}

describe("workout/app/app-store", () => {
  it("dispatch notifies once, persists, and a new store starts from the same state", () => {
    const storage = fakeStorage();
    const app = appStoreOver(storage);
    expect(app.getState()).toStrictEqual(defaultState());
    expect(app.getPersistence()).toStrictEqual({ problem: null });
    let calls = 0;
    app.subscribe((...args: unknown[]) => {
      calls += 1;
      expect(args.length).toBe(0);
    });
    app.dispatch((state) => finishPlacement(state, { push: 12 }));
    expect(calls).toBe(1);
    expect(app.getState().onboarded).toBe(true);
    expect(storage.items.has(STORAGE_KEY)).toBeTruthy();
    expect(appStoreOver(storage).getState()).toStrictEqual(app.getState());
  });

  it("an updater returning the same object neither saves nor notifies", () => {
    const storage = fakeStorage();
    const app = appStoreOver(storage);
    let calls = 0;
    app.subscribe(() => {
      calls += 1;
    });
    const before = app.getState();
    app.dispatch((state) => setTimeCap(state, 42));
    expect(calls).toBe(0);
    expect(app.getState()).toBe(before);
    expect(storage.items.has(STORAGE_KEY)).toBe(false);
  });

  it("an active session with a running hold is restored paused by a new store", () => {
    const storage = fakeStorage();
    const app = appStoreOver(storage);
    app.dispatch((state) => ({
      ...finishPlacement(state, null),
      activeSession: createSession(holdPlan(), { now: NOW }),
    }));
    app.dispatch((state) =>
      sessionAction(state, { type: "startHold", at: NOW + 1000 }),
    );
    expect(app.getState().activeSession!.hold.runningSince).toBe(NOW + 1000);

    const session = appStoreOver(storage).getState().activeSession!;
    expect(session.paused).toBe(true);
    expect(session.holdStarted).toBe(true);
    expect(session.hold).toStrictEqual({
      accumulatedMs: 0,
      runningSince: null,
    });
  });

  it("mute survives a new store", () => {
    const storage = fakeStorage();
    appStoreOver(storage).dispatch((state) => setMuted(state, true));
    expect(appStoreOver(storage).getState().settings.muted).toBe(true);
  });

  it("a failed write keeps the new state in memory and reports failed until a write works", () => {
    const storage = fakeStorage();
    const app = appStoreOver(storage);
    storage.throwing.add("setItem");
    app.dispatch((state) => setMuted(state, true));
    expect(app.getState().settings.muted).toBe(true);
    expect(app.getPersistence()).toStrictEqual({ problem: "failed" });

    storage.throwing.delete("setItem");
    app.dispatch((state) => setTimeCap(state, 30));
    expect(app.getPersistence()).toStrictEqual({ problem: null });
    expect(appStoreOver(storage).getState().settings.timeCapMinutes).toBe(30);
  });

  it("without storage the app runs in memory and reports unavailable", () => {
    const app = createAppStore({ store: createStore({ storage: null }) });
    expect(app.getPersistence()).toStrictEqual({ problem: "unavailable" });
    app.dispatch((state) => setMuted(state, true));
    expect(app.getState().settings.muted).toBe(true);
    expect(app.getPersistence()).toStrictEqual({ problem: "unavailable" });
  });

  it("corrupt stored data is protected until reset or import", () => {
    const storage = fakeStorage({ [STORAGE_KEY]: "{oops" });
    const app = appStoreOver(storage);
    expect(app.getState()).toStrictEqual(defaultState());
    expect(app.getPersistence()).toStrictEqual({ problem: "corrupt" });

    app.dispatch((state) => setMuted(state, true));
    expect(app.getState().settings.muted).toBe(true);
    expect(storage.items.get(STORAGE_KEY)).toBe("{oops");
    expect(app.getPersistence()).toStrictEqual({ problem: "corrupt" });

    let calls = 0;
    app.subscribe(() => {
      calls += 1;
    });
    app.resetAll();
    expect(calls).toBe(1);
    expect(app.getState()).toStrictEqual(defaultState());
    expect(app.getPersistence()).toStrictEqual({ problem: null });
    expect(storage.items.has(STORAGE_KEY)).toBe(false);
  });

  it("replaceAll writes over protected data and restores a running session paused", () => {
    const storage = fakeStorage({ [STORAGE_KEY]: "{oops" });
    const app = appStoreOver(storage);
    let calls = 0;
    app.subscribe(() => {
      calls += 1;
    });
    const session = sessionAction(
      {
        activeSession: createSession(holdPlan(), { now: NOW }),
      } as AppState,
      { type: "startHold", at: NOW },
    ).activeSession;
    const imported = {
      ...finishPlacement(defaultState(), null),
      activeSession: session,
    };
    app.replaceAll(imported);
    expect(calls).toBe(1);
    expect(app.getState().activeSession!.paused).toBe(true);
    expect(app.getPersistence()).toStrictEqual({ problem: null });
    expect(JSON.parse(storage.items.get(STORAGE_KEY)!)).toStrictEqual(
      app.getState(),
    );
  });

  it("unsubscribe stops notifications", () => {
    const app = appStoreOver(fakeStorage());
    let calls = 0;
    const unsubscribe = app.subscribe(() => {
      calls += 1;
    });
    app.dispatch((state) => setMuted(state, true));
    unsubscribe();
    app.dispatch((state) => setMuted(state, false));
    expect(calls).toBe(1);
  });
});
