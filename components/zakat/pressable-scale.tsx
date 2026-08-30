// Primary press feedback: gentle scale + optional haptic.
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, type PressableProps, ViewStyle, StyleProp } from "react-native";

interface PressableScaleProps
  extends Omit<PressableProps, "children" | "disabled" | "hitSlop" | "onPress" | "style"> {
  onPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
  disabled?: boolean;
  hitSlop?: PressableProps["hitSlop"];
}

export function PressableScale({
  onPress,
  children,
  style,
  haptic = false,
  disabled = false,
  hitSlop,
  ...pressableProps
}: PressableScaleProps) {
  return (
    <Pressable
      {...pressableProps}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={() => {
        if (haptic && Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        onPress?.();
      }}
      style={({ pressed }) => [
        style,
        pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
        disabled && { opacity: 0.5 },
      ]}
    >
      {children}
    </Pressable>
  );
}
