import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  BACKUP_ERRORS,
  BACKUP_FORMAT,
  BACKUP_MAX_BYTES,
  backupFileName,
  buildBackup,
  parseBackup,
} from "../../../../src/lib/tools/workout/backup/backup";
import { APP_VERSION } from "../../../../src/lib/tools/workout/core/version";
import {
  SCHEMA_VERSION,
  defaultState,
} from "../../../../src/lib/tools/workout/storage/schema";
import type {
  AppState,
  SessionRecord,
} from "../../../../src/lib/tools/workout/types";

const EXPORTED_AT = "2026-11-19T10:00:00.000Z";
const STANDALONE_EXPORTED_AT = "2026-11-21T03:00:00.000Z";
const FIXTURE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "standalone-backup-1757a98.json.txt",
);

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

function sessionRecord(date: string, startedAt: number): SessionRecord {
  return {
    id: `${date}T${startedAt}`,
    date,
    dayType: "training",
    startedAt,
    endedAt: startedAt + 900000,
    exercises: [
      {
        movementId: "squat",
        movementName: "Squat",
        variationId: "squat",
        variationName: "Squat",
        pattern: "legs",
        level: 1,
        type: "reps",
        perSide: false,
        plannedSets: 2,
        target: 12,
        restSeconds: 60,
      },
    ],
    steps: [
      {
        exerciseIndex: 0,
        setNumber: 1,
        side: null,
        status: "logged",
        value: 12,
        loggedOn: date,
        reasons: [],
      },
      {
        exerciseIndex: 0,
        setNumber: 2,
        side: null,
        status: "skipped",
        value: null,
        loggedOn: null,
        reasons: ["no-time"],
      },
    ],
    endedEarly: false,
    endReasons: [],
    endMovementId: null,
    changes: [],
  };
}

function backupState(): AppState {
  return {
    ...defaultState(),
    onboarded: true,
    history: [
      sessionRecord("2026-11-10", 1762790000000),
      sessionRecord("2026-11-03", 1762180000000),
      sessionRecord("2026-11-17", 1763390000000),
    ],
  };
}

function envelope(changes: Record<string, unknown> = {}) {
  return {
    format: BACKUP_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    appVersion: APP_VERSION,
    exportedAt: EXPORTED_AT,
    data: backupState(),
    ...changes,
  };
}

const parseEnvelope = (value: unknown) => parseBackup(JSON.stringify(value));

const ERROR_CASES: [string, string, () => unknown][] = [
  [
    "too-large",
    "more than 5,000,000 characters",
    () => parseBackup(" ".repeat(5000001)),
  ],
  ["not-json", "plain text", () => parseBackup("not json")],
  ["not-backup", "an empty object", () => parseBackup("{}")],
  ["not-backup", "an array", () => parseBackup("[]")],
  [
    "not-backup",
    "another format",
    () => parseEnvelope(envelope({ format: "other" })),
  ],
  [
    "not-backup",
    "a text schema version",
    () => parseEnvelope(envelope({ schemaVersion: "1" })),
  ],
  [
    "not-backup",
    "a missing app version",
    () => parseEnvelope(envelope({ appVersion: "" })),
  ],
  [
    "not-backup",
    "a long app version",
    () => parseEnvelope(envelope({ appVersion: "1".repeat(21) })),
  ],
  [
    "not-backup",
    "an unreadable export time",
    () => parseEnvelope(envelope({ exportedAt: "yesterday" })),
  ],
  [
    "not-backup",
    "an overlong export time",
    () =>
      parseEnvelope(
        envelope({ exportedAt: `${EXPORTED_AT}${" ".repeat(20)}` }),
      ),
  ],
  [
    "unsupported-version",
    "a newer envelope version",
    () => parseEnvelope(envelope({ schemaVersion: 99 })),
  ],
  [
    "invalid-data",
    "missing data",
    () => parseEnvelope(envelope({ data: undefined })),
  ],
  [
    "invalid-data",
    "data that is not an object",
    () => parseEnvelope(envelope({ data: [] })),
  ],
  [
    "invalid-data",
    "a data version differing from the envelope",
    () =>
      parseEnvelope(envelope({ data: { ...backupState(), schemaVersion: 2 } })),
  ],
  [
    "invalid-data",
    "a broken field inside data",
    () =>
      parseEnvelope(envelope({ data: { ...backupState(), onboarded: "yes" } })),
  ],
  [
    "not-json",
    "a truncated copy of a valid backup",
    () => {
      const text = buildBackup(backupState(), { exportedAt: EXPORTED_AT });
      return parseBackup(text.slice(0, Math.floor(text.length / 2)));
    },
  ],
];

describe("workout/backup/backup", () => {
  it("constants match the shared contract", () => {
    expect(BACKUP_FORMAT).toBe("sweat-seeker-backup");
    expect(BACKUP_MAX_BYTES).toBe(5000000);
  });

  it("buildBackup writes the versioned envelope around the whole state", () => {
    const text = buildBackup(backupState(), { exportedAt: EXPORTED_AT });
    expect(JSON.parse(text)).toStrictEqual({
      format: "sweat-seeker-backup",
      schemaVersion: 1,
      appVersion: "1.0.0",
      exportedAt: EXPORTED_AT,
      data: backupState(),
    });
    expect(text).toBe(JSON.stringify(JSON.parse(text), null, 2));
  });

  it("a built backup parses back with its state and summary", () => {
    const result = parseBackup(
      buildBackup(backupState(), { exportedAt: EXPORTED_AT }),
    );
    expect(result).toStrictEqual({
      ok: true,
      state: backupState(),
      summary: {
        exportedAt: EXPORTED_AT,
        appVersion: APP_VERSION,
        sessions: 3,
        firstDate: "2026-11-03",
        lastDate: "2026-11-17",
      },
    });
  });

  it("a backup with no history has null summary dates", () => {
    const result = parseBackup(
      buildBackup(defaultState(), { exportedAt: EXPORTED_AT }),
    );
    if (!result.ok) throw new Error(result.error);
    expect(result.state).toStrictEqual(defaultState());
    expect(result.summary).toStrictEqual({
      exportedAt: EXPORTED_AT,
      appVersion: APP_VERSION,
      sessions: 0,
      firstDate: null,
      lastDate: null,
    });
  });

  for (const [error, name, run] of ERROR_CASES) {
    it(`${name} is rejected as ${error}`, () => {
      expect(run()).toStrictEqual({ ok: false, error });
    });
  }

  it("every error code has a message that says nothing changed", () => {
    expect(Object.keys(BACKUP_ERRORS).sort()).toStrictEqual([
      "invalid-data",
      "not-backup",
      "not-json",
      "too-large",
      "unsupported-version",
    ]);
    for (const message of Object.values(BACKUP_ERRORS)) {
      expect(message).toMatch(/Nothing was changed\.$/);
    }
    expect(BACKUP_ERRORS["too-large"]).toBe(
      "That file is too large to be a Workout backup. Nothing was changed.",
    );
    expect(BACKUP_ERRORS["not-json"]).toBe(
      "That file could not be read as JSON. Nothing was changed.",
    );
    expect(BACKUP_ERRORS["not-backup"]).toBe(
      "That file is not a Workout backup. Nothing was changed.",
    );
    expect(BACKUP_ERRORS["unsupported-version"]).toBe(
      "That backup comes from a newer version of Workout. Nothing was changed.",
    );
    expect(BACKUP_ERRORS["invalid-data"]).toBe(
      "That backup is damaged or incomplete. Nothing was changed.",
    );
  });

  it("backupFileName uses the date key", () => {
    expect(backupFileName("2026-11-19")).toBe("workout-backup-2026-11-19.json");
  });

  it("no function mutates its input", () => {
    const state = deepFreeze(backupState());
    const text = buildBackup(state, { exportedAt: EXPORTED_AT });
    const result = parseBackup(text);
    if (!result.ok) throw new Error(result.error);
    expect(result.state).toStrictEqual(state);
    expect(result.state).not.toBe(state);
  });

  it("a 1757a98 standalone backup parses with its summary", () => {
    const result = parseBackup(fs.readFileSync(FIXTURE, "utf8"));
    if (!result.ok) throw new Error(result.error);
    expect(result.summary).toStrictEqual({
      exportedAt: STANDALONE_EXPORTED_AT,
      appVersion: "1.0.0",
      sessions: 13,
      firstDate: "2026-11-07",
      lastDate: "2026-11-20",
    });
  });

  it("the standalone backup state survives validation unchanged", () => {
    const text = fs.readFileSync(FIXTURE, "utf8");
    const result = parseBackup(text);
    if (!result.ok) throw new Error(result.error);
    expect(result.state).toStrictEqual(JSON.parse(text).data);
  });

  it("rebuilding the standalone backup reproduces the file byte for byte", () => {
    const text = fs.readFileSync(FIXTURE, "utf8");
    expect(
      buildBackup(JSON.parse(text).data, {
        exportedAt: STANDALONE_EXPORTED_AT,
      }),
    ).toBe(text);
  });
});
