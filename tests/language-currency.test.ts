import { describe, expect, it } from "vitest";

import { LOCALES } from "../lib/i18n/locales";
import {
  currencyActionForLanguage,
  plausibleCurrencies,
} from "../lib/zakat/language-currency";

describe("currency on language change", () => {
  it("says nothing when the current currency already fits the language", () => {
    // The case that killed the "always ask" idea: a Saudi user on Riyal switching to Arabic.
    expect(currencyActionForLanguage("ar", "SAR")).toEqual({ kind: "none" });
    expect(currencyActionForLanguage("fr", "EUR")).toEqual({ kind: "none" });
    expect(currencyActionForLanguage("en", "USD")).toEqual({ kind: "none" });
    expect(currencyActionForLanguage("id", "IDR")).toEqual({ kind: "none" });
  });

  it("sets the currency silently when the language implies exactly one", () => {
    expect(currencyActionForLanguage("id", "SAR")).toEqual({ kind: "set", currency: "IDR" });
    expect(currencyActionForLanguage("bn", "SAR")).toEqual({ kind: "set", currency: "BDT" });
    expect(currencyActionForLanguage("tr", "SAR")).toEqual({ kind: "set", currency: "TRY" });
  });

  it("asks Pakistan or India for Urdu rather than guessing", () => {
    expect(currencyActionForLanguage("ur", "SAR")).toEqual({ kind: "none" });
    expect(currencyActionForLanguage("ur", "EUR")).toEqual({
      kind: "choose",
      options: ["PKR", "INR"],
    });
  });

  it("opens the full list for languages that span many currencies", () => {
    expect(currencyActionForLanguage("ar", "IDR")).toEqual({ kind: "open-list" });
    expect(currencyActionForLanguage("fr", "PKR")).toEqual({ kind: "open-list" });
    expect(currencyActionForLanguage("en", "TRY")).toEqual({ kind: "open-list" });
  });

  it("never silently changes the currency for a multi-country language", () => {
    // A wrong silent guess is invisible to the user, which makes it worse than a question.
    for (const code of ["ar", "en", "fr"] as const) {
      for (const cur of ["IDR", "TRY", "PKR", "BDT", "JPY"]) {
        const action = currencyActionForLanguage(code, cur);
        expect(action.kind, `${code} + ${cur}`).not.toBe("set");
      }
    }
  });

  it("covers every locale in the registry, so a new language cannot fall through", () => {
    for (const meta of LOCALES) {
      expect(plausibleCurrencies(meta.code).length, meta.code).toBeGreaterThan(0);
      // Whatever the rule, an unrecognised currency must produce an actionable outcome.
      const action = currencyActionForLanguage(meta.code, "ZZZ");
      expect(["set", "choose", "open-list"], meta.code).toContain(action.kind);
    }
  });

  it("keeps the Gulf currencies plausible for Urdu, where many speakers work", () => {
    // A Pakistani in Riyadh calculates in Riyal. Forcing PKR on him would be wrong.
    expect(currencyActionForLanguage("ur", "SAR")).toEqual({ kind: "none" });
    expect(currencyActionForLanguage("ur", "AED")).toEqual({ kind: "none" });
  });
});
