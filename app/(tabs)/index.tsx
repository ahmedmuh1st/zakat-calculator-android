// Home / Dashboard — ambient Nisab hero, Hijri countdown, 9-category grid, metal price strip.
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { CategoryIcon } from "@/components/zakat/category-icon";
import { ContentColumn } from "@/components/zakat/content-column";
import { HomePaymentCard } from "@/components/zakat/home-payment-card";
import { MoneyText } from "@/components/zakat/money-text";
import { NisabRing } from "@/components/zakat/nisab-ring";
import { PressableScale } from "@/components/zakat/pressable-scale";
import { QuickSettingsPane } from "@/components/zakat/quick-settings-pane";
import { StarPattern } from "@/components/zakat/star-pattern";
import { TotalsPane } from "@/components/zakat/totals-pane";
import { TwoPane } from "@/components/zakat/two-pane";
import { useColors } from "@/hooks/use-colors";
import { useLayout } from "@/hooks/use-layout";
import { useStore } from "@/lib/store";
import { calculateZakat, formatMoney, itemValue } from "@/lib/zakat/engine";
import { fitFontSize } from "@/lib/zakat/fit-text";
import { homePaymentState } from "@/lib/zakat/home-payment";
import { nisabProgressLabel } from "@/lib/zakat/nisab-progress";
import { localizeDigits } from "@/lib/zakat/numbers";
import { fetchFxRates, fetchLivePrices } from "@/lib/zakat/prices";
import { daysUntilAnniversary, formatHijriWithLabel, toHijri } from "@/lib/zakat/hijri";
import { CATEGORY_IDS, CategoryId } from "@/lib/zakat/types";
import { useConfirm } from "@/components/zakat/confirm-sheet";
export default function HomeScreen() {
  const { settings, entries, deductions, prices, fx, history, trackedCalculationId, hydrated, t, isRTL, dispatch } = useStore();
  const colors = useColors();
  const confirm = useConfirm();
  const { contentWidth, gridColumns, heroRingSize, isWide, twoPane } = useLayout();
  const [fetchingPrices, setFetchingPrices] = useState(false);

  // Redirect to onboarding on first run
  useFocusEffect(
    useCallback(() => {
      if (hydrated && !settings.onboarded) {
        router.replace("/onboarding");
      }
    }, [hydrated, settings.onboarded]),
  );

  const result = useMemo(
    () => calculateZakat({ entries, deductions, prices, nisabStandard: settings.nisabStandard, fx: fx ?? undefined }),
    [entries, deductions, prices, settings.nisabStandard, fx],
  );

  const hijriToday = useMemo(() => toHijri(new Date()), []);
  const daysLeft = useMemo(
    () =>
      settings.anniversary
        ? daysUntilAnniversary(settings.anniversary.month, settings.anniversary.day)
        : null,
    [settings.anniversary],
  );

  const hasPrices = prices.goldPerGram > 0;
  const hasEntries = entries.some((e) => e.items.length > 0);
  const paymentState = useMemo(
    () => homePaymentState({ history, trackedCalculationId, hasEntries }),
    [history, trackedCalculationId, hasEntries],
  );
  // Measures the same quantity the nisab test uses (holdings, which include stocks
  // whose company already pays zakat), so the ring never reads full while the app
  // says "below nisab", or the reverse.
  const progress = result.nisabThreshold > 0 ? result.netHoldings / result.nisabThreshold : 0;
  const lang = settings.language;
  const money = (n: number) => formatMoney(n, settings.currency, lang);
  // Below the threshold a percentage answers a real question, "how close am I". Above it,
  // the multiple said nothing about what is owed, so it is stated plainly instead. Rule in
  // lib/zakat/nisab-progress.ts.
  const progressState = nisabProgressLabel(result.netHoldings, result.nisabThreshold);
  const progressLabel =
    progressState.kind === "passed"
      ? t.nisabPassed
      : `${localizeDigits(progressState.percent, lang)}% ${t.nisabProgress}`;

  const refreshPrices = useCallback(async () => {
    setFetchingPrices(true);
    try {
      const p = await fetchLivePrices(settings.currency);
      dispatch({ type: "setPrices", payload: p });
    } catch {
      // stay silent — manual entry remains available in Settings
    } finally {
      setFetchingPrices(false);
    }
    try {
      const rates = await fetchFxRates(settings.currency);
      dispatch({ type: "setFx", payload: rates });
    } catch {
      // silent — foreign items fall back to face value until rates arrive
    }
  }, [settings.currency, dispatch]);

  // Auto-fetch prices in the background: on first load, when currency changes,
  // or when the stored prices are older than 12 hours.
  useEffect(() => {
    if (!hydrated) return;
    const stale =
      !prices.updatedAt ||
      Date.now() - new Date(prices.updatedAt).getTime() > 12 * 60 * 60 * 1000;
    const fxStale =
      !fx || fx.base !== settings.currency ||
      !fx.updatedAt || Date.now() - new Date(fx.updatedAt).getTime() > 12 * 60 * 60 * 1000;
    if (prices.goldPerGram <= 0 || (prices.source === "live" && stale) || fxStale) {
      refreshPrices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, settings.currency]);

  const resetAllNumbers = useCallback(async () => {
    const ok = await confirm({
      title: t.resetNumbers,
      message: t.resetNumbersConfirm,
      confirmLabel: t.resetNumbersButton,
      cancelLabel: t.cancel,
    });
    if (ok) dispatch({ type: "clearCalculation" });
  }, [dispatch, t, confirm]);

  const heroColors: [string, string] = result.aboveNisab
    ? ["#0F7B6C", "#16543F"]
    : ["#3D6B5E", "#2C4A42"];

  const rowDir = isRTL ? "flex-row-reverse" : "flex-row";
  const textAlign = isRTL ? ("right" as const) : ("left" as const);

  if (!hydrated) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <TwoPane
        side={
          <>
            <TotalsPane result={result} money={money} hasEntries={hasEntries} />
            <HomePaymentCard state={paymentState} />
            <QuickSettingsPane />
          </>
        }
      >
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <ContentColumn>
        {/* Header */}
        <View className={`${rowDir} items-center justify-between px-5 pt-2 pb-3`}>
          <View>
            <Text className="text-2xl font-bold text-foreground" style={{ textAlign }}>
              {t.appName}
            </Text>
            <Text className="text-sm text-muted mt-0.5" style={{ textAlign }}>
              {formatHijriWithLabel(hijriToday, lang, t.hijriToday)}
            </Text>
          </View>
          {hasEntries && (
            <PressableScale onPress={resetAllNumbers} hitSlop={10}>
              <View
                className="w-10 h-10 rounded-full items-center justify-center border"
                style={{ borderColor: colors.border, backgroundColor: colors.surface }}
              >
                <MaterialIcons name="restart-alt" size={20} color={colors.error} />
              </View>
            </PressableScale>
          )}
        </View>

        {/* Ambient hero card */}
        {/* At two-pane widths the headline figures live in the side pane, so the
            hero here would be a duplicate. Hide it and let the grid lead. */}
        {!twoPane && (
        <View className="mx-5 rounded-3xl overflow-hidden" style={{ elevation: 3 }}>
          <LinearGradient colors={heroColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <StarPattern width={contentWidth - 40} height={200} color="#FFFFFF" opacity={0.07} />
            <View className="items-center px-5 pt-4 pb-4">
              <NisabRing
                progress={progress}
                size={heroRingSize}
                strokeWidth={9}
                fillColor={result.aboveNisab ? "#F3D48A" : "#FFFFFF"}
              >
                {(innerWidth) => {
                  const amount = result.aboveNisab ? money(result.totalZakat) : money(result.netWealth);
                  // adjustsFontSizeToFit is iOS-only, so a long amount overflowed the circle
                  // on Android and web. Size it from the string instead, which behaves the
                  // same everywhere. Rule and tests in lib/zakat/fit-text.ts.
                  const heroFontSize = fitFontSize(amount, {
                    preferred: 20,
                    minimum: 11,
                    maxWidth: innerWidth,
                  });
                  return (
                    <View className="items-center">
                      {hasEntries ? (
                        <>
                          <Text
                            className="text-xs"
                            style={{ color: "rgba(255,255,255,0.75)" }}
                            numberOfLines={1}
                          >
                            {result.aboveNisab ? t.zakatDue : t.netWealth}
                          </Text>
                          <MoneyText
                            value={amount}
                            fontSize={heroFontSize}
                            className="font-bold text-white mt-0.5"
                            style={{ fontSize: heroFontSize, fontVariant: ["tabular-nums"] }}
                            numberOfLines={1}
                          />
                        </>
                      ) : (
                        <MaterialIcons name="spa" size={34} color="rgba(255,255,255,0.85)" />
                      )}
                    </View>
                  );
                }}
              </NisabRing>

              {/* Nisab status pill */}
              {hasEntries && hasPrices ? (
                <View
                  className={`${rowDir} items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full`}
                  style={{ backgroundColor: "rgba(255,255,255,0.16)" }}
                >
                  <MaterialIcons
                    name={result.aboveNisab ? "check-circle" : "remove-circle-outline"}
                    size={15}
                    color={result.aboveNisab ? "#F3D48A" : "#FFFFFF"}
                  />
                  <Text className="text-xs font-semibold text-white">
                    {result.aboveNisab ? t.aboveNisab : t.belowNisab}
                    {"  ·  "}
                    {progressLabel}
                  </Text>
                </View>
              ) : (
                <Text className="text-sm mt-3 text-center" style={{ color: "rgba(255,255,255,0.85)" }}>
                  {hasPrices ? t.categoriesHint : fetchingPrices ? t.fetching : t.pricesNone}
                </Text>
              )}

              {/* Countdown chip */}
              <PressableScale
                onPress={() => router.push({ pathname: "/(tabs)/settings", params: { scrollTo: "anniversary" } } as never)}
                style={{ marginTop: 10 }}
              >
                <View
                  className={`${rowDir} items-center gap-1.5 px-3 py-1.5 rounded-full`}
                  style={{ backgroundColor: "rgba(0,0,0,0.22)" }}
                >
                  <MaterialIcons name="event" size={14} color="#F3D48A" />
                  <Text className="text-xs text-white">
                    {daysLeft != null && daysLeft >= 0 ? t.daysToZakat(daysLeft) : t.setAnniversary}
                  </Text>
                </View>
              </PressableScale>
            </View>
          </LinearGradient>
        </View>
        )}

        {!twoPane && paymentState.kind !== "hidden" ? (
          <View className="mx-5 mt-3">
            <HomePaymentCard state={paymentState} />
          </View>
        ) : null}

        {/* Metal price strip */}
        {/* Prices are in the side pane's quick settings at two-pane widths. */}
        {!twoPane && (
        <View className={`${rowDir} mx-5 mt-3 gap-2 items-stretch`}>
          <MetalPriceCard
            color="#C9A24B"
            bg="#C9A24B1A"
            icon="workspace-premium"
            label={`${t.goldPrice} ${t.perGram}`}
            value={hasPrices ? money(prices.goldPerGram) : "—"}
          />
          <MetalPriceCard
            color="#8E9AAB"
            bg="#8E9AAB1A"
            icon="stars"
            label={`${t.silverPrice} ${t.perGram}`}
            value={hasPrices ? money(prices.silverPerGram) : "—"}
          />
          <PressableScale onPress={refreshPrices} haptic>
            <View
              className="bg-surface border border-border rounded-2xl items-center justify-center"
              style={{ width: 44, height: PRICE_CARD_HEIGHT }}
            >
              {fetchingPrices ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <MaterialIcons name="refresh" size={18} color={colors.primary} />
              )}
            </View>
          </PressableScale>
        </View>
        )}

        {/* Category grid */}
        <View className={`${rowDir} items-baseline justify-between mx-5 mt-6 mb-3`}>
          <Text className="text-lg font-bold text-foreground">{t.categories}</Text>
          <Text className="text-xs text-muted">{t.categoriesHint}</Text>
        </View>
        <View className="px-3.5">
          {chunk(CATEGORY_IDS as unknown as CategoryId[], gridColumns).map((row, rIdx) => (
            <View key={rIdx} className={isRTL ? "flex-row-reverse" : "flex-row"} style={{ alignItems: "stretch" }}>
              {row.map((id) => (
                <CategoryCard key={id} id={id} money={money} tall={isWide} />
              ))}
              {/* Keep the last row aligned to the grid when it is not full */}
              {row.length < gridColumns &&
                Array.from({ length: gridColumns - row.length }).map((_, i) => (
                  <View key={`spacer-${i}`} style={{ flex: 1, padding: 6 }} />
                ))}
            </View>
          ))}
        </View>

        {/* Deductions row */}
        <PressableScale onPress={() => router.push("/deductions")} style={{ marginHorizontal: 20, marginTop: 8 }}>
          <View className={`${rowDir} items-center gap-3 bg-surface border border-border rounded-2xl p-4`}>
            <View
              className="items-center justify-center"
              style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: colors.error + "1A" }}
            >
              <MaterialIcons name="remove-circle-outline" size={22} color={colors.error} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground" style={{ textAlign }}>
                {t.deductions}
              </Text>
              <Text className="text-xs text-muted mt-0.5" style={{ textAlign }}>
                {deductions.length > 0 ? `− ${money(result.totalDeductions)}` : t.deductionsHint}
              </Text>
            </View>
            <MaterialIcons name={isRTL ? "chevron-left" : "chevron-right"} size={22} color={colors.muted} />
          </View>
        </PressableScale>

        {/* Review summary CTA */}
        {hasEntries && !twoPane && (
          <PressableScale onPress={() => router.push("/summary")} haptic style={{ marginHorizontal: 20, marginTop: 16 }}>
            <View className="bg-primary rounded-2xl py-4 items-center">
              <Text className="text-white text-base font-bold">{t.reviewSummary}</Text>
            </View>
          </PressableScale>
        )}


        {/* Saved results shortcut */}
        {history.length > 0 && (
          <PressableScale onPress={() => router.push("/history")} style={{ marginHorizontal: 20, marginTop: 10 }}>
            <View className={`${rowDir} items-center gap-3 bg-surface border border-border rounded-2xl px-4 py-3.5`}>
              <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: colors.primary + "14" }}>
                <MaterialIcons name="bookmark-outline" size={22} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground" style={{ textAlign }}>
                  {t.savedResults}
                </Text>
                <Text className="text-xs text-muted mt-0.5" style={{ textAlign }}>
                  {t.savedResultsHint}
                </Text>
              </View>
              <MaterialIcons name={isRTL ? "chevron-left" : "chevron-right"} size={22} color={colors.muted} />
            </View>
          </PressableScale>
        )}
        </ContentColumn>
      </ScrollView>
      </TwoPane>
    </ScreenContainer>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const PRICE_CARD_HEIGHT = 44;

function MetalPriceCard({
  color,
  bg,
  icon,
  label,
  value,
}: {
  color: string;
  bg: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
  value: string;
}) {
  return (
    <View
      className="flex-1 flex-row items-center justify-center gap-1.5 bg-surface border border-border rounded-2xl px-2"
      style={{ height: PRICE_CARD_HEIGHT }}
    >
      <View className="w-5 h-5 rounded-full items-center justify-center" style={{ backgroundColor: bg }}>
        <MaterialIcons name={icon} size={13} color={color} />
      </View>
      <View className="flex-shrink">
        <MoneyText
          value={value}
          fontSize={13}
          className="text-[13px] font-bold text-foreground"
          style={{ fontVariant: ["tabular-nums"], lineHeight: 16 }}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        />
        <Text className="text-[9px] text-muted" style={{ lineHeight: 11 }} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

function CategoryCard({ id, money, tall }: { id: CategoryId; money: (n: number) => string; tall?: boolean }) {
  const { entries, prices, fx, t } = useStore();
  const entry = entries.find((e) => e.categoryId === id);
  const count = entry?.items.length ?? 0;

  const subtotal = useMemo(() => {
    if (!entry) return 0;
    let s = 0;
    for (const item of entry.items) {
      const v = itemValue(item, id, prices, fx ?? undefined);
      s += item.isDeduction ? -v : v;
    }
    return Math.max(0, s);
  }, [entry, id, prices, fx]);

  const name = t[`cat_${id}` as keyof typeof t] as string;

  return (
    <PressableScale onPress={() => router.push(`/category/${id}`)} style={{ flex: 1, padding: 6 }}>
      <View
        className="bg-surface border border-border rounded-2xl items-center px-2 py-3.5"
        style={{ minHeight: tall ? 138 : 124 }}
      >
        <CategoryIcon categoryId={id} />
        <Text
          className="text-xs font-semibold text-foreground mt-2 text-center"
          numberOfLines={2}
          style={{ lineHeight: 16, minHeight: 32 }}
        >
          {name}
        </Text>
        <Text
          className="text-[11px] mt-0.5 text-center"
          style={{ color: count > 0 ? "#0F7B6C" : "#9AA5A0", fontVariant: ["tabular-nums"] }}
          numberOfLines={1}
        >
          {count > 0 ? `${t.categoryHoldingsLabel} ${money(subtotal)}` : "+"}
        </Text>
      </View>
    </PressableScale>
  );
}
