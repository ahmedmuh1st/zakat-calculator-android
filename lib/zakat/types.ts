// Zakat domain types — shared vocabulary across the app.

import type { LocaleCode } from "../i18n/locales";

export type CategoryId =
  | "cash"
  | "gold"
  | "silver"
  | "stocks"
  | "business"
  | "realEstate"
  | "debts"
  | "agriculture"
  | "crypto";

export type NisabStandard = "gold" | "silver";

export type IrrigationType = "rain" | "irrigated" | "mixed";

export type GoldKarat = 24 | 22 | 21 | 18 | 14 | 10;

export interface LineItem {
  id: string;
  /** i18n label key or free-text name */
  label: string;
  /** Direct monetary value (used by most categories) */
  amount: number;
  /** Gold/silver: weight in grams */
  grams?: number;
  /** Gold: karat purity */
  karat?: GoldKarat;
  /** Stocks: number of shares/units */
  shares?: number;
  /** Stocks: price per share/unit in selected currency */
  pricePerShare?: number;
  /**
   * Stocks: the company already pays zakat on its own assets, so the holding is
   * excluded from the shareholder's calculation to avoid paying twice. Defaults to
   * true for SAR holdings (Saudi listed companies are assessed by ZATCA) and false
   * otherwise, but the user can always override it per holding.
   */
  companyPaysZakat?: boolean;
  /** Optional ISO currency code when the item is entered in a foreign currency (e.g. "USD"). Undefined = base currency. */
  currency?: string;
  /** Agriculture: irrigation type determines rate */
  irrigation?: IrrigationType;
  /** Business: negative contributions (payables, bad debts) */
  isDeduction?: boolean;
}

export interface CategoryEntry {
  categoryId: CategoryId;
  items: LineItem[];
}

export interface Deduction {
  id: string;
  label: string;
  amount: number;
}

export interface MetalPrices {
  /** price per gram in selected currency */
  goldPerGram: number;
  silverPerGram: number;
  /** ISO timestamp of last update */
  updatedAt: string | null;
  source: "live" | "manual" | "none";
}

export interface FxRates {
  /** Base currency the app displays in (settings.currency) */
  base: string;
  /** rates[code] = units of `code` per 1 unit of base. Convert foreign→base: amount / rates[code]. */
  rates: Record<string, number>;
  updatedAt: string | null;
}

export interface CalculationInput {
  entries: CategoryEntry[];
  deductions: Deduction[];
  prices: MetalPrices;
  nisabStandard: NisabStandard;
  /** Optional FX table for items entered in foreign currencies */
  fx?: FxRates;
}

export interface CategoryResult {
  categoryId: CategoryId;
  /** zakatable base for this category */
  base: number;
  /** zakat due for this category */
  zakat: number;
  /** effective rate note e.g. 0.025, 0.05, 0.075, 0.1 */
  effectiveRate: number;
}

export interface CalculationResult {
  categories: CategoryResult[];
  grossWealth: number;
  /**
   * Total wealth held across the wealth categories, including holdings excluded
   * from the zakatable base (stocks whose company already pays zakat). The nisab
   * test runs on this, so an excluded holding still proves the person is wealthy
   * enough to owe zakat on everything else.
   */
  grossHoldings: number;
  totalDeductions: number;
  /** wealth compared against nisab (excludes agriculture which has no hawl/nisab in this simplified model) */
  netWealth: number;
  /** holdings after deductions; this is what the nisab threshold is compared against */
  netHoldings: number;
  nisabThreshold: number;
  nisabStandard: NisabStandard;
  aboveNisab: boolean;
  /** zakat on wealth categories (2.5%), zero when below nisab */
  wealthZakat: number;
  /** Reduction in pooled wealth Zakat caused by shared deductions. */
  deductionZakatAdjustment?: number;
  /** agriculture zakat is due per-harvest regardless of hawl */
  agricultureZakat: number;
  totalZakat: number;
}

/**
 * One disbursement against a saved Zakat obligation. Deletions remain as hidden
 * tombstones so a stale backup cannot resurrect a payment removed on another device.
 */
export interface ZakatPayment {
  id: string;
  name: string;
  amount: number;
  /** ISO 8601 date and time when the payment was made. */
  paidAt: string;
  /** ISO 8601 mutation time used for cross-device conflict resolution. */
  updatedAt: string;
  /** ISO 8601 deletion time. Present means hidden from the UI and totals. */
  deletedAt?: string;
}

export interface SavedCalculation {
  id: string;
  savedAt: string; // ISO date
  hijriYear: number;
  hijriLabel: string;
  /**
   * User-facing name, e.g. "Zakat Ramadan 1447". Optional because records saved
   * before naming existed have none; render with calcDisplayName(), which falls
   * back to hijriLabel so old records look exactly as they did.
   */
  name?: string;
  currency: string;
  input: CalculationInput;
  result: CalculationResult;
  /** Optional so records created before payment tracking remain valid. */
  payments?: ZakatPayment[];
}

export interface Settings {
  language: LocaleCode;
  currency: string;
  nisabStandard: NisabStandard;
  /** Hijri anniversary { month: 1-12, day: 1-30 } */
  anniversary: { month: number; day: number } | null;
  onboarded: boolean;
  /** Theme preference; default follows the device */
  theme?: "system" | "light" | "dark";
  /**
   * True once the user has landed on the Learn tab after onboarding. First launch
   * routes there so a newcomer reads before facing nine categories; every launch
   * after that opens the calculator. Tab order is unaffected.
   */
  hasSeenLearn?: boolean;
}

/**
 * The portable slice of app state: everything a backup carries, and nothing derived,
 * cached, or specific to one install. Declared here rather than in the store so the
 * backup module stays free of React and can be unit tested directly.
 */
export interface AppSnapshot {
  settings: Settings;
  entries: CategoryEntry[];
  deductions: Deduction[];
  prices: MetalPrices;
  history: SavedCalculation[];
}

export const NISAB_GOLD_GRAMS = 85;
export const NISAB_SILVER_GRAMS = 595;
export const ZAKAT_RATE = 0.025;

export const KARAT_PURITY: Record<GoldKarat, number> = {
  24: 1,
  22: 22 / 24,
  21: 21 / 24,
  18: 18 / 24,
  14: 14 / 24,
  10: 10 / 24,
};

export const AGRICULTURE_RATES: Record<IrrigationType, number> = {
  rain: 0.1,
  irrigated: 0.05,
  mixed: 0.075,
};

export const CATEGORY_IDS: CategoryId[] = [
  "cash",
  "gold",
  "silver",
  "stocks",
  "business",
  "realEstate",
  "debts",
  "agriculture",
  "crypto",
];

export const CATEGORY_COLORS: Record<CategoryId, string> = {
  cash: "#2E8B8B",
  gold: "#C9A24B",
  silver: "#8E9AAB",
  stocks: "#5B7FBD",
  business: "#B06A3B",
  realEstate: "#7A8B5A",
  debts: "#9B6BAE",
  agriculture: "#5F9E54",
  crypto: "#D97B4F",
};
