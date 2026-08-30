// History — year-over-year saved calculations with growth comparison.
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { FlatList, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { ContentColumn } from "@/components/zakat/content-column";
import { PaymentTracker } from "@/components/zakat/payment-tracker";
import { PressableScale } from "@/components/zakat/pressable-scale";
import { useColors } from "@/hooks/use-colors";
import { useLayout } from "@/hooks/use-layout";
import { useConfirm } from "@/components/zakat/confirm-sheet";
import { dateTag, type LocaleCode } from "@/lib/i18n/locales";
import { useStore } from "@/lib/store";
import { calcDisplayName } from "@/lib/zakat/calc-name";
import { buildBreakdown } from "@/lib/zakat/breakdown";
import { exportHistoryCsv } from "@/lib/zakat/export";
import { formatMoney } from "@/lib/zakat/engine";
import { localizeDigits } from "@/lib/zakat/numbers";
import { summarizePayments } from "@/lib/zakat/payments";
import { SavedCalculation } from "@/lib/zakat/types";

export default function History() {
  const { history, settings, t, isRTL, dispatch } = useStore();
  const colors = useColors();
  const confirm = useConfirm();
  const params = useLocalSearchParams<{ calculationId?: string | string[] }>();
  const { listContentStyle } = useLayout();
  const requestedCalculationId = Array.isArray(params.calculationId)
    ? params.calculationId[0]
    : params.calculationId;
  const displayedHistory = React.useMemo(() => {
    if (!requestedCalculationId) return history;
    const selected = history.find((item) => item.id === requestedCalculationId);
    return selected
      ? [selected, ...history.filter((item) => item.id !== requestedCalculationId)]
      : history;
  }, [history, requestedCalculationId]);
  const lang = settings.language;
  const rowDir = isRTL ? "flex-row-reverse" : "flex-row";
  const textAlign = isRTL ? ("right" as const) : ("left" as const);

  const confirmDelete = async (id: string) => {
    const ok = await confirm({ title: t.deleteCalc, message: "", confirmLabel: t.delete, cancelLabel: t.cancel });
    if (ok) dispatch({ type: "deleteFromHistory", id });
  };

  /**
   * Loads a past record's figures into the live calculator so this year can start
   * from last year's numbers. Always asks first: these are amounts entered by
   * hand, and Ahmed chose a confirm over a transient undo bar precisely because
   * an undo that expires is no protection for someone who notices late.
   */
  const confirmLoad = async (item: SavedCalculation) => {
    const ok = await confirm({
      title: t.loadConfirmTitle,
      message: t.loadConfirmMessage,
      confirmLabel: t.loadConfirmAction,
      cancelLabel: t.cancel,
      destructive: false,
    });
    if (!ok) return;
    dispatch({ type: "loadFromHistory", payload: item });
    router.replace("/(tabs)");
  };

  const onExport = () => {
    if (history.length === 0) return;
    exportHistoryCsv(history).catch(() => {});
  };

  return (
    <ScreenContainer>
      <ContentColumn>
      <View className={`${rowDir} items-center gap-3 px-5 pt-2 pb-3`}>
        <PressableScale
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
          hitSlop={10}
        >
          <View className="w-9 h-9 rounded-full items-center justify-center bg-surface border border-border">
            <MaterialIcons name={isRTL ? "arrow-forward" : "arrow-back"} size={20} color={colors.foreground} />
          </View>
        </PressableScale>
        <Text className="text-2xl font-bold text-foreground flex-1" style={{ textAlign }}>
          {t.history}
        </Text>
        {history.length > 0 && (
          <PressableScale onPress={onExport} hitSlop={10}>
            <View className={`${rowDir} items-center gap-1.5 rounded-full px-3 py-2 bg-surface border border-border`}>
              <MaterialIcons name="ios-share" size={16} color={colors.primary} />
              <Text className="text-xs font-bold" style={{ color: colors.primary }}>
                CSV
              </Text>
            </View>
          </PressableScale>
        )}
      </View>
      </ContentColumn>
      {history.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <MaterialIcons name="history" size={44} color={colors.muted} />
          <Text className="text-sm text-muted text-center mt-4 leading-5">{t.historyEmpty}</Text>
        </View>
      ) : (
        <FlatList
          data={displayedHistory}
          keyExtractor={(h) => h.id}
          contentContainerStyle={[{ paddingHorizontal: 20, paddingBottom: 24 }, listContentStyle]}
          renderItem={({ item }) => {
            const canonicalIndex = history.findIndex((record) => record.id === item.id);
            const prev = canonicalIndex >= 0 ? history[canonicalIndex + 1] : undefined;
            return (
              <HistoryCard
                item={item}
                prev={prev}
                lang={lang}
                rowDir={rowDir}
                textAlign={textAlign}
                onLoad={() => confirmLoad(item)}
                onDelete={() => confirmDelete(item.id)}
                initiallyExpanded={requestedCalculationId === item.id}
                onSelect={() => dispatch({ type: "setTrackedCalculation", id: item.id })}
              />
            );
          }}
        />
      )}
    </ScreenContainer>
  );
}

function HistoryCard({
  item,
  prev,
  lang,
  rowDir,
  textAlign,
  onLoad,
  onDelete,
  initiallyExpanded,
  onSelect,
}: {
  item: SavedCalculation;
  prev?: SavedCalculation;
  lang: LocaleCode;
  rowDir: string;
  textAlign: "left" | "right";
  onLoad: () => void;
  onDelete: () => void;
  initiallyExpanded?: boolean;
  onSelect: () => void;
}) {
  const { t } = useStore();
  const colors = useColors();
  const money = (n: number) => formatMoney(n, item.currency, lang);
  const savedAt = new Date(item.savedAt);
  const savedLabel = isNaN(savedAt.getTime())
    ? ""
    : savedAt.toLocaleString(dateTag(lang), {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
  const growth =
    prev && prev.result.netWealth > 0
      ? ((item.result.netWealth - prev.result.netWealth) / prev.result.netWealth) * 100
      : null;
  const [paymentsOpen, setPaymentsOpen] = React.useState(Boolean(initiallyExpanded));
  React.useEffect(() => {
    if (initiallyExpanded) setPaymentsOpen(true);
  }, [initiallyExpanded]);
  const breakdown = React.useMemo(
    () => (paymentsOpen ? buildBreakdown(item) : null),
    [item, paymentsOpen],
  );
  const paymentSummary = React.useMemo(
    () => summarizePayments(item.result.totalZakat, item.payments),
    [item.result.totalZakat, item.payments],
  );

  return (
    <View className="bg-surface border border-border rounded-2xl p-4 mb-3">
      <View className={`${rowDir} items-center justify-between`}>
        <View className="flex-1">
          <Text className="text-sm font-bold text-foreground" style={{ textAlign }}>
            {calcDisplayName(item)}
          </Text>
          {/* A named record still needs its Hijri date, so show both. Records
              saved before naming existed fall back to the label above, in which
              case repeating it here would be noise. */}
          {item.name ? (
            <Text className="text-[11px] text-muted mt-0.5" style={{ textAlign }}>
              {item.hijriLabel}
              {savedLabel ? ` · ${savedLabel}` : ""}
            </Text>
          ) : savedLabel ? (
            <Text className="text-[11px] text-muted mt-0.5" style={{ textAlign }}>
              {savedLabel}
            </Text>
          ) : null}
        </View>
        <PressableScale onPress={onDelete}>
          <MaterialIcons name="delete-outline" size={18} color={colors.muted} />
        </PressableScale>
      </View>
      <View className={`${rowDir} mt-3 gap-4`}>
        <View className="flex-1">
          <Text className="text-xs text-muted" style={{ textAlign }}>
            {t.wealth}
          </Text>
          <Text className="text-lg font-bold text-foreground" style={{ textAlign, fontVariant: ["tabular-nums"] }}>
            {money(item.result.netWealth)}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-muted" style={{ textAlign }}>
            {t.zakatPaid}
          </Text>
          <Text className="text-lg font-bold" style={{ textAlign, color: "#0F7B6C", fontVariant: ["tabular-nums"] }}>
            {money(item.result.totalZakat)}
          </Text>
        </View>
      </View>
      {growth != null && (
        <View className={`${rowDir} items-center gap-1 mt-2`}>
          <MaterialIcons
            name={growth >= 0 ? "trending-up" : "trending-down"}
            size={14}
            color={growth >= 0 ? colors.success : colors.error}
          />
          <Text className="text-[11px]" style={{ color: growth >= 0 ? colors.success : colors.error }}>
            {growth >= 0 ? "+" : ""}
            {growth.toFixed(1)}% {t.vsLastYear}
          </Text>
        </View>
      )}
      {paymentSummary.active.length > 0 ? (
        <View className={`${rowDir} items-center gap-1.5 mt-2`}>
          <MaterialIcons
            name={paymentSummary.remaining === 0 ? "check-circle" : "payments"}
            size={14}
            color={paymentSummary.remaining === 0 ? colors.success : colors.primary}
          />
          <Text
            className="text-[11px] font-semibold leading-4"
            style={{
              color: paymentSummary.remaining === 0 ? colors.success : colors.primary,
              textAlign,
            }}
          >
            {paymentSummary.remaining === 0
              ? t.fullyPaid
              : t.paymentRemaining(money(paymentSummary.remaining))}
          </Text>
        </View>
      ) : null}
      {item.result.totalZakat > 0 ? (
        <>
          <PressableScale
            onPress={() =>
              setPaymentsOpen((open) => {
                const next = !open;
                if (next) onSelect();
                return next;
              })
            }
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={paymentsOpen ? t.breakdownHide : t.breakdownShow}
            accessibilityState={{ expanded: paymentsOpen }}
            style={{ marginTop: 10 }}
          >
            <View className={`${rowDir} items-center gap-1`}>
              <Text className="text-[12px] font-semibold" style={{ color: colors.primary }}>
                {paymentsOpen ? t.breakdownHide : t.breakdownShow}
              </Text>
              <MaterialIcons
                name={paymentsOpen ? "expand-less" : "expand-more"}
                size={17}
                color={colors.primary}
              />
            </View>
          </PressableScale>
          {paymentsOpen && breakdown ? (
            <View className="mt-3 gap-3">
              <View className="rounded-2xl border border-border p-3" style={{ backgroundColor: colors.background }}>
                {breakdown.rows.length === 0 ? (
                  <Text className="text-[12px] text-muted" style={{ textAlign }}>
                    {t.breakdownEmpty}
                  </Text>
                ) : (
                  <>
                    <View className={`${rowDir} items-baseline gap-2 mb-2`}>
                      <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 }} />
                      <Text className="text-[10px] text-muted" style={{ flexBasis: "30%", textAlign: "right" }} numberOfLines={1}>
                        {t.holdingsLabel}
                      </Text>
                      <Text className="text-[10px] text-muted" style={{ flexBasis: "26%", textAlign: "right" }} numberOfLines={1}>
                        {t.dueSection}
                      </Text>
                    </View>
                    {breakdown.rows.map((row) => {
                      const rate = row.rate * 100;
                      const rateLabel = localizeDigits(Number.isInteger(rate) ? String(rate) : rate.toFixed(1), lang);
                      return (
                        <View key={row.categoryId} className={`${rowDir} items-baseline gap-2 mb-1.5`}>
                          <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 }}>
                            <Text className="text-[12px] text-foreground leading-4" style={{ textAlign }} numberOfLines={2}>
                              {t[`cat_${row.categoryId}` as keyof typeof t] as string}
                            </Text>
                            <Text className="text-[10px] text-muted mt-px" style={{ textAlign }}>
                              {rateLabel}%
                            </Text>
                          </View>
                          <Text
                            className="text-[12px] text-muted"
                            style={{ flexBasis: "30%", textAlign: "right", writingDirection: "ltr", fontVariant: ["tabular-nums"] }}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.7}
                          >
                            {money(row.holdings)}
                          </Text>
                          <Text
                            className="text-[12px] font-semibold"
                            style={{ flexBasis: "26%", textAlign: "right", writingDirection: "ltr", color: "#0F7B6C", fontVariant: ["tabular-nums"] }}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.7}
                          >
                            {money(row.zakat)}
                          </Text>
                        </View>
                      );
                    })}
                    {breakdown.deductionZakatAdjustment > 0 ? (
                      <View className={`${rowDir} items-baseline gap-2 mt-1 pt-2 border-t border-border`}>
                        <Text className="text-[12px] flex-1 leading-4" style={{ color: colors.error, textAlign }} numberOfLines={2}>
                          {t.breakdownDeducted}
                        </Text>
                        <Text className="text-[12px]" style={{ flexBasis: "30%", textAlign: "right", writingDirection: "ltr", color: colors.error }} numberOfLines={1}>
                          −{money(breakdown.totalDeductions)}
                        </Text>
                        <Text className="text-[12px] font-semibold" style={{ flexBasis: "26%", textAlign: "right", writingDirection: "ltr", color: colors.error }} numberOfLines={1}>
                          −{money(breakdown.deductionZakatAdjustment)}
                        </Text>
                      </View>
                    ) : null}
                  </>
                )}
                <View className="mt-2 pt-2 border-t border-border">
                  <Text className="text-[10px] text-muted leading-4" style={{ textAlign }}>
                    {t.breakdownNisabLine(
                      breakdown.nisabStandard === "silver" ? t.silverStd : t.goldStd,
                      money(breakdown.nisabThreshold),
                    )}
                  </Text>
                  {breakdown.zeroBecauseBelowNisab ? (
                    <Text className="text-[11px] mt-1 leading-4" style={{ color: colors.primary, textAlign }}>
                      {t.breakdownBelowNisab(
                        breakdown.nisabStandard === "silver" ? t.silverStd : t.goldStd,
                        money(breakdown.nisabThreshold),
                      )}
                    </Text>
                  ) : null}
                </View>
              </View>
              <PaymentTracker
                calculationId={item.id}
                due={item.result.totalZakat}
                currency={item.currency}
                lang={lang}
                compact
              />
            </View>
          ) : null}
        </>
      ) : null}
      <PressableScale onPress={onLoad} haptic style={{ marginTop: 12 }}>
        <View
          className={`${rowDir} items-center justify-center gap-2 rounded-xl py-2.5 border`}
          style={{ borderColor: colors.primary }}
        >
          <MaterialIcons name="restore" size={16} color={colors.primary} />
          <Text className="text-xs font-bold" style={{ color: colors.primary }}>
            {t.loadIntoCalculator}
          </Text>
        </View>
      </PressableScale>
    </View>
  );
}
