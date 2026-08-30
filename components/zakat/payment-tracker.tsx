import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useMemo } from "react";
import { Text, View } from "react-native";

import { MoneyText } from "@/components/zakat/money-text";
import { usePaymentPrompt } from "@/components/zakat/payment-sheet";
import { PressableScale } from "@/components/zakat/pressable-scale";
import { useConfirm } from "@/components/zakat/confirm-sheet";
import { useColors } from "@/hooks/use-colors";
import { dateTag, type LocaleCode } from "@/lib/i18n/locales";
import { makeId, useStore } from "@/lib/store";
import { formatMoney } from "@/lib/zakat/engine";
import { createPayment, summarizePayments, updatePayment } from "@/lib/zakat/payments";
import type { ZakatPayment } from "@/lib/zakat/types";

interface PaymentTrackerProps {
  calculationId: string | null;
  due: number;
  currency: string;
  lang: LocaleCode;
  onEnsureSaved?: () => Promise<string | null>;
  compact?: boolean;
  overviewOnly?: boolean;
  contextLabel?: string;
  onOpenDetails?: () => void;
}

export function PaymentTracker({
  calculationId,
  due,
  currency,
  lang,
  onEnsureSaved,
  compact = false,
  overviewOnly = false,
  contextLabel,
  onOpenDetails,
}: PaymentTrackerProps) {
  const { history, dispatch, t, isRTL } = useStore();
  const colors = useColors();
  const prompt = usePaymentPrompt();
  const confirm = useConfirm();
  const calculation = history.find((item) => item.id === calculationId);
  const summary = useMemo(
    () => summarizePayments(due, calculation?.payments),
    [due, calculation?.payments],
  );
  const money = (value: number) => formatMoney(value, currency, lang);
  const rowDir = isRTL ? "flex-row-reverse" : "flex-row";
  const textAlign = isRTL ? ("right" as const) : ("left" as const);

  const addPayment = async () => {
    const id = calculationId ?? (await onEnsureSaved?.()) ?? null;
    if (!id) return;
    const draft = await prompt({ currency });
    if (!draft) return;
    const now = new Date().toISOString();
    const payment = createPayment(makeId(), draft, now);
    if (!payment) return;
    dispatch({ type: "upsertPaymentInHistory", calculationId: id, payment });
  };

  const editPayment = async (payment: ZakatPayment) => {
    if (!calculationId) return;
    const draft = await prompt({ payment, currency });
    if (!draft) return;
    const edited = updatePayment(payment, draft, new Date().toISOString());
    if (!edited) return;
    dispatch({ type: "upsertPaymentInHistory", calculationId, payment: edited });
  };

  const deletePayment = async (payment: ZakatPayment) => {
    if (!calculationId) return;
    const ok = await confirm({
      title: t.deletePaymentConfirm,
      message: payment.name,
      confirmLabel: t.deletePayment,
      cancelLabel: t.cancel,
      destructive: true,
    });
    if (!ok) return;
    dispatch({
      type: "deletePaymentFromHistory",
      calculationId,
      paymentId: payment.id,
      deletedAt: new Date().toISOString(),
    });
  };

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString(dateTag(lang), {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <View
      testID="payment-tracker"
      className={`rounded-2xl border border-border ${compact ? "p-3" : "p-4"}`}
      style={{ backgroundColor: colors.surface }}
    >
      <View className={`${rowDir} items-center justify-between gap-3`}>
        <View className={`${rowDir} items-center gap-2 flex-1`}>
          <View className="w-8 h-8 rounded-xl items-center justify-center" style={{ backgroundColor: colors.primary + "18" }}>
            <MaterialIcons name="payments" size={17} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-foreground" style={{ textAlign }}>
              {t.paymentProgress}
            </Text>
            {contextLabel ? (
              <Text
                className="text-[11px] font-semibold mt-0.5 leading-4"
                style={{ color: colors.primary, textAlign }}
                numberOfLines={2}
              >
                {t.trackingCalculation(contextLabel)}
              </Text>
            ) : null}
            <Text className="text-[11px] text-muted mt-0.5 leading-4" style={{ textAlign }}>
              {t.paymentPaidOf(money(summary.paid), money(summary.due))}
            </Text>
          </View>
        </View>
        {summary.due > 0 && summary.remaining === 0 ? (
          <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: colors.success + "18" }}>
            <Text className="text-[10px] font-bold" style={{ color: colors.success }}>
              {t.fullyPaid}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="h-2 rounded-full overflow-hidden mt-3" style={{ backgroundColor: colors.border }}>
        <View
          className="h-full rounded-full"
          style={{
            width: `${summary.progress * 100}%`,
            minWidth: summary.paid > 0 && summary.progress > 0 ? 6 : 0,
            backgroundColor: summary.remaining === 0 && summary.due > 0 ? colors.success : colors.primary,
            alignSelf: isRTL ? "flex-end" : "flex-start",
          }}
        />
      </View>

      <View className={`${rowDir} mt-3 gap-3`}>
        <PaymentMetric label={t.totalPaid} value={money(summary.paid)} textAlign={textAlign} />
        <PaymentMetric label={t.paymentRemainingLabel} value={money(summary.remaining)} textAlign={textAlign} emphasize />
      </View>

      {summary.extraPaid > 0 ? (
        <Text className="text-xs mt-2 font-semibold leading-5" style={{ color: colors.success, textAlign }}>
          {t.paymentExtra(money(summary.extraPaid))}
        </Text>
      ) : null}

      {!overviewOnly && summary.active.length > 0 ? (
        <View className="mt-3 pt-1 border-t border-border">
          {summary.active.map((payment) => (
            <View key={payment.id} className={`${rowDir} items-center gap-2 py-2.5 border-b border-border`}>
              <View className="flex-1 min-w-0">
                <Text className="text-xs font-semibold text-foreground leading-4" style={{ textAlign }} numberOfLines={2}>
                  {payment.name}
                </Text>
                <Text className="text-[10px] text-muted mt-0.5 leading-4" style={{ textAlign }}>
                  {formatDate(payment.paidAt)}
                </Text>
              </View>
              <MoneyText
                value={money(payment.amount)}
                fontSize={12}
                className="text-xs font-bold text-foreground"
                style={{ fontVariant: ["tabular-nums"] }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              />
              <PressableScale
                onPress={() => editPayment(payment)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`${t.editPayment}: ${payment.name}`}
              >
                <MaterialIcons name="edit" size={16} color={colors.primary} />
              </PressableScale>
              <PressableScale
                onPress={() => deletePayment(payment)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`${t.deletePayment}: ${payment.name}`}
              >
                <MaterialIcons name="delete-outline" size={17} color={colors.muted} />
              </PressableScale>
            </View>
          ))}
        </View>
      ) : !overviewOnly ? (
        <Text className="text-xs text-muted mt-3 leading-5" style={{ textAlign }}>
          {t.noPayments}
        </Text>
      ) : null}

      <PressableScale
        onPress={() => addPayment().catch(() => {})}
        haptic
        accessibilityRole="button"
        accessibilityLabel={t.addPayment}
        style={{ marginTop: 12 }}
      >
        <View className={`${rowDir} items-center justify-center gap-1.5 rounded-xl py-2.5 border`} style={{ borderColor: colors.primary }}>
          <MaterialIcons name="add" size={17} color={colors.primary} />
          <Text className="text-xs font-bold" style={{ color: colors.primary }}>
            {t.addPayment}
          </Text>
        </View>
      </PressableScale>
      {overviewOnly && onOpenDetails ? (
        <PressableScale
          onPress={onOpenDetails}
          accessibilityRole="button"
          accessibilityLabel={t.viewPaymentDetails}
          style={{ marginTop: 10 }}
        >
          <View className={`${rowDir} items-center justify-center gap-1.5 py-1.5`}>
            <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
              {t.viewPaymentDetails}
            </Text>
            <MaterialIcons name={isRTL ? "chevron-left" : "chevron-right"} size={17} color={colors.primary} />
          </View>
        </PressableScale>
      ) : null}
    </View>
  );
}

function PaymentMetric({
  label,
  value,
  textAlign,
  emphasize = false,
}: {
  label: string;
  value: string;
  textAlign: "left" | "right";
  emphasize?: boolean;
}) {
  const colors = useColors();
  return (
    <View className="flex-1 min-w-0">
      <Text className="text-[10px] text-muted leading-4" style={{ textAlign }}>
        {label}
      </Text>
      <MoneyText
        value={value}
        fontSize={14}
        className="text-sm font-bold"
        style={{ textAlign, color: emphasize ? colors.primary : colors.foreground, fontVariant: ["tabular-nums"] }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      />
    </View>
  );
}
