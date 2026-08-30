import { describe, expect, it } from "vitest";

import { en } from "../lib/i18n/en";
import { ar } from "../lib/i18n/ar";
import { id } from "../lib/i18n/id";
import { ur } from "../lib/i18n/ur";
import { bn } from "../lib/i18n/bn";
import { tr } from "../lib/i18n/tr";
import { fr } from "../lib/i18n/fr";
import { FAQ_ITEMS, FAQ_CATEGORIES } from "../lib/content/faq";
import { LEARN_CARDS } from "../lib/content/zakatonomics";
import {
  FAQ_TRANSLATIONS,
  LEARN_TRANSLATIONS,
  FAQ_CATEGORY_TRANSLATIONS,
} from "../lib/content/translations";

/**
 * Ahmed's standing rule: no em dashes in output. That was written for generated prose, but it
 * applies at least as strongly to app copy, which ships to users in seven languages.
 *
 * Round 26 removed 550 of them, inherited from the English source and faithfully reproduced by
 * every translator. This test stops them coming back, including via a future translation batch
 * that copies the source punctuation.
 */

const DICTS = { en, ar, id, ur, bn, tr, fr };

/** Recursively collect every string a nested content structure holds. */
function collectStrings(value: unknown, path: string, out: { path: string; text: string }[]) {
  if (typeof value === "string") {
    out.push({ path, text: value });
    return;
  }
  if (typeof value === "function") return; // interpolation helpers are exercised separately
  if (Array.isArray(value)) {
    value.forEach((v, i) => collectStrings(v, `${path}[${i}]`, out));
    return;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) collectStrings(v, `${path}.${k}`, out);
  }
}

describe("no em dashes in user-facing copy", () => {
  for (const [locale, dict] of Object.entries(DICTS)) {
    it(`${locale} dictionary is free of em dashes`, () => {
      const found: string[] = [];
      collectStrings(dict, locale, found as never);
      const offenders = (found as unknown as { path: string; text: string }[]).filter((e) =>
        e.text.includes("\u2014"),
      );
      expect(offenders.map((o) => `${o.path}: ${o.text.slice(0, 60)}`)).toEqual([]);
    });
  }

  it("English FAQ and Learn content is free of em dashes", () => {
    const found: { path: string; text: string }[] = [];
    collectStrings(FAQ_ITEMS, "FAQ_ITEMS", found);
    collectStrings(FAQ_CATEGORIES, "FAQ_CATEGORIES", found);
    collectStrings(LEARN_CARDS, "LEARN_CARDS", found);
    const offenders = found.filter((e) => e.text.includes("\u2014"));
    expect(offenders.map((o) => `${o.path}: ${o.text.slice(0, 60)}`)).toEqual([]);
  });

  it("translated FAQ, Learn and category content is free of em dashes", () => {
    const found: { path: string; text: string }[] = [];
    collectStrings(FAQ_TRANSLATIONS, "FAQ_TRANSLATIONS", found);
    collectStrings(LEARN_TRANSLATIONS, "LEARN_TRANSLATIONS", found);
    collectStrings(FAQ_CATEGORY_TRANSLATIONS, "FAQ_CATEGORY_TRANSLATIONS", found);
    const offenders = found.filter((e) => e.text.includes("\u2014"));
    expect(offenders.map((o) => `${o.path}: ${o.text.slice(0, 60)}`)).toEqual([]);
  });

  it("also rejects en dashes used as sentence punctuation", () => {
    // An en dash surrounded by spaces does the same job as an em dash and reads the same way,
    // so the rule would be trivially bypassed by swapping the character.
    const found: { path: string; text: string }[] = [];
    for (const [locale, dict] of Object.entries(DICTS)) collectStrings(dict, locale, found);
    const offenders = found.filter((e) => / \u2013 /.test(e.text));
    expect(offenders.map((o) => `${o.path}: ${o.text.slice(0, 60)}`)).toEqual([]);
  });
});
