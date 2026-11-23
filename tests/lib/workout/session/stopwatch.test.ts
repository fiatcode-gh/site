import { describe, expect, it } from "vitest";
import {
  elapsedMs,
  newStopwatch,
  startWatch,
  stopWatch,
} from "../../../../src/lib/tools/workout/session/stopwatch";

describe("workout/session/stopwatch", () => {
  it("a new stopwatch is stopped at zero", () => {
    expect(newStopwatch()).toStrictEqual({
      accumulatedMs: 0,
      runningSince: null,
    });
    expect(elapsedMs(newStopwatch(), 5000)).toBe(0);
  });

  it("a running watch reads the wall-clock time since it started", () => {
    const watch = startWatch(newStopwatch(), 1000);
    expect(elapsedMs(watch, 4000)).toBe(3000);
  });

  it("pause and resume never lose accumulated time", () => {
    const stopped = stopWatch(startWatch(newStopwatch(), 1000), 8000);
    expect(elapsedMs(stopped, 30000)).toBe(7000);
    const resumed = startWatch(stopped, 60000);
    expect(elapsedMs(resumed, 65000)).toBe(12000);
  });

  it("starting twice and stopping twice are idempotent", () => {
    const running = startWatch(newStopwatch(), 1000);
    expect(startWatch(running, 5000)).toBe(running);
    const stopped = stopWatch(running, 3000);
    expect(stopWatch(stopped, 9000)).toBe(stopped);
    expect(elapsedMs(stopped, 9000)).toBe(2000);
  });

  it("a clock that jumps backwards adds no time", () => {
    const running = startWatch(
      { accumulatedMs: 500, runningSince: null },
      10000,
    );
    expect(elapsedMs(running, 4000)).toBe(500);
    expect(stopWatch(running, 4000)).toStrictEqual({
      accumulatedMs: 500,
      runningSince: null,
    });
  });

  it("no function mutates its argument", () => {
    const fresh = Object.freeze(newStopwatch());
    const running = Object.freeze(startWatch(fresh, 1000));
    expect(fresh).toStrictEqual({ accumulatedMs: 0, runningSince: null });
    const stopped = Object.freeze(stopWatch(running, 2000));
    expect(running).toStrictEqual({ accumulatedMs: 0, runningSince: 1000 });
    elapsedMs(running, 3000);
    startWatch(stopped, 4000);
    expect(stopped).toStrictEqual({ accumulatedMs: 1000, runningSince: null });
  });
});
