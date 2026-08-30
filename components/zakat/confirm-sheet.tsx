// In-app confirmation dialog (Modal-based). Replaces native Alert.alert, which
// proved unreliable on the user's device in Expo Go (callbacks never fired).
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Modal, Text, View } from "react-native";

import { PressableScale } from "@/components/zakat/pressable-scale";
import { useColors } from "@/hooks/use-colors";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Destructive styling for the confirm button (default true). */
  destructive?: boolean;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setOpts(options);
    });
  }, []);

  const settle = (value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setOpts(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal visible={opts != null} transparent animationType="fade" onRequestClose={() => settle(false)}>
        <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          {opts && (
            <View className="w-full max-w-sm bg-background rounded-3xl p-6">
              <Text className="text-lg font-bold text-foreground text-center">{opts.title}</Text>
              {opts.message ? (
                <Text className="text-sm leading-5 text-muted text-center mt-2">{opts.message}</Text>
              ) : null}
              <PressableScale onPress={() => settle(true)} haptic style={{ marginTop: 20 }}>
                <View
                  className="rounded-2xl py-3.5 items-center"
                  style={{ backgroundColor: opts.destructive === false ? colors.primary : colors.error }}
                >
                  <Text className="text-white text-sm font-bold">{opts.confirmLabel}</Text>
                </View>
              </PressableScale>
              <PressableScale onPress={() => settle(false)} style={{ marginTop: 10 }}>
                <View className="rounded-2xl py-3.5 items-center border border-border bg-surface">
                  <Text className="text-sm font-bold text-foreground">{opts.cancelLabel}</Text>
                </View>
              </PressableScale>
            </View>
          )}
        </View>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}

