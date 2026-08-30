import type { CategoryId, SavedCalculation } from "./types";

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface BreakdownRow {
  categoryId: CategoryId;
  holdings: number;
  zakat: number;
  rate: number;
}

export interface Breakdown {
  rows: BreakdownRow[];
  totalDeductions: number;
  deductionZakatAdjustment: number;
  netWealth: number;
  nisabThreshold: number;
  nisabStandard: "gold" | "silver";
  aboveNisab: boolean;
  totalZakat: number;
  zeroBecauseBelowNisab: boolean;
}

/** Builds truthful display rows without rewriting immutable saved records. */
export function buildBreakdown(saved: SavedCalculation): Breakdown {
  const result = saved.result;
  const reconstructGross = result.aboveNisab && result.wealthZakat > 0;
  const rows = result.categories
    .filter((category) => category.base !== 0 || category.zakat !== 0)
    .map((category) => ({
      categoryId: category.categoryId,
      holdings: category.base,
      zakat:
        category.categoryId !== "agriculture" && reconstructGross
          ? round2(category.base * category.effectiveRate)
          : category.zakat,
      rate: category.effectiveRate,
    }));
  const grossWealthZakatCents = rows
    .filter((row) => row.categoryId !== "agriculture")
    .reduce((sum, row) => sum + Math.round(row.zakat * 100), 0);
  const savedWealthZakatCents = Math.round(round2(result.wealthZakat) * 100);

  return {
    rows,
    totalDeductions: result.totalDeductions,
    deductionZakatAdjustment: reconstructGross
      ? Math.max(0, grossWealthZakatCents - savedWealthZakatCents) / 100
      : 0,
    netWealth: result.netWealth,
    nisabThreshold: result.nisabThreshold,
    nisabStandard: result.nisabStandard,
    aboveNisab: result.aboveNisab,
    totalZakat: result.totalZakat,
    zeroBecauseBelowNisab:
      result.totalZakat === 0 && result.netWealth > 0 && !result.aboveNisab,
  };
}
