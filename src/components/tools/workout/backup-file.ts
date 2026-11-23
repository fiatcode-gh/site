import {
  BACKUP_MAX_BYTES,
  backupFileName,
  buildBackup,
  parseBackup,
  type BackupErrorCode,
  type BackupSummary,
} from "@/lib/tools/workout/backup/backup";
import type { AppState, DateKey } from "@/lib/tools/workout/types";

export type BackupFileResult =
  | { ok: true; state: AppState; summary: BackupSummary }
  | { ok: false; error: BackupErrorCode };

export function downloadBackup(
  state: AppState,
  clock: { now(): number; today(): DateKey },
): void {
  const text = buildBackup(state, {
    exportedAt: new Date(clock.now()).toISOString(),
  });
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = backupFileName(clock.today());
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function readBackupFile(file: File): Promise<BackupFileResult> {
  if (file.size > BACKUP_MAX_BYTES) return { ok: false, error: "too-large" };
  let text: string;
  try {
    text = await file.text();
  } catch {
    return { ok: false, error: "not-backup" };
  }
  return parseBackup(text);
}
