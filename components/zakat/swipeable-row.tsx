// A line item that reveals Edit and Delete actions when swiped in either
// direction. Both directions expose both actions so the gesture works
// identically in RTL and LTR without the user having to learn a side.
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useRef } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useColors } from "@/hooks/use-colors";

/** Width of the action tray revealed behind the row. */
const ACTION_WIDTH = 132;
/** Drag distance past which the tray snaps open instead of springing back. */
const OPEN_THRESHOLD = 46;

export interface SwipeableRowProps {
  children: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  editLabel: string;
  deleteLabel: string;
  /** Disables the gesture, e.g. while this row is being edited. */
  disabled?: boolean;
}

export function SwipeableRow({
  children,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
  disabled = false,
}: SwipeableRowProps) {
  const colors = useColors();
  const translateX = useSharedValue(0);
  const startX = useRef(0);

  const close = useCallback(() => {
    translateX.value = withTiming(0, { duration: 160 });
  }, [translateX]);

  const tapFeedback = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleEdit = useCallback(() => {
    close();
    tapFeedback();
    onEdit();
  }, [close, onEdit, tapFeedback]);

  const handleDelete = useCallback(() => {
    close();
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDelete();
  }, [close, onDelete]);

  const pan = Gesture.Pan()
    .enabled(!disabled)
    // Only claim the gesture once the drag is clearly horizontal, so vertical
    // scrolling through a long list still works.
    .activeOffsetX([-12, 12])
    .failOffsetY([-14, 14])
    .onStart(() => {
      startX.current = translateX.value;
    })
    .onUpdate((e) => {
      const next = startX.current + e.translationX;
      // Clamp so the row can never be dragged further than the tray width.
      translateX.value = Math.max(-ACTION_WIDTH, Math.min(ACTION_WIDTH, next));
    })
    .onEnd(() => {
      const x = translateX.value;
      if (x <= -OPEN_THRESHOLD) {
        translateX.value = withSpring(-ACTION_WIDTH, { damping: 20, stiffness: 220 });
        runOnJS(tapFeedback)();
      } else if (x >= OPEN_THRESHOLD) {
        translateX.value = withSpring(ACTION_WIDTH, { damping: 20, stiffness: 220 });
        runOnJS(tapFeedback)();
      } else {
        translateX.value = withTiming(0, { duration: 160 });
      }
    })
    .runOnJS(true);

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Each tray fades in only while the row is dragged towards it.
  const leftTrayStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 8 ? 1 : 0,
  }));
  const rightTrayStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -8 ? 1 : 0,
  }));

  const actions = (
    <>
      <Pressable
        onPress={handleEdit}
        accessibilityRole="button"
        accessibilityLabel={editLabel}
        style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
      >
        <MaterialIcons name="edit" size={20} color={colors.primary} />
        <Text style={[styles.actionLabel, { color: colors.primary }]}>{editLabel}</Text>
      </Pressable>
      <Pressable
        onPress={handleDelete}
        accessibilityRole="button"
        accessibilityLabel={deleteLabel}
        style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
      >
        <MaterialIcons name="delete-outline" size={20} color={colors.error} />
        <Text style={[styles.actionLabel, { color: colors.error }]}>{deleteLabel}</Text>
      </Pressable>
    </>
  );

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.tray, styles.trayLeft, leftTrayStyle]} pointerEvents="box-none">
        {actions}
      </Animated.View>
      <Animated.View style={[styles.tray, styles.trayRight, rightTrayStyle]} pointerEvents="box-none">
        {actions}
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    marginBottom: 8,
  },
  tray: {
    position: "absolute",
    top: 0,
    bottom: 8,
    width: ACTION_WIDTH,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  trayLeft: {
    left: 0,
  },
  trayRight: {
    right: 0,
  },
  action: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 8,
    minWidth: 56,
    minHeight: 44,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
});
