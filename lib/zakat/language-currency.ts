// What should happen to the currency when the user changes the app language.
//
// Ahmed's report, from the iOS round: he switched the app to Urdu and the total stayed in
// Riyal. Switching to Arabic asked nothing at all. A Zakat total in the wrong currency is not
// a cosmetic problem, it is a wrong number.
//
// He first proposed opening the currency list after every language change. That was rejected,
// with his agreement (option A), for a specific reason: a Saudi user on Riyal who switches to
// Arabic already has the right currency, so the sheet would be asking him to re-confirm a
// correct answer, every time. Nagging people who are already right is how a helpful prompt
// turns into a thing users learn to dismiss without reading.
//
// So the rule keys off what a language can honestly tell us:
//
//   Single-country language  -> set the currency silently. Indonesian means Rupiah.
//   Two plausible countries  -> ask, with just those two. Urdu is Pakistan or India.
//   Many countries           -> open the full list. Arabic spans 20 currencies, and English
//                              and French span the world. Guessing here would be worse than
//                              asking, because a wrong silent guess is invisible.
//
// And in every case: if the current currency is already plausible for the new language, do
// nothing at all.
import type { LocaleCode } from "../i18n/locales";

/** What the caller should do after a language change. */
export type CurrencyAction =
  | { kind: "none" }
  | { kind: "set"; currency: string }
  | { kind: "choose"; options: string[] }
  | { kind: "open-list" };

interface LanguageCurrencyRule {
  /** Set silently: the language implies exactly one currency in practice. */
  implies?: string;
  /** Ask between these, because the language spans two large populations. */
  choose?: string[];
  /**
   * Currencies that are reasonable for this language. If the user is already on one of these,
   * nothing is asked. Wider than `implies` on purpose: an Indonesian speaker holding USD is
   * not a mistake to correct.
   */
  plausible: string[];
}

const RULES: Record<LocaleCode, LanguageCurrencyRule> = {
  // Spans 20+ countries with different currencies. No honest default exists.
  ar: { plausible: ["SAR", "AED", "KWD", "QAR", "BHD", "OMR", "EGP", "JOD", "IQD", "LYD", "DZD", "MAD", "TND", "SDG", "SYP", "YER", "LBP", "MRU", "SOS", "DJF", "KMF", "USD"] },
  // Global lingua franca. Also the default locale, so a silent change here would fire on
  // first launch for everyone.
  en: { plausible: ["USD", "GBP", "EUR", "CAD", "AUD", "NZD", "SGD", "MYR", "ZAR", "NGN", "KES", "GHS", "PKR", "INR", "BDT", "SAR", "AED"] },
  fr: { plausible: ["EUR", "CHF", "CAD", "XOF", "XAF", "MAD", "DZD", "TND", "KMF", "DJF", "MGA", "USD"] },
  id: { implies: "IDR", plausible: ["IDR", "MYR", "SGD", "USD"] },
  bn: { implies: "BDT", plausible: ["BDT", "INR", "USD"] },
  tr: { implies: "TRY", plausible: ["TRY", "EUR", "USD"] },
  // Urdu is Pakistan's national language and an official language of India. Both are large
  // Muslim populations, and picking one silently would be wrong for the other.
  ur: { choose: ["PKR", "INR"], plausible: ["PKR", "INR", "SAR", "AED", "GBP", "USD"] },
};

/**
 * Decides what to do about currency when the language changes.
 *
 * @param language the language just selected
 * @param currentCurrency the currency in settings right now
 */
export function currencyActionForLanguage(
  language: LocaleCode,
  currentCurrency: string,
): CurrencyAction {
  const rule = RULES[language];
  if (!rule) return { kind: "none" };

  // Already sensible: say nothing. This is the clause that stops the Saudi-on-Riyal nag.
  if (rule.plausible.includes(currentCurrency)) return { kind: "none" };

  if (rule.implies) return { kind: "set", currency: rule.implies };
  if (rule.choose) return { kind: "choose", options: rule.choose };
  return { kind: "open-list" };
}

/** Currencies considered reasonable for a language. Exported for tests and the picker's pins. */
export function plausibleCurrencies(language: LocaleCode): string[] {
  return RULES[language]?.plausible ?? [];
}
