// Searchable full-screen currency picker modal with flags and localized names.
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Modal, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/zakat/pressable-scale";
import { useColors } from "@/hooks/use-colors";
import type { LocaleCode } from "@/lib/i18n/locales";
import { ALL_CURRENCIES, CurrencyInfo, currencyByCode, searchCurrencies } from "@/lib/zakat/currencies";

interface CurrencyPickerProps {
  label: string;
  value: string;
  isRTL: boolean;
  lang: LocaleCode;
  searchPlaceholder: string;
  onSelect: (code: string) => void;
  /** Pin these codes to the top of the unfiltered list (e.g. base currency). */
  pinned?: string[];
  /** Compact trigger: a small side button (flag + code) instead of a full-width row. */
  compact?: boolean;
  /**
   * Opens the list from outside the component. Used when a language change leaves the
   * currency ambiguous, so the app asks rather than guesses.
   */
  openSignal?: boolean;
  onOpenSignalHandled?: () => void;
}

export function CurrencyPicker({ label, value, isRTL, lang, searchPlaceholder, onSelect, pinned = [], compact = false, openSignal = false, onOpenSignalHandled }: CurrencyPickerProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // A parent raising openSignal opens the modal once, then clears the signal so closing
  // the sheet does not immediately reopen it.
  useEffect(() => {
    if (openSignal) {
      setOpen(true);
      onOpenSignalHandled?.();
    }
  }, [openSignal, onOpenSignalHandled]);

  const selected = currencyByCode(value);
  const rowDir = isRTL ? "flex-row-reverse" : "flex-row";
  const textAlign = isRTL ? ("right" as const) : ("left" as const);

  const data = useMemo(() => {
    const results = searchCurrencies(query);
    if (query.trim()) return results;
    const pinnedItems = pinned.map((c) => currencyByCode(c)).filter((c): c is CurrencyInfo => !!c);
    const rest = ALL_CURRENCIES.filter((c) => !pinned.includes(c.code));
    return [...pinnedItems, ...rest];
  }, [query, pinned]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      {compact ? (
        <PressableScale onPress={() => setOpen(true)} hitSlop={4}>
          <View
            className={`${rowDir} items-center gap-0.5 bg-background border border-border rounded-xl px-2.5`}
            style={{ minHeight: 48, justifyContent: "center" }}
          >
            <Text className="text-xs font-bold text-foreground">
              {selected ? `${selected.flag} ${selected.code}` : value}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={16} color={colors.muted} />
          </View>
        </PressableScale>
      ) : (
        <PressableScale onPress={() => setOpen(true)}>
          <View
            className={`${rowDir} items-center justify-between bg-background border border-border rounded-xl px-3.5`}
            style={{ minHeight: 48 }}
          >
            <Text className="text-xs text-muted">{label}</Text>
            <View className={`${rowDir} items-center gap-1.5`}>
              <Text className="text-sm font-bold text-foreground">
                {selected ? `${selected.flag} ${selected.code}` : value}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={20} color={colors.muted} />
            </View>
          </View>
        </PressableScale>
      )}

      <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 8 }}>
          {/* Header */}
          <View className={`${rowDir} items-center gap-3 px-5 pb-3`}>
            <PressableScale onPress={close} hitSlop={8}>
              <View className="w-9 h-9 rounded-full bg-surface border border-border items-center justify-center">
                <MaterialIcons name="close" size={20} color={colors.foreground} />
              </View>
            </PressableScale>
            <Text className="flex-1 text-lg font-bold text-foreground" style={{ textAlign }}>
              {label}
            </Text>
          </View>

          {/* Search box */}
          <View className="px-5 pb-3">
            <View className={`${rowDir} items-center gap-2 bg-surface border border-border rounded-xl px-3.5`}>
              <MaterialIcons name="search" size={20} color={colors.muted} />
              <TextInput
                className="flex-1 text-foreground"
                placeholder={searchPlaceholder}
                placeholderTextColor={colors.muted}
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
                autoCapitalize="none"
                style={{ textAlign, minHeight: 48, paddingVertical: 12 }}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <PressableScale onPress={() => setQuery("")} hitSlop={8}>
                  <MaterialIcons name="cancel" size={18} color={colors.muted} />
                </PressableScale>
              )}
            </View>
          </View>

          <FlatList
            data={data}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 16 }}
            renderItem={({ item }) => {
              const isSelected = item.code === value;
              return (
                <PressableScale
                  onPress={() => {
                    onSelect(item.code);
                    close();
                  }}
                >
                  <View
                    className={`${rowDir} items-center gap-3 rounded-xl px-3.5 py-3 mb-1 border`}
                    style={{
                      backgroundColor: isSelected ? colors.primary + "14" : "transparent",
                      borderColor: isSelected ? colors.primary : "transparent",
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{item.flag}</Text>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-foreground" style={{ textAlign }}>
                        {item.code}
                      </Text>
                      <Text className="text-xs text-muted mt-0.5" style={{ textAlign }}>
                        {lang === "ar" ? item.ar : item.en}
                      </Text>
                    </View>
                    {isSelected && <MaterialIcons name="check-circle" size={20} color={colors.primary} />}
                  </View>
                </PressableScale>
              );
            }}
          />
        </View>
      </Modal>
    </>
  );
}
