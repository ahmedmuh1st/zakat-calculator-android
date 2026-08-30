import "@/global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text, TextInput } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";

import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import { StoreProvider } from "@/lib/store";
import { ConfirmProvider } from "@/components/zakat/confirm-sheet";
import { NamePromptProvider } from "@/components/zakat/name-prompt";
import { PaymentProvider } from "@/components/zakat/payment-sheet";

interface TextWithDefaultProps { defaultProps?: { maxFontSizeMultiplier?: number } }
const TextAny = Text as unknown as TextWithDefaultProps;
const TextInputAny = TextInput as unknown as TextWithDefaultProps;
TextAny.defaultProps = { ...(TextAny.defaultProps ?? {}), maxFontSizeMultiplier: 1.2 };
TextInputAny.defaultProps = { ...(TextInputAny.defaultProps ?? {}), maxFontSizeMultiplier: 1.2 };

export const unstable_settings = { anchor: "(tabs)" };

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StoreProvider>
            <ConfirmProvider>
              <NamePromptProvider>
                <PaymentProvider>
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      gestureEnabled: true,
                      fullScreenGestureEnabled: true,
                    }}
                  >
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="onboarding" />
                    <Stack.Screen name="category/[id]" />
                    <Stack.Screen name="deductions" />
                    <Stack.Screen name="summary" />
                  </Stack>
                  <StatusBar style="auto" />
                </PaymentProvider>
              </NamePromptProvider>
            </ConfirmProvider>
          </StoreProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
