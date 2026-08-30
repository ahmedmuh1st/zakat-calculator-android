import { describe, expect, it } from "vitest";

import { calculateZakat, categoryBase, categoryHoldings } from "../lib/zakat/engine";
import type { CalculationInput, MetalPrices } from "../lib/zakat/types";

// Silver nisab at 2 per gram is 595 * 2 = 1,190. Gold nisab at 400 is 34,000.
const prices: MetalPrices = {
  goldPerGram: 400,
  silverPerGram: 2,
  updatedAt: null,
  source: "manual",
};

function input(partial: Partial<CalculationInput>): CalculationInput {
  return {
    entries: [],
    deductions: [],
    prices,
    nisabStandard: "silver",
    ...partial,
  };
}

const flaggedStocks = {
  categoryId: "stocks" as const,
  items: [
    { id: "a", label: "Saudi equities", amount: 49000, companyPaysZakat: true },
  ],
};

const smallCash = {
  categoryId: "cash" as const,
  items: [{ id: "b", label: "Bank", amount: 1000 }],
};

describe("stocks whose company already pays zakat", () => {
  it("is excluded from the zakatable base", () => {
    expect(categoryBase(flaggedStocks, prices)).toBe(0);
  });

  it("but still counts as wealth the person holds", () => {
    expect(categoryHoldings(flaggedStocks, prices)).toBe(49000);
  });

  it("keeps the person above nisab so the rest of their wealth is still charged", () => {
    // The case that made this a correctness bug rather than a display quirk:
    // 49,000 in flagged Saudi equities plus 1,000 in cash. Judging on the base
    // alone leaves 1,000, which is under the 1,190 silver threshold, and the app
    // would tell a clearly wealthy person that nothing is due.
    const r = calculateZakat(input({ entries: [flaggedStocks, smallCash] }));

    expect(r.grossWealth).toBe(1000);
    expect(r.grossHoldings).toBe(50000);
    expect(r.aboveNisab).toBe(true);
    // Charged on the cash only, never on the flagged holding.
    expect(r.totalZakat).toBe(25);
  });

  it("does not invent zakat on the flagged holding itself", () => {
    const r = calculateZakat(input({ entries: [flaggedStocks] }));

    expect(r.aboveNisab).toBe(true);
    expect(r.grossWealth).toBe(0);
    expect(r.totalZakat).toBe(0);
  });

  it("still reports below nisab when holdings genuinely fall short", () => {
    const r = calculateZakat(
      input({
        entries: [{ categoryId: "cash", items: [{ id: "c", label: "Bank", amount: 500 }] }],
      }),
    );

    expect(r.aboveNisab).toBe(false);
    expect(r.totalZakat).toBe(0);
  });

  it("subtracts deductions from holdings too, so debt can pull someone under", () => {
    const r = calculateZakat(
      input({
        entries: [smallCash],
        deductions: [{ id: "d", label: "Loan", amount: 900 }],
      }),
    );

    expect(r.netHoldings).toBe(100);
    expect(r.aboveNisab).toBe(false);
  });

  it("ignores the flag outside the stocks category", () => {
    const goldWithFlag = {
      categoryId: "gold" as const,
      items: [{ id: "e", label: "Bars", amount: 5000, companyPaysZakat: true }],
    };

    expect(categoryBase(goldWithFlag, prices)).toBe(5000);
    expect(categoryHoldings(goldWithFlag, prices)).toBe(5000);
  });
});
