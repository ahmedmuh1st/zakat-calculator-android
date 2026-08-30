// In-app feedback: native rating prompt plus a direct write-to-me path.
//
// Privacy note: nothing here reports anything back to us. The rating prompt is
// the OS-provided one, and the "tell me what to fix" path just opens the user's
// own mail app. No analytics, no event logging, consistent with the app's
// privacy stance.
//
// Store guidance (Apple HIG and Play Core) says the rating card must not be
// triggered by a button and must not be preceded by a qualifying question. So
// the native prompt fires after a genuinely positive moment (a saved
// calculation), and the explicit Settings entry point sends people to the store
// listing rather than invoking the card.
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as StoreReview from "expo-store-review";
import { Linking, Platform } from "react-native";

const ASKED_KEY = "zakat.review.lastAskedAt";
const SAVE_COUNT_KEY = "zakat.review.saveCount";

/** Ask at most twice a year, well inside what both stores tolerate. */
const MIN_DAYS_BETWEEN_ASKS = 180;
/** Only after the user has actually finished something twice. */
const MIN_SAVES_BEFORE_ASK = 2;

function packageName(): string | undefined {
  return Constants.expoConfig?.android?.package;
}

/** Public store listing URL, used by the explicit Settings entry point. */
export function storeListingUrl(): string | null {
  if (Platform.OS === "android") {
    const pkg = packageName();
    return pkg ? `https://play.google.com/store/apps/details?id=${pkg}` : null;
  }
  if (Platform.OS === "ios") {
    // Filled in once the App Store listing is live; until then fall back to
    // whatever the config exposes.
    const url = Constants.expoConfig?.ios?.appStoreUrl;
    return url ? `${url}?action=write-review` : null;
  }
  return null;
}

/** Opens the store listing so the user can leave a rating themselves. */
export async function openStoreListing(): Promise<boolean> {
  const url = storeListingUrl();
  if (!url) return false;
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Records that the user completed a calculation, and fires the native rating
 * card if the moment qualifies. Safe to call unconditionally; it does nothing
 * on web, in TestFlight, or when asked too recently.
 */
export async function noteCalculationSaved(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const rawCount = await AsyncStorage.getItem(SAVE_COUNT_KEY);
    const count = (rawCount ? parseInt(rawCount, 10) || 0 : 0) + 1;
    await AsyncStorage.setItem(SAVE_COUNT_KEY, String(count));
    if (count < MIN_SAVES_BEFORE_ASK) return;

    const lastAsked = await AsyncStorage.getItem(ASKED_KEY);
    if (lastAsked) {
      const days = (Date.now() - new Date(lastAsked).getTime()) / 86_400_000;
      if (days < MIN_DAYS_BETWEEN_ASKS) return;
    }

    const available = await StoreReview.isAvailableAsync();
    if (!available) return;
    const hasAction = await StoreReview.hasAction();
    if (!hasAction) return;

    await StoreReview.requestReview();
    // The OS decides whether the card actually appeared, so record the attempt
    // either way rather than nagging on the next save.
    await AsyncStorage.setItem(ASKED_KEY, new Date().toISOString());
  } catch {
    // Feedback is never important enough to interrupt a calculation.
  }
}

/** For the reset flow: forget rating history so a fresh install behaves fresh. */
export async function clearFeedbackState(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([ASKED_KEY, SAVE_COUNT_KEY]);
  } catch {
    // non-critical
  }
}
