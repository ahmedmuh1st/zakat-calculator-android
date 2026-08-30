// Global app store: settings, calculation-in-progress, history. Persisted to AsyncStorage (privacy-first, on-device).
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";

import { dictionaryFor } from "./i18n/dictionaries";
import { Dict } from "./i18n/en";
import { isRtlLocale } from "./i18n/locales";
import { mergeHistory, type BackupEnvelope } from "./zakat/backup-format";
import {
  deleteCalculationPayment,
  mergeCalculationPayments,
  upsertCalculationPayment,
} from "./zakat/payments";
import {
  CategoryEntry,
  CategoryId,
  Deduction,
  FxRates,
  LineItem,
  MetalPrices,
  SavedCalculation,
  Settings,
  ZakatPayment,
} from "./zakat/types";

interface AppState {
  settings: Settings;
  entries: CategoryEntry[];
  deductions: Deduction[];
  prices: MetalPrices;
  fx: FxRates | null;
  history: SavedCalculation[];
  /** Device-local choice of the saved obligation shown by the Home payment card. */
  trackedCalculationId: string | null;
  hydrated: boolean;
}

const initialState: AppState = {
  settings: {
    language: "en",
    currency: "SAR",
    // Silver, not gold. The silver threshold is the lower of the two, so zakat falls
    // due sooner and more of the poor's right is discharged. Ahmed's call, 17 Aug 2026.
    // This is the initial state only: hydration replaces it with whatever the user has
    // stored, so an existing user's chosen standard never silently flips.
    nisabStandard: "silver",
    anniversary: null,
    onboarded: false,
    theme: "system",
  },
  entries: [],
  deductions: [],
  prices: { goldPerGram: 0, silverPerGram: 0, updatedAt: null, source: "none" },
  fx: null,
  history: [],
  trackedCalculationId: null,
  hydrated: false,
};

type Action =
  | { type: "hydrate"; payload: Partial<AppState> }
  | { type: "setSettings"; payload: Partial<Settings> }
  | { type: "setPrices"; payload: MetalPrices }
  | { type: "setFx"; payload: FxRates }
  | { type: "upsertItem"; categoryId: CategoryId; item: LineItem }
  | { type: "removeItem"; categoryId: CategoryId; itemId: string }
  | { type: "setDeductions"; payload: Deduction[] }
  | { type: "saveToHistory"; payload: SavedCalculation }
  | { type: "deleteFromHistory"; id: string }
  | { type: "upsertPaymentInHistory"; calculationId: string; payment: ZakatPayment }
  | { type: "deletePaymentFromHistory"; calculationId: string; paymentId: string; deletedAt: string }
  | { type: "setTrackedCalculation"; id: string }
  | { type: "loadFromHistory"; payload: SavedCalculation }
  | { type: "clearCalculation" }
  | { type: "importBackup"; payload: BackupEnvelope }
  | { type: "resetAll" };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "hydrate":
      return { ...state, ...action.payload, hydrated: true };
    case "setSettings":
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case "setPrices":
      return { ...state, prices: action.payload };
    case "setFx":
      return { ...state, fx: action.payload };
    case "upsertItem": {
      const entries = [...state.entries];
      const idx = entries.findIndex((e) => e.categoryId === action.categoryId);
      if (idx === -1) {
        entries.push({ categoryId: action.categoryId, items: [action.item] });
      } else {
        const items = [...entries[idx].items];
        const iIdx = items.findIndex((i) => i.id === action.item.id);
        if (iIdx === -1) items.push(action.item);
        else items[iIdx] = action.item;
        entries[idx] = { ...entries[idx], items };
      }
      return { ...state, entries };
    }
    case "removeItem": {
      const entries = state.entries
        .map((e) =>
          e.categoryId === action.categoryId
            ? { ...e, items: e.items.filter((i) => i.id !== action.itemId) }
            : e,
        )
        .filter((e) => e.items.length > 0);
      return { ...state, entries };
    }
    case "setDeductions":
      return { ...state, deductions: action.payload };
    case "saveToHistory":
      return {
        ...state,
        history: [action.payload, ...state.history],
        trackedCalculationId: action.payload.id,
      };
    case "deleteFromHistory": {
      const history = state.history.filter((h) => h.id !== action.id);
      return {
        ...state,
        history,
        trackedCalculationId:
          state.trackedCalculationId === action.id ? null : state.trackedCalculationId,
      };
    }
    case "upsertPaymentInHistory":
      return {
        ...state,
        history: upsertCalculationPayment(state.history, action.calculationId, action.payment),
        trackedCalculationId: action.calculationId,
      };
    case "deletePaymentFromHistory":
      return {
        ...state,
        history: deleteCalculationPayment(
          state.history,
          action.calculationId,
          action.paymentId,
          action.deletedAt,
        ),
        trackedCalculationId: action.calculationId,
      };
    case "setTrackedCalculation":
      return state.history.some((item) => item.id === action.id)
        ? { ...state, trackedCalculationId: action.id }
        : state;
    // Restores a past calculation's figures into the live calculator so this
    // year can start from last year's numbers. Only the entered figures are
    // restored: metal prices, FX and the Hijri year stay current, because the
    // point is to recompute at today's values rather than replay an old result.
    case "loadFromHistory":
      return {
        ...state,
        entries: action.payload.input.entries,
        deductions: action.payload.input.deductions,
        settings: { ...state.settings, nisabStandard: action.payload.input.nisabStandard },
      };
    case "clearCalculation":
      return { ...state, entries: [], deductions: [] };
    // Restores a backup file. Per BACKUP-FORMAT.md: entries, deductions, prices and
    // preferences replace, because they describe one in-progress calculation and one set
    // of preferences, and merging those would produce a state the user never had. History
    // merges on id, so importing the same file twice adds nothing and a restore can never
    // destroy records the file happens not to contain.
    //
    // onboarded and hasSeenLearn are deliberately kept from the current install: they
    // describe this device, not the user's data, and importing them would either bounce a
    // returning user into onboarding or rob a newcomer of it. fx is not restored either,
    // since stale rates would silently change converted totals; it refetches.
    case "importBackup": {
      const incoming = action.payload.data;
      const { onboarded, hasSeenLearn } = state.settings;
      const { merged } = mergeHistory(
        state.history,
        incoming.history ?? [],
        (local, remote) => mergeCalculationPayments(local, remote).calculation,
      );
      return {
        ...state,
        settings: {
          ...state.settings,
          ...incoming.settings,
          onboarded,
          hasSeenLearn,
        },
        entries: incoming.entries ?? [],
        deductions: incoming.deductions ?? [],
        prices: incoming.prices ?? state.prices,
        history: merged,
        trackedCalculationId:
          state.trackedCalculationId && merged.some((item) => item.id === state.trackedCalculationId)
            ? state.trackedCalculationId
            : null,
      };
    }
    case "resetAll":
      return { ...initialState, hydrated: true };
    default:
      return state;
  }
}

const KEY = "zakat-app-state-v1";

// Serialize AsyncStorage writes so a slow earlier write can never land after
// (and overwrite) a newer one — this raced with "reset all numbers" on device.
let writeChain: Promise<void> = Promise.resolve();

interface StoreValue extends AppState {
  dispatch: React.Dispatch<Action>;
  t: Dict;
  isRTL: boolean;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydrate once
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw);
          dispatch({ type: "hydrate", payload: saved });
        } else {
          dispatch({ type: "hydrate", payload: {} });
        }
      })
      .catch(() => dispatch({ type: "hydrate", payload: {} }));
  }, []);

  // Persist on change (after hydration)
  useEffect(() => {
    if (!state.hydrated) return;
    const { hydrated: _h, ...toSave } = state;
    const json = JSON.stringify(toSave);
    writeChain = writeChain.then(() => AsyncStorage.setItem(KEY, json)).catch(() => {});
  }, [state]);

  // Both come from the locale registry. Urdu is right-to-left too, so direction can never be
  // inferred from "is this Arabic", which is what the old two-language check did.
  const t = dictionaryFor(state.settings.language);
  const isRTL = isRtlLocale(state.settings.language);

  const value = useMemo<StoreValue>(
    () => ({ ...state, dispatch, t, isRTL }),
    [state, t, isRTL],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function useCategoryEntry(categoryId: CategoryId): CategoryEntry | undefined {
  const { entries } = useStore();
  return entries.find((e) => e.categoryId === categoryId);
}

export function makeId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export const noop = () => {};

export function usePrices() {
  const { prices, dispatch } = useStore();
  const setManual = useCallback(
    (goldPerGram: number, silverPerGram: number) => {
      dispatch({
        type: "setPrices",
        payload: { goldPerGram, silverPerGram, updatedAt: new Date().toISOString(), source: "manual" },
      });
    },
    [dispatch],
  );
  return { prices, setManual };
}
