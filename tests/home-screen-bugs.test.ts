import { describe, expect, it } from "vitest";

import { formatHijri, toHijri } from "../lib/zakat/hijri";
import { formatMoney } from "../lib/zakat/engine";
import { ar } from "../lib/i18n/ar";

describe("Hijri date formatting", () => {
  it("does not emit a stray leading zero for the day", () => {
    const h = { year: 1448, month: 2, day: 17 };
    const out = formatHijri(h, "ar");
    expect(out).not.toMatch(/^0/);
    expect(out).not.toContain("٠١");
    expect(out).toContain("صفر");
    expect(out).toContain("١٤٤٨");
  });

  it("renders Arabic-Indic digits in Arabic locale", () => {
    const out = formatHijri({ year: 1448, month: 2, day: 17 }, "ar");
    // Should contain Arabic-Indic digits, not Western
    expect(out).toMatch(/[٠-٩]/);
    expect(out).not.toMatch(/[0-9]/);
  });

  it("renders Western digits in English locale", () => {
    const out = formatHijri({ year: 1448, month: 2, day: 17 }, "en");
    expect(out).toContain("17");
    expect(out).toContain("Safar");
    expect(out).toContain("AH");
  });

  it("toHijri returns a plausible date", () => {
    const h = toHijri(new Date("2026-07-31T12:00:00Z"));
    expect(h.year).toBeGreaterThan(1440);
    expect(h.month).toBeGreaterThanOrEqual(1);
    expect(h.month).toBeLessThanOrEqual(12);
    expect(h.day).toBeGreaterThanOrEqual(1);
    expect(h.day).toBeLessThanOrEqual(30);
  });
});

describe("Arabic countdown numerals", () => {
  it("uses Arabic-Indic digits for the day count", () => {
    const out = ar.daysToZakat(192);
    expect(out).not.toContain("192");
    expect(out).toMatch(/[٠-٩]/);
  });
});

describe("Money formatting keeps the currency indicator", () => {
  it("includes the Riyal symbol for SAR in Arabic", () => {
    const out = formatMoney(487.69, "SAR", "ar");
    expect(out).toContain("\u20C1");
  });

  it("includes a currency indicator for USD", () => {
    const out = formatMoney(487.69, "USD", "en");
    expect(out).toMatch(/\$/);
  });
});
