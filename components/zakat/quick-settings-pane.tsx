// Quick settings for the wide-screen side pane.
//
// Only the handful of settings that get changed mid-calculation live here:
// currency, Nisab standard, language and metal prices. Each row shows its
// current value and expands inline when tapped; opening one closes the other,
// so the pane never grows unmanageably tall. Everything else stays in the
// full Settings tab, reachable from the link at the bottom.
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { CurrencyPicker } from "@/components/zakat/currency-picker";
import { PressableScale } from "@/components/zakat/pressable-scale";
import { useColors } from "@/hooks/use-colors";
import { useStore } from "@/lib/store";
import { LOCALES, localeMeta } from "@/lib/i18n/locales";
import { formatMoney } from "@/lib/zakat/engine";
import { useLanguageChange } from "@/lib/zakat/use-language-change";
import { fetchLivePrices } from "@/lib/zakat/prices";

type RowKey = "currency" | "nisab" | "language" | "prices";

export function QuickSettingsPane() {
  const { settings, prices, t, isRTL, dispatch } = useStore();
  const colors = useColors();
  const [open, setOpen] = useState<RowKey | null>(null);
  const [fetching, setFetching] = useState(false);

  const lang = settings.language;
  const rowDir = isRTL ? ("row-reverse" as const) : ("row" as const);
  const textAlign = isRTL ? ("right" as const) : ("left" as const);
  const money = (n: number) => formatMoney(n, settings.currency, lang);
  // Same currency-follows-language rule as the Settings tab, shared rather than duplicated.
  const { changeLanguage, currencyListOpen, clearCurrencyListSignal } = useLanguageChange();

  const toggle = (key: RowKey) => setOpen((cur) => (cur === key ? null : key));

  const refreshPrices = async () => {
    setFetching(true);
    try {
      const p = await fetchLivePrices(settings.currency);
      dispatch({ type: "setPrices", payload: p });
    } catch {
      // silent: manual entry stays available in the full Settings tab
    } finally {
      setFetching(false);
    }
  };

  const hasPrices = prices.goldPerGram > 0;
  const missingPriceLabel = fetching ? t.fetching : t.fetchLive;

  return (
    <View className="bg-surface border border-border rounded-2xl overflow-hidden">
      <Text className="text-sm font-bold text-foreground px-4 pt-4 pb-2" style={{ textAlign }}>
        {t.quickSettings}
      </Text>

      {/* Currency */}
      <QuickRow
        icon="payments"
        label={t.currency}
        value={settings.currency}
        expanded={open === "currency"}
        onPress={() => toggle("currency")}
        rowDir={rowDir}
        textAlign={textAlign}
      >
        <CurrencyPicker
          label={t.currency}
          value={settings.currency}
          isRTL={isRTL}
          lang={lang}
          searchPlaceholder={t.searchCurrency}
          onSelect={(c) => {
            dispatch({ type: "setSettings", payload: { currency: c } });
            setOpen(null);
          }}
          pinned={["SAR", "USD", "EUR", "AED", "KWD", "QAR", "BHD", "OMR", "EGP"]}
          openSignal={currencyListOpen}
          onOpenSignalHandled={clearCurrencyListSignal}
        />
      </QuickRow>

      {/* Nisab standard */}
      <QuickRow
        icon="balance"
        label={t.nisabStandard}
        value={settings.nisabStandard === "gold" ? t.goldStd : t.silverStd}
        expanded={open === "nisab"}
        onPress={() => toggle("nisab")}
        rowDir={rowDir}
        textAlign={textAlign}
      >
        <View className="gap-2" style={{ flexDirection: rowDir }}>
          {(["gold", "silver"] as const).map((std) => {
            const active = settings.nisabStandard === std;
            const tint = std === "gold" ? "#C9A24B" : "#8E9AAB";
            return (
              <PressableScale
                key={std}
                onPress={() => dispatch({ type: "setSettings", payload: { nisabStandard: std } })}
                style={{ flex: 1 }}
              >
                <View
                  className="rounded-xl py-2.5 items-center border"
                  style={{
                    backgroundColor: active ? tint : "transparent",
                    borderColor: active ? tint : colors.border,
                  }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: active ? "#FFFFFF" : colors.muted }}
                    numberOfLines={1}
                  >
                    {std === "gold" ? t.nisab_gold : t.nisab_silver}
                  </Text>
                </View>
              </PressableScale>
            );
          })}
        </View>
      </QuickRow>

      {/* Language */}
      <QuickRow
        icon="translate"
        label={t.language}
        value={localeMeta(lang).endonym}
        expanded={open === "language"}
        onPress={() => toggle("language")}
        rowDir={rowDir}
        textAlign={textAlign}
      >
        {/* This pane still offered only English and Arabic after the app grew to seven
            locales, so a wide-screen user could not reach the other five from here.
            Wrapped rather than a single row, because seven endonyms do not fit side by
            side in a side pane. */}
        <View className="gap-2 flex-wrap" style={{ flexDirection: rowDir }}>
          {LOCALES.map((meta) => {
            const active = lang === meta.code;
            return (
              <PressableScale
                key={meta.code}
                onPress={() => changeLanguage(meta.code)}
              >
                <View
                  className="rounded-xl py-2.5 px-3 items-center border"
                  style={{
                    backgroundColor: active ? colors.primary : "transparent",
                    borderColor: active ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: active ? "#FFFFFF" : colors.muted, writingDirection: meta.direction }}
                  >
                    {meta.endonym}
                  </Text>
                </View>
              </PressableScale>
            );
          })}
        </View>
      </QuickRow>

      {/* Metal prices */}
      <QuickRow
        icon="workspace-premium"
        label={t.metalPrices}
        value={hasPrices ? money(prices.goldPerGram) : missingPriceLabel}
        expanded={open === "prices"}
        onPress={() => toggle("prices")}
        rowDir={rowDir}
        textAlign={textAlign}
        last
      >
        <View className="gap-2">
          <View className="justify-between" style={{ flexDirection: rowDir }}>
            <Text className="text-xs text-muted">{t.goldPerGram}</Text>
            <Text className="text-xs font-semibold text-foreground" style={{ fontVariant: ["tabular-nums"] }}>
              {hasPrices ? money(prices.goldPerGram) : missingPriceLabel}
            </Text>
          </View>
          <View className="justify-between" style={{ flexDirection: rowDir }}>
            <Text className="text-xs text-muted">{t.silverPerGram}</Text>
            <Text className="text-xs font-semibold text-foreground" style={{ fontVariant: ["tabular-nums"] }}>
              {hasPrices ? money(prices.silverPerGram) : missingPriceLabel}
            </Text>
          </View>
          <PressableScale onPress={refreshPrices} haptic disabled={fetching}>
            <View
              className="rounded-xl py-2.5 items-center justify-center gap-2"
              style={{ flexDirection: rowDir, backgroundColor: colors.primary + "14" }}
            >
              {fetching ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <MaterialIcons name="refresh" size={16} color={colors.primary} />
              )}
              <Text className="text-xs font-bold" style={{ color: colors.primary }}>
                {fetching ? t.fetching : t.fetchLive}
              </Text>
            </View>
          </PressableScale>
        </View>
      </QuickRow>

      {/* Escape hatch to everything else */}
      <PressableScale onPress={() => router.push("/(tabs)/settings")}>
        <View
          className="items-center justify-between px-4 py-3 border-t border-border"
          style={{ flexDirection: rowDir }}
        >
          <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
            {t.allSettings}
          </Text>
          <MaterialIcons
            name={isRTL ? "chevron-left" : "chevron-right"}
            size={18}
            color={colors.primary}
          />
        </View>
      </PressableScale>
    </View>
  );
}

function QuickRow({
  icon,
  label,
  value,
  expanded,
  onPress,
  rowDir,
  textAlign,
  children,
  last = false,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
  value: string;
  expanded: boolean;
  onPress: () => void;
  rowDir: "row" | "row-reverse";
  textAlign: "left" | "right";
  children: React.ReactNode;
  last?: boolean;
}) {
  const colors = useColors();
  return (
    <View className={last ? "" : "border-b border-border"}>
      <PressableScale onPress={onPress}>
        <View className="items-center gap-3 px-4 py-3" style={{ flexDirection: rowDir }}>
          <MaterialIcons name={icon} size={18} color={colors.muted} />
          <Text className="text-xs text-muted flex-1" style={{ textAlign }} numberOfLines={1}>
            {label}
          </Text>
          <Text className="text-xs font-semibold text-foreground" numberOfLines={1}>
            {value}
          </Text>
          <MaterialIcons
            name={expanded ? "expand-less" : "expand-more"}
            size={18}
            color={colors.muted}
          />
        </View>
      </PressableScale>
      {expanded && <View className="px-4 pb-3">{children}</View>}
    </View>
  );
}
