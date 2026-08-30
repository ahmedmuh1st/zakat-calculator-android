// Cross-platform confirmation dialog: native Alert on iOS/Android, window.confirm on web.
import { Alert, Platform } from "react-native";

export async function confirmDialog(title: string, message: string, confirmLabel: string, cancelLabel: string): Promise<boolean> {
  if (Platform.OS === "web") {
    // eslint-disable-next-line no-alert
    return typeof window !== "undefined" && window.confirm(`${title}\n\n${message}`);
  }
  // Defer to the next tick — calling Alert.alert synchronously inside a press
  // handler can be swallowed on iOS while the press animation is in flight.
  await new Promise((r) => setTimeout(r, 0));
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: "cancel", onPress: () => resolve(false) },
        { text: confirmLabel, style: "destructive", onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
