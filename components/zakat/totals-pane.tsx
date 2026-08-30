// Live totals card for the side pane on tablets and unfolded foldables.
//
// It repeats the figures the home hero shows so the running total stays
// visible while the user types amounts in the primary pane. Everything here
// is also reachable in the normal phone flow, so nothing is exclusive to
// wide screens.
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

import { MoneyText } from "@/components/zakat/money-text";
import { PressableScale } from "@/components/zakat/pressable-scale";
import { useColors } from "@/hooks/use-colors";
import { useStore } from "@/lib/store";
import { nisabProgressLabel } from "@/lib/zakat/nisab-progress";
import { localizeDigits } from "@/lib/zakat/numbers";
import { CalculationResult } from "@/lib/zakat/types";

export interface TotalsPaneProps {
  result: CalculationResult;
  money: (n: number) => string;
  /** Hide the "Review summary" button on screens that already are the summary. */
  showReviewButton?: boolean;
  /** Whether the user has entered anything yet. */
  hasEntries: boolean;
}

export function TotalsPane({ result, money, showReviewButton = true, hasEntries }: TotalsPaneProps) {
  const { t, isRTL, settings } = useStore();
  const colors = useColors();

  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? ("right" as const) : ("left" as const);
  // Matches the nisab test, which runs on holdings rather than the zakatable base.
  const progress = result.nisabThreshold > 0 ? result.netHoldings / result.nisabThreshold : 0;
  // Same wording rule as the home hero, shared in lib/zakat/nisab-progress.ts.
  const progressState = nisabProgressLabel(result.netHoldings, result.nisabThreshold);
  const progressLabel =
    progressState.kind === "passed"
      ? t.nisabPassed
      : `${localizeDigits(progressState.percent, settings.language)}% ${t.nisabProgress}`;
  const heroColors: [string, string] = result.aboveNisab ? ["#0F7B6C", "#16543F"] : ["#3D6B5E", "#2C4A42"];

  return (
    <View className="rounded-3xl overflow-hidden" style={{ elevation: 2 }}>
      <LinearGradient colors={heroColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View className="px-4 py-5 gap-4">
          {/* Headline figure */}
          <View>
            <Text className="text-xs" style={{ color: "rgba(255,255,255,0.75)", textAlign }}>
              {t.zakatDue}
            </Text>
            <MoneyText
              value={money(result.totalZakat)}
              fontSize={30}
              className="text-3xl font-bold text-white mt-1"
              style={{ fontVariant: ["tabular-nums"], textAlign }}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            />
          </View>

          {/* Supporting figures */}
          <View className="gap-2">
            <PaneRow
              label={t.netWealth}
              value={money(result.netWealth)}
              rowDir={rowDir}
            />
            <PaneRow
              label={t.deductions}
              value={`−${money(result.totalDeductions)}`}
              rowDir={rowDir}
            />
          </View>

          {/* Nisab status */}
          {hasEntries ? (
            <View
              className="items-center gap-1.5 px-3 py-2 rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.16)", flexDirection: rowDir }}
            >
              <MaterialIcons
                name={result.aboveNisab ? "check-circle" : "remove-circle-outline"}
                size={15}
                color={result.aboveNisab ? "#F3D48A" : "#FFFFFF"}
              />
              <Text className="text-xs font-semibold text-white flex-1" style={{ textAlign }}>
                {result.aboveNisab ? t.aboveNisab : t.belowNisab}
                {"  ·  "}
                {progressLabel}
              </Text>
            </View>
          ) : (
            <Text className="text-xs" style={{ color: "rgba(255,255,255,0.85)", textAlign }}>
              {t.categoriesHint}
            </Text>
          )}

          {showReviewButton && hasEntries && (
            <PressableScale onPress={() => router.push("/summary")} haptic>
              <View
                className="rounded-2xl py-3 items-center"
                style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
              >
                <Text className="text-white text-sm font-bold">{t.reviewSummary}</Text>
              </View>
            </PressableScale>
          )}
        </View>
      </LinearGradient>
      {/* A quiet reminder that the figure updates as amounts are entered. */}
      <View className="px-4 py-2" style={{ backgroundColor: colors.surface }}>
        <Text className="text-[10px] text-muted" style={{ textAlign }}>
          {t.livePaneNote}
        </Text>
      </View>
    </View>
  );
}

function PaneRow({ label, value, rowDir }: { label: string; value: string; rowDir: "row" | "row-reverse" }) {
  return (
    <View className="items-center justify-between" style={{ flexDirection: rowDir }}>
      <Text className="text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>
        {label}
      </Text>
      <MoneyText
        value={value}
        fontSize={13}
        className="text-[13px] font-semibold text-white"
        style={{ fontVariant: ["tabular-nums"] }}
      />
    </View>
  );
}
