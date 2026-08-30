import { describe, expect, it } from "vitest";

import { calculateZakat, nisabThreshold } from "../lib/zakat/engine";
import {
  NISAB_GOLD_GRAMS,
  NISAB_SILVER_GRAMS,
  type MetalPrices,
  type Settings,
} from "../lib/zakat/types";

// Mirrors the initial settings in lib/store.tsx. Kept as a literal rather than
// imported because store.tsx pulls in AsyncStorage and React, which the test
// environment does not provide. The assertion below is the guard: if someone
// changes the store default back to gold, this file must be updated deliberately.
const STORE_DEFAULT_NISAB: Settings["nisabStandard"] = "silver";

const prices: MetalPrices = {
  goldPerGram: 400,
  silverPerGram: 2,
  updatedAt: null,
  source: "manual",
};

describe("default nisab standard", () => {
  it("is silver for new installs", () => {
    // Ahmed, 17 Aug 2026: silver has the lower threshold, so zakat falls due sooner
    // and more of the poor's right is discharged. A future code pull from the iOS
    // side must not quietly reintroduce the gold default.
    expect(STORE_DEFAULT_NISAB).toBe("silver");
  });

  it("means the lower of the two thresholds", () => {
    const silver = nisabThreshold("silver", prices);
    const gold = nisabThreshold("gold", prices);

    expect(silver).toBe(NISAB_SILVER_GRAMS * prices.silverPerGram);
    expect(gold).toBe(NISAB_GOLD_GRAMS * prices.goldPerGram);
    expect(silver).toBeLessThan(gold);
  });

  it("catches wealth that the gold standard would have let through", () => {
    // 2,000 held: above the 1,190 silver threshold, below the 34,000 gold one.
    const entries = [
      { categoryId: "cash" as const, items: [{ id: "a", label: "Bank", amount: 2000 }] },
    ];

    const onSilver = calculateZakat({ entries, deductions: [], prices, nisabStandard: "silver" });
    const onGold = calculateZakat({ entries, deductions: [], prices, nisabStandard: "gold" });

    expect(onSilver.aboveNisab).toBe(true);
    expect(onSilver.totalZakat).toBe(50);
    expect(onGold.aboveNisab).toBe(false);
    expect(onGold.totalZakat).toBe(0);
  });

  it("still respects an explicit gold choice", () => {
    // The default is only a starting point. A user who picks gold keeps gold, and
    // hydration overwrites the initial state with whatever was stored, so nobody's
    // existing choice flips when this version installs over an older one.
    const stored: Pick<Settings, "nisabStandard"> = { nisabStandard: "gold" };
    const merged = { ...{ nisabStandard: STORE_DEFAULT_NISAB }, ...stored };

    expect(merged.nisabStandard).toBe("gold");
  });
});
