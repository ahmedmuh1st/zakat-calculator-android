// Coverage guard for the seven-locale set.
//
// The failure this exists to stop: a translation unit comes back structurally valid but empty,
// or a new UI string is added in English and the other six dictionaries silently fall back.
// Both ship as blank or English labels rather than a crash, so only a test catches them.
import { describe, expect, it } from "vitest";

import { FAQ_CATEGORIES, FAQ_ITEMS } from "../lib/content/faq";
import { FAQ_CATEGORY_TRANSLATIONS, FAQ_TRANSLATIONS, LEARN_TRANSLATIONS } from "../lib/content/translations";
import { LEARN_CARDS } from "../lib/content/zakatonomics";
import { missingContentIds } from "../lib/i18n/content";
import { dictionaryFor, translatedLocales } from "../lib/i18n/dictionaries";
import { en } from "../lib/i18n/en";
import { LOCALES, type LocaleCode } from "../lib/i18n/locales";

/** Locales that must be fully translated, i.e. everything except the English source. */
const TRANSLATED: LocaleCode[] = LOCALES.map((l) => l.code).filter((c) => c !== "en");

/** Arabic-Indic and Extended Arabic-Indic digits back to ASCII, for assertions only. */
function toWesternDigits(value: string): string {
  return value.replace(/[\u0660-\u0669\u06f0-\u06f9]/g, (ch) => {
    const code = ch.charCodeAt(0);
    const base = code >= 0x06f0 ? 0x06f0 : 0x0660;
    return String(code - base);
  });
}

describe("locale registry is complete", () => {
  it("ships a dictionary for every registered locale", () => {
    const withDicts = translatedLocales().sort();
    expect(withDicts).toEqual(LOCALES.map((l) => l.code).sort());
  });

  it("has all seven locales", () => {
    expect(LOCALES).toHaveLength(7);
  });
});

describe.each(TRANSLATED)("dictionary: %s", (code) => {
  const dict = dictionaryFor(code) as Record<string, unknown>;
  const source = en as unknown as Record<string, unknown>;

  it("has every key English has", () => {
    const missing = Object.keys(source).filter((k) => !(k in dict));
    expect(missing).toEqual([]);
  });

  it("has no blank or whitespace-only strings", () => {
    const blank = Object.entries(dict)
      .filter(([, v]) => typeof v === "string" && !(v as string).trim())
      .map(([k]) => k);
    expect(blank).toEqual([]);
  });

  it("keeps every interpolated string a function of the right arity", () => {
    const fnKeys = Object.entries(source)
      .filter(([, v]) => typeof v === "function")
      .map(([k]) => k);
    // sanity: the source really does have interpolated strings to check
    expect(fnKeys.length).toBeGreaterThan(0);
    for (const key of fnKeys) {
      expect(typeof dict[key], `${code}.${key}`).toBe("function");
      expect((dict[key] as () => void).length, `${code}.${key} arity`).toBe(
        (source[key] as () => void).length,
      );
    }
  });

  it("renders interpolated strings with their arguments substituted", () => {
    const d = dict as unknown as typeof en;
    // A dropped placeholder reads as a complete sentence to a reviewer, so assert the value
    // lands. Arabic renders the count in Arabic-Indic digits (١٢), which is correct, so
    // normalise before comparing rather than weakening the assertion.
    expect(toWesternDigits(d.daysToZakat(12))).toContain("12");
    expect(d.nisabThreshold("gold")).toContain("gold");
    expect(d.purifyMsg("1,000")).toContain("1,000");
    expect(d.karatPurityNote("22k", "91.7%")).toContain("22k");
    expect(d.karatPurityNote("22k", "91.7%")).toContain("91.7%");
    expect(d.nisabExplainerShort("silver", "2,500")).toContain("2,500");
  });

  it("has twelve Hijri month names", () => {
    const months = (dict as unknown as typeof en).hijriMonths;
    expect(months).toHaveLength(12);
    expect(months.filter((m) => !m.trim())).toEqual([]);
  });

  it("does not leak prompt or placeholder artefacts", () => {
    const bad = /(\[BN\]|\[UR\]|\[TR\]|\[FR\]|\[ID\]|TODO|undefined|please share|i'm ready|as an ai)/i;
    const leaks = Object.entries(dict)
      .filter(([, v]) => typeof v === "string" && bad.test(v as string))
      .map(([k]) => k);
    expect(leaks).toEqual([]);
  });

  it("keeps the support email intact", () => {
    expect((dict as unknown as typeof en).contactEmail).toBe(en.contactEmail);
  });
});

describe.each(TRANSLATED.filter((c) => c !== "ar"))("content: %s", (code) => {
  it("translates every FAQ item", () => {
    const missing = missingContentIds(
      FAQ_TRANSLATIONS,
      code,
      FAQ_ITEMS.map((i) => i.id),
      ["q", "a"],
    );
    expect(missing).toEqual([]);
  });

  it("translates every Learn card", () => {
    const missing = missingContentIds(
      LEARN_TRANSLATIONS,
      code,
      LEARN_CARDS.map((card) => card.id),
      ["title", "body"],
    );
    expect(missing).toEqual([]);
  });

  it("translates every FAQ topic label", () => {
    const missing = missingContentIds(
      FAQ_CATEGORY_TRANSLATIONS,
      code,
      FAQ_CATEGORIES.map((category) => category.id),
      ["label"],
    );
    expect(missing).toEqual([]);
  });
});
