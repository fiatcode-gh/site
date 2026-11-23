import { defaultState } from "../storage/schema";
import type { ClearResult, SaveResult, Store } from "../storage/store";
import type { AppState } from "../types";
import { restoreOnLoad } from "./actions";

export type PersistenceProblem =
  "unavailable" | "failed" | "corrupt" | "unsupported";

export interface AppStore {
  getState(): AppState;
  getPersistence(): { problem: PersistenceProblem | null };
  dispatch(updater: (state: AppState) => AppState): void;
  replaceAll(next: AppState): void;
  resetAll(): void;
  subscribe(listener: () => void): () => void;
}

const WRITE_PROBLEMS: Readonly<Record<string, PersistenceProblem>> = {
  failed: "failed",
  unavailable: "unavailable",
};

export function createAppStore({ store }: { store: Store }): AppStore {
  const loaded = store.load();
  let state = restoreOnLoad(loaded.state);
  let problem: PersistenceProblem | null =
    loaded.status === "ok" || loaded.status === "empty" ? null : loaded.status;
  const listeners = new Set<() => void>();

  function track(result: SaveResult | ClearResult): void {
    if (result.ok) problem = null;
    else if (Object.hasOwn(WRITE_PROBLEMS, result.reason)) {
      problem = WRITE_PROBLEMS[result.reason]!;
    }
  }

  function notify(): void {
    for (const listener of [...listeners]) listener();
  }

  function dispatch(updater: (state: AppState) => AppState): void {
    const next = updater(state);
    if (next === state) return;
    state = next;
    track(store.save(state));
    notify();
  }

  function replaceAll(next: AppState): void {
    state = restoreOnLoad(next);
    track(store.save(state, { force: true }));
    notify();
  }

  function resetAll(): void {
    track(store.clear());
    state = defaultState();
    notify();
  }

  function subscribe(listener: () => void): () => void {
    const entry = () => listener();
    listeners.add(entry);
    return () => listeners.delete(entry);
  }

  return {
    getState: () => state,
    getPersistence: () => ({ problem }),
    dispatch,
    replaceAll,
    resetAll,
    subscribe,
  };
}
