import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Text, TextInput, View } from "react-native";

import { PressableScale } from "@/components/zakat/pressable-scale";
import { useColors } from "@/hooks/use-colors";
import { useStore } from "@/lib/store";
import { cleanNumericText, formatNumericText, localizeDigits, normalizeDigits, parseAmount } from "@/lib/zakat/numbers";
import { paymentDateParts, paymentIsoFromParts, type PaymentDraft } from "@/lib/zakat/payments";
import type { ZakatPayment } from "@/lib/zakat/types";

interface PaymentRequest {
  currency: string;
  payment?: ZakatPayment;
}

type PaymentPrompt = (request: PaymentRequest) => Promise<PaymentDraft | null>;

const PaymentContext = createContext<PaymentPrompt | null>(null);

const digitsOnly = (value: string) => normalizeDigits(value).replace(/\D/g, "");

function cleanDateInput(value: string): string {
  const digits = digitsOnly(value).slice(0, 8);
  return [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)].filter(Boolean).join("-");
}

function cleanTimeInput(value: string): string {
  const digits = digitsOnly(value).slice(0, 4);
  return [digits.slice(0, 2), digits.slice(2, 4)].filter(Boolean).join(":");
}

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const { t, isRTL, settings } = useStore();
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [name, setName] = useState("");
  const [amountText, setAmountText] = useState("");
  const [dateText, setDateText] = useState("");
  const [timeText, setTimeText] = useState("");
  const [error, setError] = useState("");
  const amountRef = useRef<TextInput>(null);
  const resolverRef = useRef<((value: PaymentDraft | null) => void) | null>(null);

  const ask = useCallback<PaymentPrompt>((nextRequest) => {
    return new Promise<PaymentDraft | null>((resolve) => {
      resolverRef.current = resolve;
      setRequest(nextRequest);
    });
  }, []);

  useEffect(() => {
    if (!request) return;
    const parts = paymentDateParts(request.payment?.paidAt ?? new Date().toISOString());
    setName(request.payment?.name ?? "");
    setAmountText(request.payment ? String(request.payment.amount) : "");
    setDateText(parts.date);
    setTimeText(parts.time);
    setError("");
  }, [request]);

  useEffect(() => () => resolverRef.current?.(null), []);

  const settle = (value: PaymentDraft | null) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setRequest(null);
    setError("");
  };

  const submit = () => {
    const cleanName = name.trim();
    if (!cleanName) {
      setError(t.paymentNameError);
      return;
    }
    const amount = parseAmount(amountText);
    if (!(amount > 0)) {
      setError(t.paymentAmountError);
      return;
    }
    const paidAt = paymentIsoFromParts(dateText, timeText);
    if (!paidAt) {
      setError(t.paymentDateError);
      return;
    }
    settle({ name: cleanName, amount, paidAt });
  };

  const textAlign = isRTL ? ("right" as const) : ("left" as const);
  const rowDir = isRTL ? "flex-row-reverse" : "flex-row";
  const visible = request != null;
  const payment = request?.payment;
  const currencyLabel = request?.currency === "SAR" ? "⃁" : request?.currency;

  return (
    <PaymentContext.Provider value={ask}>
      {children}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => settle(null)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 items-center justify-end sm:justify-center px-5 pb-5"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        >
          {visible ? (
            <View className="w-full max-w-sm bg-background rounded-3xl p-5">
              <Text className="text-lg font-bold text-foreground text-center">
                {payment ? t.editPayment : t.addPayment}
              </Text>

              <Text className="text-xs font-semibold text-muted mt-5 mb-1.5" style={{ textAlign }}>
                {t.paymentName}
              </Text>
              <TextInput
                accessibilityLabel={t.paymentName}
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  setError("");
                }}
                placeholder={t.paymentNamePlaceholder}
                placeholderTextColor={colors.muted}
                autoFocus
                maxLength={80}
                returnKeyType="next"
                onSubmitEditing={() => amountRef.current?.focus()}
                className="rounded-2xl px-4 py-3.5 bg-surface border border-border text-base text-foreground"
                style={{ textAlign, writingDirection: isRTL ? "rtl" : "ltr" }}
              />

              <Text className="text-xs font-semibold text-muted mt-4 mb-1.5" style={{ textAlign }}>
                {t.paymentAmount}
              </Text>
              <View className={`${rowDir} items-center rounded-2xl bg-surface border border-border px-4`}>
                <TextInput
                  accessibilityLabel={t.paymentAmount}
                  ref={amountRef}
                  value={formatNumericText(amountText, settings.language)}
                  onChangeText={(value) => {
                    setAmountText(cleanNumericText(value));
                    setError("");
                  }}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  maxLength={24}
                  className="flex-1 py-3.5 text-lg font-semibold text-foreground"
                  style={{ textAlign, writingDirection: "ltr", fontVariant: ["tabular-nums"] }}
                />
                <Text className="text-sm font-semibold text-muted">{currencyLabel}</Text>
              </View>

              <Text className="text-xs font-semibold text-muted mt-4 mb-1.5" style={{ textAlign }}>
                {t.paymentDateTime}
              </Text>
              <View className={`${rowDir} gap-2`}>
                <TextInput
                  accessibilityLabel={`${t.paymentDateTime} YYYY-MM-DD`}
                  value={localizeDigits(dateText, settings.language)}
                  onChangeText={(value) => {
                    setDateText(cleanDateInput(value));
                    setError("");
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  maxLength={10}
                  className="flex-[2] rounded-2xl px-4 py-3 bg-surface border border-border text-base text-foreground"
                  style={{ textAlign: "center", writingDirection: "ltr", fontVariant: ["tabular-nums"] }}
                />
                <TextInput
                  accessibilityLabel={`${t.paymentDateTime} HH:MM`}
                  value={localizeDigits(timeText, settings.language)}
                  onChangeText={(value) => {
                    setTimeText(cleanTimeInput(value));
                    setError("");
                  }}
                  placeholder="HH:MM"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  maxLength={5}
                  className="flex-1 rounded-2xl px-3 py-3 bg-surface border border-border text-base text-foreground"
                  style={{ textAlign: "center", writingDirection: "ltr", fontVariant: ["tabular-nums"] }}
                />
              </View>

              {error ? (
                <Text className="text-xs mt-2 leading-5" style={{ color: colors.error, textAlign }}>
                  {error}
                </Text>
              ) : null}

              <PressableScale
                onPress={submit}
                haptic
                accessibilityRole="button"
                accessibilityLabel={t.save}
                style={{ marginTop: 18 }}
              >
                <View className="rounded-2xl py-3.5 items-center" style={{ backgroundColor: colors.primary }}>
                  <Text className="text-white text-sm font-bold">{t.save}</Text>
                </View>
              </PressableScale>
              <PressableScale
                onPress={() => settle(null)}
                accessibilityRole="button"
                accessibilityLabel={t.cancel}
                style={{ marginTop: 10 }}
              >
                <View className="rounded-2xl py-3.5 items-center border border-border bg-surface">
                  <Text className="text-sm font-bold text-foreground">{t.cancel}</Text>
                </View>
              </PressableScale>
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </Modal>
    </PaymentContext.Provider>
  );
}

export function usePaymentPrompt(): PaymentPrompt {
  const context = useContext(PaymentContext);
  if (!context) throw new Error("usePaymentPrompt must be used within PaymentProvider");
  return context;
}
