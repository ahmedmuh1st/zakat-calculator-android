// One place the UI asks for translated content, so no screen indexes a `{ en, ar }` object
// by locale directly. That pattern is what broke when the locale type widened past two.

import { resolveContent, type AuthoredText } from "../i18n/content";
import type { LocaleCode } from "../i18n/locales";
import { FAQ_CATEGORY_TRANSLATIONS, FAQ_TRANSLATIONS, LEARN_TRANSLATIONS } from "./translations";

/** FAQ question text for a locale. */
export function faqQuestion(item: { id: string; q: AuthoredText }, locale: LocaleCode): string {
  return resolveContent(FAQ_TRANSLATIONS, locale, item.id, "q", item.q);
}

/** FAQ answer text for a locale. */
export function faqAnswer(item: { id: string; a: AuthoredText }, locale: LocaleCode): string {
  return resolveContent(FAQ_TRANSLATIONS, locale, item.id, "a", item.a);
}

/** Learn card title for a locale. */
export function learnTitle(card: { id: string; title: AuthoredText }, locale: LocaleCode): string {
  return resolveContent(LEARN_TRANSLATIONS, locale, card.id, "title", card.title);
}

/** Learn card body for a locale. */
export function learnBody(card: { id: string; body: AuthoredText }, locale: LocaleCode): string {
  return resolveContent(LEARN_TRANSLATIONS, locale, card.id, "body", card.body);
}

/** FAQ topic label for a locale, e.g. "Gold & Silver". */
export function faqCategoryLabel(
  category: { id: string; en: string; ar: string },
  locale: LocaleCode,
): string {
  return resolveContent(FAQ_CATEGORY_TRANSLATIONS, locale, category.id, "label", {
    en: category.en,
    ar: category.ar,
  });
}

/** A plain `{ en, ar }` blob that is not a keyed content item, such as a per-category fiqh note. */
export function authoredText(text: AuthoredText, locale: LocaleCode): string {
  return locale === "ar" && text.ar.trim() ? text.ar : text.en;
}
