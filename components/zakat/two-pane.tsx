// Two-pane layout for tablets and unfolded foldables in landscape.
//
// Below the two-pane threshold this renders the primary content alone, so
// phone and unfolded-portrait layouts are untouched. At or above the
// threshold it places a persistent side pane next to the content.
//
// The pane sits on the trailing edge: right in English, left in Arabic. That
// mirroring is driven by the app's own `isRTL` flag (from the language
// setting) rather than `I18nManager`, matching how every other row in the app
// flips direction.
import React from "react";
import { ScrollView, View } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { useLayout } from "@/hooks/use-layout";
import { useStore } from "@/lib/store";

/** Hairline divider between the panes. */
const PANE_BORDER = 0.5;

export interface TwoPaneProps {
  /** Main screen content. Rendered alone when the window is too narrow. */
  children: React.ReactNode;
  /** Side pane content. Only mounted when the layout is wide enough. */
  side?: React.ReactNode;
}

export function TwoPane({ children, side }: TwoPaneProps) {
  const { twoPane, sidePaneWidth } = useLayout();
  const { isRTL } = useStore();
  const colors = useColors();

  if (!twoPane || !side) {
    return <>{children}</>;
  }

  return (
    <View style={{ flex: 1, flexDirection: isRTL ? "row-reverse" : "row" }}>
      <View style={{ flex: 1 }}>{children}</View>
      <View
        style={{
          width: sidePaneWidth,
          borderColor: colors.border,
          // Hairline on the inner edge only, so the pane reads as part of the
          // same surface rather than a floating panel.
          borderLeftWidth: isRTL ? 0 : PANE_BORDER,
          borderRightWidth: isRTL ? PANE_BORDER : 0,
        }}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {side}
        </ScrollView>
      </View>
    </View>
  );
}
