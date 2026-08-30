// Dictionary registry: locale code to UI string dictionary.
//
// English is the shape all others must satisfy (`Dict`), so a missing key is a type error
// rather than a blank label at runtime. Locales without a dictionary yet resolve to English,
// which means a half-finished translation ships as partially-English rather than broken.

import { ar } from "./ar";
import { bn } from "./bn";
import { en, type Dict } from "./en";
import { fr } from "./fr";
import { id } from "./id";
import { DEFAULT_LOCALE, type LocaleCode } from "./locales";
import { tr } from "./tr";
import { ur } from "./ur";

/**
 * Every dictionary the app has. Keys are locale codes; a locale absent here falls back to
 * English at lookup time.
 */
const DICTIONARIES: Partial<Record<LocaleCode, Dict>> = {
  en,
  ar,
  id,
  ur,
  bn,
  tr,
  fr,
};

/** UI dictionary for a locale, falling back to English. */
export function dictionaryFor(locale: LocaleCode): Dict {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE] ?? en;
}

/** Which locales have their own dictionary, for the picker and the structural test. */
export function translatedLocales(): LocaleCode[] {
  return Object.keys(DICTIONARIES) as LocaleCode[];
}
