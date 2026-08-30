// Resolving translated *content* (FAQ answers, Learn cards, fiqh notes).
//
// UI strings live in one dictionary file per locale. Content is different: the FAQ and Learn
// items carry their English and Arabic text inline, item by item, because that is how the
// answers were authored and reviewed together. Widening every inline object to seven locales
// would make each of the 42 FAQ answers a seven-branch blob and make every future content
// edit touch seven strings.
//
// So: `en` and `ar` stay inline as the authored source, and the five added locales live in
// per-locale override tables keyed by item id. This resolver joins them.
//
// The fallback is the important part. The iOS session had 24 Bengali fields come back empty
// from translation while still reporting high confidence. If a lookup misses here, the reader
// gets the English answer, which is useful, rather than an empty card, which looks broken.

import type { LocaleCode } from "./locales";

/** The inline authored shape carried by FAQ and Learn items. */
export interface AuthoredText {
  en: string;
  ar: string;
}

/**
 * Per-locale override table: `OVERRIDES[locale][itemId][field]`. Only the five added locales
 * appear; `en` and `ar` are read from the inline authored text.
 */
export type ContentOverrides = Partial<Record<LocaleCode, Record<string, Record<string, string>>>>;

/**
 * Resolve one field of one content item for a locale.
 *
 * Order: locale override, then the inline authored text if the locale is authored, then
 * English. Whitespace-only values are treated as missing, which is what catches a translation
 * unit that came back structurally present but empty.
 */
export function resolveContent(
  overrides: ContentOverrides,
  locale: LocaleCode,
  itemId: string,
  field: string,
  authored: AuthoredText,
): string {
  const override = overrides[locale]?.[itemId]?.[field];
  if (override && override.trim()) return override;

  if (locale === "ar" && authored.ar.trim()) return authored.ar;

  return authored.en;
}

/**
 * Which item ids a locale is missing, for the structural test. Returns the ids that would
 * silently fall back to English, so a translation gap fails a test rather than shipping.
 */
export function missingContentIds(
  overrides: ContentOverrides,
  locale: LocaleCode,
  itemIds: string[],
  fields: string[],
): string[] {
  if (locale === "en" || locale === "ar") return [];
  const table = overrides[locale] ?? {};
  return itemIds.filter((id) =>
    fields.some((field) => {
      const value = table[id]?.[field];
      return !value || !value.trim();
    }),
  );
}
