import { describe, expect, it } from "vitest";
import {
  STORAGE_KEY,
  defaultState,
} from "../../../../src/lib/tools/workout/storage/schema";
import {
  createStore,
  type StorageLike,
} from "../../../../src/lib/tools/workout/storage/store";
import type { AppState } from "../../../../src/lib/tools/workout/types";

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

function savedState(): AppState {
  return {
    ...defaultState(),
    onboarded: true,
    settings: { timeCapMinutes: 25, muted: true },
  };
}

describe("workout/storage/store", () => {
  it("an empty storage loads as empty with the default state", () => {
    const store = createStore({ storage: fakeStorage() });
    expect(store.load()).toStrictEqual({
      status: "empty",
      state: defaultState(),
    });
  });

  it("a saved state loads back as ok and deep-equal", () => {
    const storage = fakeStorage();
    expect(createStore({ storage }).save(savedState())).toStrictEqual({
      ok: true,
    });
    expect(createStore({ storage }).load()).toStrictEqual({
      status: "ok",
      state: savedState(),
    });
  });

  it("only the store key is ever written", () => {
    const storage = fakeStorage();
    const store = createStore({ storage });
    store.load();
    store.save(savedState());
    store.save(defaultState(), { force: true });
    expect([...storage.items.keys()]).toStrictEqual([STORAGE_KEY]);
    expect(storage.items.get(STORAGE_KEY)).toBe(JSON.stringify(defaultState()));
  });

  it("a custom key is used for every read and write", () => {
    const storage = fakeStorage();
    const store = createStore({ storage, key: "other" });
    store.save(savedState());
    expect([...storage.items.keys()]).toStrictEqual(["other"]);
    expect(store.load().status).toBe("ok");
  });

  it("a null storage is unavailable and never throws", () => {
    const store = createStore({ storage: null });
    expect(store.load()).toStrictEqual({
      status: "unavailable",
      state: defaultState(),
    });
    expect(store.save(savedState())).toStrictEqual({
      ok: false,
      reason: "unavailable",
    });
    expect(store.clear()).toStrictEqual({ ok: false, reason: "unavailable" });
  });

  it("a throwing getItem makes the store unavailable for the visit", () => {
    const storage = fakeStorage();
    storage.throwing.add("getItem");
    const store = createStore({ storage });
    expect(store.load()).toStrictEqual({
      status: "unavailable",
      state: defaultState(),
    });
    expect(store.save(savedState())).toStrictEqual({
      ok: false,
      reason: "unavailable",
    });
    expect(store.save(savedState(), { force: true })).toStrictEqual({
      ok: false,
      reason: "unavailable",
    });
    expect(store.clear()).toStrictEqual({ ok: false, reason: "unavailable" });
    expect(storage.items.size).toBe(0);
  });

  it("a throwing setItem fails the save and the next save tries again", () => {
    const storage = fakeStorage();
    const store = createStore({ storage });
    store.load();
    storage.throwing.add("setItem");
    expect(store.save(savedState())).toStrictEqual({
      ok: false,
      reason: "failed",
    });
    storage.throwing.delete("setItem");
    expect(store.save(savedState())).toStrictEqual({ ok: true });
    expect(storage.items.get(STORAGE_KEY)).toBe(JSON.stringify(savedState()));
  });

  it("corrupt stored text loads as corrupt and is protected from a normal save", () => {
    const storage = fakeStorage({ [STORAGE_KEY]: "{oops" });
    const store = createStore({ storage });
    expect(store.load()).toStrictEqual({
      status: "corrupt",
      state: defaultState(),
    });
    expect(store.save(savedState())).toStrictEqual({
      ok: false,
      reason: "protected",
    });
    expect(storage.items.get(STORAGE_KEY)).toBe("{oops");
    expect(store.save(savedState(), { force: true })).toStrictEqual({
      ok: true,
    });
    expect(storage.items.get(STORAGE_KEY)).toBe(JSON.stringify(savedState()));
    expect(store.save(defaultState())).toStrictEqual({ ok: true });
  });

  it("invalid stored state also loads as corrupt", () => {
    const text = JSON.stringify({ ...savedState(), onboarded: "yes" });
    const storage = fakeStorage({ [STORAGE_KEY]: text });
    const store = createStore({ storage });
    expect(store.load()).toStrictEqual({
      status: "corrupt",
      state: defaultState(),
    });
    expect(store.save(savedState())).toStrictEqual({
      ok: false,
      reason: "protected",
    });
    expect(storage.items.get(STORAGE_KEY)).toBe(text);
  });

  it("clear lifts the protection so a normal save writes again", () => {
    const storage = fakeStorage({ [STORAGE_KEY]: "{oops" });
    const store = createStore({ storage });
    store.load();
    expect(store.clear()).toStrictEqual({ ok: true });
    expect(storage.items.has(STORAGE_KEY)).toBe(false);
    expect(store.save(savedState())).toStrictEqual({ ok: true });
    expect(storage.items.get(STORAGE_KEY)).toBe(JSON.stringify(savedState()));
  });

  it("a newer stored version is unsupported and protected the same way", () => {
    const text = JSON.stringify({ ...savedState(), schemaVersion: 2 });
    const storage = fakeStorage({ [STORAGE_KEY]: text });
    const store = createStore({ storage });
    expect(store.load()).toStrictEqual({
      status: "unsupported",
      state: defaultState(),
    });
    expect(store.save(savedState())).toStrictEqual({
      ok: false,
      reason: "protected",
    });
    expect(storage.items.get(STORAGE_KEY)).toBe(text);
    expect(store.save(savedState(), { force: true })).toStrictEqual({
      ok: true,
    });
    expect(storage.items.get(STORAGE_KEY)).toBe(JSON.stringify(savedState()));
  });

  it("clear removes the item", () => {
    const storage = fakeStorage();
    const store = createStore({ storage });
    store.save(savedState());
    expect(store.clear()).toStrictEqual({ ok: true });
    expect(storage.items.size).toBe(0);
    expect(store.load()).toStrictEqual({
      status: "empty",
      state: defaultState(),
    });
  });

  it("a throwing removeItem fails the clear and keeps the protection", () => {
    const storage = fakeStorage({ [STORAGE_KEY]: "{oops" });
    const store = createStore({ storage });
    store.load();
    storage.throwing.add("removeItem");
    expect(store.clear()).toStrictEqual({ ok: false, reason: "failed" });
    expect(store.save(savedState())).toStrictEqual({
      ok: false,
      reason: "protected",
    });
    expect(storage.items.get(STORAGE_KEY)).toBe("{oops");
  });
});
