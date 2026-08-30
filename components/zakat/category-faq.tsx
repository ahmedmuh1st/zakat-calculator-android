import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Text, View } from "react-native";

import { PressableScale } from "@/components/zakat/pressable-scale";
import { useColors } from "@/hooks/use-colors";
import { faqForCategory, primaryFaqTopic } from "@/lib/content/category-faq";
import { faqAnswer, faqQuestion } from "@/lib/content/resolve";
import { useStore } from "@/lib/store";
import type { CategoryId } from "@/lib/zakat/types";

/**
 * Contextual FAQ block shown inside a category screen.
 *
 * Answers come from the same curated FAQ list the Learn tab uses, so there is one
 * source of content. Questions start collapsed to keep the calculator the focus, and
 * "see all" deep-links into the Learn tab already filtered to the right topic.
 */
export function CategoryFaq({ categoryId, accent }: { categoryId: CategoryId; accent: string }) {
  const { settings, t, isRTL } = useStore();
  const colors = useColors();
  const lang = settings.language;
  const textAlign = isRTL ? ("right" as const) : ("left" as const);
  const rowDir = isRTL ? "flex-row-reverse" : "flex-row";
  const items = useMemo(() => faqForCategory(categoryId), [categoryId]);

  if (items.length === 0) return null;

  const openAll = () => {
    router.push({
      pathname: "/(tabs)/learn",
      params: { topic: primaryFaqTopic(categoryId), nonce: String(Date.now()) },
    });
  };

  return (
    <View className="mx-5 mt-4">
      <View className={`${rowDir} items-center justify-between mb-2`}>
        <Text className="text-xs font-bold text-muted" style={{ textAlign }}>
          {t.relatedQuestions}
        </Text>
        <PressableScale onPress={openAll} hitSlop={8}>
          <View className={`${rowDir} items-center gap-1`}>
            <Text className="text-xs font-bold" style={{ color: accent }}>
              {t.seeAllQuestions}
            </Text>
            <MaterialIcons
              name={isRTL ? "chevron-left" : "chevron-right"}
              size={14}
              color={accent}
            />
          </View>
        </PressableScale>
      </View>
      <View className="gap-2">
        {items.map((item) => (
          <FaqRow
            key={item.id}
            q={faqQuestion(item, lang)}
            a={faqAnswer(item, lang)}
            accent={accent}
            rowDir={rowDir}
            textAlign={textAlign}
            borderColor={colors.border}
            mutedColor={colors.muted}
          />
        ))}
      </View>
    </View>
  );
}

function FaqRow({
  q,
  a,
  accent,
  rowDir,
  textAlign,
  borderColor,
  mutedColor,
}: {
  q: string;
  a: string;
  accent: string;
  rowDir: string;
  textAlign: "left" | "right";
  borderColor: string;
  mutedColor: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <PressableScale onPress={() => setOpen((o) => !o)}>
      <View className="bg-surface border rounded-2xl px-4 py-3" style={{ borderColor }}>
        <View className={`${rowDir} items-center gap-2`}>
          <Text className="text-[13px] font-semibold text-foreground flex-1" style={{ textAlign }}>
            {q}
          </Text>
          <MaterialIcons
            name={open ? "expand-less" : "expand-more"}
            size={20}
            color={open ? accent : mutedColor}
          />
        </View>
        {open && (
          <Text className="text-[13px] leading-5 text-muted mt-2" style={{ textAlign }}>
            {a}
          </Text>
        )}
      </View>
    </PressableScale>
  );
}
