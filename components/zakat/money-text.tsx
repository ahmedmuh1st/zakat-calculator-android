// Renders a formatted money string, scaling the Saudi Riyal glyph up so it sits
// visually level with the digits. U+20C1 is drawn small relative to numerals in
// most system fonts, which makes amounts look unbalanced without this.
import React from "react";
import { Text, type TextProps, type TextStyle } from "react-native";

import { SAR_SYMBOL } from "@/lib/zakat/engine";
import { sarGlyphScale, sarLineHeight } from "@/lib/zakat/glyph-metrics";

export { SAR_GLYPH_SCALE, sarGlyphScale, sarLineHeight } from "@/lib/zakat/glyph-metrics";

export interface MoneyTextProps extends TextProps {
  /** Already-formatted money string, e.g. the output of formatMoney(). */
  value: string;
  /** Font size of the digits, used to derive the glyph size. */
  fontSize?: number;
}

/**
 * Splits the formatted string on the Riyal glyph and renders the glyph in a
 * nested Text with a larger fontSize. Falls back to plain text for any other
 * currency, so non-SAR amounts are untouched.
 */
export function MoneyText({ value, fontSize, style, children, ...rest }: MoneyTextProps) {
  const flat = (Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style) as TextStyle | undefined;
  const baseSize = fontSize ?? (typeof flat?.fontSize === "number" ? flat.fontSize : undefined);

  if (!value.includes(SAR_SYMBOL) || !baseSize) {
    return (
      <Text style={style} {...rest}>
        {value}
      </Text>
    );
  }

  const parts = value.split(SAR_SYMBOL);
  const callerLineHeight = typeof flat?.lineHeight === "number" ? flat.lineHeight : undefined;
  const containedLineHeight = sarLineHeight(baseSize, callerLineHeight);
  const glyphStyle: TextStyle = {
    fontSize: Math.round(baseSize * sarGlyphScale(baseSize)),
    // Share the outer line box so the glyph keeps the digits' baseline.
    lineHeight: containedLineHeight ?? callerLineHeight,
  };

  // Widen the line box only when the caller's own value would clip the glyph.
  const outerStyle = containedLineHeight ? [style, { lineHeight: containedLineHeight }] : style;

  return (
    <Text style={outerStyle} {...rest}>
      {parts.map((part, i) => (
        <Text key={i}>
          {i > 0 ? <Text style={glyphStyle}>{SAR_SYMBOL}</Text> : null}
          {part}
        </Text>
      ))}
    </Text>
  );
}
