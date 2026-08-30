// Every locale must carry the backup strings. The Dict type already enforces presence at
// compile time, but a generated dictionary can satisfy the type by copying English, which
// ships untranslated UI to a user who chose Urdu. These checks catch that.
import { describe, expect, it } from "vitest";

import { dictionaryFor } from "../lib/i18n/dictionaries";
import { LOCALES } from "../lib/i18n/locales";

const BACKUP_KEYS = [
  "backup",
  "backupAuto",
  "backupAutoOn",
  "backupAutoHint",
  "backupSaveCopy",
  "backupSaveCopyHint",
  "backupRestore",
  "backupRestoreHint",
  "backupRestoreTitle",
  "backupRestoreConfirm",
  "backupSaveDone",
  "backupErrorNotJson",
  "backupErrorNotOurs",
  "backupErrorTooNew",
  "backupErrorBadShape",
  "backupErrorFailed",
] as const;

describe("backup strings", () => {
  for (const meta of LOCALES) {
    const dict = dictionaryFor(meta.code) as unknown as Record<string, unknown>;

    it(`${meta.englishName} defines every backup string`, () => {
      for (const key of BACKUP_KEYS) {
        const value = dict[key];
        expect(typeof value, `${meta.code}.${key}`).toBe("string");
        expect((value as string).trim().length, `${meta.code}.${key}`).toBeGreaterThan(0);
      }
    });

    it(`${meta.englishName} formats the restore prompt and result`, () => {
      const body = dict.backupRestoreBody as (a: string, b: string, c: string) => string;
      const done = dict.backupRestoreDone as (a: string) => string;
      expect(typeof body).toBe("function");
      expect(typeof done).toBe("function");
      const rendered = body("7", "3", "1 Jan 2026");
      expect(rendered).toContain("7");
      expect(rendered).toContain("3");
      expect(rendered).toContain("1 Jan 2026");
      expect(done("2")).toContain("2");
    });

    if (meta.code !== "en") {
      it(`${meta.englishName} translates the backup rows rather than copying English`, () => {
        const en = dictionaryFor("en") as unknown as Record<string, unknown>;
        // Row titles and bodies are prose, so an exact match with English means untranslated.
        // Short labels are excluded: "Backup" is a loanword in several of these languages.
        for (const key of ["backupAutoOn", "backupSaveCopyHint", "backupRestoreHint"]) {
          expect(dict[key], `${meta.code}.${key}`).not.toBe(en[key]);
        }
      });
    }
  }

  it("the privacy copy no longer claims data never leaves the device", () => {
    const en = dictionaryFor("en") as unknown as Record<string, string>;
    expect(en.privacyBody.toLowerCase()).not.toContain("never leaves");
    expect(en.privacyBody).toMatch(/backup/i);
    expect(en.privacyPolicyBody).toMatch(/backup/i);
  });
});
