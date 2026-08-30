import { describe, expect, it } from "vitest";

import { buildBreakdown } from "../lib/zakat/breakdown";
import type { SavedCalculation } from "../lib/zakat/types";

const oldSaved = {
  id: "old",
  savedAt: "2026-01-01T00:00:00.000Z",
  hijriYear: 1447,
  hijriLabel: "1447",
  currency: "SAR",
  input: { entries: [], deductions: [], prices: {}, nisabStandard: "silver" },
  result: {
    categories: [
      { categoryId: "cash", base: 100000, zakat: 2250, effectiveRate: 0.025 },
      { categoryId: "agriculture", base: 1000, zakat: 100, effectiveRate: 0.1 },
    ],
    grossWealth: 100000,
    grossHoldings: 100000,
    totalDeductions: 10000,
    netWealth: 90000,
    netHoldings: 90000,
    nisabThreshold: 3000,
    nisabStandard: "silver",
    aboveNisab: true,
    wealthZakat: 2250,
    agricultureZakat: 100,
    totalZakat: 2350,
  },
} as unknown as SavedCalculation;

describe("truthful saved-calculation breakdown", () => {
  it("reconstructs old proportionally reduced rows without mutating history", () => {
    const before = structuredClone(oldSaved);
    const breakdown = buildBreakdown(oldSaved);
    expect(breakdown.rows).toEqual([
      { categoryId: "cash", holdings: 100000, zakat: 2500, rate: 0.025 },
      { categoryId: "agriculture", holdings: 1000, zakat: 100, rate: 0.1 },
    ]);
    expect(breakdown.deductionZakatAdjustment).toBe(250);
    expect(oldSaved).toEqual(before);
  });

  it("does not invent Zakat for a below-Nisab saved record", () => {
    const below = structuredClone(oldSaved);
    below.result.aboveNisab = false;
    below.result.wealthZakat = 0;
    below.result.agricultureZakat = 0;
    below.result.totalZakat = 0;
    below.result.categories[0]!.zakat = 0;
    const breakdown = buildBreakdown(below);
    expect(breakdown.rows[0]!.zakat).toBe(0);
    expect(breakdown.deductionZakatAdjustment).toBe(0);
  });
});
