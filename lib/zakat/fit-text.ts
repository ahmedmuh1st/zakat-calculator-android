// Choosing a font size that keeps a single line of text inside a fixed width.
//
// The hero total sits inside a circle, so there is a hard width it must not exceed. React
// Native's own answer, adjustsFontSizeToFit with minimumFontScale, is iOS-only: it does
// nothing on Android or web, which is why a long Rupiah amount was crossing the ring's
// stroke rather than shrinking. Rather than rely on a prop that works on one of three
// platforms, size the text from the string itself.
//
// The estimate is deliberately simple: for tabular figures the average glyph advance is a
// stable fraction of the font size, so width is roughly characters * size * ratio. That is
// approximate, but it only ever has to be conservative, and being slightly small is
// invisible while being slightly large clips the amount.

/**
 * Average glyph width as a fraction of font size, for the digits, separators and currency
 * codes that appear in formatted money. Measured against the app's own figures rather than
 * assumed: digits in the system font sit near 0.55, and letters in codes such as "Rp" run
 * slightly wider, so 0.58 leaves a small margin.
 */
export const MONEY_GLYPH_RATIO = 0.58;

export interface FitTextOptions {
  /** Preferred size when the text is short enough to use it. */
  preferred: number;
  /** Never go below this, even if the text still would not fit. */
  minimum: number;
  /** Width the single line has to fit inside. */
  maxWidth: number;
  /** Override the glyph ratio, for text that is not formatted money. */
  ratio?: number;
}

export function fitFontSize(text: string, options: FitTextOptions): number {
  const { preferred, minimum, maxWidth } = options;
  const ratio = options.ratio ?? MONEY_GLYPH_RATIO;

  // A missing or nonsensical width means we have nothing to fit against, so leave the
  // preferred size alone rather than shrinking to the floor for no reason.
  if (!(maxWidth > 0) || text.length === 0) return preferred;

  const estimated = maxWidth / (text.length * ratio);
  if (estimated >= preferred) return preferred;

  return Math.max(minimum, Math.floor(estimated));
}
