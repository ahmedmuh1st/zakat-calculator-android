// Sizing rules for the enlarged Saudi Riyal glyph (U+20C1).
//
// Kept in a plain .ts module rather than inside money-text.tsx so the rules can
// be unit tested: the test runner has no JSX transform configured, so importing
// a component file from a test fails to parse.

/**
 * How much larger the Riyal glyph is drawn relative to the surrounding digits
 * at body sizes, where the glyph is genuinely hard to read without a boost.
 */
export const SAR_GLYPH_SCALE = 1.28;

/** At or above this digit size the glyph already reads clearly. */
export const SAR_LARGE_TEXT_THRESHOLD = 32;

/**
 * Scale applied at or above {@link SAR_LARGE_TEXT_THRESHOLD}.
 *
 * The full boost was chosen for small text. At display sizes it only overflows
 * the line box, because Tailwind's text-* classes set fontSize and lineHeight to
 * the same value, leaving a 28%-larger glyph nowhere to go. That clipped the top
 * and bottom of the symbol on the summary total, which Ahmed hit on a phone with
 * enlarged system text.
 */
export const SAR_LARGE_GLYPH_SCALE = 1.15;

/** Resolves the glyph scale for a given digit font size. */
export function sarGlyphScale(baseSize: number): number {
  return baseSize >= SAR_LARGE_TEXT_THRESHOLD ? SAR_LARGE_GLYPH_SCALE : SAR_GLYPH_SCALE;
}

/**
 * Line height that contains the scaled glyph without clipping it. Returns
 * undefined when the caller's own lineHeight is already generous enough, so
 * spacing that already works is left untouched.
 */
export function sarLineHeight(baseSize: number, callerLineHeight?: number): number | undefined {
  // 1.12 clears the glyph's ascender and descender with a little room to spare.
  const needed = Math.ceil(baseSize * sarGlyphScale(baseSize) * 1.12);
  if (typeof callerLineHeight === "number" && callerLineHeight >= needed) return undefined;
  return needed;
}
