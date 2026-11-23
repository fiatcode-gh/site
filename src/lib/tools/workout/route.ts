import { movement } from "./library/library";
import type { AppState } from "./types";

export type ScreenName =
  | "welcome"
  | "placement"
  | "today"
  | "session"
  | "progress"
  | "progress-movement"
  | "settings";

export interface Route {
  name: string;
  param: string | null;
}

const FIRST_RUN = ["welcome", "placement"];

const route = (name: string, param: string | null = null): Route => ({
  name,
  param,
});

function decode(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

export function parseRoute(hash: string | null | undefined): Route {
  const parts = String(hash ?? "")
    .replace(/^#\/?/, "")
    .split("/")
    .filter(Boolean)
    .map(decode);
  if (parts.length === 0) return route("today");
  if (parts[0] === "progress" && parts.length > 1) {
    return route("progress-movement", parts[1]);
  }
  return route(parts[0]!);
}

export function resolveRoute(
  { name, param }: Route,
  state: Pick<AppState, "onboarded" | "activeSession">,
  registered: readonly string[],
): Route {
  const home = state.onboarded ? "today" : "welcome";
  if (!registered.includes(name)) return route(home);
  if (!state.onboarded && !FIRST_RUN.includes(name)) return route("welcome");
  if (state.onboarded && FIRST_RUN.includes(name)) return route("today");
  if (name === "session" && !state.activeSession) return route("today");
  if (name === "progress-movement" && !movement(param ?? "")) {
    return route("progress");
  }
  return route(name, name === "progress-movement" ? param : null);
}

export function routeHash({ name, param }: Route): string {
  return name === "progress-movement"
    ? `#/progress/${encodeURIComponent(param ?? "")}`
    : `#/${name}`;
}
