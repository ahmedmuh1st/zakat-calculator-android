import { describe, expect, it } from "vitest";

import { homePaymentState } from "../lib/zakat/home-payment";
import type { SavedCalculation } from "../lib/zakat/types";

const saved = (id: string): SavedCalculation =>
  ({
    id,
    savedAt: `2026-08-${id === "new" ? "27" : "01"}T10:00:00.000Z`,
    hijriYear: 1448,
    hijriLabel: "Rabi I 1448",
    name: id,
    currency: "SAR",
    input: { entries: [], deductions: [], prices: {}, nisabStandard: "silver" },
    result: { totalZakat: id === "new" ? 100 : 50 },
  }) as unknown as SavedCalculation;

describe("Home payment state", () => {
  it("uses the explicitly tracked saved calculation", () => {
    const state = homePaymentState({
      history: [saved("new"), saved("old")],
      trackedCalculationId: "old",
      hasEntries: true,
    });
    expect(state.kind).toBe("tracked");
    if (state.kind === "tracked") expect(state.calculation.id).toBe("old");
  });

  it("falls back to the newest saved calculation for existing users", () => {
    const state = homePaymentState({
      history: [saved("new"), saved("old")],
      trackedCalculationId: null,
      hasEntries: false,
    });
    expect(state.kind).toBe("tracked");
    if (state.kind === "tracked") expect(state.calculation.id).toBe("new");
  });

  it("falls back safely when the remembered record was deleted", () => {
    const state = homePaymentState({
      history: [saved("new")],
      trackedCalculationId: "deleted",
      hasEntries: false,
    });
    expect(state.kind).toBe("tracked");
    if (state.kind === "tracked") expect(state.calculation.id).toBe("new");
  });

  it("shows save-first when unsaved figures exist", () => {
    expect(homePaymentState({ history: [], trackedCalculationId: null, hasEntries: true })).toEqual({
      kind: "save-first",
    });
  });

  it("stays hidden before figures or history exist", () => {
    expect(homePaymentState({ history: [], trackedCalculationId: null, hasEntries: false })).toEqual({
      kind: "hidden",
    });
  });
});
