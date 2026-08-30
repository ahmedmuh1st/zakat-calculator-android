// Naming for saved calculations.
//
// Ahmed's framing: History should read as a list of yearly projects ("زكاة رمضان
// ١٤٤٧"), not a list of anonymous totals. The name is suggested from the Hijri
// month and year at save time and is editable, so a person who calculates twice
// in a year can tell the two apart.

import { hijriMonthName, type HijriDate } from "./hijri";
import { localizeDigits } from "./numbers";
import { type LocaleCode, usesArabicNumerals } from "../i18n/locales";

/** Longest name we store, to keep History rows readable. */
export const CALC_NAME_MAX_LENGTH = 40;

/**
 * The word "Zakat" as each language writes it. Kept here rather than in the UI
 * dictionary because it is part of stored data: the suggested name is written
 * into the record, so it must not change meaning if the dictionary is reworded.
 */
const ZAKAT_WORD: Record<LocaleCode, string> = {
  en: "Zakat",
  ar: "زكاة",
  id: "Zakat",
  ur: "زکوٰۃ",
  bn: "যাকাত",
  tr: "Zekât",
  fr: "Zakat",
};

/**
 * Suggested name for a calculation saved on the given Hijri date, e.g.
 * "Zakat Ramadan 1447", "زكاة رمضان ١٤٤٧" or "Zekât Ramazan 1447".
 */
export function suggestedCalcName(h: HijriDate, lang: LocaleCode): string {
  const month = hijriMonthName(h.month, lang);
  const word = ZAKAT_WORD[lang] ?? ZAKAT_WORD.en;
  const year = usesArabicNumerals(lang) ? localizeDigits(h.year, lang) : String(h.year);
  return `${word} ${month} ${year}`;
}

/**
 * Cleans user input into a storable name. Collapses whitespace and trims to the
 * length cap. Returns undefined for an effectively empty name, so callers can
 * fall back to the Hijri label rather than storing a blank string.
 */
export function normalizeCalcName(raw: string): string | undefined {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (!cleaned) return undefined;
  return cleaned.slice(0, CALC_NAME_MAX_LENGTH);
}

/**
 * What History should show for a record: its name when it has one, otherwise the
 * Hijri label. Keeps older records, saved before names existed, displaying
 * exactly as they did before.
 */
export function calcDisplayName(record: { name?: string; hijriLabel: string }): string {
  return record.name && record.name.trim() ? record.name : record.hijriLabel;
}
