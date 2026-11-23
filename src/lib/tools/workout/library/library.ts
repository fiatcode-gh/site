import type { Movement, PlacedVariation, Variation } from "../types";
import { BACK } from "./movements/back";
import { CONDITIONING } from "./movements/conditioning";
import { CORE } from "./movements/core";
import { LEGS } from "./movements/legs";
import { PUSH } from "./movements/push";
import type { Pattern } from "./patterns";

export type MovementRow = {
  id: string;
  pattern: Pattern;
  name: string;
  startLevels: number[];
  variations: [id: string, name: string, work: string, cue: string][];
};

const WORK = /^(R|H) (\d+)-(\d+)( \/side)?$/;

function toVariation([
  id,
  name,
  work,
  cue,
]: MovementRow["variations"][number]): Variation {
  const match = WORK.exec(work);
  if (!match) throw new Error(`Bad work spec for ${id}: ${work}`);
  return {
    id,
    name,
    cue,
    type: match[1] === "H" ? "hold" : "reps",
    min: Number(match[2]),
    max: Number(match[3]),
    perSide: Boolean(match[4]),
  };
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export const MOVEMENTS: readonly Movement[] = deepFreeze(
  [...PUSH, ...LEGS, ...CORE, ...BACK, ...CONDITIONING].map((row) => ({
    id: row.id,
    pattern: row.pattern,
    name: row.name,
    startLevels: row.startLevels,
    variations: row.variations.map(toVariation),
  })),
);

const byId = new Map(MOVEMENTS.map((m) => [m.id, m]));

const variationsById = new Map<string, PlacedVariation>(
  MOVEMENTS.flatMap((m) =>
    m.variations.map(
      (v, level) =>
        [v.id, Object.freeze({ ...v, movementId: m.id, level })] as const,
    ),
  ),
);

export function movementsFor(pattern: Pattern): Movement[] {
  return MOVEMENTS.filter((m) => m.pattern === pattern);
}

export function movement(id: string): Movement | undefined {
  return byId.get(id);
}

export function variationAt(
  movementId: string,
  level: number,
): Variation | undefined {
  const found = byId.get(movementId);
  if (!found || !Number.isInteger(level)) return undefined;
  return found.variations[level];
}

export function variation(variationId: string): PlacedVariation | undefined {
  return variationsById.get(variationId);
}
