import { Redirect, Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useStore } from "@/lib/store";
import { TAB_ORDER, visualTabOrder, type TabName } from "@/lib/tab-order";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, hydrated, settings, isRTL } = useStore();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 10);
  const tabBarHeight = 62 + bottomPadding;

  // After a full app reset (or first launch), bounce to onboarding from ANY tab.
  // This is the reliable path — imperative router.replace inside Alert callbacks
  // can silently fail on native.
  if (hydrated && !settings.onboarded) {
    return <Redirect href="/onboarding" />;
  }

  // The tab strip is drawn by React Navigation, which follows the SYSTEM writing
  // direction rather than the app's language setting. Because the app never calls
  // I18nManager.forceRTL (see V3 item 2 in NEW-VERSIONS-PLAN.md), an Arabic UI on an
  // LTR system locale left the calculator tab on the far left while every other
  // screen mirrored correctly.
  //
  // Declaration order IS visual order for Tabs.Screen children, so declaring the
  // screens reversed in Arabic puts the calculator back on the right. Two details
  // matter: initialRouteName must be pinned, since the first declared screen is
  // otherwise the default route, and the reversal must operate on a copy so the
  // canonical order is not corrupted after the first render. Both are handled in
  // lib/tab-order.ts. This mirrors the contained fix the iOS session shipped;
  // it is not native RTL.
  const tabs = visualTabOrder(isRTL);

  const icons: Record<TabName, Parameters<typeof IconSymbol>[0]["name"]> = {
    index: "house.fill",
    history: "clock.fill",
    learn: "book.fill",
    settings: "gearshape.fill",
  };

  const titles: Record<TabName, string> = {
    index: t.tabHome,
    history: t.tabHistory,
    learn: t.tabLearn,
    settings: t.tabSettings,
  };

  return (
    <Tabs
      initialRouteName={TAB_ORDER[0]}
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontSize: 11,
          lineHeight: 16,
          fontWeight: "600",
          paddingBottom: 1,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
        tabBarStyle: {
          paddingTop: 6,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      {tabs.map((name) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: titles[name],
            tabBarIcon: ({ color }) => <IconSymbol size={26} name={icons[name]} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
