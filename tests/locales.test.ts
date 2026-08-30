// Locale registry invariants.
//
// The point of these tests is that adding a language should be one registry entry plus a
// dictionary, and anything the app derives from a locale should come from the registry. If a
// future round infers direction from `=== "ar"` again, or ships a dictionary with a missing
// key, this file fails.

import { describe, expect, it } from "vitest";

import { dictionaryFor, translatedLocales } from "../lib/i18n/dictionaries";
import { en } from "../lib/i18n/en";
import {
  asLocale,
  DEFAULT_LOCALE,
  isRtlLocale,
  LOCALES,
  localeMeta,
  usesArabicNumerals,
  type LocaleCode,
} from "../lib/i18n/locales";
import { suggestedCalcName } from "../lib/zakat/calc-name";
import { formatHijri, formatHijriWithLabel, hijriMonthName } from "../lib/zakat/hijri";
import { formatNumericText, localizeDigits } from "../lib/zakat/numbers";

const ALL_CODES = LOCALES.map((l) => l.code);

describe("locale registry", () => {
  it("has no duplicate codes", () => {
    expect(new Set(ALL_CODES).size).toBe(ALL_CODES.length);
  });

  it("gives every locale a non-empty endonym and Intl tag", () => {
    for (const meta of LOCALES) {
      expect(meta.endonym.trim(), `endonym for ${meta.code}`).not.toBe("");
      expect(meta.englishName.trim(), `englishName for ${meta.code}`).not.toBe("");
      expect(meta.intlTag.trim(), `intlTag for ${meta.code}`).not.toBe("");
    }
  });

  it("marks Arabic and Urdu right-to-left and the rest left-to-right", () => {
    // The specific bug this guards: Urdu is RTL, so direction is not a synonym for Arabic.
    expect(isRtlLocale("ar")).toBe(true);
    expect(isRtlLocale("ur")).toBe(true);
    expect(isRtlLocale("en")).toBe(false);
    expect(isRtlLocale("id")).toBe(false);
    expect(isRtlLocale("bn")).toBe(false);
    expect(isRtlLocale("tr")).toBe(false);
    expect(isRtlLocale("fr")).toBe(false);
  });

  it("uses Arabic-Indic digits for Arabic only", () => {
    // Urdu and Bengali read financial figures in Western digits; matches iOS.
    expect(usesArabicNumerals("ar")).toBe(true);
    for (const code of ALL_CODES.filter((c) => c !== "ar")) {
      expect(usesArabicNumerals(code), `numerals for ${code}`).toBe(false);
    }
  });

  it("falls back to English for unknown or malformed stored values", () => {
    expect(asLocale("de")).toBe(DEFAULT_LOCALE);
    expect(asLocale(null)).toBe(DEFAULT_LOCALE);
    expect(asLocale(42)).toBe(DEFAULT_LOCALE);
    expect(asLocale("ur")).toBe("ur");
  });

  it("returns the English meta rather than undefined for a bad code", () => {
    expect(localeMeta("zz" as LocaleCode).code).toBe(DEFAULT_LOCALE);
  });
});

describe("dictionaries", () => {
  it("gives every locale a dictionary object, falling back to English", () => {
    for (const code of ALL_CODES) {
      expect(dictionaryFor(code), `dictionary for ${code}`).toBeTruthy();
    }
  });

  it("has every key of the English dictionary in each shipped dictionary", () => {
    const expected = Object.keys(en).sort();
    for (const code of translatedLocales()) {
      const actual = Object.keys(dictionaryFor(code)).sort();
      expect(actual, `keys for ${code}`).toEqual(expected);
    }
  });

  it("has no empty string values in any shipped dictionary", () => {
    // A translation unit that comes back structurally present but blank renders as an
    // invisible label. The iOS session hit exactly this with Bengali.
    for (const code of translatedLocales()) {
      const dict = dictionaryFor(code) as Record<string, unknown>;
      const blanks = Object.keys(dict).filter(
        (key) => typeof dict[key] === "string" && !(dict[key] as string).trim(),
      );
      expect(blanks, `blank values in ${code}`).toEqual([]);
    }
  });
});

describe("locale-derived formatting works for every locale", () => {
  const hijri = { year: 1447, month: 9, day: 17 };

  it("names Hijri months without returning undefined", () => {
    for (const code of ALL_CODES) {
      expect(hijriMonthName(hijri.month, code), `month name for ${code}`).toBeTruthy();
    }
  });

  it("formats Hijri dates and labels for every locale", () => {
    for (const code of ALL_CODES) {
      // Arabic renders the year in Arabic-Indic glyphs, so assert the year is present in
      // whichever digit script the locale uses rather than assuming Western digits.
      const expectedYear = localizeDigits(hijri.year, code);
      expect(formatHijri(hijri, code), `formatHijri for ${code}`).toContain(expectedYear);
      const labelled = formatHijriWithLabel(hijri, code, "Today");
      expect(labelled.startsWith("Today"), `label order for ${code}`).toBe(true);
    }
  });

  it("uses the Arabic comma in right-to-left locales", () => {
    expect(formatHijriWithLabel(hijri, "ar", "اليوم")).toContain("،");
    expect(formatHijriWithLabel(hijri, "ur", "آج")).toContain("،");
    expect(formatHijriWithLabel(hijri, "en", "Today")).toContain(",");
  });

  it("suggests a calculation name in every locale", () => {
    for (const code of ALL_CODES) {
      const name = suggestedCalcName(hijri, code);
      expect(name.trim(), `suggested name for ${code}`).not.toBe("");
      expect(name.includes("undefined"), `undefined leaked into ${code} name`).toBe(false);
    }
  });

  it("formats numbers without leaking Arabic digits into non-Arabic locales", () => {
    for (const code of ALL_CODES.filter((c) => c !== "ar")) {
      expect(localizeDigits(1447, code), `digits for ${code}`).toBe("1447");
      expect(/[٠-٩]/.test(formatNumericText("150000", code)), `grouped digits for ${code}`).toBe(false);
    }
    expect(localizeDigits(1447, "ar")).toBe("١٤٤٧");
  });
});
