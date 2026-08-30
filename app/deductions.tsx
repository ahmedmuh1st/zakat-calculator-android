// Deductions — debts and dues subtracted before nisab comparison.
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { ContentColumn } from "@/components/zakat/content-column";
import { MoneyInput } from "@/components/zakat/money-input";
import { PressableScale } from "@/components/zakat/pressable-scale";
import { SwipeableRow } from "@/components/zakat/swipeable-row";
import { TotalsPane } from "@/components/zakat/totals-pane";
import { TwoPane } from "@/components/zakat/two-pane";
import { useColors } from "@/hooks/use-colors";
import { useLayout } from "@/hooks/use-layout";
import { makeId, useStore } from "@/lib/store";
import { calculateZakat, formatMoney } from "@/lib/zakat/engine";
import { parseAmount } from "@/lib/zakat/numbers";

export default function Deductions() {
  const { entries, deductions, prices, fx, settings, t, isRTL, dispatch } = useStore();
  const colors = useColors();
  const { listContentStyle } = useLayout();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  const lang = settings.language;
  const money = (n: number) => formatMoney(n, settings.currency, lang);
  const rowDir = isRTL ? "flex-row-reverse" : "flex-row";
  const textAlign = isRTL ? ("right" as const) : ("left" as const);

  // Live figures for the side pane, so the effect of a deduction shows up the
  // moment it is added on a wide screen.
  const result = useMemo(
    () =>
      calculateZakat({
        entries,
        deductions,
        prices,
        nisabStandard: settings.nisabStandard,
        fx: fx ?? undefined,
      }),
    [entries, deductions, prices, settings.nisabStandard, fx],
  );
  const hasEntries = entries.some((e) => e.items.length > 0);

  const canAdd = parseAmount(amount) > 0;

  const add = () => {
    const a = parseAmount(amount);
    if (!a || a <= 0) return;
    if (editingId) {
      dispatch({
        type: "setDeductions",
        payload: deductions.map((d) => (d.id === editingId ? { ...d, label: name.trim() || t.ded_label, amount: a } : d)),
      });
    } else {
      dispatch({
        type: "setDeductions",
        payload: [...deductions, { id: makeId(), label: name.trim() || t.ded_label, amount: a }],
      });
    }
    setEditingId(null);
    setName("");
    setAmount("");
  };

  const remove = (id: string) => {
    if (editingId === id) {
      setEditingId(null);
      setName("");
      setAmount("");
    }
    dispatch({ type: "setDeductions", payload: deductions.filter((d) => d.id !== id) });
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <TwoPane side={<TotalsPane result={result} money={money} hasEntries={hasEntries} />}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ContentColumn>
        <View className={`${rowDir} items-center gap-3 px-5 pt-2 pb-3`}>
          <PressableScale onPress={() => router.back()}>
            <View className="w-9 h-9 rounded-full bg-surface border border-border items-center justify-center">
              <MaterialIcons name={isRTL ? "chevron-right" : "chevron-left"} size={22} color={colors.foreground} />
            </View>
          </PressableScale>
          <Text className="text-xl font-bold text-foreground flex-1" style={{ textAlign }}>
            {t.ded_title}
          </Text>
        </View>
        </ContentColumn>

        <ScrollView contentContainerStyle={[{ paddingBottom: 24 }, listContentStyle]}>
          <View className="mx-5 rounded-2xl p-4" style={{ backgroundColor: colors.error + "12" }}>
            <Text className="text-[13px] leading-5 text-foreground" style={{ textAlign }}>
              {t.ded_body}
            </Text>
          </View>

          <View className="mx-5 mt-4">
            {deductions.map((d) => {
              const startEdit = () => {
                setEditingId(d.id);
                setName(d.label === t.ded_label ? "" : d.label);
                setAmount(String(d.amount));
              };
              return (
              <SwipeableRow
                key={d.id}
                onEdit={startEdit}
                onDelete={() => remove(d.id)}
                editLabel={t.edit}
                deleteLabel={t.delete}
                disabled={editingId === d.id}
              >
              <View
                className={`${rowDir} items-center gap-2.5 bg-surface border rounded-2xl px-4 py-3`}
                style={{ borderColor: editingId === d.id ? colors.error : colors.border }}
              >
                <Text className="flex-1 text-sm font-semibold text-foreground" style={{ textAlign }} numberOfLines={1}>
                  {d.label}
                </Text>
                <Text className="text-sm font-bold" style={{ color: colors.error, fontVariant: ["tabular-nums"] }}>
                  −{money(d.amount)}
                </Text>
                <PressableScale onPress={startEdit} hitSlop={8}>
                  <MaterialIcons name="edit" size={20} color={editingId === d.id ? colors.error : colors.muted} />
                </PressableScale>
                <PressableScale onPress={() => remove(d.id)} hitSlop={8}>
                  <MaterialIcons name="delete-outline" size={20} color={colors.muted} />
                </PressableScale>
              </View>
              </SwipeableRow>
              );
            })}
          </View>

          <View className="mx-5 mt-2 bg-surface border border-border rounded-2xl p-4">
            <TextInput
              className="bg-background border border-border rounded-xl px-3.5 text-foreground"
              placeholder={t.ded_label}
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              style={{ textAlign, minHeight: 48, paddingVertical: 12 }}
              returnKeyType="done"
            />
            <View className="mt-2">
              <MoneyInput
                value={amount}
                onChangeValue={setAmount}
                locale={lang}
                isRTL={isRTL}
                placeholder={`${t.amount} (${settings.currency})`}
                onSubmitEditing={add}
              />
            </View>
            <PressableScale onPress={add} haptic disabled={!canAdd} style={{ marginTop: 12 }}>
              <View
                className="rounded-xl items-center border"
                style={{
                  minHeight: 50,
                  justifyContent: "center",
                  backgroundColor: canAdd ? colors.error : "transparent",
                  borderColor: canAdd ? colors.error : colors.border,
                }}
              >
                <View className={`${rowDir} items-center gap-1.5`}>
                  <MaterialIcons name={editingId ? "check" : "add"} size={18} color={canAdd ? "#FFFFFF" : colors.muted} />
                  <Text className="text-sm font-bold" style={{ color: canAdd ? "#FFFFFF" : colors.muted }}>
                    {editingId ? t.updateItem : t.addItem}
                  </Text>
                </View>
              </View>
            </PressableScale>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </TwoPane>
    </ScreenContainer>
  );
}
