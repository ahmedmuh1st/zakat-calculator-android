// Locale-aware numeric input utilities.
// - Accept Arabic-Indic (٠١٢٣٤٥٦٧٨٩) and Extended Arabic (۰۱۲۳۴۵۶۷۸۹) digits everywhere.
// - Normalize Arabic decimal (٫) and thousands (٬) separators.
// - Format with grouping separators live while typing.

import { type LocaleCode, usesArabicNumerals } from "../i18n/locales";

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const EXTENDED_ARABIC = "۰۱۲۳۴۵۶۷۸۹";

/**
 * Render an integer (or numeric string) using the digit script of the given
 * locale. Arabic uses Arabic-Indic digits so numbers never mix scripts inside
 * one sentence, which is what caused Western digits to appear next to
 * Arabic-Indic ones on the home screen.
 *
 * Only Arabic gets Arabic-Indic glyphs. Urdu and Bengali have their own digit
 * forms, but a Zakat total is a financial figure people cross-check against a
 * bank app, and banking apps in Pakistan and Bangladesh use Western digits.
 */
export function localizeDigits(value: number | string, locale: LocaleCode): string {
  const text = typeof value === "number" ? String(value) : value;
  if (!usesArabicNumerals(locale)) return text;
  return text.replace(/[0-9]/g, (d) => ARABIC_INDIC[parseInt(d, 10)]);
}

/** Convert any Arabic-Indic/Extended digits to ASCII and normalize separators. */
export function normalizeDigits(input: string): string {
  let out = "";
  for (const ch of input) {
    const ai = ARABIC_INDIC.indexOf(ch);
    const ea = EXTENDED_ARABIC.indexOf(ch);
    if (ai >= 0) out += String(ai);
    else if (ea >= 0) out += String(ea);
    else if (ch === "٫") out += "."; // Arabic decimal separator
    else if (ch === "٬" || ch === "،") out += ""; // Arabic thousands separator / comma → strip
    else out += ch;
  }
  return out;
}

/** Parse user text (any digit script, with grouping separators) into a number. NaN-safe → 0. */
export function parseAmount(text: string): number {
  const normalized = normalizeDigits(text).replace(/,/g, "").replace(/\s/g, "");
  const n = parseFloat(normalized);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * Clean raw input into a canonical ASCII numeric string (digits + at most one dot),
 * preserving a trailing dot so the user can keep typing decimals.
 */
export function cleanNumericText(text: string): string {
  const normalized = normalizeDigits(text).replace(/[^0-9.]/g, "");
  const firstDot = normalized.indexOf(".");
  if (firstDot === -1) return normalized;
  // keep only the first dot
  return normalized.slice(0, firstDot + 1) + normalized.slice(firstDot + 1).replace(/\./g, "");
}

/** Format a canonical numeric string with locale grouping separators for display while typing. */
export function formatNumericText(canonical: string, locale: LocaleCode): string {
  if (!canonical) return "";
  const [intPart, decPart] = canonical.split(".");
  const intNum = parseInt(intPart || "0", 10);
  const arabicDigits = usesArabicNumerals(locale);
  const grouped = Number.isFinite(intNum)
    ? intNum.toLocaleString(arabicDigits ? "ar-SA" : "en-US", { useGrouping: true, maximumFractionDigits: 0 })
    : intPart;
  if (canonical.includes(".")) {
    const decDisplay =
      arabicDigits
        ? (decPart ?? "").replace(/[0-9]/g, (d) => ARABIC_INDIC[parseInt(d, 10)])
        : (decPart ?? "");
    return `${grouped}${arabicDigits ? "٫" : "."}${decDisplay}`;
  }
  return grouped;
}
