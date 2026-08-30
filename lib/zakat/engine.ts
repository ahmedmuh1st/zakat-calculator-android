// Pure Zakat calculation engine. No IO, fully testable, works offline.
import {
  AGRICULTURE_RATES,
  CalculationInput,
  CalculationResult,
  CategoryEntry,
  CategoryResult,
  FxRates,
  KARAT_PURITY,
  LineItem,
  MetalPrices,
  NISAB_GOLD_GRAMS,
  NISAB_SILVER_GRAMS,
  NisabStandard,
  ZAKAT_RATE,
} from "./types";

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Convert an amount in `currency` to base using the FX table. Unknown currency → returned as-is. */
export function toBase(amount: number, currency: string | undefined, fx?: FxRates): number {
  if (!currency || !fx || currency === fx.base) return amount;
  const rate = fx.rates[currency];
  if (!rate || rate <= 0) return amount;
  return amount / rate;
}

/** Value of a single line item in currency terms. */
export function itemValue(item: LineItem, categoryId: string, prices: MetalPrices, fx?: FxRates): number {
  if (categoryId === "gold" && item.grams != null) {
    const purity = item.karat ? KARAT_PURITY[item.karat] : 1;
    return item.grams * purity * (prices.goldPerGram || 0);
  }
  if (categoryId === "silver" && item.grams != null) {
    return item.grams * (prices.silverPerGram || 0);
  }
  if (categoryId === "stocks" && item.shares != null && item.pricePerShare != null) {
    return toBase(item.shares * item.pricePerShare, item.currency, fx);
  }
  return toBase(item.amount || 0, item.currency, fx);
}

/**
 * Whether a line item counts toward the zakatable base at all.
 *
 * Stocks: when the company itself is assessed for zakat on its own assets (the
 * default for Saudi listed companies under ZATCA), the shareholder does not pay
 * again on the same wealth. Such holdings are excluded entirely rather than
 * discounted, and the exclusion is surfaced in the UI so the user understands why
 * the portfolio is not being counted.
 */
export function isItemZakatable(item: LineItem, categoryId: string): boolean {
  if (categoryId === "stocks" && item.companyPaysZakat) return false;
  return true;
}

/** Zakatable base of one category (business supports deduction items). */
export function categoryBase(entry: CategoryEntry, prices: MetalPrices, fx?: FxRates): number {
  let base = 0;
  for (const item of entry.items) {
    if (!isItemZakatable(item, entry.categoryId)) continue;
    const v = itemValue(item, entry.categoryId, prices, fx);
    base += item.isDeduction ? -v : v;
  }
  return Math.max(0, base);
}

/**
 * Total wealth held in one category, INCLUDING items excluded from the zakatable
 * base (currently stocks whose company is already assessed for zakat).
 *
 * The distinction matters and getting it wrong is a real error in both directions:
 * - Charge zakat on a company-paid holding and the person pays twice on the same
 *   wealth, once through the company and once themselves.
 * - Hide it from the nisab test as well and someone holding 49,000 in Saudi
 *   equities plus 1,000 elsewhere is judged on 1,000, falls under the threshold,
 *   and is told nothing is due. They are plainly wealthy enough to owe zakat.
 *
 * So the nisab comparison uses holdings, while the 2.5% charge uses the base.
 */
export function categoryHoldings(entry: CategoryEntry, prices: MetalPrices, fx?: FxRates): number {
  let held = 0;
  for (const item of entry.items) {
    const v = itemValue(item, entry.categoryId, prices, fx);
    held += item.isDeduction ? -v : v;
  }
  return Math.max(0, held);
}

export function nisabThreshold(standard: NisabStandard, prices: MetalPrices): number {
  return standard === "gold"
    ? NISAB_GOLD_GRAMS * (prices.goldPerGram || 0)
    : NISAB_SILVER_GRAMS * (prices.silverPerGram || 0);
}

/**
 * Full calculation:
 * - Wealth categories (all except agriculture) pool together, deductions subtracted,
 *   compared to nisab; 2.5% due if net >= nisab.
 * - Agriculture is per-harvest at 5%/7.5%/10% with no hawl requirement (due regardless of nisab pool).
 */
export function calculateZakat(input: CalculationInput): CalculationResult {
  const { entries, deductions, prices, nisabStandard, fx } = input;

  const categories: CategoryResult[] = [];
  let grossWealth = 0;
  let grossHoldings = 0;
  let agricultureZakat = 0;

  for (const entry of entries) {
    if (entry.categoryId === "agriculture") {
      let agBase = 0;
      let agZakat = 0;
      for (const item of entry.items) {
        const v = itemValue(item, entry.categoryId, prices, fx);
        const rate = AGRICULTURE_RATES[item.irrigation ?? "irrigated"];
        agBase += v;
        agZakat += v * rate;
      }
      agricultureZakat = round2(agZakat);
      categories.push({
        categoryId: "agriculture",
        base: round2(agBase),
        zakat: agricultureZakat,
        effectiveRate: agBase > 0 ? agZakat / agBase : 0,
      });
    } else {
      const base = categoryBase(entry, prices, fx);
      grossWealth += base;
      grossHoldings += categoryHoldings(entry, prices, fx);
      categories.push({
        categoryId: entry.categoryId,
        base: round2(base),
        zakat: 0, // filled after nisab check
        effectiveRate: ZAKAT_RATE,
      });
    }
  }

  const totalDeductions = deductions.reduce((s, d) => s + (d.amount || 0), 0);
  const netWealth = Math.max(0, grossWealth - totalDeductions);
  // Nisab is a test of how much wealth the person holds, so it runs on holdings
  // (which include company-paid stocks) rather than on the zakatable base.
  const netHoldings = Math.max(0, grossHoldings - totalDeductions);
  const threshold = nisabThreshold(nisabStandard, prices);
  const aboveNisab = threshold > 0 ? netHoldings >= threshold : netHoldings > 0;

  let wealthZakat = 0;
  let deductionZakatAdjustment = 0;
  if (aboveNisab && netWealth > 0 && grossWealth > 0) {
    wealthZakat = netWealth * ZAKAT_RATE;
    // Each printed category rate must produce the amount printed beside it.
    // Shared deductions are shown once, separately, rather than invisibly spread
    // across every category while the UI still labels each row 2.5%.
    for (const c of categories) {
      if (c.categoryId !== "agriculture") {
        c.zakat = round2(c.base * c.effectiveRate);
      }
    }
    const grossCategoryCents = categories
      .filter((c) => c.categoryId !== "agriculture")
      .reduce((sum, c) => sum + Math.round(c.zakat * 100), 0);
    const wealthZakatCents = Math.round(round2(wealthZakat) * 100);
    deductionZakatAdjustment = Math.max(0, grossCategoryCents - wealthZakatCents) / 100;
  }

  return {
    categories,
    grossWealth: round2(grossWealth),
    grossHoldings: round2(grossHoldings),
    totalDeductions: round2(totalDeductions),
    netWealth: round2(netWealth),
    netHoldings: round2(netHoldings),
    nisabThreshold: round2(threshold),
    nisabStandard,
    aboveNisab,
    wealthZakat: round2(wealthZakat),
    deductionZakatAdjustment,
    agricultureZakat: round2(agricultureZakat),
    totalZakat: round2(wealthZakat + agricultureZakat),
  };
}

/** New official Saudi Riyal currency symbol (U+20C1), approved 2025. */
export const SAR_SYMBOL = "\u20C1";

export function formatMoney(n: number, currency: string, locale: string = "en"): string {
  try {
    const formatted = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: n >= 1000 ? 0 : 2,
      currencyDisplay: "narrowSymbol",
    }).format(n);
    if (currency === "SAR") {
      // Replace legacy SAR representations (ر.س. / SAR / S.R.) with the new symbol.
      return formatted
        .replace(/ر\.?\s?س\.?/g, SAR_SYMBOL)
        .replace(/SAR/g, SAR_SYMBOL)
        .replace(/S\.?R\.?/g, SAR_SYMBOL);
    }
    return formatted;
  } catch {
    if (currency === "SAR") return `${SAR_SYMBOL} ${n.toLocaleString()}`;
    return `${currency} ${n.toLocaleString()}`;
  }
}
