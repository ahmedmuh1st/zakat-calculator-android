// Centers screen content and caps its width on unfolded foldables / tablets.
//
// On compact widths this renders as a plain full-width View, so phone layouts
// are byte-for-byte unchanged. On wide widths it becomes a centered column.
import { View, type ViewProps } from "react-native";

import { useLayout } from "@/hooks/use-layout";

export interface ContentColumnProps extends ViewProps {
  /**
   * Override the width cap. Screens that lay out two columns inside the
   * container (the summary) need the wider canvas rather than the single
   * reading column.
   */
  maxWidth?: number;
}

export function ContentColumn({ children, style, maxWidth, ...props }: ContentColumnProps) {
  const { isWide, contentMaxWidth } = useLayout();
  const cap = maxWidth ?? contentMaxWidth;

  if (!isWide) {
    return (
      <View style={style} {...props}>
        {children}
      </View>
    );
  }

  return (
    <View style={[{ width: "100%", alignItems: "center" }, style]} {...props}>
      <View style={{ width: "100%", maxWidth: cap }}>{children}</View>
    </View>
  );
}
