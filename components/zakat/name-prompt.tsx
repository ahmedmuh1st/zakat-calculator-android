// Single-field naming dialog, used when saving a calculation to History.
//
// Built on the same Modal pattern as ConfirmProvider rather than Alert.prompt,
// which does not exist on Android at all and proved unreliable in Expo Go.
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Modal, Text, TextInput, View } from "react-native";

import { PressableScale } from "@/components/zakat/pressable-scale";
import { useColors } from "@/hooks/use-colors";
import { CALC_NAME_MAX_LENGTH, normalizeCalcName } from "@/lib/zakat/calc-name";

interface PromptOptions {
  title: string;
  message: string;
  /** Pre-filled, pre-selected suggestion, e.g. "Zakat Ramadan 1447". */
  initialValue: string;
  placeholder: string;
  confirmLabel: string;
  cancelLabel: string;
  isRTL: boolean;
}

/** Resolves to the cleaned name, or null when the user cancels. */
type PromptFn = (opts: PromptOptions) => Promise<string | null>;

const PromptContext = createContext<PromptFn | null>(null);

export function NamePromptProvider({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const [opts, setOpts] = useState<PromptOptions | null>(null);
  const [value, setValue] = useState("");
  const resolverRef = useRef<((v: string | null) => void) | null>(null);

  const prompt = useCallback<PromptFn>((options) => {
    return new Promise<string | null>((resolve) => {
      resolverRef.current = resolve;
      setValue(options.initialValue);
      setOpts(options);
    });
  }, []);

  const settle = (result: string | null) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOpts(null);
  };

  // An unmount mid-prompt would otherwise leave the caller awaiting forever.
  useEffect(() => {
    return () => resolverRef.current?.(null);
  }, []);

  const submit = () => {
    // An empty name is valid input: callers fall back to the Hijri label.
    settle(normalizeCalcName(value) ?? "");
  };

  return (
    <PromptContext.Provider value={prompt}>
      {children}
      <Modal visible={opts != null} transparent animationType="fade" onRequestClose={() => settle(null)}>
        <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          {opts && (
            <View className="w-full max-w-sm bg-background rounded-3xl p-6">
              <Text className="text-lg font-bold text-foreground text-center">{opts.title}</Text>
              {opts.message ? (
                <Text className="text-sm leading-5 text-muted text-center mt-2">{opts.message}</Text>
              ) : null}
              <TextInput
                value={value}
                onChangeText={setValue}
                placeholder={opts.placeholder}
                placeholderTextColor={colors.muted}
                maxLength={CALC_NAME_MAX_LENGTH}
                autoFocus
                selectTextOnFocus
                returnKeyType="done"
                onSubmitEditing={submit}
                className="mt-4 rounded-2xl px-4 py-3 bg-surface border border-border text-base text-foreground"
                style={{
                  textAlign: opts.isRTL ? "right" : "left",
                  writingDirection: opts.isRTL ? "rtl" : "ltr",
                }}
              />
              <PressableScale onPress={submit} haptic style={{ marginTop: 16 }}>
                <View className="rounded-2xl py-3.5 items-center" style={{ backgroundColor: colors.primary }}>
                  <Text className="text-white text-sm font-bold">{opts.confirmLabel}</Text>
                </View>
              </PressableScale>
              <PressableScale onPress={() => settle(null)} style={{ marginTop: 10 }}>
                <View className="rounded-2xl py-3.5 items-center border border-border bg-surface">
                  <Text className="text-sm font-bold text-foreground">{opts.cancelLabel}</Text>
                </View>
              </PressableScale>
            </View>
          )}
        </View>
      </Modal>
    </PromptContext.Provider>
  );
}

export function useNamePrompt(): PromptFn {
  const ctx = useContext(PromptContext);
  if (!ctx) throw new Error("useNamePrompt must be used inside NamePromptProvider");
  return ctx;
}
