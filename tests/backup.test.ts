import { describe, expect, it } from "vitest";

import {
  BACKUP_FORMAT_VERSION,
  backupFilename,
  buildBackup,
  mergeHistory,
  parseBackup,
  serializeBackup,
} from "../lib/zakat/backup-format";
import { mergeCalculationPayments } from "../lib/zakat/payments";
import { AppSnapshot, type SavedCalculation, type ZakatPayment } from "../lib/zakat/types";

function snapshot(): AppSnapshot {
  return {
    settings: {
      language: "ar",
      currency: "SAR",
      nisabStandard: "silver",
      anniversary: { month: 9, day: 1 },
      onboarded: true,
      theme: "dark",
      hasSeenLearn: true,
    },
    entries: [
      {
        categoryId: "cash",
        items: [{ id: "c1", label: "Al Rajhi", amount: 50000 }],
      },
    ],
    deductions: [{ id: "d1", label: "Rent", amount: 2000 }],
    prices: {
      goldPerGram: 300,
      silverPerGram: 4,
      updatedAt: "2026-08-19T00:00:00.000Z",
      source: "live",
    },
    history: [],
  };
}

function record(id: string, savedAt: string) {
  return { id, savedAt } as { id: string; savedAt: string };
}

describe("backup envelope", () => {
  it("tags the file so a foreign JSON cannot be imported by accident", () => {
    const env = buildBackup(snapshot(), "1.0.4", "android");
    expect(env.app).toBe("zakat-calculator");
    expect(env.formatVersion).toBe(BACKUP_FORMAT_VERSION);
    expect(env.exportedFrom).toEqual({ platform: "android", appVersion: "1.0.4" });
  });

  it("excludes install-local flags, so a restore cannot replay or skip onboarding", () => {
    const env = buildBackup(snapshot(), "1.0.4", "android");
    expect("onboarded" in env.data.settings).toBe(false);
    expect("hasSeenLearn" in env.data.settings).toBe(false);
    // Genuine preferences must survive.
    expect(env.data.settings.language).toBe("ar");
    expect(env.data.settings.nisabStandard).toBe("silver");
    expect(env.data.settings.anniversary).toEqual({ month: 9, day: 1 });
  });

  it("excludes cached FX rates so a stale backup cannot change converted totals", () => {
    const env = buildBackup(snapshot(), "1.0.4", "android");
    expect("fx" in env.data).toBe(false);
  });

  it("carries the user's figures and history", () => {
    const snap = snapshot();
    snap.history = [record("h1", "2026-01-01T00:00:00.000Z") as never];
    const env = buildBackup(snap, "1.0.4", "android");
    expect(env.data.entries).toHaveLength(1);
    expect(env.data.deductions).toHaveLength(1);
    expect(env.data.history).toHaveLength(1);
  });

  it("exports exactly the portable payload, no field silently dropped", () => {
    // The iOS build shipped a writer that omitted entries, deductions and prices, so its
    // files passed validation while restoring almost nothing. Asserting the whole key set
    // means adding a field to AppSnapshot without exporting it fails here rather than in
    // a user's restore.
    const snap = snapshot();
    snap.history = [record("h1", "2026-01-01T00:00:00.000Z") as never];
    const env = buildBackup(snap, "1.0.4", "android");

    expect(Object.keys(env.data).sort()).toEqual([
      "deductions",
      "entries",
      "history",
      "prices",
      "settings",
    ]);
    expect(env.data.entries).toEqual(snap.entries);
    expect(env.data.deductions).toEqual(snap.deductions);
    expect(env.data.prices).toEqual(snap.prices);
    expect(env.data.history).toEqual(snap.history);
  });

  it("round trips: what we write, we can read", () => {
    const env = buildBackup(snapshot(), "1.0.4", "android");
    const res = parseBackup(serializeBackup(env));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.summary).toEqual({ entries: 1, deductions: 1, history: 0 });
  });

  it("round trips active payments and deletion tombstones without data loss", () => {
    const snap = snapshot();
    snap.history = [
      {
        id: "calc-1",
        savedAt: "2026-08-27T08:00:00.000Z",
        payments: [
          {
            id: "p1",
            name: "Family fund",
            amount: 500,
            paidAt: "2026-08-27T09:00:00.000Z",
            updatedAt: "2026-08-27T09:00:00.000Z",
          },
          {
            id: "p2",
            name: "Removed payment",
            amount: 250,
            paidAt: "2026-08-27T09:30:00.000Z",
            updatedAt: "2026-08-27T10:00:00.000Z",
            deletedAt: "2026-08-27T10:00:00.000Z",
          },
        ],
      } as SavedCalculation,
    ];
    const result = parseBackup(serializeBackup(buildBackup(snap, "1.0.5", "android")));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.envelope.data.history[0].payments).toEqual(snap.history[0].payments);
  });

  it("is pretty-printed so a curious user can read the file", () => {
    const text = serializeBackup(buildBackup(snapshot(), "1.0.4", "android"));
    expect(text).toContain("\n  ");
  });

  it("names the file by date", () => {
    expect(backupFilename(new Date(2026, 7, 19))).toBe("zakat-backup-2026-08-19.json");
  });
});

describe("backup validation", () => {
  it("rejects text that is not JSON", () => {
    const res = parseBackup("not a file");
    expect(res).toEqual({ ok: false, error: "not-json" });
  });

  it("rejects another app's JSON rather than importing garbage", () => {
    const res = parseBackup(JSON.stringify({ app: "some-other-app", formatVersion: 1, data: {} }));
    expect(res).toEqual({ ok: false, error: "not-our-file" });
  });

  it("refuses a newer format instead of silently dropping fields it cannot read", () => {
    const env = buildBackup(snapshot(), "1.0.4", "ios");
    const future = { ...env, formatVersion: BACKUP_FORMAT_VERSION + 1 };
    expect(parseBackup(JSON.stringify(future))).toEqual({ ok: false, error: "too-new" });
  });

  it("accepts a file written by the other platform", () => {
    const fromIos = buildBackup(snapshot(), "1.0.3", "ios");
    const res = parseBackup(JSON.stringify(fromIos));
    expect(res.ok).toBe(true);
  });

  it("tolerates a BOM, since some editors and cloud drives add one", () => {
    const text = "\uFEFF" + serializeBackup(buildBackup(snapshot(), "1.0.4", "android"));
    expect(parseBackup(text).ok).toBe(true);
  });

  it("rejects a file missing the data block", () => {
    expect(parseBackup(JSON.stringify({ app: "zakat-calculator", formatVersion: 1 }))).toEqual({
      ok: false,
      error: "no-data",
    });
  });

  it("rejects a data block whose arrays are the wrong shape", () => {
    const bad = {
      app: "zakat-calculator",
      formatVersion: 1,
      data: { settings: {}, entries: "nope", deductions: [], history: [] },
    };
    expect(parseBackup(JSON.stringify(bad))).toEqual({ ok: false, error: "bad-shape" });
  });

  it("ignores unknown fields, so a newer minor build's file still imports", () => {
    const env = buildBackup(snapshot(), "1.0.4", "ios") as unknown as Record<string, unknown>;
    env.somethingNew = { added: "later" };
    (env.data as Record<string, unknown>).alsoNew = [1, 2, 3];
    expect(parseBackup(JSON.stringify(env)).ok).toBe(true);
  });

  it("rejects malformed payment records before applying the backup", () => {
    const env = buildBackup(snapshot(), "1.0.5", "ios");
    env.data.history = [
      { id: "calc", savedAt: "2026-08-27T10:00:00Z", payments: [{ id: "bad", amount: 0 }] } as never,
    ];
    expect(parseBackup(JSON.stringify(env))).toEqual({ ok: false, error: "bad-shape" });
  });
});

describe("history merge", () => {
  it("adds records the device does not have", () => {
    const res = mergeHistory(
      [record("a", "2026-01-01T00:00:00.000Z")],
      [record("b", "2025-01-01T00:00:00.000Z")],
    );
    expect(res.added).toBe(1);
    expect(res.merged.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("is a no-op when the same file is imported twice", () => {
    const current = [record("a", "2026-01-01T00:00:00.000Z")];
    const once = mergeHistory(current, [record("a", "2026-01-01T00:00:00.000Z")]);
    expect(once.added).toBe(0);
    expect(once.skipped).toBe(1);
    expect(once.merged).toHaveLength(1);
  });

  it("never overwrites an existing record with the incoming one", () => {
    const current = [{ id: "a", savedAt: "2026-01-01T00:00:00.000Z", name: "mine" }];
    const res = mergeHistory(current, [
      { id: "a", savedAt: "2026-01-01T00:00:00.000Z", name: "theirs" },
    ]);
    expect(res.merged[0].name).toBe("mine");
  });

  it("sorts newest first after merging", () => {
    const res = mergeHistory(
      [record("mid", "2025-06-01T00:00:00.000Z")],
      [record("old", "2024-01-01T00:00:00.000Z"), record("new", "2026-06-01T00:00:00.000Z")],
    );
    expect(res.merged.map((r) => r.id)).toEqual(["new", "mid", "old"]);
  });

  it("skips malformed incoming records instead of throwing", () => {
    const res = mergeHistory([], [null as never, record("ok", "2026-01-01T00:00:00.000Z")]);
    expect(res.added).toBe(1);
    expect(res.skipped).toBe(1);
  });

  it("keeps local calculation facts while merging newer payment edits", () => {
    const localPayment: ZakatPayment = {
      id: "p1",
      name: "Local name",
      amount: 100,
      paidAt: "2026-08-27T09:00:00Z",
      updatedAt: "2026-08-27T09:00:00Z",
    };
    const remotePayment: ZakatPayment = {
      ...localPayment,
      name: "Updated name",
      amount: 175,
      updatedAt: "2026-08-27T10:00:00Z",
    };
    const local = {
      id: "calc",
      savedAt: "2026-08-27T08:00:00Z",
      name: "Mine",
      payments: [localPayment],
    } as SavedCalculation;
    const remote = { ...local, name: "Theirs", payments: [remotePayment] };
    const result = mergeHistory(
      [local],
      [remote],
      (mine, theirs) => mergeCalculationPayments(mine, theirs).calculation,
    );
    expect(result).toMatchObject({ added: 0, skipped: 1, updated: 1 });
    expect(result.merged[0].name).toBe("Mine");
    expect(result.merged[0].payments?.[0]).toMatchObject({
      name: "Updated name",
      amount: 175,
    });
  });
});
