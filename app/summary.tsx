// Summary — total Zakat presentation with per-category breakdown, save + share.
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Platform, ScrollView, Share, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { CategoryIcon } from "@/components/zakat/category-icon";
import { ContentColumn } from "@/components/zakat/content-column";
import { MoneyText } from "@/components/zakat/money-text";
import { useNamePrompt } from "@/components/zakat/name-prompt";
import { PaymentTracker } from "@/components/zakat/payment-tracker";
import { PressableScale } from "@/components/zakat/pressable-scale";
import { StarPattern } from "@/components/zakat/star-pattern";
import { useColors } from "@/hooks/use-colors";
import { useLayout, WIDE_CONTENT_MAX_WIDTH } from "@/hooks/use-layout";
import { noteCalculationSaved } from "@/lib/feedback";
import { makeId, useStore } from "@/lib/store";
import { normalizeCalcName, suggestedCalcName } from "@/lib/zakat/calc-name";
import { calculateZakat, formatMoney } from "@/lib/zakat/engine";
import { formatHijri, toHijri } from "@/lib/zakat/hijri";
import { CATEGORY_COLORS } from "@/lib/zakat/types";

export default function Summary() {
  const { entries, deductions, prices, fx, settings, t, isRTL, dispatch } = useStore();
  const colors = useColors();
  const { contentWidth, twoPane } = useLayout();
  const namePrompt = useNamePrompt();
  const [savedCalculationId, setSavedCalculationId] = useState<string | null>(null);

  const result = useMemo(
    () => calculateZakat({ entries, deductions, prices, nisabStandard: settings.nisabStandard, fx: fx ?? undefined }),
    [entries, deductions, prices, settings.nisabStandard, fx],
  );

  const lang = settings.language;
  const money = (n: number) => formatMoney(n, settings.currency, lang);
  const rowDir = isRTL ? "flex-row-reverse" : "flex-row";
  const textAlign = isRTL ? ("right" as const) : ("left" as const);
  const hijri = toHijri(new Date());

  const nonZero = result.categories.filter((c) => c.base > 0);
  const maxBase = Math.max(...nonZero.map((c) => c.base), 1);
  const stdLabel = settings.nisabStandard === "gold" ? t.goldStd : t.silverStd;

  const ensureSaved = async (): Promise<string | null> => {
    if (savedCalculationId) return savedCalculationId;

    // Named records make History read as a list of yearly projects rather than
    // anonymous totals, which is also what makes "use in calculator" legible
    // later. The Hijri suggestion is pre-selected so accepting it is one tap.
    const name = await namePrompt({
      title: t.nameCalculation,
      message: t.nameCalculationHint,
      initialValue: suggestedCalcName(hijri, lang),
      placeholder: t.namePlaceholder,
      confirmLabel: t.save,
      cancelLabel: t.cancel,
      isRTL,
    });
    if (name === null) return null; // cancelled, nothing saved

    const id = makeId();
    dispatch({
      type: "saveToHistory",
      payload: {
        id,
        savedAt: new Date().toISOString(),
        hijriYear: hijri.year,
        hijriLabel: formatHijri(hijri, lang),
        name: normalizeCalcName(name),
        currency: settings.currency,
        input: { entries, deductions, prices, nisabStandard: settings.nisabStandard, fx: fx ?? undefined },
        result,
      },
    });
    setSavedCalculationId(id);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    // Saving a calculation is the app's signature positive moment, which is
    // where store guidelines say the rating card belongs. The helper decides
    // whether this particular save qualifies.
    noteCalculationSaved().catch(() => {});
    return id;
  };

  const save = async () => {
    await ensureSaved();
  };

  const savedNow = savedCalculationId != null;

  const share = () => {
    const lines = [
      `${t.appName} — ${formatHijri(hijri, lang)}`,
      `${t.netWealth}: ${money(result.netWealth)}`,
      `${t.nisabThreshold(stdLabel)}: ${money(result.nisabThreshold)}`,
      `${t.totalZakat}: ${money(result.totalZakat)}`,
    ];
    Share.share({ message: lines.join("\n") }).catch(() => {});
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <ContentColumn>
      <View className={`${rowDir} items-center gap-3 px-5 pt-2 pb-3`}>
        <PressableScale onPress={() => router.back()}>
          <View className="w-9 h-9 rounded-full bg-surface border border-border items-center justify-center">
            <MaterialIcons name={isRTL ? "chevron-right" : "chevron-left"} size={22} color={colors.foreground} />
          </View>
        </PressableScale>
        <Text className="text-xl font-bold text-foreground flex-1" style={{ textAlign }}>
          {t.summary}
        </Text>
        <PressableScale onPress={share}>
          <View className="w-9 h-9 rounded-full bg-surface border border-border items-center justify-center">
            <MaterialIcons name="ios-share" size={18} color={colors.foreground} />
          </View>
        </PressableScale>
      </View>
      </ContentColumn>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <ContentColumn maxWidth={twoPane ? WIDE_CONTENT_MAX_WIDTH : undefined}>
        {/* At two-pane widths the figures and the breakdown sit side by side, so
            the whole summary is legible without scrolling. Below that width the
            same blocks stack in their original order. */}
        <View
          style={
            twoPane
              ? { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "flex-start", gap: 8 }
              : undefined
          }
        >
        <View style={twoPane ? { flex: 1 } : undefined}>
        {/* Hero total */}
        <View className="mx-5 rounded-3xl overflow-hidden">
          <LinearGradient
            colors={result.aboveNisab || result.agricultureZakat > 0 ? ["#0F7B6C", "#16543F"] : ["#5A6E66", "#41524B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <StarPattern width={contentWidth - 40} height={210} color="#FFFFFF" opacity={0.07} />
            <View className="items-center px-6 py-8">
              <Text className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                {t.totalZakat}
              </Text>
              <MoneyText
                value={money(result.totalZakat)}
                fontSize={44}
                className="text-5xl font-bold text-white mt-2"
                style={{ fontVariant: ["tabular-nums"], width: contentWidth - 88, textAlign: "center" }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.4}
                allowFontScaling={false}
              />
              <Text className="text-[13px] mt-4 text-center leading-5" style={{ color: "rgba(255,255,255,0.85)" }}>
                {result.totalZakat > 0 ? t.purifyMsg(money(result.netWealth)) : t.belowNisabMsg}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Box 1 — your wealth. Ends at net zakatable wealth, nothing else. */}
        <Text className="text-xs font-semibold text-muted mx-5 mt-5 mb-1.5 uppercase" style={{ textAlign }}>
          {t.wealthSection}
        </Text>
        <View className="mx-5 bg-surface border border-border rounded-2xl px-4 py-1">
          <Row label={t.grossWealth} value={money(result.grossWealth)} rowDir={rowDir} />
          <Row label={t.deductions} value={`−${money(result.totalDeductions)}`} rowDir={rowDir} />
          <Row label={t.netWealth} value={money(result.netWealth)} rowDir={rowDir} bold last />
        </View>

        {/* Box 2 — what is due. Kept apart from the wealth figures so a total is
            never mistaken for a holding. */}
        <Text className="text-xs font-semibold text-muted mx-5 mt-5 mb-1.5 uppercase" style={{ textAlign }}>
          {t.dueSection}
        </Text>
        <View className="mx-5 bg-surface border border-border rounded-2xl px-4 py-1">
          <Row
            label={t.wealthZakatLabel}
            value={money(result.wealthZakat)}
            rowDir={rowDir}
            bold
            last={result.agricultureZakat <= 0}
          />
          {result.agricultureZakat > 0 && (
            <Row label={t.agricultureZakatLabel} value={money(result.agricultureZakat)} rowDir={rowDir} bold last />
          )}
        </View>

        {/* The Nisab is a threshold, not an amount held, so it reads as an
            explanatory note rather than a figure sitting among the totals. */}
        <View
          className="mx-5 mt-3 rounded-2xl px-4 py-3"
          style={{ backgroundColor: colors.primary + "14", borderWidth: 1, borderColor: colors.primary + "33" }}
        >
          <View className={`${rowDir} items-start gap-2`}>
            <MaterialIcons name="info-outline" size={16} color={colors.primary} style={{ marginTop: 1 }} />
            <Text className="text-[12px] flex-1 leading-5" style={{ color: colors.primary, textAlign }}>
              {t.nisabExplainerShort(stdLabel, money(result.nisabThreshold))}
            </Text>
          </View>
        </View>

        {/* Agriculture has its own nisab, so it can be due even when the wealth
            pool is below the threshold. Explain it and leave the choice to the user. */}
        {result.agricultureZakat > 0 && (
          <View
            className="mx-5 mt-3 rounded-2xl px-4 py-3"
            style={{ backgroundColor: colors.success + "18", borderWidth: 1, borderColor: colors.success + "44" }}
          >
            <View className={`${rowDir} items-start gap-2`}>
              <MaterialIcons name="eco" size={16} color={colors.success} style={{ marginTop: 1 }} />
              <Text className="text-[12px] flex-1 leading-5" style={{ color: colors.success, textAlign }}>
                {t.agricultureScholarlyNote}
              </Text>
            </View>
          </View>
        )}
        </View>

        {/* Second column at two-pane widths: the breakdown and the save action. */}
        <View style={twoPane ? { flex: 1 } : undefined}>
        {/* Breakdown bars */}
        {nonZero.length > 0 && (
          <>
            <Text
              className="text-lg font-bold text-foreground mx-5 mb-2"
              style={{ textAlign, marginTop: twoPane ? 0 : 24 }}
            >
              {t.breakdown}
            </Text>
            <View className="mx-5 bg-surface border border-border rounded-2xl p-4 gap-3">
              {nonZero.map((c) => {
                const catName = t[`cat_${c.categoryId}` as keyof typeof t] as string;
                const color = CATEGORY_COLORS[c.categoryId];
                return (
                  <View key={c.categoryId}>
                    <View className={`${rowDir} items-center gap-2.5`}>
                      <CategoryIcon categoryId={c.categoryId} boxSize={32} size={16} />
                      <View className="flex-1">
                        <View className={`${rowDir} justify-between`}>
                          <Text className="text-xs font-semibold text-foreground">{catName}</Text>
                          <Text className="text-xs font-bold text-foreground" style={{ fontVariant: ["tabular-nums"] }}>
                            {money(c.zakat)}
                          </Text>
                        </View>
                        <View className="h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ backgroundColor: color + "22" }}>
                          <View
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max((c.base / maxBase) * 100, 4)}%`,
                              backgroundColor: color,
                              alignSelf: isRTL ? "flex-end" : "flex-start",
                            }}
                          />
                        </View>
                        <Text className="text-[10px] text-muted mt-1" style={{ textAlign, fontVariant: ["tabular-nums"] }}>
                          {t.holdingsLabel}: {money(c.base)}
                        </Text>
                      </View>
                      <Text className="text-[11px] text-muted" style={{ fontVariant: ["tabular-nums"], minWidth: 56, textAlign: isRTL ? "left" : "right" }}>
                        {`${(c.effectiveRate * 100).toLocaleString()}%`}
                      </Text>
                    </View>
                  </View>
                );
              })}
              {(result.deductionZakatAdjustment ?? 0) > 0 ? (
                <View className="pt-3 mt-1 border-t border-border">
                  <View className={`${rowDir} items-center justify-between gap-3`}>
                    <Text className="text-xs font-semibold flex-1" style={{ color: colors.error, textAlign }}>
                      {t.deductionZakatAdjustment}
                    </Text>
                    <Text className="text-xs font-bold" style={{ color: colors.error, fontVariant: ["tabular-nums"] }}>
                      −{money(result.deductionZakatAdjustment ?? 0)}
                    </Text>
                  </View>
                  <Text className="text-[10px] mt-1 leading-4" style={{ color: colors.error, textAlign }}>
                    {t.deductionZakatExplanation(
                      money(result.totalDeductions),
                      money(result.deductionZakatAdjustment ?? 0),
                    )}
                  </Text>
                </View>
              ) : null}
            </View>
          </>
        )}

        {result.totalZakat > 0 ? (
          <View style={{ marginHorizontal: 20, marginTop: 20 }}>
            <PaymentTracker
              calculationId={savedCalculationId}
              due={result.totalZakat}
              currency={settings.currency}
              lang={lang}
              onEnsureSaved={ensureSaved}
            />
          </View>
        ) : null}

        {/* Actions */}
        <PressableScale
          onPress={() => {
            save().catch(() => {});
          }}
          haptic
          disabled={savedNow}
          style={{ marginHorizontal: 20, marginTop: 20 }}
        >
          <View
            className={`${rowDir} rounded-2xl py-4 items-center justify-center gap-2`}
            style={{ backgroundColor: savedNow ? colors.success : colors.primary }}
          >
            <MaterialIcons name={savedNow ? "check" : "bookmark-outline"} size={18} color="#FFFFFF" />
            <Text className="text-white text-base font-bold">{savedNow ? t.saved : t.saveCalculation}</Text>
          </View>
        </PressableScale>
        </View>
        </View>
        </ContentColumn>
      </ScrollView>
    </ScreenContainer>
  );
}

function Row({
  label,
  value,
  rowDir,
  bold = false,
  last = false,
}: {
  label: string;
  value: string;
  rowDir: string;
  bold?: boolean;
  last?: boolean;
}) {
  return (
    <View className={`${rowDir} items-center justify-between py-3 ${last ? "" : "border-b border-border"}`}>
      <Text className={`text-sm ${bold ? "font-bold text-foreground" : "text-muted"}`}>{label}</Text>
      <MoneyText
        value={value}
        fontSize={14}
        className={`text-sm ${bold ? "font-bold" : "font-semibold"} text-foreground`}
        style={{ fontVariant: ["tabular-nums"] }}
      />
    </View>
  );
}
