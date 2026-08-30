// Changing the app language, including what that means for the currency.
//
// Two places let the user switch language: the Settings tab and the wide-screen quick
// settings pane. The currency rule has to behave identically in both, so it lives here
// rather than being written twice. The rule itself, and why it is not simply "always ask",
// is in language-currency.ts.
import { useCallback, useState } from "react";

import { dictionaryFor } from "../i18n/dictionaries";
import type { LocaleCode } from "../i18n/locales";
import { useStore } from "../store";
import { useConfirm } from "@/components/zakat/confirm-sheet";
import { currencyByCode } from "./currencies";
import { currencyActionForLanguage } from "./language-currency";

export function useLanguageChange() {
  const { settings, dispatch } = useStore();
  const confirm = useConfirm();
  const [currencyListOpen, setCurrencyListOpen] = useState(false);

  const changeLanguage = useCallback(
    async (code: LocaleCode) => {
      dispatch({ type: "setSettings", payload: { language: code } });

      const action = currencyActionForLanguage(code, settings.currency);
      if (action.kind === "none") return;

      // Read the strings from the language just chosen, not the one being left behind.
      const next = dictionaryFor(code);
      const nameOf = (currency: string) => {
        const info = currencyByCode(currency);
        if (!info) return currency;
        return code === "ar" ? info.ar : info.en;
      };

      if (action.kind === "set") {
        dispatch({ type: "setSettings", payload: { currency: action.currency } });
        await confirm({
          title: next.currencyForLanguage,
          message: next.currencySetTo(nameOf(action.currency)),
          confirmLabel: next.done,
          cancelLabel: next.cancel,
          destructive: false,
        });
        return;
      }

      if (action.kind === "choose") {
        // Exactly two plausible answers, so the confirm sheet's two buttons are the choice
        // itself rather than a yes/no about a guess.
        const [first, second] = action.options;
        const flag = (c: string) => currencyByCode(c)?.flag ?? "";
        const pickedFirst = await confirm({
          title: next.currencyForLanguage,
          message: next.currencyAskWhich,
          confirmLabel: `${flag(first)} ${nameOf(first)}`.trim(),
          cancelLabel: `${flag(second)} ${nameOf(second)}`.trim(),
          destructive: false,
        });
        dispatch({ type: "setSettings", payload: { currency: pickedFirst ? first : second } });
        return;
      }

      // Many currencies and no honest default: open the list rather than guess wrong.
      setCurrencyListOpen(true);
    },
    [confirm, dispatch, settings.currency],
  );

  return {
    changeLanguage,
    currencyListOpen,
    clearCurrencyListSignal: useCallback(() => setCurrencyListOpen(false), []),
  };
}
