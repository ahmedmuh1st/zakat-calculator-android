import { describe, expect, it } from "vitest";

import { calculateZakat, itemValue, nisabThreshold, toBase } from "../lib/zakat/engine";
import { daysUntilAnniversary, toHijri } from "../lib/zakat/hijri";
import { cleanNumericText, formatNumericText, normalizeDigits, parseAmount } from "../lib/zakat/numbers";
import { CalculationInput, FxRates, MetalPrices } from "../lib/zakat/types";

const prices: MetalPrices = {
  goldPerGram: 400, // SAR
  silverPerGram: 5,
  updatedAt: new Date().toISOString(),
  source: "manual",
};

// 1 SAR base; USD 0.2667 per SAR (i.e. 3.75 SAR per USD)
const fx: FxRates = {
  base: "SAR",
  rates: { SAR: 1, USD: 1 / 3.75, EUR: 1 / 4.1 },
  updatedAt: new Date().toISOString(),
};

function baseInput(overrides: Partial<CalculationInput> = {}): CalculationInput {
  return {
    entries: [],
    deductions: [],
    prices,
    nisabStandard: "gold",
    ...overrides,
  };
}

describe("nisab", () => {
  it("gold nisab = 85g x price", () => {
    expect(nisabThreshold("gold", prices)).toBe(34000);
  });
  it("silver nisab = 595g x price", () => {
    expect(nisabThreshold("silver", prices)).toBe(2975);
  });
});

describe("itemValue", () => {
  it("values 18k gold at 75% purity", () => {
    expect(itemValue({ id: "1", label: "ring", amount: 0, grams: 100, karat: 18 }, "gold", prices)).toBe(30000);
  });
  it("values 24k gold at full purity", () => {
    expect(itemValue({ id: "1", label: "bar", amount: 0, grams: 10, karat: 24 }, "gold", prices)).toBe(4000);
  });
  it("values silver by grams", () => {
    expect(itemValue({ id: "1", label: "set", amount: 0, grams: 200 }, "silver", prices)).toBe(1000);
  });
  it("uses amount for cash", () => {
    expect(itemValue({ id: "1", label: "savings", amount: 5000 }, "cash", prices)).toBe(5000);
  });
  it("values stocks as shares x price per share", () => {
    expect(itemValue({ id: "1", label: "Mayar", amount: 0, shares: 200, pricePerShare: 55.5 }, "stocks", prices)).toBe(11100);
  });
  it("falls back to amount for stocks without shares data", () => {
    expect(itemValue({ id: "1", label: "fund", amount: 25000 }, "stocks", prices)).toBe(25000);
  });
  it("converts USD cash to SAR base via fx", () => {
    // $10,000 at 3.75 = SAR 37,500
    expect(itemValue({ id: "1", label: "usd cash", amount: 10000, currency: "USD" }, "cash", prices, fx)).toBeCloseTo(37500, 0);
  });
  it("leaves base-currency items untouched", () => {
    expect(toBase(5000, "SAR", fx)).toBe(5000);
    expect(toBase(5000, undefined, fx)).toBe(5000);
  });
  it("unknown currency falls back to face value", () => {
    expect(toBase(5000, "XXX", fx)).toBe(5000);
  });
  it("converts foreign stocks value to base", () => {
    // 100 shares × $200 = $20,000 = SAR 75,000
    expect(
      itemValue({ id: "1", label: "us shares", amount: 0, shares: 100, pricePerShare: 200, currency: "USD" }, "stocks", prices, fx),
    ).toBeCloseTo(75000, 0);
  });
});

describe("calculateZakat", () => {
  it("charges 2.5% above gold nisab", () => {
    const r = calculateZakat(
      baseInput({ entries: [{ categoryId: "cash", items: [{ id: "1", label: "x", amount: 100000 }] }] }),
    );
    expect(r.aboveNisab).toBe(true);
    expect(r.totalZakat).toBe(2500);
  });
  it("charges nothing below nisab", () => {
    const r = calculateZakat(
      baseInput({ entries: [{ categoryId: "cash", items: [{ id: "1", label: "x", amount: 20000 }] }] }),
    );
    expect(r.aboveNisab).toBe(false);
    expect(r.totalZakat).toBe(0);
  });
  it("same wealth can be above silver nisab while below gold", () => {
    const gold = calculateZakat(
      baseInput({ entries: [{ categoryId: "cash", items: [{ id: "1", label: "x", amount: 20000 }] }] }),
    );
    const silver = calculateZakat(
      baseInput({
        nisabStandard: "silver",
        entries: [{ categoryId: "cash", items: [{ id: "1", label: "x", amount: 20000 }] }],
      }),
    );
    expect(gold.aboveNisab).toBe(false);
    expect(silver.aboveNisab).toBe(true);
    expect(silver.totalZakat).toBe(500);
  });
  it("subtracts deductions before nisab comparison", () => {
    const r = calculateZakat(
      baseInput({
        entries: [{ categoryId: "cash", items: [{ id: "1", label: "x", amount: 40000 }] }],
        deductions: [{ id: "d1", label: "debt", amount: 10000 }],
      }),
    );
    // net 30000 < 34000 gold nisab
    expect(r.netWealth).toBe(30000);
    expect(r.aboveNisab).toBe(false);
  });
  it("business payables reduce the category base", () => {
    const r = calculateZakat(
      baseInput({
        entries: [
          {
            categoryId: "business",
            items: [
              { id: "1", label: "stock", amount: 100000 },
              { id: "2", label: "payables", amount: 30000, isDeduction: true },
            ],
          },
        ],
      }),
    );
    const biz = r.categories.find((c) => c.categoryId === "business")!;
    expect(biz.base).toBe(70000);
    expect(r.totalZakat).toBe(1750);
  });
  it("agriculture uses harvest rates and bypasses nisab pool", () => {
    const r = calculateZakat(
      baseInput({
        entries: [
          {
            categoryId: "agriculture",
            items: [
              { id: "1", label: "rain crop", amount: 10000, irrigation: "rain" },
              { id: "2", label: "irrigated crop", amount: 10000, irrigation: "irrigated" },
              { id: "3", label: "mixed crop", amount: 10000, irrigation: "mixed" },
            ],
          },
        ],
      }),
    );
    expect(r.agricultureZakat).toBe(1000 + 500 + 750);
    expect(r.aboveNisab).toBe(false); // no wealth categories
    expect(r.totalZakat).toBe(2250);
  });
  it("gold grams flow through nisab math end to end", () => {
    const r = calculateZakat(
      baseInput({
        entries: [
          { categoryId: "gold", items: [{ id: "1", label: "bars", amount: 0, grams: 100, karat: 24 }] },
        ],
      }),
    );
    // 100g > 85g nisab -> zakat = 40000 * 2.5% = 1000
    expect(r.aboveNisab).toBe(true);
    expect(r.totalZakat).toBe(1000);
  });
  it("never returns negative wealth", () => {
    const r = calculateZakat(
      baseInput({
        entries: [{ categoryId: "cash", items: [{ id: "1", label: "x", amount: 1000 }] }],
        deductions: [{ id: "d", label: "big debt", amount: 99999 }],
      }),
    );
    expect(r.netWealth).toBe(0);
    expect(r.totalZakat).toBe(0);
  });
  it("mixed portfolio pools stocks with cash for nisab and 2.5%", () => {
    const r = calculateZakat(
      baseInput({
        entries: [
          { categoryId: "cash", items: [{ id: "1", label: "bank", amount: 20000 }] },
          { categoryId: "stocks", items: [{ id: "2", label: "shares", amount: 0, shares: 100, pricePerShare: 200 }] },
        ],
      }),
    );
    // 20000 + 20000 = 40000 >= 34000 gold nisab -> 1000 zakat
    expect(r.netWealth).toBe(40000);
    expect(r.aboveNisab).toBe(true);
    expect(r.totalZakat).toBe(1000);
    const stocks = r.categories.find((c) => c.categoryId === "stocks")!;
    expect(stocks.zakat).toBe(500);
  });
  it("multi-currency portfolio converts before nisab comparison", () => {
    const r = calculateZakat(
      baseInput({
        entries: [
          { categoryId: "cash", items: [{ id: "1", label: "USD", amount: 10000, currency: "USD" }] },
        ],
        fx,
      }),
    );
    // SAR 37,500 >= 34,000 nisab → 937.5 zakat
    expect(r.netWealth).toBeCloseTo(37500, 0);
    expect(r.aboveNisab).toBe(true);
    expect(r.totalZakat).toBeCloseTo(937.5, 1);
  });

  it("shows Umer's true gross category Zakat and one deduction adjustment", () => {
    const r = calculateZakat(
      baseInput({
        prices: { ...prices, goldPerGram: 100 },
        nisabStandard: "silver",
        entries: [
          // Underlying 120,129.80 displays as 120,130 in the UI and produces the
          // exact 29,239.02 saved total in Umer's reported calculation.
          { categoryId: "gold", items: [{ id: "g", label: "Gold", amount: 0, grams: 1201.298, karat: 24 }] },
          { categoryId: "cash", items: [{ id: "c", label: "Cash", amount: 637746 }] },
          { categoryId: "stocks", items: [{ id: "s", label: "Stocks", amount: 216000 }] },
          { categoryId: "realEstate", items: [{ id: "r", label: "Property", amount: 238798 }] },
          { categoryId: "debts", items: [{ id: "d", label: "Owed", amount: 10000 }] },
        ],
        deductions: [{ id: "shared", label: "Debts", amount: 53113 }],
      }),
    );

    expect(r.categories.map((c) => [c.categoryId, c.zakat])).toEqual([
      ["gold", 3003.25],
      ["cash", 15943.65],
      ["stocks", 5400],
      ["realEstate", 5969.95],
      ["debts", 250],
    ]);
    expect(r.deductionZakatAdjustment).toBe(1327.83);
    expect(r.totalZakat).toBe(29239.02);
    const reconciledCents = Math.round(
      (r.categories.reduce((sum, category) => sum + category.zakat, 0) -
        (r.deductionZakatAdjustment ?? 0)) *
        100,
    );
    expect(reconciledCents).toBe(Math.round(r.totalZakat * 100));
  });

  it("has no category Zakat or deduction adjustment below Nisab", () => {
    const r = calculateZakat(
      baseInput({
        entries: [{ categoryId: "cash", items: [{ id: "1", label: "Cash", amount: 20000 }] }],
        deductions: [{ id: "d", label: "Debt", amount: 1000 }],
      }),
    );
    expect(r.categories[0]?.zakat).toBe(0);
    expect(r.deductionZakatAdjustment).toBe(0);
  });
});

describe("numbers", () => {
  it("normalizes Arabic-Indic digits", () => {
    expect(normalizeDigits("١٢٣٤٥")).toBe("12345");
    expect(normalizeDigits("۱۲۳")).toBe("123");
  });
  it("normalizes Arabic decimal separator", () => {
    expect(parseAmount("١٠٠٫٥")).toBe(100.5);
  });
  it("parses grouped input", () => {
    expect(parseAmount("1,500,000")).toBe(1500000);
    expect(parseAmount("١٬٥٠٠")).toBe(1500);
  });
  it("cleans mixed input to canonical form", () => {
    expect(cleanNumericText("١٠٠٠")).toBe("1000");
    expect(cleanNumericText("1.2.3")).toBe("1.23");
    expect(cleanNumericText("abc12")).toBe("12");
  });
  it("formats with grouping for display", () => {
    expect(formatNumericText("1500000", "en")).toBe("1,500,000");
    expect(formatNumericText("12.5", "en")).toBe("12.5");
  });
});

describe("hijri", () => {
  it("converts today to a plausible hijri date", () => {
    const h = toHijri(new Date());
    expect(h.year).toBeGreaterThan(1400);
    expect(h.month).toBeGreaterThanOrEqual(1);
    expect(h.month).toBeLessThanOrEqual(12);
    expect(h.day).toBeGreaterThanOrEqual(1);
    expect(h.day).toBeLessThanOrEqual(30);
  });
  it("finds a future anniversary within ~2 lunar years", () => {
    const d = daysUntilAnniversary(9, 1); // 1st Ramadan
    expect(d).toBeGreaterThanOrEqual(0);
    expect(d).toBeLessThanOrEqual(710);
  });
});
