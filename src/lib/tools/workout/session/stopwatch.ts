import type { Stopwatch } from "../types";

export function newStopwatch(): Stopwatch {
  return { accumulatedMs: 0, runningSince: null };
}

export function startWatch(watch: Stopwatch, at: number): Stopwatch {
  if (watch.runningSince !== null) return watch;
  return { accumulatedMs: watch.accumulatedMs, runningSince: at };
}

export function stopWatch(watch: Stopwatch, at: number): Stopwatch {
  if (watch.runningSince === null) return watch;
  return {
    accumulatedMs: watch.accumulatedMs + Math.max(0, at - watch.runningSince),
    runningSince: null,
  };
}

export function elapsedMs(watch: Stopwatch, at: number): number {
  const open =
    watch.runningSince === null ? 0 : Math.max(0, at - watch.runningSince);
  return watch.accumulatedMs + open;
}
