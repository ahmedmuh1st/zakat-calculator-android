import { describe, expect, it } from "vitest";

import { faqForCategory, primaryFaqTopic } from "../lib/content/category-faq";
import { FAQ_ITEMS } from "../lib/content/faq";
import { calculateZakat, isItemZakatable, itemValue } from "../lib/zakat/engine";
import { CATEGORY_IDS, KARAT_PURITY, type CalculationInput, type MetalPrices } from "../lib/zakat/types";

const prices: MetalPrices = {
  goldPerGram: 400,
  silverPerGram: 4,
  updatedAt: "2026-08-18T00:00:00.000Z",
  source: "manual",
};

function input(partial: Partial<CalculationInput>): CalculationInput {
  return {
    entries: [],
    deductions: [],
    prices,
    nisabStandard: "gold",
    ...partial,
  };
}

describe("gold karats (V2-4)", () => {
  it("covers 14k and 10k alongside the original karats", () => {
    expect(Object.keys(KARAT_PURITY).map(Number).sort((a, b) => b - a)).toEqual([24, 22, 21, 18, 14, 10]);
  });

  it("uses exact fractional purity, not rounded percentages", () => {
    expect(KARAT_PURITY[14]).toBeCloseTo(14 / 24, 10);
    expect(KARAT_PURITY[10]).toBeCloseTo(10 / 24, 10);
  });

  it("values 14k gold at its pure gold content", () => {
    // 100g of 14k at 400/g of pure gold = 100 * (14/24) * 400
    const value = itemValue({ id: "a", label: "ring", amount: 0, grams: 100, karat: 14 }, "gold", prices);
    expect(value).toBeCloseTo(100 * (14 / 24) * 400, 6);
  });

  it("values lower karats below higher ones for the same weight", () => {
    const at = (karat: 24 | 22 | 21 | 18 | 14 | 10) =>
      itemValue({ id: "a", label: "x", amount: 0, grams: 50, karat }, "gold", prices);
    const values = [24, 22, 21, 18, 14, 10].map((k) => at(k as 24));
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeLessThan(values[i - 1]);
    }
  });
});

describe("stocks the company already pays zakat on (V2-5)", () => {
  const holding = {
    id: "s1",
    label: "Saudi co",
    amount: 0,
    shares: 100,
    pricePerShare: 500,
  };

  it("excludes a flagged holding from the zakatable base", () => {
    expect(isItemZakatable({ ...holding, companyPaysZakat: true }, "stocks")).toBe(false);
    expect(isItemZakatable(holding, "stocks")).toBe(true);
  });

  it("only applies the flag to stocks", () => {
    // A stray flag on another category must not silently drop wealth.
    expect(isItemZakatable({ ...holding, companyPaysZakat: true }, "cash")).toBe(true);
  });

  it("keeps the holding out of the total but leaves other categories intact", () => {
    const withFlag = calculateZakat(
      input({
        entries: [
          { categoryId: "stocks", items: [{ ...holding, companyPaysZakat: true }] },
          { categoryId: "cash", items: [{ id: "c1", label: "bank", amount: 100_000 }] },
        ],
      }),
    );
    expect(withFlag.grossWealth).toBe(100_000);
    expect(withFlag.categories.find((c) => c.categoryId === "stocks")?.base).toBe(0);
    expect(withFlag.totalZakat).toBeCloseTo(2_500, 2);
  });

  it("counts the holding when the flag is off", () => {
    const without = calculateZakat(
      input({ entries: [{ categoryId: "stocks", items: [holding] }] }),
    );
    expect(without.grossWealth).toBe(50_000);
    expect(without.totalZakat).toBeCloseTo(1_250, 2);
  });

  it("does not turn an above-nisab holder into a payer of zero by accident", () => {
    // All wealth excluded → nothing to charge, but the person is still visibly
    // wealthy, so nisab must report true. Superseded the original assertion here,
    // which expected aboveNisab false: that was the defect the iOS session caught
    // on 18 Aug. The nisab test runs on holdings, the 2.5% charge on the base.
    const all = calculateZakat(
      input({ entries: [{ categoryId: "stocks", items: [{ ...holding, companyPaysZakat: true }] }] }),
    );
    expect(all.grossWealth).toBe(0);
    expect(all.grossHoldings).toBe(50_000);
    expect(all.totalZakat).toBe(0);
    expect(all.aboveNisab).toBe(true);
  });
});

describe("contextual category FAQ (V2-2)", () => {
  it("returns questions for every calculator category", () => {
    for (const id of CATEGORY_IDS) {
      expect(faqForCategory(id).length).toBeGreaterThan(0);
    }
  });

  it("respects the limit and never repeats a question", () => {
    for (const id of CATEGORY_IDS) {
      const items = faqForCategory(id, 3);
      expect(items.length).toBeLessThanOrEqual(3);
      expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
    }
  });

  it("pins the karat question first for gold, since that was the reported confusion", () => {
    expect(faqForCategory("gold")[0]?.id).toBe("gold-karat");
  });

  it("only returns questions that exist in the curated list", () => {
    const ids = new Set(FAQ_ITEMS.map((f) => f.id));
    for (const id of CATEGORY_IDS) {
      for (const item of faqForCategory(id)) {
        expect(ids.has(item.id)).toBe(true);
      }
    }
  });

  it("maps each category to a real FAQ topic for the see-all deep link", () => {
    const topics = new Set(FAQ_ITEMS.map((f) => f.category));
    for (const id of CATEGORY_IDS) {
      expect(topics.has(primaryFaqTopic(id))).toBe(true);
    }
  });
});
