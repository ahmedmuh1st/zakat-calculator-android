// Pure backup format logic: build, validate, merge. No React Native imports, so the
// rules below can be unit tested directly. The IO half (share sheet, file picker) lives
// in backup.ts, which re-exports everything here.
//
// See BACKUP-FORMAT.md, the contract shared with the iOS app: a user moving between
// platforms must be able to restore the other app's file.
import { isStoredPayment } from "./payments";
import type { AppSnapshot } from "./types";

export const BACKUP_FORMAT_VERSION = 1;
export const APP_TAG = "zakat-calculator";

export interface BackupEnvelope {
  app: string;
  formatVersion: number;
  exportedAt: string;
  exportedFrom: { platform: string; appVersion: string };
  data: AppSnapshot;
}

/**
 * Why these are dropped rather than exported:
 * - `onboarded` / `hasSeenLearn` describe this install, not the user's data. Importing them
 *   would either throw a returning user back into onboarding or rob a newcomer of it.
 * - `fx` is a cached rate table. Restoring month-old rates would silently change converted
 *   totals, so it refetches instead.
 */
export function buildBackup(
  state: AppSnapshot,
  appVersion: string,
  platform: string,
): BackupEnvelope {
  const { onboarded: _o, hasSeenLearn: _l, ...portableSettings } = state.settings;
  return {
    app: APP_TAG,
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    exportedFrom: { platform, appVersion },
    data: {
      settings: portableSettings as AppSnapshot["settings"],
      entries: state.entries,
      deductions: state.deductions,
      prices: state.prices,
      history: state.history,
    },
  };
}

export type BackupError = "not-json" | "not-our-file" | "too-new" | "no-data" | "bad-shape";

export interface ParseOk {
  ok: true;
  envelope: BackupEnvelope;
  /** Counts for the confirm prompt, so the user is told what a restore will do. */
  summary: { entries: number; deductions: number; history: number };
}
export interface ParseFail {
  ok: false;
  error: BackupError;
}

/**
 * Validates completely before anything is applied. A malformed file must change nothing,
 * and the caller needs to know which check failed so it can say so in the user's language.
 */
export function parseBackup(raw: string): ParseOk | ParseFail {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.replace(/^\uFEFF/, ""));
  } catch {
    return { ok: false, error: "not-json" };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "bad-shape" };
  }
  const env = parsed as Partial<BackupEnvelope>;
  if (env.app !== APP_TAG) return { ok: false, error: "not-our-file" };
  const v = Number(env.formatVersion);
  if (!Number.isFinite(v) || v < 1) return { ok: false, error: "bad-shape" };
  // A newer file may carry fields this build cannot represent. Refusing and telling the user
  // to update beats importing a subset and looking like data loss.
  if (v > BACKUP_FORMAT_VERSION) return { ok: false, error: "too-new" };
  const data = env.data;
  if (!data || typeof data !== "object") return { ok: false, error: "no-data" };

  const entries = Array.isArray(data.entries) ? data.entries : null;
  const deductions = Array.isArray(data.deductions) ? data.deductions : null;
  const history = Array.isArray(data.history) ? data.history : null;
  if (!entries || !deductions || !history) return { ok: false, error: "bad-shape" };
  if (!data.settings || typeof data.settings !== "object") {
    return { ok: false, error: "bad-shape" };
  }
  for (const record of history) {
    if (!record || typeof record !== "object" || Array.isArray(record)) continue;
    const payments = (record as { payments?: unknown }).payments;
    if (payments !== undefined && (!Array.isArray(payments) || payments.some((item) => !isStoredPayment(item)))) {
      return { ok: false, error: "bad-shape" };
    }
  }

  return {
    ok: true,
    envelope: env as BackupEnvelope,
    summary: {
      entries: entries.length,
      deductions: deductions.length,
      history: history.length,
    },
  };
}

/**
 * History merges on `id` so importing the same file twice is a no-op, and a restore never
 * destroys records the file happens not to contain. Entries, deductions and settings replace,
 * because they are one in-progress calculation and one set of preferences; merging those would
 * produce a state the user never had.
 */
export function mergeHistory<T extends { id: string; savedAt: string }>(
  current: T[],
  incoming: T[],
  mergeExisting?: (local: T, remote: T) => T,
): { merged: T[]; added: number; skipped: number; updated: number } {
  const indices = new Map(current.map((record, index) => [record.id, index]));
  let added = 0;
  let skipped = 0;
  let updated = 0;
  const merged = [...current];
  for (const rec of incoming) {
    if (!rec || typeof rec.id !== "string") {
      skipped += 1;
      continue;
    }
    const existingIndex = indices.get(rec.id);
    if (existingIndex !== undefined) {
      skipped += 1;
      if (mergeExisting) {
        const existing = merged[existingIndex];
        const next = mergeExisting(existing, rec);
        if (next !== existing) {
          merged[existingIndex] = next;
          updated += 1;
        }
      }
      continue;
    }
    indices.set(rec.id, merged.length);
    merged.push(rec);
    added += 1;
  }
  merged.sort((a, b) => (a.savedAt < b.savedAt ? 1 : a.savedAt > b.savedAt ? -1 : 0));
  return { merged, added, skipped, updated };
}

export function backupFilename(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `zakat-backup-${y}-${m}-${d}.json`;
}

/** Pretty-printed so a curious user can open the file and read it. */
export function serializeBackup(env: BackupEnvelope): string {
  return JSON.stringify(env, null, 2);
}
