import { describe, expect, it } from "vitest";

import {
  SAR_GLYPH_SCALE,
  SAR_LARGE_GLYPH_SCALE,
  SAR_LARGE_TEXT_THRESHOLD,
  sarGlyphScale,
  sarLineHeight,
} from "../lib/zakat/glyph-metrics";

// Ahmed reported the Riyal glyph clipped top and bottom on the summary screen,
// with his phone's system text size increased. Root cause: Tailwind's text-5xl
// sets fontSize and lineHeight both to 48, while the glyph was drawn at 28%
// larger, so it overflowed a line box that could not grow.
describe("Riyal glyph scaling", () => {
  it("keeps the full boost at body sizes, where the glyph is hard to read", () => {
    expect(sarGlyphScale(13)).toBe(SAR_GLYPH_SCALE);
    expect(sarGlyphScale(20)).toBe(SAR_GLYPH_SCALE);
    expect(sarGlyphScale(SAR_LARGE_TEXT_THRESHOLD - 1)).toBe(SAR_GLYPH_SCALE);
  });

  it("uses the gentler boost at display sizes", () => {
    expect(sarGlyphScale(SAR_LARGE_TEXT_THRESHOLD)).toBe(SAR_LARGE_GLYPH_SCALE);
    expect(sarGlyphScale(44)).toBe(SAR_LARGE_GLYPH_SCALE);
  });

  it("the gentler boost is still a boost, not parity with the digits", () => {
    expect(SAR_LARGE_GLYPH_SCALE).toBeGreaterThan(1);
    expect(SAR_LARGE_GLYPH_SCALE).toBeLessThan(SAR_GLYPH_SCALE);
  });
});

describe("Riyal glyph line box", () => {
  it("grows the line box past the scaled glyph, which is what stops the clipping", () => {
    // The reported case: text-5xl on the summary total.
    const lh = sarLineHeight(44, 44);
    expect(lh).toBeDefined();
    expect(lh!).toBeGreaterThan(Math.round(44 * SAR_LARGE_GLYPH_SCALE));
  });

  it("leaves a caller's own generous line height alone", () => {
    // index.tsx already passes lineHeight 16 for 13px text; 13 * 1.28 * 1.12 = 19,
    // so that one does need widening, but a deliberately roomy value must not be
    // overridden.
    expect(sarLineHeight(13, 40)).toBeUndefined();
    expect(sarLineHeight(44, 200)).toBeUndefined();
  });

  it("widens a too-tight caller line height", () => {
    expect(sarLineHeight(13, 16)).toBeGreaterThan(16);
  });

  it("returns a containing height when the caller sets none", () => {
    const lh = sarLineHeight(30, undefined);
    expect(lh).toBeDefined();
    expect(lh!).toBeGreaterThan(30);
  });

  it("scales monotonically with font size", () => {
    const sizes = [13, 14, 20, 30, 44];
    const heights = sizes.map((s) => sarLineHeight(s, undefined)!);
    for (let i = 1; i < heights.length; i += 1) {
      expect(heights[i]).toBeGreaterThan(heights[i - 1]);
    }
  });
});
