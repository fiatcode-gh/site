import { describe, expect, it } from "vitest";
import {
  parseRoute,
  resolveRoute,
  routeHash,
  type Route,
} from "../../../src/lib/tools/workout/route";
import { defaultState } from "../../../src/lib/tools/workout/storage/schema";
import type { SessionState } from "../../../src/lib/tools/workout/types";

const FIRST_RUN = ["welcome", "placement", "today"];
const ALL = [
  ...FIRST_RUN,
  "session",
  "progress",
  "progress-movement",
  "settings",
];
const fresh = defaultState();
const onboarded = { ...fresh, onboarded: true };
const withSession = {
  ...onboarded,
  activeSession: { id: "x" } as SessionState,
};

describe("workout/route", () => {
  it("parseRoute maps empty hashes to today", () => {
    expect(parseRoute("")).toStrictEqual({ name: "today", param: null });
    expect(parseRoute("#/")).toStrictEqual({ name: "today", param: null });
  });

  it("parseRoute reads a plain screen name", () => {
    expect(parseRoute("#/today")).toStrictEqual({ name: "today", param: null });
    expect(parseRoute("#/nonsense")).toStrictEqual({
      name: "nonsense",
      param: null,
    });
  });

  it("parseRoute reads a movement page", () => {
    expect(parseRoute("#/progress/push-up")).toStrictEqual({
      name: "progress-movement",
      param: "push-up",
    });
  });

  it("resolveRoute sends a fresh state to welcome", () => {
    expect(
      resolveRoute({ name: "today", param: null }, fresh, FIRST_RUN),
    ).toStrictEqual({ name: "welcome", param: null });
  });

  it("resolveRoute lets a fresh state open placement", () => {
    expect(
      resolveRoute({ name: "placement", param: null }, fresh, FIRST_RUN),
    ).toStrictEqual({ name: "placement", param: null });
  });

  it("resolveRoute sends an onboarded state away from welcome", () => {
    expect(
      resolveRoute({ name: "welcome", param: null }, onboarded, FIRST_RUN),
    ).toStrictEqual({ name: "today", param: null });
  });

  it("resolveRoute needs an active session for session", () => {
    const route = { name: "session", param: null };
    expect(resolveRoute(route, onboarded, ALL)).toStrictEqual({
      name: "today",
      param: null,
    });
    expect(resolveRoute(route, withSession, ALL)).toStrictEqual({
      name: "session",
      param: null,
    });
    expect(resolveRoute(route, withSession, FIRST_RUN)).toStrictEqual({
      name: "today",
      param: null,
    });
  });

  it("resolveRoute sends an unknown movement to progress", () => {
    expect(
      resolveRoute(
        { name: "progress-movement", param: "nope" },
        onboarded,
        ALL,
      ),
    ).toStrictEqual({ name: "progress", param: null });
    expect(
      resolveRoute(
        { name: "progress-movement", param: "push-up" },
        onboarded,
        ALL,
      ),
    ).toStrictEqual({ name: "progress-movement", param: "push-up" });
  });

  it("resolveRoute sends an unregistered name to today", () => {
    expect(
      resolveRoute({ name: "nonsense", param: null }, onboarded, FIRST_RUN),
    ).toStrictEqual({ name: "today", param: null });
    expect(
      resolveRoute({ name: "settings", param: null }, onboarded, FIRST_RUN),
    ).toStrictEqual({ name: "today", param: null });
  });

  it("routeHash writes the canonical hash for every route", () => {
    expect(routeHash({ name: "today", param: null })).toBe("#/today");
    expect(routeHash({ name: "progress-movement", param: "push-up" })).toBe(
      "#/progress/push-up",
    );
    expect(routeHash({ name: "progress-movement", param: "a b" })).toBe(
      "#/progress/a%20b",
    );
    const routes: Route[] = [
      ...[
        "welcome",
        "placement",
        "today",
        "session",
        "progress",
        "settings",
      ].map((name) => ({ name, param: null })),
      { name: "progress-movement", param: "push-up" },
    ];
    for (const route of routes) {
      expect(parseRoute(routeHash(route)), route.name).toStrictEqual(route);
    }
  });
});
