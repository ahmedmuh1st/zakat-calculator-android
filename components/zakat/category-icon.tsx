import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { View } from "react-native";

import { CATEGORY_COLORS, CategoryId } from "@/lib/zakat/types";

const ICONS: Record<CategoryId, React.ComponentProps<typeof MaterialIcons>["name"]> = {
  cash: "account-balance-wallet",
  gold: "workspace-premium",
  silver: "stars",
  stocks: "trending-up",
  business: "storefront",
  realEstate: "apartment",
  debts: "handshake",
  agriculture: "agriculture",
  crypto: "currency-bitcoin",
};

export function CategoryIcon({
  categoryId,
  size = 22,
  boxSize = 42,
}: {
  categoryId: CategoryId;
  size?: number;
  boxSize?: number;
}) {
  const color = CATEGORY_COLORS[categoryId];
  return (
    <View
      style={{
        width: boxSize,
        height: boxSize,
        borderRadius: boxSize * 0.32,
        backgroundColor: color + "1F",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <MaterialIcons name={ICONS[categoryId]} size={size} color={color} />
    </View>
  );
}
