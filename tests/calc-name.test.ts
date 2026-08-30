import { describe, expect, it } from "vitest";

import {
  CALC_NAME_MAX_LENGTH,
  calcDisplayName,
  normalizeCalcName,
  suggestedCalcName,
} from "../lib/zakat/calc-name";

describe("suggested calculation name", () => {
  it("names the record after the Hijri month and year in English", () => {
    expect(suggestedCalcName({ year: 1447, month: 9, day: 12 }, "en")).toBe("Zakat Ramadan 1447");
  });

  it("uses Arabic month names and Arabic-Indic digits in Arabic", () => {
    // Ahmed's own example of what History should read like.
    expect(suggestedCalcName({ year: 1447, month: 9, day: 12 }, "ar")).toBe("زكاة رمضان ١٤٤٧");
  });

  it("does not leak Western digits into the Arabic suggestion", () => {
    expect(suggestedCalcName({ year: 1448, month: 2, day: 1 }, "ar")).not.toMatch(/[0-9]/);
  });

  it("clamps an out-of-range month rather than producing undefined", () => {
    expect(suggestedCalcName({ year: 1447, month: 13, day: 1 }, "en")).toContain("Dhu al-Hijjah");
    expect(suggestedCalcName({ year: 1447, month: 0, day: 1 }, "en")).toContain("Muharram");
  });
});

describe("normalizing a typed name", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeCalcName("  Zakat   Ramadan  1447 ")).toBe("Zakat Ramadan 1447");
  });

  it("treats a blank name as absent so callers can fall back to the Hijri label", () => {
    expect(normalizeCalcName("")).toBeUndefined();
    expect(normalizeCalcName("    ")).toBeUndefined();
    expect(normalizeCalcName("\n\t")).toBeUndefined();
  });

  it("caps the length to keep History rows readable", () => {
    const long = "ز".repeat(120);
    expect(normalizeCalcName(long)!.length).toBe(CALC_NAME_MAX_LENGTH);
  });

  it("keeps Arabic text intact", () => {
    expect(normalizeCalcName("زكاة رمضان ١٤٤٧")).toBe("زكاة رمضان ١٤٤٧");
  });
});

describe("what History displays", () => {
  it("prefers the name when there is one", () => {
    expect(calcDisplayName({ name: "Zakat Ramadan 1447", hijriLabel: "12 Ramadan 1447 AH" })).toBe(
      "Zakat Ramadan 1447",
    );
  });

  it("falls back to the Hijri label for records saved before naming existed", () => {
    expect(calcDisplayName({ hijriLabel: "12 Ramadan 1447 AH" })).toBe("12 Ramadan 1447 AH");
  });

  it("treats a whitespace-only name as no name", () => {
    expect(calcDisplayName({ name: "   ", hijriLabel: "12 Ramadan 1447 AH" })).toBe("12 Ramadan 1447 AH");
  });
});
