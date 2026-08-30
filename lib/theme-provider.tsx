import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, View, useColorScheme as useSystemColorScheme } from "react-native";
import { colorScheme as nativewindColorScheme, vars } from "nativewind";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { SchemeColors, type ColorScheme } from "@/constants/theme";

export type ThemePreference = "system" | "light" | "dark";
const THEME_PREF_KEY = "zakat-theme-preference";

type ThemeContextValue = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme() ?? "light";
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("system");
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(systemScheme);

  const applyScheme = useCallback((scheme: ColorScheme) => {
    nativewindColorScheme.set(scheme);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.dataset.theme = scheme;
      root.classList.toggle("dark", scheme === "dark");
      const palette = SchemeColors[scheme];
      Object.entries(palette).forEach(([token, value]) => {
        root.style.setProperty(`--color-${token}`, value);
      });
    }
  }, []);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    applyScheme(scheme);
  }, [applyScheme]);

  // Load persisted preference once
  useEffect(() => {
    AsyncStorage.getItem(THEME_PREF_KEY)
      .then((raw) => {
        if (raw === "light" || raw === "dark" || raw === "system") {
          setThemePreferenceState(raw);
        }
      })
      .catch(() => {});
  }, []);

  const setThemePreference = useCallback(
    (pref: ThemePreference) => {
      setThemePreferenceState(pref);
      AsyncStorage.setItem(THEME_PREF_KEY, pref).catch(() => {});
    },
    [],
  );

  // Resolve effective scheme whenever preference or system scheme changes
  useEffect(() => {
    const effective: ColorScheme = themePreference === "system" ? systemScheme : themePreference;
    setColorSchemeState(effective);
  }, [themePreference, systemScheme]);

  // Keep following OS changes live while on "system"
  useEffect(() => {
    if (themePreference !== "system") return;
    const sub = Appearance.addChangeListener(({ colorScheme: cs }) => {
      setColorSchemeState((cs ?? "light") as ColorScheme);
    });
    return () => sub.remove();
  }, [themePreference]);

  useEffect(() => {
    applyScheme(colorScheme);
  }, [applyScheme, colorScheme]);

  const themeVariables = useMemo(
    () =>
      vars({
        "color-primary": SchemeColors[colorScheme].primary,
        "color-background": SchemeColors[colorScheme].background,
        "color-surface": SchemeColors[colorScheme].surface,
        "color-foreground": SchemeColors[colorScheme].foreground,
        "color-muted": SchemeColors[colorScheme].muted,
        "color-border": SchemeColors[colorScheme].border,
        "color-success": SchemeColors[colorScheme].success,
        "color-warning": SchemeColors[colorScheme].warning,
        "color-error": SchemeColors[colorScheme].error,
        "color-gold": SchemeColors[colorScheme].gold,
      }),
    [colorScheme],
  );

  const value = useMemo(
    () => ({
      colorScheme,
      setColorScheme,
      themePreference,
      setThemePreference,
    }),
    [colorScheme, setColorScheme, themePreference, setThemePreference],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, themeVariables]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return ctx;
}
