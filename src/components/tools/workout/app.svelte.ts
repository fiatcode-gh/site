import { answerSuggestion } from "@/lib/tools/workout/app/actions";
import {
  createAppStore,
  type PersistenceProblem,
} from "@/lib/tools/workout/app/app-store";
import { toDateKey } from "@/lib/tools/workout/core/dates";
import { resolveSuggestion } from "@/lib/tools/workout/progression/progression";
import {
  parseRoute,
  resolveRoute,
  routeHash,
  type Route,
  type ScreenName,
} from "@/lib/tools/workout/route";
import type { CueName } from "@/lib/tools/workout/session/session";
import {
  createStore,
  type StorageLike,
} from "@/lib/tools/workout/storage/store";
import type { AppState, DateKey } from "@/lib/tools/workout/types";
import { getContext, setContext } from "svelte";
import { createCues } from "./cues";

export interface WorkoutApp {
  readonly state: AppState;
  readonly problem: PersistenceProblem | null;
  readonly route: Route;
  readonly today: DateKey;
  readonly announcement: string;
  readonly clock: { now(): number; today(): DateKey };
  readonly cues: { unlock(): void; play(name: CueName): void };
  dispatch(updater: (state: AppState) => AppState): void;
  replaceAll(next: AppState): void;
  resetAll(): void;
  navigate(name: ScreenName, param?: string): void;
  announce(text: string): void;
  destroy(): void;
}

const SCREEN_TITLES: Readonly<Record<ScreenName, string>> = {
  welcome: "Welcome",
  placement: "Starting level",
  today: "Today",
  session: "Session",
  progress: "Progress",
  "progress-movement": "Progress",
  settings: "Settings",
};

const DATE_CHECK_MS = 60_000;

function browserStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function createWorkoutApp(screens: ScreenName[]): WorkoutApp {
  const clock = {
    now: () => Date.now(),
    today: () => toDateKey(new Date()),
  };
  const store = createAppStore({
    store: createStore({ storage: browserStorage() }),
  });
  const cues = createCues({ isMuted: () => store.getState().settings.muted });

  let requested = parseRoute(location.hash);
  let state = $state.raw(store.getState());
  let problem = $state.raw(store.getPersistence().problem);
  let route = $state.raw(resolve());
  let today = $state.raw(clock.today());
  let announcement = $state.raw("");
  let frame = 0;

  function resolve(): Route {
    return resolveRoute(requested, store.getState(), screens);
  }

  function update(): void {
    const hash = location.hash;
    if (hash === "" || hash.startsWith("#/")) requested = parseRoute(hash);
    state = store.getState();
    problem = store.getPersistence().problem;
    const next = resolve();
    if (next.name !== route.name || next.param !== route.param) route = next;
    const canonical = routeHash(route);
    if (hash.startsWith("#/") && hash !== canonical) {
      history.replaceState(history.state, "", canonical);
    }
    document.title = `${SCREEN_TITLES[route.name as ScreenName]} · Workout | fiatcode`;
  }

  function checkDate(): void {
    const now = clock.today();
    if (now !== today) today = now;
  }

  function onVisibility(): void {
    if (document.visibilityState === "visible") checkDate();
  }

  const unsubscribe = store.subscribe(update);
  window.addEventListener("hashchange", update);
  document.addEventListener("visibilitychange", onVisibility);
  const dateTimer = setInterval(checkDate, DATE_CHECK_MS);
  update();

  return {
    get state() {
      return state;
    },
    get problem() {
      return problem;
    },
    get route() {
      return route;
    },
    get today() {
      return today;
    },
    get announcement() {
      return announcement;
    },
    clock,
    cues,
    dispatch: store.dispatch,
    replaceAll: store.replaceAll,
    resetAll: store.resetAll,
    navigate(name, param) {
      location.hash = routeHash({ name, param: param ?? null });
    },
    announce(text) {
      announcement = "";
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        announcement = text;
      });
    },
    destroy() {
      unsubscribe();
      window.removeEventListener("hashchange", update);
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(dateTimer);
      cancelAnimationFrame(frame);
    },
  };
}

const KEY = Symbol("workout-app");

export function setWorkoutApp(get: () => WorkoutApp): void {
  setContext(KEY, get);
}

export function getWorkoutApp(): WorkoutApp {
  return getContext<() => WorkoutApp>(KEY)();
}

/** The site's focus ring (2 px outline, 2 px offset) reaches this far past a box. */
const FOCUS_RING_PX = 4;

/**
 * Brings a screen's focus target (its title or the control it names) into view
 * and focus after a change of screen or step. The island top is scrolled into
 * view when it is above the window and the target stays visible from there;
 * otherwise the target itself is centred. Visible means between the page's
 * scroll padding: under the pinned chrome and above the status bar.
 */
export function showFocusTarget(target: HTMLElement | null | undefined): void {
  if (!target) return;
  const page = getComputedStyle(document.documentElement);
  const top = parseFloat(page.scrollPaddingTop) || 0;
  const bottom = innerHeight - (parseFloat(page.scrollPaddingBottom) || 0);
  const box = target.getBoundingClientRect();
  const root = target.closest<HTMLElement>('[data-wk="root"]');
  const rootTop = root?.getBoundingClientRect().top ?? 0;
  const fits = (shift: number) =>
    box.top + shift - FOCUS_RING_PX >= top &&
    box.bottom + shift + FOCUS_RING_PX <= bottom;
  if (root && rootTop < 0 && fits(top - rootTop)) {
    root.scrollIntoView({ block: "start" });
  } else if (!fits(0)) {
    target.scrollIntoView({ block: "center" });
  }
  target.focus({ preventScroll: true });
}

/** Brings the player stage into view and, unless a dialog holds focus, focuses its primary button. */
export function showStage(stage: HTMLElement | null | undefined): void {
  if (!stage) return;
  stage.scrollIntoView({ block: "start" });
  if (stage.querySelector("dialog[open]")) return;
  stage
    .querySelector<HTMLElement>('[data-wk="primary"]')
    ?.focus({ preventScroll: true });
}

/** Answers a movement's pending suggestion and announces the change it makes. */
export function answerPendingSuggestion(
  app: WorkoutApp,
  movementId: string,
  accept: boolean,
): void {
  const { change } = resolveSuggestion(app.state.progress, movementId, accept);
  app.dispatch((state) => answerSuggestion(state, movementId, accept));
  if (change) app.announce(change.sentence);
}
