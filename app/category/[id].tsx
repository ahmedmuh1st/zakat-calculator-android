// Category detail — add/edit line items with category-specific inputs and fiqh note.
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { CategoryIcon } from "@/components/zakat/category-icon";
import { CategoryFaq } from "@/components/zakat/category-faq";
import { ContentColumn } from "@/components/zakat/content-column";
import { CurrencyPicker } from "@/components/zakat/currency-picker";
import { MoneyInput } from "@/components/zakat/money-input";
import { MoneyText } from "@/components/zakat/money-text";
import { PressableScale } from "@/components/zakat/pressable-scale";
import { SwipeableRow } from "@/components/zakat/swipeable-row";
import { TotalsPane } from "@/components/zakat/totals-pane";
import { TwoPane } from "@/components/zakat/two-pane";
import { useColors } from "@/hooks/use-colors";
import { useLayout } from "@/hooks/use-layout";
import { CATEGORY_NOTES } from "@/lib/content/zakatonomics";
import { authoredText } from "@/lib/content/resolve";
import { makeId, useStore } from "@/lib/store";
import { calculateZakat, formatMoney, itemValue, toBase } from "@/lib/zakat/engine";
import { parseAmount } from "@/lib/zakat/numbers";
import {
  AGRICULTURE_RATES,
  CATEGORY_COLORS,
  CategoryId,
  GoldKarat,
  IrrigationType,
  KARAT_PURITY,
  LineItem,
} from "@/lib/zakat/types";

const KARATS: GoldKarat[] = [24, 22, 21, 18, 14, 10];
const IRRIGATIONS: IrrigationType[] = ["rain", "irrigated", "mixed"];

export default function CategoryDetail() {
  const params = useLocalSearchParams<{ id: string }>();
  const categoryId = params.id as CategoryId;
  const { entries, deductions, prices, fx, settings, t, isRTL, dispatch } = useStore();
  const colors = useColors();
  const { listContentStyle } = useLayout();
  const scrollRef = useRef<ScrollView>(null);

  const entry = entries.find((e) => e.categoryId === categoryId);
  const items = useMemo(() => entry?.items ?? [], [entry]);

  const isMetal = categoryId === "gold" || categoryId === "silver";
  const isAgriculture = categoryId === "agriculture";
  const isBusiness = categoryId === "business";
  const isStocks = categoryId === "stocks";
  const isCash = categoryId === "cash";
  const supportsCurrency = !isMetal; // monetary categories can be entered in foreign currency

  // Form state (used for both add and edit)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [grams, setGrams] = useState("");
  const [shares, setShares] = useState("");
  const [pricePerShare, setPricePerShare] = useState("");
  const [karat, setKarat] = useState<GoldKarat>(24);
  const [irrigation, setIrrigation] = useState<IrrigationType>("irrigated");
  const [isDeduction, setIsDeduction] = useState(false);
  // Saudi listed companies are assessed for Zakat by ZATCA, so SAR holdings default to
  // excluded. Any other currency implies a foreign listing, which usually is not.
  const [companyPaysZakat, setCompanyPaysZakat] = useState(settings.currency === "SAR");
  const [itemCurrency, setItemCurrency] = useState<string>(settings.currency);

  const catName = t[`cat_${categoryId}` as keyof typeof t] as string;
  const note = CATEGORY_NOTES[categoryId];
  const lang = settings.language;
  const money = (n: number) => formatMoney(n, settings.currency, lang);
  const moneyIn = (n: number, cur: string) => formatMoney(n, cur, lang);
  const rowDir = isRTL ? "flex-row-reverse" : "flex-row";
  const textAlign = isRTL ? ("right" as const) : ("left" as const);

  const subtotal = useMemo(() => {
    let s = 0;
    for (const item of items) {
      const v = itemValue(item, categoryId, prices, fx ?? undefined);
      s += item.isDeduction ? -v : v;
    }
    return Math.max(0, s);
  }, [items, categoryId, prices, fx]);

  const isForeign = supportsCurrency && itemCurrency !== settings.currency;

  // Whole-calculation figures for the side pane, so a wide-screen user sees the
  // running total react while typing into this one category.
  const overallResult = useMemo(
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
  const hasAnyEntries = entries.some((e) => e.items.length > 0);
  // The zakat actually due for this category, taken from the engine result rather
  // than recomputed here, so it respects nisab and the agriculture rates instead of
  // blindly applying 2.5%.
  const categoryZakat = overallResult.categories.find((c) => c.categoryId === categoryId)?.zakat ?? 0;
  const stocksValue = parseAmount(shares) * parseAmount(pricePerShare);
  const rawValue = isMetal ? 0 : isStocks ? stocksValue : parseAmount(amount);
  const convertedValue = isForeign ? toBase(rawValue, itemCurrency, fx ?? undefined) : rawValue;
  const canAdd = isMetal ? parseAmount(grams) > 0 : rawValue > 0;

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setAmount("");
    setGrams("");
    setShares("");
    setPricePerShare("");
    setIsDeduction(false);
    setCompanyPaysZakat(settings.currency === "SAR");
    setItemCurrency(settings.currency);
  };

  const startEdit = (item: LineItem) => {
    setEditingId(item.id);
    setName(item.label === catName ? "" : item.label);
    setAmount(item.grams != null || item.shares != null ? "" : item.amount ? String(item.amount) : "");
    setGrams(item.grams != null ? String(item.grams) : "");
    setShares(item.shares != null ? String(item.shares) : "");
    setPricePerShare(item.pricePerShare != null ? String(item.pricePerShare) : "");
    if (item.karat) setKarat(item.karat);
    if (item.irrigation) setIrrigation(item.irrigation);
    setIsDeduction(!!item.isDeduction);
    setCompanyPaysZakat(!!item.companyPaysZakat);
    setItemCurrency(item.currency ?? settings.currency);
  };

  const submitItem = () => {
    if (!canAdd) return;
    Keyboard.dismiss();
    const item: LineItem = {
      id: editingId ?? makeId(),
      label: name.trim() || catName,
      amount: isStocks ? stocksValue : parseAmount(amount),
      ...(isMetal ? { grams: parseAmount(grams) } : {}),
      ...(categoryId === "gold" ? { karat } : {}),
      ...(isStocks ? { shares: parseAmount(shares), pricePerShare: parseAmount(pricePerShare) } : {}),
      ...(isForeign ? { currency: itemCurrency } : {}),
      ...(isAgriculture ? { irrigation } : {}),
      ...(isBusiness && isDeduction ? { isDeduction: true } : {}),
      ...(isStocks && companyPaysZakat ? { companyPaysZakat: true } : {}),
    };
    dispatch({ type: "upsertItem", categoryId, item });
    resetForm();
  };

  const accent = CATEGORY_COLORS[categoryId];
  const nameLabel = isCash ? t.bankName : t.itemName;
  // When any form field gains focus, scroll to the end so the Add button stays visible above the keyboard.
  const scrollFormIntoView = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), Platform.OS === "ios" ? 250 : 120);
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <TwoPane side={<TotalsPane result={overallResult} money={money} hasEntries={hasAnyEntries} />}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <ContentColumn>
        <View className={`${rowDir} items-center gap-3 px-5 pt-2 pb-3`}>
          <PressableScale onPress={() => router.back()}>
            <View className="w-9 h-9 rounded-full bg-surface border border-border items-center justify-center">
              <MaterialIcons name={isRTL ? "chevron-right" : "chevron-left"} size={22} color={colors.foreground} />
            </View>
          </PressableScale>
          <CategoryIcon categoryId={categoryId} boxSize={38} size={20} />
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground" style={{ textAlign }}>
              {catName}
            </Text>
          </View>
          {/* Two labelled figures. A bare number here was read as the Zakat due when
              it was the value of the holdings, so neither figure travels unnamed. */}
          <View style={{ alignItems: isRTL ? "flex-start" : "flex-end" }}>
            <Text className="text-[10px] text-muted">{t.categoryHoldingsLabel}</Text>
            <MoneyText
              value={money(subtotal)}
              fontSize={14}
              className="text-sm font-bold"
              style={{ color: accent, fontVariant: ["tabular-nums"] }}
            />
          </View>
        </View>
        </ContentColumn>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[{ paddingBottom: 24 }, listContentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Fiqh note */}
          <View className="mx-5 rounded-2xl p-4" style={{ backgroundColor: accent + "14" }}>
            <View className={`${rowDir} items-center gap-1.5 mb-1`}>
              <MaterialIcons name="info-outline" size={14} color={accent} />
              <Text className="text-xs font-bold" style={{ color: accent }}>
                {t.aboutCategory}
              </Text>
            </View>
            <Text className="text-[13px] leading-5 text-foreground" style={{ textAlign }}>
              {authoredText(note, lang)}
            </Text>
          </View>

          {/* Existing items */}
          <View className="mx-5 mt-4">
            {items.length === 0 ? (
              <Text className="text-sm text-muted text-center py-6">{t.emptyCategory}</Text>
            ) : (
              items.map((item) => {
                const baseVal = itemValue(item, categoryId, prices, fx ?? undefined);
                const removeItem = () => {
                  if (editingId === item.id) resetForm();
                  dispatch({ type: "removeItem", categoryId, itemId: item.id });
                };
                return (
                  <SwipeableRow
                    key={item.id}
                    onEdit={() => startEdit(item)}
                    onDelete={removeItem}
                    editLabel={t.edit}
                    deleteLabel={t.delete}
                    disabled={editingId === item.id}
                  >
                    <View
                      className={`${rowDir} items-center gap-2.5 bg-surface border rounded-2xl px-4 py-3`}
                      style={{ borderColor: editingId === item.id ? accent : colors.border }}
                    >
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-foreground" style={{ textAlign }} numberOfLines={1}>
                        {item.label}
                        {item.isDeduction ? " (−)" : ""}
                      </Text>
                      <Text className="text-xs text-muted mt-0.5" style={{ textAlign }}>
                        {item.grams != null
                          ? `${item.grams}g${item.karat ? ` · ${item.karat}k` : ""}`
                          : item.shares != null && item.pricePerShare != null
                            ? t.sharesSummary(item.shares.toLocaleString(), moneyIn(item.pricePerShare, item.currency ?? settings.currency))
                            : item.currency && item.currency !== settings.currency
                              ? moneyIn(item.amount, item.currency)
                              : item.irrigation
                                ? (t[`irrigation_${item.irrigation}` as keyof typeof t] as string)
                                : ""}
                      </Text>
                      {item.companyPaysZakat && (
                        <View className={`${rowDir} items-center gap-1 mt-1`}>
                          <MaterialIcons name="verified" size={12} color={colors.success} />
                          <Text className="text-[11px] font-semibold" style={{ color: colors.success }}>
                            {t.excludedFromZakat}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      className="text-sm font-bold"
                      style={{
                        color: item.isDeduction ? colors.success : colors.foreground,
                        fontVariant: ["tabular-nums"],
                        // An excluded holding still shows its market value, but muted, so the
                        // user can see the figure without thinking it feeds the total.
                        opacity: item.companyPaysZakat ? 0.45 : 1,
                        textDecorationLine: item.companyPaysZakat ? "line-through" : "none",
                      }}
                    >
                      {item.isDeduction ? "−" : ""}
                      {money(baseVal)}
                    </Text>
                    <PressableScale onPress={() => startEdit(item)} hitSlop={8}>
                      <MaterialIcons name="edit" size={20} color={editingId === item.id ? accent : colors.muted} />
                    </PressableScale>
                    <PressableScale onPress={removeItem} hitSlop={8}>
                      <MaterialIcons name="delete-outline" size={20} color={colors.muted} />
                    </PressableScale>
                    </View>
                  </SwipeableRow>
                );
              })
            )}
          </View>

          {/* Add / edit item form */}
          <View
            className="mx-5 mt-2 bg-surface border rounded-2xl p-4"
            style={{ borderColor: editingId ? accent : colors.border }}
          >
            <TextInput
              className="bg-background border border-border rounded-xl px-3.5 text-foreground"
              placeholder={nameLabel}
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              onFocus={scrollFormIntoView}
              style={{ textAlign, minHeight: 48, paddingVertical: 12 }}
              returnKeyType="done"
            />

            {isMetal ? (
              <View className="mt-2">
                <MoneyInput
                  value={grams}
                  onChangeValue={setGrams}
                  locale={lang}
                  isRTL={isRTL}
                  placeholder={t.weightGrams}
                  onFocus={scrollFormIntoView}
                  onSubmitEditing={submitItem}
                />
              </View>
            ) : isStocks ? (
              <>
                <View className={`${rowDir} gap-2 mt-2`}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <MoneyInput
                      value={shares}
                      onChangeValue={setShares}
                      locale={lang}
                      isRTL={isRTL}
                      placeholder={t.numShares}
                      onFocus={scrollFormIntoView}
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <MoneyInput
                      value={pricePerShare}
                      onChangeValue={setPricePerShare}
                      locale={lang}
                      isRTL={isRTL}
                      placeholder={t.pricePerShare}
                      onFocus={scrollFormIntoView}
                      onSubmitEditing={submitItem}
                    />
                  </View>
                  <CurrencyPicker
                    label={t.itemCurrency}
                    value={itemCurrency}
                    isRTL={isRTL}
                    lang={lang}
                    searchPlaceholder={t.searchCurrency}
                    onSelect={setItemCurrency}
                    pinned={[settings.currency, "USD", "EUR", "AED", "KWD"].filter((c, i, a) => a.indexOf(c) === i)}
                    compact
                  />
                </View>
                {stocksValue > 0 && (
                  <Text className="text-xs text-muted mt-2" style={{ textAlign, fontVariant: ["tabular-nums"] }}>
                    = {moneyIn(stocksValue, itemCurrency)}
                    {isForeign ? `  ${t.convertedTo(money(convertedValue))}` : ""}
                  </Text>
                )}
              </>
            ) : (
              <>
                <View className={`${rowDir} gap-2 mt-2 items-stretch`}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <MoneyInput
                      value={amount}
                      onChangeValue={setAmount}
                      locale={lang}
                      isRTL={isRTL}
                      placeholder={`${t.amount} (${itemCurrency})`}
                      onFocus={scrollFormIntoView}
                      onSubmitEditing={submitItem}
                    />
                  </View>
                  {supportsCurrency && (
                    <CurrencyPicker
                      label={t.itemCurrency}
                      value={itemCurrency}
                      isRTL={isRTL}
                      lang={lang}
                      searchPlaceholder={t.searchCurrency}
                      onSelect={setItemCurrency}
                      pinned={[settings.currency, "USD", "EUR", "AED", "KWD"].filter((c, i, a) => a.indexOf(c) === i)}
                      compact
                    />
                  )}
                </View>
                {isForeign && rawValue > 0 && (
                  <Text className="text-xs text-muted mt-2" style={{ textAlign, fontVariant: ["tabular-nums"] }}>
                    {t.convertedTo(money(convertedValue))}
                  </Text>
                )}
              </>
            )}

            {/* Gold karat selector */}
            {categoryId === "gold" && (
              <View className="mt-3">
                {/* Labelled and explained: testers were asking whether karats were
                    supported at all, because the bare row of chips read as decoration. */}
                <View className={`${rowDir} items-center gap-1.5 mb-1.5`}>
                  <MaterialIcons name="diamond" size={13} color={accent} />
                  <Text className="text-xs font-bold" style={{ color: accent, textAlign }}>
                    {t.karatLabel}
                  </Text>
                </View>
                <View className={`${rowDir} flex-wrap gap-2`}>
                  {KARATS.map((k) => (
                    <PressableScale key={k} onPress={() => setKarat(k)} style={{ flexGrow: 1, flexBasis: "30%" }}>
                      <View
                        className="rounded-xl py-2 items-center border"
                        style={{
                          backgroundColor: karat === k ? accent : "transparent",
                          borderColor: karat === k ? accent : colors.border,
                        }}
                      >
                        <Text className="text-xs font-bold" style={{ color: karat === k ? "#FFFFFF" : colors.muted }}>
                          {k}k
                        </Text>
                      </View>
                    </PressableScale>
                  ))}
                </View>
                <Text className="text-[11px] leading-4 text-muted mt-1.5" style={{ textAlign }}>
                  {t.karatHint}
                </Text>
                <Text className="text-[11px] leading-4 mt-0.5" style={{ color: accent, textAlign }}>
                  {t.karatPurityNote(`${karat}k`, `${Math.round(KARAT_PURITY[karat] * 1000) / 10}%`)}
                </Text>
              </View>
            )}

            {/* Stocks: the company may already be assessed for Zakat on its own assets */}
            {isStocks && (
              <PressableScale onPress={() => setCompanyPaysZakat((v) => !v)} style={{ marginTop: 10 }}>
                <View className="gap-1">
                  <View className={`${rowDir} items-center gap-2`}>
                    <MaterialIcons
                      name={companyPaysZakat ? "check-box" : "check-box-outline-blank"}
                      size={20}
                      color={companyPaysZakat ? colors.success : colors.muted}
                    />
                    <Text
                      className="text-xs flex-1"
                      style={{ color: companyPaysZakat ? colors.success : colors.muted, textAlign }}
                    >
                      {t.companyPaysZakat}
                    </Text>
                  </View>
                  <Text className="text-[11px] leading-4 text-muted" style={{ textAlign }}>
                    {t.companyPaysZakatHint}
                  </Text>
                </View>
              </PressableScale>
            )}

            {/* Agriculture irrigation selector */}
            {isAgriculture && (
              <View className="gap-2 mt-2">
                {IRRIGATIONS.map((ir) => (
                  <PressableScale key={ir} onPress={() => setIrrigation(ir)}>
                    <View
                      className={`${rowDir} items-center justify-between rounded-xl px-3.5 py-2.5 border`}
                      style={{
                        backgroundColor: irrigation === ir ? accent + "18" : "transparent",
                        borderColor: irrigation === ir ? accent : colors.border,
                      }}
                    >
                      <Text className="text-xs font-semibold" style={{ color: irrigation === ir ? accent : colors.muted }}>
                        {t[`irrigation_${ir}` as keyof typeof t] as string}
                      </Text>
                      <Text className="text-xs font-bold" style={{ color: irrigation === ir ? accent : colors.muted }}>
                        {(AGRICULTURE_RATES[ir] * 100).toLocaleString()}%
                      </Text>
                    </View>
                  </PressableScale>
                ))}
              </View>
            )}

            {/* Business deduction toggle */}
            {isBusiness && (
              <PressableScale onPress={() => setIsDeduction((d) => !d)} style={{ marginTop: 8 }}>
                <View className="gap-1">
                  <View className={`${rowDir} items-center gap-2`}>
                    <MaterialIcons
                      name={isDeduction ? "check-box" : "check-box-outline-blank"}
                      size={20}
                      color={isDeduction ? colors.success : colors.muted}
                    />
                    <Text
                      className="text-xs flex-1"
                      style={{ color: isDeduction ? colors.success : colors.muted, textAlign }}
                    >
                      {t.markDeduction}
                    </Text>
                  </View>
                  {isDeduction && (
                    <Text className="text-[11px] leading-4 text-muted" style={{ textAlign }}>
                      {t.markDeductionHint}
                    </Text>
                  )}
                </View>
              </PressableScale>
            )}

            {/* Primary action: solid accent when enabled, clearly muted otherwise */}
            <View className={`${rowDir} gap-2 mt-3 items-center`}>
              <PressableScale onPress={submitItem} haptic disabled={!canAdd} style={{ flex: 1 }}>
                <View
                  className="rounded-xl items-center border"
                  style={{
                    minHeight: 50,
                    justifyContent: "center",
                    backgroundColor: canAdd ? accent : "transparent",
                    borderColor: canAdd ? accent : colors.border,
                  }}
                >
                  <View className={`${rowDir} items-center gap-1.5`}>
                    <MaterialIcons
                      name={editingId ? "check" : "add"}
                      size={18}
                      color={canAdd ? "#FFFFFF" : colors.muted}
                    />
                    <Text className="text-sm font-bold" style={{ color: canAdd ? "#FFFFFF" : colors.muted }}>
                      {editingId ? t.updateItem : t.addItem}
                    </Text>
                  </View>
                </View>
              </PressableScale>
              {editingId && (
                <PressableScale onPress={resetForm}>
                  <View className="rounded-xl px-4 border border-border items-center" style={{ minHeight: 50, justifyContent: "center" }}>
                    <Text className="text-sm font-semibold text-muted">{t.cancel}</Text>
                  </View>
                </PressableScale>
              )}
            </View>
          </View>

          {/* Contextual questions for this category, pulled from the same curated FAQ
              the Learn tab uses. Osama's feedback: the answers existed but nothing
              connected them to the screen where the question actually arises. */}
          <CategoryFaq categoryId={categoryId} accent={accent} />
        </ScrollView>

        {/* Pinned subtotal + done (quiet, secondary — sits at the very bottom under the keyboard) */}
        <View className="border-t border-border bg-background">
          <ContentColumn>
            <View className={`${rowDir} items-center gap-3 px-5 py-3`}>
              <View className="flex-1">
                <Text className="text-xs text-muted" style={{ textAlign }}>
                  {t.categoryHoldingsLabel}
                </Text>
                <MoneyText
                  value={money(subtotal)}
                  fontSize={18}
                  className="text-lg font-bold text-foreground"
                  style={{ textAlign, fontVariant: ["tabular-nums"] }}
                />
                {/* What the user actually owes on this category. Without it the only
                    money on screen is holdings, which reads as an amount due. */}
                {items.length > 0 && (
                  <View className={`${rowDir} items-center gap-1.5 mt-0.5`}>
                    <Text className="text-[11px] text-muted">{t.categoryZakatLabel}</Text>
                    {categoryZakat > 0 ? (
                      <MoneyText
                        value={money(categoryZakat)}
                        fontSize={12}
                        className="text-xs font-bold"
                        style={{ color: accent, fontVariant: ["tabular-nums"] }}
                      />
                    ) : (
                      <Text className="text-xs font-semibold text-muted">
                        {t.categoryZakatBelowNisab}
                      </Text>
                    )}
                  </View>
                )}
              </View>
              <PressableScale onPress={() => router.back()} haptic>
                <View className="rounded-xl px-8 border border-border bg-surface items-center" style={{ minHeight: 46, justifyContent: "center" }}>
                  <Text className="text-sm font-bold text-foreground">{t.done}</Text>
                </View>
              </PressableScale>
            </View>
          </ContentColumn>
        </View>
      </KeyboardAvoidingView>
      </TwoPane>
    </ScreenContainer>
  );
}
