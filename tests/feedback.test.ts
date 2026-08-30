// The rating prompt must never nag. These tests pin the gating rules, since
// getting them wrong on a live app is expensive to walk back.
import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (k: string) => store.get(k) ?? null,
    setItem: async (k: string, v: string) => void store.set(k, v),
    multiRemove: async (keys: string[]) => keys.forEach((k) => store.delete(k)),
  },
}));

const requestReview = vi.fn(async () => {});

vi.mock("expo-store-review", () => ({
  isAvailableAsync: async () => true,
  hasAction: async () => true,
  requestReview: () => requestReview(),
}));

vi.mock("expo-constants", () => ({
  default: { expoConfig: { android: { package: "com.app.zakatcalculator" }, ios: {} } },
}));

vi.mock("react-native", () => ({
  Platform: { OS: "android" },
  Linking: { openURL: async () => {} },
}));

const { noteCalculationSaved, clearFeedbackState, storeListingUrl } = await import("../lib/feedback");

describe("rating prompt gating", () => {
  beforeEach(() => {
    store.clear();
    requestReview.mockClear();
  });

  it("stays silent on the first saved calculation", async () => {
    await noteCalculationSaved();
    expect(requestReview).not.toHaveBeenCalled();
  });

  it("asks once the user has saved twice", async () => {
    await noteCalculationSaved();
    await noteCalculationSaved();
    expect(requestReview).toHaveBeenCalledTimes(1);
  });

  it("does not ask again straight after asking", async () => {
    await noteCalculationSaved();
    await noteCalculationSaved();
    await noteCalculationSaved();
    await noteCalculationSaved();
    expect(requestReview).toHaveBeenCalledTimes(1);
  });

  it("asks again only after the cooldown has elapsed", async () => {
    await noteCalculationSaved();
    await noteCalculationSaved();
    expect(requestReview).toHaveBeenCalledTimes(1);

    // Pretend the last ask was 200 days ago, past the 180-day cooldown.
    const old = new Date(Date.now() - 200 * 86_400_000).toISOString();
    store.set("zakat.review.lastAskedAt", old);

    await noteCalculationSaved();
    expect(requestReview).toHaveBeenCalledTimes(2);
  });

  it("forgets its history on reset", async () => {
    await noteCalculationSaved();
    await noteCalculationSaved();
    await clearFeedbackState();
    requestReview.mockClear();

    // Counting starts over, so the next single save must not prompt.
    await noteCalculationSaved();
    expect(requestReview).not.toHaveBeenCalled();
  });

  it("builds the Play listing URL from the package name", () => {
    expect(storeListingUrl()).toBe(
      "https://play.google.com/store/apps/details?id=com.app.zakatcalculator",
    );
  });
});
