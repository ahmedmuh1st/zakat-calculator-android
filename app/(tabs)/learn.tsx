// Learn tab: one scroll — learn cards on top, "More FAQs" section below (searchable, offline).
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, ScrollView, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { PressableScale } from "@/components/zakat/pressable-scale";
import { useColors } from "@/hooks/use-colors";
import { useLayout } from "@/hooks/use-layout";
import { FAQ_CATEGORIES, FAQ_ITEMS, FaqCategory, FaqItem } from "@/lib/content/faq";
import { faqAnswer, faqCategoryLabel, faqQuestion, learnBody, learnTitle } from "@/lib/content/resolve";
import { LEARN_CARDS, LearnCard } from "@/lib/content/zakatonomics";
import type { LocaleCode } from "@/lib/i18n/locales";
import { useStore } from "@/lib/store";

export default function Learn() {
  const { settings, t, isRTL, dispatch } = useStore();
  const colors = useColors();
  const { listContentStyle } = useLayout();
  const lang = settings.language;
  const textAlign = isRTL ? ("right" as const) : ("left" as const);
  const rowDir = isRTL ? "flex-row-reverse" : "flex-row";
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<FaqCategory | "all">("all");

  // Category screens deep-link in with ?topic=<FaqCategory> so "see all questions"
  // lands on the relevant filter instead of the full list. `nonce` changes on every
  // navigation, so tapping through twice still re-applies the filter after the user
  // has changed it by hand.
  const params = useLocalSearchParams<{ topic?: string; nonce?: string }>();
  const topicParam = params.topic;
  const nonce = params.nonce;
  useEffect(() => {
    if (!topicParam) return;
    if (FAQ_CATEGORIES.some((c) => c.id === topicParam)) {
      setCat(topicParam as FaqCategory);
      setQuery("");
    }
  }, [topicParam, nonce]);

  // A first-time visitor gets a one-off nudge onward to the calculator. Recording the
  // visit here (rather than in onboarding) means the note only disappears once the
  // screen has actually been seen.
  const isFirstVisit = !settings.hasSeenLearn;
  useEffect(() => {
    if (isFirstVisit) dispatch({ type: "setSettings", payload: { hasSeenLearn: true } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ_ITEMS.filter((item) => {
      if (cat !== "all" && item.category !== cat) return false;
      if (!q) return true;
      const hay = [item.q.en, item.q.ar, item.a.en, item.a.ar, ...item.keywords].join(" ").toLowerCase();
      return q.split(/\s+/).every((word) => hay.includes(word));
    });
  }, [query, cat]);

  return (
    <ScreenContainer>
      <FlatList
        data={results}
        keyExtractor={(f) => f.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[{ paddingHorizontal: 20, paddingBottom: 24 }, listContentStyle]}
        ListHeaderComponent={
          <View>
            {/* One-off welcome nudge, shown only on the first visit after onboarding */}
            {isFirstVisit && (
              <View className="mt-3 rounded-2xl p-4" style={{ backgroundColor: colors.primary + "14" }}>
                <Text className="text-[13px] leading-5 text-foreground" style={{ textAlign }}>
                  {t.learnFirstNote}
                </Text>
                <PressableScale onPress={() => router.replace("/(tabs)")} style={{ marginTop: 10 }}>
                  <View
                    className="rounded-xl items-center justify-center"
                    style={{ minHeight: 44, backgroundColor: colors.primary }}
                  >
                    <Text className="text-sm font-bold" style={{ color: "#FFFFFF" }}>
                      {t.goToCalculator}
                    </Text>
                  </View>
                </PressableScale>
              </View>
            )}
            {/* Learn section on top */}
            <Text className="text-2xl font-bold text-foreground pt-2" style={{ textAlign }}>
              {t.learn}
            </Text>
            <Text className="text-sm text-muted mt-0.5 mb-3" style={{ textAlign }}>
              {t.learnSubtitle}
            </Text>
            {LEARN_CARDS.map((card) => (
              <Card key={card.id} card={card} lang={lang} isRTL={isRTL} textAlign={textAlign} />
            ))}
            {/* More FAQs section below, same design language */}
            <Text className="text-2xl font-bold text-foreground mt-6" style={{ textAlign }}>
              {t.moreFaqs}
            </Text>
            <View className="mt-3">
              {/* Search box */}
              <View
                className={`${rowDir} items-center gap-2 bg-surface border border-border rounded-2xl px-3`}
                style={{ minHeight: 46 }}
              >
                <MaterialIcons name="search" size={20} color={colors.muted} />
                <TextInput
                  className="flex-1 text-[14px] text-foreground py-2.5"
                  style={{ textAlign }}
                  placeholder={t.faqSearch}
                  placeholderTextColor={colors.muted}
                  value={query}
                  onChangeText={setQuery}
                  returnKeyType="search"
                />
                {query.length > 0 && (
                  <PressableScale onPress={() => setQuery("")} hitSlop={8}>
                    <MaterialIcons name="close" size={18} color={colors.muted} />
                  </PressableScale>
                )}
              </View>
              {/* Category chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 10, marginBottom: 12, flexDirection: isRTL ? "row-reverse" : "row" }}
              >
                {[{ id: "all" as const, en: t.faqAll, ar: t.faqAll }, ...FAQ_CATEGORIES].map((c) => {
                  const active = cat === c.id;
                  return (
                    <PressableScale key={c.id} onPress={() => setCat(c.id as FaqCategory | "all")} style={{ marginRight: 8 }}>
                      <View
                        className="rounded-full px-3.5 py-1.5 border"
                        style={{
                          backgroundColor: active ? colors.primary : colors.surface,
                          borderColor: active ? colors.primary : colors.border,
                        }}
                      >
                        <Text className="text-[12.5px] font-bold" style={{ color: active ? "#FFFFFF" : colors.muted }}>
                          {c.id === "all" ? c.en : faqCategoryLabel(c, lang)}
                        </Text>
                      </View>
                    </PressableScale>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text className="text-sm text-muted text-center mt-8 px-6 leading-6">{t.faqEmpty}</Text>
        }
        ListFooterComponent={
          results.length > 0 ? (
            <Text className="text-[11.5px] text-muted mt-4 leading-5" style={{ textAlign }}>
              {t.faqDisclaimer}
            </Text>
          ) : null
        }
        renderItem={({ item }) => <FaqCard item={item} lang={lang} isRTL={isRTL} textAlign={textAlign} />}
      />
    </ScreenContainer>
  );
}

function FaqCard({
  item,
  lang,
  isRTL,
  textAlign,
}: {
  item: FaqItem;
  lang: LocaleCode;
  isRTL: boolean;
  textAlign: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const rowDir = isRTL ? "flex-row-reverse" : "flex-row";
  return (
    <PressableScale onPress={() => setOpen((o) => !o)} style={{ marginBottom: 10 }}>
      <View className="bg-surface border border-border rounded-2xl p-4">
        <View className={`${rowDir} items-center gap-3`}>
          <Text className="flex-1 text-[14.5px] font-bold text-foreground leading-6" style={{ textAlign }}>
            {faqQuestion(item, lang)}
          </Text>
          <MaterialIcons name={open ? "expand-less" : "expand-more"} size={22} color="#9AA5A0" />
        </View>
        {open && (
          <Text className="text-[13.5px] leading-6 text-foreground mt-3" style={{ textAlign }}>
            {faqAnswer(item, lang)}
          </Text>
        )}
      </View>
    </PressableScale>
  );
}

function Card({
  card,
  lang,
  isRTL,
  textAlign,
}: {
  card: LearnCard;
  lang: LocaleCode;
  isRTL: boolean;
  textAlign: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const rowDir = isRTL ? "flex-row-reverse" : "flex-row";
  return (
    <PressableScale onPress={() => setOpen((o) => !o)} style={{ marginBottom: 12 }}>
      <View className="bg-surface border border-border rounded-2xl overflow-hidden">
        <View className="h-1" style={{ backgroundColor: card.color }} />
        <View className="p-4">
          <View className={`${rowDir} items-center gap-3`}>
            <View
              className="items-center justify-center rounded-xl"
              style={{ width: 38, height: 38, backgroundColor: card.color + "1C" }}
            >
              <MaterialIcons name={card.icon as any} size={20} color={card.color} />
            </View>
            <Text className="flex-1 text-[15px] font-bold text-foreground" style={{ textAlign }}>
              {learnTitle(card, lang)}
            </Text>
            <MaterialIcons name={open ? "expand-less" : "expand-more"} size={22} color="#9AA5A0" />
          </View>
          {open && (
            <Text className="text-[13.5px] leading-6 text-foreground mt-3" style={{ textAlign }}>
              {learnBody(card, lang)}
            </Text>
          )}
        </View>
      </View>
    </PressableScale>
  );
}
