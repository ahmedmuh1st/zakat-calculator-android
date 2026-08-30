// Locale registry: the single place that knows what a language *is*.
//
// Before this file, the app decided everything from `language === "ar"`: the dictionary,
// the text direction, the digit system. That works for exactly two languages and breaks on
// the third, because Urdu is right-to-left too. Direction is a property of a locale, not a
// synonym for Arabic.
//
// Anything that varies per language belongs here, so adding a language is one entry plus a
// dictionary rather than a hunt through conditionals.

export type LocaleCode = "en" | "ar" | "id" | "ur" | "bn" | "tr" | "fr";

export type Direction = "ltr" | "rtl";

/** Which digit glyphs to render numbers with. */
export type NumeralSystem = "latn" | "arab";

export interface LocaleMeta {
  code: LocaleCode;
  /** Name in the language itself, as shown in the picker. Never translated. */
  endonym: string;
  /** English name, for logs, tests and store metadata. */
  englishName: string;
  direction: Direction;
  numerals: NumeralSystem;
  /** BCP 47 tag for Intl number and date formatting. */
  intlTag: string;
}

// Order is the order shown in the picker: the two authored languages first, then the added
// ones by Muslim population. Deliberately not alphabetical, which would bury Arabic.
export const LOCALES: LocaleMeta[] = [
  { code: "en", endonym: "English", englishName: "English", direction: "ltr", numerals: "latn", intlTag: "en" },
  { code: "ar", endonym: "العربية", englishName: "Arabic", direction: "rtl", numerals: "arab", intlTag: "ar" },
  { code: "id", endonym: "Bahasa Indonesia", englishName: "Indonesian", direction: "ltr", numerals: "latn", intlTag: "id" },
  { code: "ur", endonym: "اردو", englishName: "Urdu", direction: "rtl", numerals: "latn", intlTag: "ur" },
  { code: "bn", endonym: "বাংলা", englishName: "Bengali", direction: "ltr", numerals: "latn", intlTag: "bn" },
  { code: "tr", endonym: "Türkçe", englishName: "Turkish", direction: "ltr", numerals: "latn", intlTag: "tr" },
  { code: "fr", endonym: "Français", englishName: "French", direction: "ltr", numerals: "latn", intlTag: "fr" },
];

const BY_CODE: Record<LocaleCode, LocaleMeta> = LOCALES.reduce(
  (acc, meta) => {
    acc[meta.code] = meta;
    return acc;
  },
  {} as Record<LocaleCode, LocaleMeta>,
);

export const DEFAULT_LOCALE: LocaleCode = "en";

export function localeMeta(code: LocaleCode): LocaleMeta {
  return BY_CODE[code] ?? BY_CODE[DEFAULT_LOCALE];
}

/** True when the locale is written right to left. Arabic and Urdu today. */
export function isRtlLocale(code: LocaleCode): boolean {
  return localeMeta(code).direction === "rtl";
}

/**
 * True when numbers should render with Arabic-Indic glyphs (٠١٢).
 *
 * Only Arabic. Urdu and Bengali have their own digit forms, but financial apps in Pakistan
 * and Bangladesh overwhelmingly display Western digits, and a Zakat total is a financial
 * figure people cross-check against a bank app. Matches the iOS session's decision so the
 * two platforms format identically.
 */
export function usesArabicNumerals(code: LocaleCode): boolean {
  return localeMeta(code).numerals === "arab";
}

/** Narrow an unknown stored value to a supported locale, falling back to English. */
export function asLocale(value: unknown): LocaleCode {
  return typeof value === "string" && value in BY_CODE ? (value as LocaleCode) : DEFAULT_LOCALE;
}

/**
 * Intl tag for formatting a date in this locale. Arabic gets the Arabic-Indic numeral
 * extension so date digits match the money digits beside them; every other locale uses
 * its plain tag.
 */
export function dateTag(code: LocaleCode): string {
  const meta = localeMeta(code);
  return usesArabicNumerals(code) ? `${meta.intlTag}-SA-u-nu-arab` : meta.intlTag;
}
