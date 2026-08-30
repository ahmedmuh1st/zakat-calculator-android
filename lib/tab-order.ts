/**
 * Canonical tab order, and the visual order to declare for a given writing
 * direction.
 *
 * Background: React Navigation lays the tab strip out according to the SYSTEM
 * writing direction, not the app's language setting. The app deliberately does not
 * call I18nManager.forceRTL (that is the V3 native-RTL migration), so an Arabic UI
 * on an LTR device kept the tab bar in LTR order while all screen content
 * mirrored. Declaration order is visual order for Tabs.Screen children, so
 * reversing the declared array in Arabic restores the expected order.
 */

export type TabName = "index" | "history" | "learn" | "settings";

/**
 * Canonical order, leading edge first. `index` MUST stay first: it is the default
 * route passed to Tabs via initialRouteName.
 */
export const TAB_ORDER: readonly TabName[] = ["index", "history", "learn", "settings"];

/**
 * The order the tabs should be DECLARED in for the given direction.
 *
 * Returns a fresh array every call and never mutates TAB_ORDER, so the canonical
 * order survives re-renders and language switches.
 */
export function visualTabOrder(isRTL: boolean): TabName[] {
  const copy = [...TAB_ORDER];
  return isRTL ? copy.reverse() : copy;
}
