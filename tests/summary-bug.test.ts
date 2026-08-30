import { describe, expect, it } from "vitest";

import { calculateZakat } from "../lib/zakat/engine";
import type { CategoryEntry, CategoryId, MetalPrices } from "../lib/zakat/types";

const prices: MetalPrices = {
  goldPerGram: 487.53,
  silverPerGram: 6.96,
  source: "live",
  updatedAt: new Date().toISOString(),
};

function entry(categoryId: CategoryId, items: CategoryEntry["items"]): CategoryEntry {
  return { categoryId, items };
}

/**
 * Reproduces the state Ahmed reached in TestFlight build 3, where the summary
 * reported a 15,000 zakat total while also reporting net zakatable wealth of
 * 0.00 against 13,388,240 gross and 20,000,000 of deductions.
 */
describe("Summary arithmetic from the TestFlight session", () => {
  const entries: CategoryEntry[] = [
    entry("cash", [{ id: "c1", label: "cash", amount: 1_000_000 }]),
    entry("gold", [{ id: "g1", label: "gold", amount: 0, grams: 1000, karat: 24 }]),
    entry("silver", [{ id: "s1", label: "silver", amount: 0, grams: 1000 }]),
    entry("stocks", [
      { id: "st1", label: "أسهم ١", amount: 0, shares: 1000, pricePerShare: 1000 },
      { id: "st2", label: "أسهم ٢", amount: 0, shares: 1000, pricePerShare: 1000 },
    ]),
    entry("business", [{ id: "b1", label: "صقر", amount: 6_000_000 }]),
    entry("realEstate", [{ id: "r1", label: "re", amount: 1_000_000 }]),
    entry("debts", [{ id: "d1", label: "owed", amount: 1_000_000 }]),
  ];

  it("never reports zakat due when net zakatable wealth is zero", () => {
    const result = calculateZakat({
      entries,
      deductions: [{ id: "x", label: "big debt", amount: 20_000_000 }],
      prices,
      nisabStandard: "gold",
    });

    expect(result.netWealth).toBe(0);
    expect(result.totalZakat).toBe(0);
    expect(result.aboveNisab).toBe(false);
  });

  it("category breakdown rows sum to the wealth zakat total", () => {
    const result = calculateZakat({
      entries,
      deductions: [],
      prices,
      nisabStandard: "gold",
    });

    const rowSum = result.categories
      .filter((c) => c.categoryId !== "agriculture")
      .reduce((s, c) => s + c.zakat, 0);

    expect(Math.abs(rowSum - result.wealthZakat)).toBeLessThan(1);
  });

  it("breakdown rows carry each category's own zakat, not its gross base", () => {
    const result = calculateZakat({
      entries,
      deductions: [],
      prices,
      nisabStandard: "gold",
    });

    const cash = result.categories.find((c) => c.categoryId === "cash");
    expect(cash).toBeDefined();
    // 1,000,000 of cash owes 25,000, not 1,000,000.
    expect(cash!.zakat).toBeCloseTo(25_000, 0);
  });

  it("business deduction items reduce only that category, never below zero", () => {
    const withDeductionItem: CategoryEntry[] = [
      entry("business", [
        { id: "b1", label: "stock", amount: 6_000_000 },
        { id: "b2", label: "supplier dues", amount: 2_000_000, isDeduction: true },
      ]),
    ];

    const result = calculateZakat({
      entries: withDeductionItem,
      deductions: [],
      prices,
      nisabStandard: "gold",
    });

    const business = result.categories.find((c) => c.categoryId === "business");
    expect(business!.base).toBe(4_000_000);
    expect(business!.zakat).toBeCloseTo(100_000, 0);
  });

  it("converts a USD stock holding into the base currency", () => {
    // 5,000 shares at $100 = $500,000. At 3.75 SAR/USD that is 1,875,000 SAR.
    const result = calculateZakat({
      entries: [
        entry("stocks", [
          { id: "st3", label: "أسهم $", amount: 0, shares: 5000, pricePerShare: 100, currency: "USD" },
        ]),
      ],
      deductions: [],
      prices,
      nisabStandard: "gold",
      fx: { base: "SAR", rates: { USD: 0.2667 }, updatedAt: null },
    });

    const stocks = result.categories.find((c) => c.categoryId === "stocks");
    expect(stocks!.base).toBeCloseTo(1_875_000, -3);
  });

  it("gross wealth equals the sum of the category bases", () => {
    const result = calculateZakat({
      entries,
      deductions: [],
      prices,
      nisabStandard: "gold",
    });

    const sum = result.categories
      .filter((c) => c.categoryId !== "agriculture")
      .reduce((s, c) => s + c.base, 0);

    expect(Math.abs(sum - result.grossWealth)).toBeLessThan(1);
    // 1,000,000 cash + 487,530 gold + 6,960 silver + 2,000,000 stocks
    // + 6,000,000 business + 1,000,000 real estate + 1,000,000 receivables
    expect(result.grossWealth).toBeCloseTo(11_494_490, 0);
  });
});
