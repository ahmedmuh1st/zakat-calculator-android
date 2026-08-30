import { describe, expect, it } from "vitest";

import { historyToCsv } from "../lib/zakat/export-format";
import type { SavedCalculation } from "../lib/zakat/types";

function calculation(): SavedCalculation {
  return {
    id: "calc-1",
    savedAt: "2026-08-27T08:00:00.000Z",
    hijriYear: 1448,
    hijriLabel: "14 Rabi I 1448",
    name: "Zakat 1448",
    currency: "SAR",
    input: { entries: [], deductions: [], prices: { goldPerGram: 0, silverPerGram: 0, updatedAt: null, source: "none" }, nisabStandard: "silver" },
    result: {
      grossWealth: 0,
      grossHoldings: 0,
      totalDeductions: 0,
      netWealth: 0,
      netHoldings: 0,
      nisabThreshold: 0,
      nisabStandard: "silver",
      aboveNisab: true,
      wealthZakat: 1_000,
      agricultureZakat: 0,
      totalZakat: 1_000,
      categories: [],
    },
    payments: [
      {
        id: "p1",
        name: "Family fund",
        amount: 250,
        paidAt: "2026-08-27T09:30:00.000Z",
        updatedAt: "2026-08-27T09:30:00.000Z",
      },
      {
        id: "p2",
        name: "Deleted payment",
        amount: 100,
        paidAt: "2026-08-27T10:00:00.000Z",
        updatedAt: "2026-08-27T11:00:00.000Z",
        deletedAt: "2026-08-27T11:00:00.000Z",
      },
    ],
  };
}

describe("payment CSV export", () => {
  it("exports paid, remaining and active payment details", () => {
    const csv = historyToCsv([calculation()]);
    expect(csv.split("\n")[0]).toBe(
      "Name,Saved at,Hijri year,Hijri date,Currency,Gross wealth,Deductions,Net wealth,Nisab,Total Zakat,Paid,Remaining,Payments",
    );
    expect(csv).toContain("Zakat 1448");
    expect(csv).toContain("250,750,Family fund: 250 @ 2026-08-27T09:30:00.000Z");
    expect(csv).not.toContain("Deleted payment");
  });
});
