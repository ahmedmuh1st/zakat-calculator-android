import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

import { PaymentTracker } from "@/components/zakat/payment-tracker";
import { PressableScale } from "@/components/zakat/pressable-scale";
import { useColors } from "@/hooks/use-colors";
import { useStore } from "@/lib/store";
import { calcDisplayName } from "@/lib/zakat/calc-name";
import type { HomePaymentState } from "@/lib/zakat/home-payment";

export function HomePaymentCard({ state }: { state: HomePaymentState }) {
  const { t, isRTL, settings } = useStore();
  const colors = useColors();
  const rowDir = isRTL ? "flex-row-reverse" : "flex-row";
  const textAlign = isRTL ? ("right" as const) : ("left" as const);

  if (state.kind === "hidden") return null;

  if (state.kind === "save-first") {
    return (
      <View className="rounded-2xl border border-border p-4" style={{ backgroundColor: colors.surface }}>
        <View className={`${rowDir} items-center gap-3`}>
          <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: colors.primary + "18" }}>
            <MaterialIcons name="payments" size={21} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-foreground" style={{ textAlign }}>
              {t.paymentProgress}
            </Text>
            <Text className="text-xs text-muted mt-1 leading-5" style={{ textAlign }}>
              {t.homePaymentSaveHint}
            </Text>
          </View>
        </View>
        <PressableScale
          onPress={() => router.push("/summary")}
          haptic
          accessibilityRole="button"
          accessibilityLabel={t.reviewAndTrack}
          style={{ marginTop: 12 }}
        >
          <View className={`${rowDir} items-center justify-center gap-2 rounded-xl py-3`} style={{ backgroundColor: colors.primary }}>
            <MaterialIcons name="bookmark-outline" size={17} color="#FFFFFF" />
            <Text className="text-sm font-bold text-white">{t.reviewAndTrack}</Text>
          </View>
        </PressableScale>
      </View>
    );
  }

  const calculation = state.calculation;
  return (
    <PaymentTracker
      calculationId={calculation.id}
      due={calculation.result.totalZakat}
      currency={calculation.currency}
      lang={settings.language}
      compact
      overviewOnly
      contextLabel={calcDisplayName(calculation)}
      onOpenDetails={() =>
        router.push({
          pathname: "/(tabs)/history",
          params: { calculationId: calculation.id },
        } as never)
      }
    />
  );
}
