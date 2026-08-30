// Hijri calendar utilities using Intl islamic-umalqura calendar (built into JS engines).

import { localizeDigits } from "./numbers";
import { isRtlLocale, type LocaleCode, usesArabicNumerals } from "../i18n/locales";

export interface HijriDate {
  year: number;
  month: number; // 1-12
  day: number;
}

const HIJRI_MONTHS_EN = [
  "Muharram",
  "Safar",
  "Rabi' al-Awwal",
  "Rabi' al-Thani",
  "Jumada al-Ula",
  "Jumada al-Akhirah",
  "Rajab",
  "Sha'ban",
  "Ramadan",
  "Shawwal",
  "Dhu al-Qi'dah",
  "Dhu al-Hijjah",
];

const HIJRI_MONTHS_AR = [
  "محرم",
  "صفر",
  "ربيع الأول",
  "ربيع الآخر",
  "جمادى الأولى",
  "جمادى الآخرة",
  "رجب",
  "شعبان",
  "رمضان",
  "شوال",
  "ذو القعدة",
  "ذو الحجة",
];

/**
 * Hijri month name for a locale.
 *
 * Arabic gets the Arabic script. Every other locale gets the transliteration
 * ("Ramadan", "Sha'ban"), which is what the months are called in Indonesian,
 * Urdu, Bengali, Turkish and French anyway — these are proper nouns carried
 * over from Arabic, not words each language translates differently. Turkish
 * spells a few of them its own way, but the transliteration is universally
 * recognised and mis-spelling a sacred month would be worse than not
 * localising it.
 */
export function hijriMonthName(month: number, lang: LocaleCode): string {
  const arr = lang === "ar" ? HIJRI_MONTHS_AR : HIJRI_MONTHS_EN;
  return arr[Math.min(Math.max(month, 1), 12) - 1];
}

export function toHijri(date: Date): HijriDate {
  const fmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day") };
}

export function formatHijri(h: HijriDate, lang: LocaleCode): string {
  const m = hijriMonthName(h.month, lang);
  if (usesArabicNumerals(lang)) {
    const day = localizeDigits(h.day, lang);
    const year = localizeDigits(h.year, lang);
    return `${day} ${m} ${year}هـ`;
  }
  return `${h.day} ${m} ${h.year} AH`;
}

/**
 * "Today, 17 Safar 1448 AH" as a single string.
 *
 * The home screen used to join the label and the date with a raw "·" inside a
 * bidirectional text run, which iOS reordered into a stray glyph before the
 * day number in Arabic. Building one string with a plain comma keeps the run
 * unambiguous in both directions. Urdu is right-to-left too, so it takes the
 * Arabic comma for the same reason.
 */
export function formatHijriWithLabel(h: HijriDate, lang: LocaleCode, todayLabel: string): string {
  const separator = isRtlLocale(lang) ? "،" : ",";
  return `${todayLabel}${separator} ${formatHijri(h, lang)}`;
}

/** Days from today until the next occurrence of a Hijri month/day anniversary. */
export function daysUntilAnniversary(month: number, day: number, from: Date = new Date()): number {
  // Walk forward day-by-day (bounded by ~355*2 days) until hijri m/d matches.
  const probe = new Date(from);
  probe.setHours(12, 0, 0, 0);
  for (let i = 0; i <= 710; i++) {
    const h = toHijri(probe);
    if (h.month === month && h.day === day) return i;
    probe.setDate(probe.getDate() + 1);
  }
  return -1;
}
