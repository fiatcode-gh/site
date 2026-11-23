import type { AppState } from "../types";
import { STORAGE_KEY, defaultState, readState } from "./schema";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type LoadStatus =
  "ok" | "empty" | "unavailable" | "corrupt" | "unsupported";
export interface LoadResult {
  status: LoadStatus;
  state: AppState;
}
export type SaveResult =
  { ok: true } | { ok: false; reason: "unavailable" | "protected" | "failed" };
export type ClearResult =
  { ok: true } | { ok: false; reason: "unavailable" | "failed" };

export interface Store {
  load(): LoadResult;
  save(state: AppState, options?: { force?: boolean }): SaveResult;
  clear(): ClearResult;
}

const LOAD_STATUS = {
  corrupt: "corrupt",
  invalid: "corrupt",
  unsupported: "unsupported",
} as const;

export function createStore({
  storage,
  key = STORAGE_KEY,
}: {
  storage: StorageLike | null | undefined;
  key?: string;
}): Store {
  let unavailable = !storage;
  let guarded = false;

  function load(): LoadResult {
    if (!storage || unavailable) {
      return { status: "unavailable", state: defaultState() };
    }
    let text: string | null | undefined;
    try {
      text = storage.getItem(key);
    } catch {
      unavailable = true;
      return { status: "unavailable", state: defaultState() };
    }
    if (text === null || text === undefined) {
      return { status: "empty", state: defaultState() };
    }
    const result = readState(text);
    if (result.ok) return { status: "ok", state: result.state };
    guarded = true;
    return { status: LOAD_STATUS[result.error], state: defaultState() };
  }

  function save(
    state: AppState,
    { force = false }: { force?: boolean } = {},
  ): SaveResult {
    if (!storage || unavailable) return { ok: false, reason: "unavailable" };
    if (guarded && !force) return { ok: false, reason: "protected" };
    try {
      storage.setItem(key, JSON.stringify(state));
    } catch {
      return { ok: false, reason: "failed" };
    }
    guarded = false;
    return { ok: true };
  }

  function clear(): ClearResult {
    if (!storage || unavailable) return { ok: false, reason: "unavailable" };
    try {
      storage.removeItem(key);
    } catch {
      return { ok: false, reason: "failed" };
    }
    guarded = false;
    return { ok: true };
  }

  return { load, save, clear };
}
