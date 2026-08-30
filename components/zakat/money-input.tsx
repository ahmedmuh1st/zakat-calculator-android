// Locale-aware numeric input: accepts Arabic-Indic digits, shows live thousands
// separators in the user's locale, and offers a generous tap target.
import React, { useCallback, useRef, useState } from "react";
import { Pressable, TextInput, View, type TextInputProps } from "react-native";

import { useColors } from "@/hooks/use-colors";
import type { LocaleCode } from "@/lib/i18n/locales";
import { cleanNumericText, formatNumericText } from "@/lib/zakat/numbers";

export interface MoneyInputProps
  extends Omit<TextInputProps, "value" | "onChangeText" | "keyboardType"> {
  /** Canonical ASCII numeric string, e.g. "150000.5" */
  value: string;
  /** Receives the canonical ASCII numeric string */
  onChangeValue: (canonical: string) => void;
  locale: LocaleCode;
  isRTL?: boolean;
  containerClassName?: string;
}

export function MoneyInput({
  value,
  onChangeValue,
  locale,
  isRTL,
  containerClassName,
  style,
  onFocus,
  ...props
}: MoneyInputProps) {
  const colors = useColors();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  const handleChange = useCallback(
    (text: string) => {
      onChangeValue(cleanNumericText(text));
    },
    [onChangeValue],
  );

  const display = formatNumericText(value, locale);

  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      style={{ flexGrow: 1, flexShrink: 1, flexBasis: "auto" }}
    >
      <View
        className={`bg-background border rounded-xl ${containerClassName ?? ""}`}
        style={{ borderColor: focused ? colors.primary : colors.border, minHeight: 48, justifyContent: "center" }}
      >
        <TextInput
          ref={inputRef}
          value={display}
          onChangeText={handleChange}
          keyboardType="decimal-pad"
          placeholderTextColor={colors.muted}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={() => setFocused(false)}
          className="px-3.5 text-foreground"
          style={[{ textAlign: isRTL ? "right" : "left", minHeight: 48, paddingVertical: 12, fontVariant: ["tabular-nums"] }, style]}
          returnKeyType="done"
          {...props}
        />
      </View>
    </Pressable>
  );
}
