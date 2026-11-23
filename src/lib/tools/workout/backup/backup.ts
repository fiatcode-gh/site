import { APP_VERSION } from "../core/version";
import { SCHEMA_VERSION, migrateState, validateState } from "../storage/schema";
import type { AppState, DateKey } from "../types";

export const BACKUP_FORMAT = "sweat-seeker-backup";
export const BACKUP_MAX_BYTES = 5_000_000;

export type BackupErrorCode =
  | "too-large"
  | "not-json"
  | "not-backup"
  | "unsupported-version"
  | "invalid-data";

export interface BackupSummary {
  exportedAt: string;
  appVersion: string;
  sessions: number;
  firstDate: DateKey | null;
  lastDate: DateKey | null;
}

export const BACKUP_ERRORS: Readonly<Record<BackupErrorCode, string>> =
  Object.freeze({
    "too-large":
      "That file is too large to be a Workout backup. Nothing was changed.",
    "not-json": "That file could not be read as JSON. Nothing was changed.",
    "not-backup": "That file is not a Workout backup. Nothing was changed.",
    "unsupported-version":
      "That backup comes from a newer version of Workout. Nothing was changed.",
    "invalid-data":
      "That backup is damaged or incomplete. Nothing was changed.",
  });

interface Envelope {
  format: typeof BACKUP_FORMAT;
  schemaVersion: number;
  appVersion: string;
  exportedAt: string;
}

type Obj = Record<string, unknown>;

export function buildBackup(
  state: AppState,
  { exportedAt }: { exportedAt: string },
): string {
  return JSON.stringify(
    {
      format: BACKUP_FORMAT,
      schemaVersion: SCHEMA_VERSION,
      appVersion: APP_VERSION,
      exportedAt,
      data: state,
    },
    null,
    2,
  );
}

export function backupFileName(dateKey: DateKey): string {
  return `workout-backup-${dateKey}.json`;
}

function isPlainObject(value: unknown): value is Obj {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function own(obj: Obj, key: string): unknown {
  return Object.hasOwn(obj, key) ? obj[key] : undefined;
}

function isEnvelope(value: unknown): value is Obj & Envelope {
  if (!isPlainObject(value)) return false;
  const version = own(value, "schemaVersion");
  const appVersion = own(value, "appVersion");
  const exportedAt = own(value, "exportedAt");
  return (
    own(value, "format") === BACKUP_FORMAT &&
    typeof version === "number" &&
    Number.isInteger(version) &&
    version >= 1 &&
    typeof appVersion === "string" &&
    appVersion.length >= 1 &&
    appVersion.length <= 20 &&
    typeof exportedAt === "string" &&
    exportedAt.length <= 40 &&
    !Number.isNaN(Date.parse(exportedAt))
  );
}

const failure = (error: BackupErrorCode) => ({ ok: false as const, error });

function summarize(envelope: Envelope, state: AppState): BackupSummary {
  const dates = state.history.map((r) => r.date).sort();
  return {
    exportedAt: envelope.exportedAt,
    appVersion: envelope.appVersion,
    sessions: state.history.length,
    firstDate: dates.length ? dates[0]! : null,
    lastDate: dates.length ? dates[dates.length - 1]! : null,
  };
}

export function parseBackup(
  text: string,
):
  | { ok: true; state: AppState; summary: BackupSummary }
  | { ok: false; error: BackupErrorCode } {
  if (text.length > BACKUP_MAX_BYTES) return failure("too-large");
  let envelope: unknown;
  try {
    envelope = JSON.parse(text);
  } catch {
    return failure("not-json");
  }
  if (!isEnvelope(envelope)) return failure("not-backup");
  if (envelope.schemaVersion > SCHEMA_VERSION) {
    return failure("unsupported-version");
  }
  const data = own(envelope, "data");
  if (
    !isPlainObject(data) ||
    own(data, "schemaVersion") !== envelope.schemaVersion
  ) {
    return failure("invalid-data");
  }
  const migrated = migrateState(data);
  if (!migrated.ok) {
    return failure(
      migrated.error === "unsupported" ? "unsupported-version" : "invalid-data",
    );
  }
  const validated = validateState(migrated.raw);
  if (!validated.ok) return failure("invalid-data");
  return {
    ok: true,
    state: validated.state,
    summary: summarize(envelope, validated.state),
  };
}
