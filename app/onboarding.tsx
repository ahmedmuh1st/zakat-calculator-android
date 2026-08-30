// 3-slide onboarding: what the app is, privacy, set Zakat anniversary (Hijri).
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { FlatList, Modal, ScrollView, Text, useWindowDimensions, View } from "react-native";

import { PressableScale } from "@/components/zakat/pressable-scale";
import { StarPattern } from "@/components/zakat/star-pattern";
import { useLayout } from "@/hooks/use-layout";
import { useStore } from "@/lib/store";
import { LOCALES } from "@/lib/i18n/locales";
import { hijriMonthName, toHijri } from "@/lib/zakat/hijri";

export default function Onboarding() {
  const { t, isRTL, settings, dispatch } = useStore();
  const { width, height } = useWindowDimensions();
  const { contentMaxWidth } = useLayout();
  const [page, setPage] = useState(0);
  const listRef = useRef<FlatList>(null);
  const today = toHijri(new Date());
  const [month, setMonth] = useState(9); // Ramadan default
  const [day, setDay] = useState(1);

  const lang = settings.language;

  const slides = [
    { icon: "spa" as const, title: t.onb1Title, body: t.onb1Body },
    { icon: "volunteer-activism" as const, title: t.onb2Title, body: t.onb2Body },
    { icon: "event" as const, title: t.onb3Title, body: t.onb3Body },
  ];

  // RTL swipe support: in Arabic, render slides in reverse physical order so the
  // first slide sits at the far right and swiping RIGHT advances to the next one.
  const displaySlides = isRTL ? [...slides].reverse() : slides;
  const logicalToPhysical = (logical: number) => (isRTL ? slides.length - 1 - logical : logical);
  const physicalToLogical = (physical: number) => (isRTL ? slides.length - 1 - physical : physical);

  const finish = (withAnniversary: boolean) => {
    dispatch({
      type: "setSettings",
      payload: {
        onboarded: true,
        anniversary: withAnniversary ? { month, day } : null,
      },
    });
    // First launch lands on Learn rather than the calculator. Testers opened the app,
    // met nine categories and no sense of which applied to them. A short read first
    // makes the calculator legible. The tab order is untouched, so every later launch
    // still opens on the calculator.
    router.replace("/(tabs)/learn");
  };

  // When the language toggles, the physical slide order flips — keep the same
  // logical page in view.
  useEffect(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: logicalToPhysical(page), animated: false });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRTL]);

  const goNext = () => {
    if (page < slides.length - 1) {
      const next = page + 1;
      listRef.current?.scrollToIndex({ index: logicalToPhysical(next), animated: true });
      setPage(next);
    } else {
      finish(true);
    }
  };

  return (
    <LinearGradient colors={["#0F7B6C", "#123E33"]} style={{ flex: 1 }}>
      <StarPattern width={width} height={height} color="#FFFFFF" opacity={0.05} />

      {/* Language toggle */}
      {/* Seven locales overflow a centred pill row on a narrow phone, so this scrolls
          horizontally. Endonyms only: a first-time user picking Urdu is looking for اردو. */}
      <View className="mt-16">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 6 }}
        >
          {LOCALES.map((meta) => {
            const selected = settings.language === meta.code;
            return (
              <PressableScale
                key={meta.code}
                onPress={() => dispatch({ type: "setSettings", payload: { language: meta.code } })}
              >
                <View
                  className="px-4 py-1.5 rounded-full"
                  style={{
                    backgroundColor: selected ? "#FFFFFF" : "rgba(255,255,255,0.14)",
                  }}
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: selected ? "#0F7B6C" : "#FFFFFF" }}
                  >
                    {meta.endonym}
                  </Text>
                </View>
              </PressableScale>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        ref={listRef}
        data={displaySlides}
        keyExtractor={(s) => s.title}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={isRTL ? slides.length - 1 : 0}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        onMomentumScrollEnd={(e) =>
          setPage(physicalToLogical(Math.round(e.nativeEvent.contentOffset.x / width)))
        }
        renderItem={({ item, index }) => {
          const logicalIndex = physicalToLogical(index);
          const isPickerSlide = logicalIndex === 2;
          return (
          <View style={{ width }} className="items-center justify-center px-8">
            <View className="w-full items-center" style={{ maxWidth: contentMaxWidth }}>
            <View
              className="items-center justify-center rounded-full"
              style={{
                width: isPickerSlide ? 76 : 108,
                height: isPickerSlide ? 76 : 108,
                backgroundColor: "rgba(255,255,255,0.12)",
              }}
            >
              <MaterialIcons name={item.icon} size={isPickerSlide ? 38 : 52} color="#F3D48A" />
            </View>
            <Text className={`${isPickerSlide ? "text-2xl mt-5" : "text-3xl mt-8"} font-bold text-white text-center`}>
              {item.title}
            </Text>
            <Text
              className={`${isPickerSlide ? "text-sm mt-2 leading-5" : "text-base mt-4 leading-6"} text-center`}
              style={{ color: "rgba(255,255,255,0.82)" }}
            >
              {item.body}
            </Text>

            {/* Hijri anniversary picker on the last slide */}
            {logicalIndex === 2 && (
              <View className="mt-5 w-full">
                <View className={`${isRTL ? "flex-row-reverse" : "flex-row"} gap-3 justify-center`}>
                  {/* Month dropdown */}
                  <OnbPicker
                    label={t.month}
                    value={hijriMonthName(month, lang)}
                    options={Array.from({ length: 12 }, (_, i) => ({ label: hijriMonthName(i + 1, lang), value: i + 1 }))}
                    selected={month}
                    onSelect={setMonth}
                    isRTL={isRTL}
                  />
                  <OnbPicker
                    label={t.day}
                    value={String(day)}
                    options={Array.from({ length: 30 }, (_, i) => ({ label: String(i + 1), value: i + 1 }))}
                    selected={day}
                    onSelect={setDay}
                    isRTL={isRTL}
                  />
                </View>
                <Text className="text-xs text-center mt-2.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {t.hijriToday}: {today.day} {hijriMonthName(today.month, lang)} {today.year}
                </Text>
              </View>
            )}
            </View>
          </View>
          );
        }}
      />

      {/* Dots + actions */}
      <View className="items-center pb-12 px-8">
        <View className="w-full items-center" style={{ maxWidth: contentMaxWidth }}>
        <View className={`${isRTL ? "flex-row-reverse" : "flex-row"} gap-2 mb-5`}>
          {slides.map((_, i) => (
            <View
              key={i}
              className="rounded-full"
              style={{
                width: i === page ? 22 : 8,
                height: 8,
                backgroundColor: i === page ? "#F3D48A" : "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </View>
        <PressableScale onPress={goNext} haptic style={{ width: "100%" }}>
          <View className="bg-white rounded-2xl py-4 items-center">
            <Text className="text-base font-bold" style={{ color: "#0F7B6C" }}>
              {page === slides.length - 1 ? t.getStarted : t.next}
            </Text>
          </View>
        </PressableScale>
        {page === slides.length - 1 ? (
          <PressableScale onPress={() => finish(false)} style={{ marginTop: 12 }}>
            <Text className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
              {t.notSureYet}
            </Text>
          </PressableScale>
        ) : (
          <PressableScale onPress={() => finish(false)} style={{ marginTop: 12 }}>
            <Text className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
              {t.skip}
            </Text>
          </PressableScale>
        )}
        </View>
      </View>
    </LinearGradient>
  );
}

function OnbPicker({
  label,
  value,
  options,
  selected,
  onSelect,
  isRTL,
}: {
  label: string;
  value: string;
  options: { label: string; value: number }[];
  selected: number;
  onSelect: (v: number) => void;
  isRTL: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <PressableScale onPress={() => setOpen(true)} style={{ flex: 1, maxWidth: 170 }}>
        <View className="items-center rounded-2xl px-3 py-3" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
          <Text className="text-[11px] mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
            {label}
          </Text>
          <View className={`${isRTL ? "flex-row-reverse" : "flex-row"} items-center gap-1`}>
            <Text className="text-sm font-bold text-white" numberOfLines={1}>
              {value}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color="rgba(255,255,255,0.7)" />
          </View>
        </View>
      </PressableScale>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <PressableScale onPress={() => setOpen(false)} style={{ flex: 1 }}>
          <View className="flex-1 items-center justify-center px-10" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <View className="bg-white rounded-2xl w-full max-w-sm overflow-hidden" style={{ maxHeight: 420 }}>
              <ScrollView>
                {options.map((o) => (
                  <PressableScale
                    key={o.value}
                    onPress={() => {
                      onSelect(o.value);
                      setOpen(false);
                    }}
                  >
                    <View
                      className="px-5 py-3.5 border-b"
                      style={{
                        borderBottomColor: "#EEE9DC",
                        backgroundColor: o.value === selected ? "#0F7B6C14" : "transparent",
                      }}
                    >
                      <Text
                        className="text-base text-center"
                        style={{ color: o.value === selected ? "#0F7B6C" : "#333", fontWeight: o.value === selected ? "700" : "400" }}
                      >
                        {o.label}
                      </Text>
                    </View>
                  </PressableScale>
                ))}
              </ScrollView>
            </View>
          </View>
        </PressableScale>
      </Modal>
    </>
  );
}
