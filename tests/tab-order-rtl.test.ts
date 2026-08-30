import { describe, expect, it } from "vitest";

import { TAB_ORDER, visualTabOrder } from "../lib/tab-order";

describe("tab order", () => {
  it("keeps the calculator first in LTR", () => {
    expect(visualTabOrder(false)).toEqual(["index", "history", "learn", "settings"]);
  });

  it("reverses the declaration order in RTL so the calculator sits on the right", () => {
    expect(visualTabOrder(true)).toEqual(["settings", "learn", "history", "index"]);
  });

  it("never mutates the canonical order", () => {
    visualTabOrder(true);
    visualTabOrder(true);
    expect(TAB_ORDER).toEqual(["index", "history", "learn", "settings"]);
  });

  it("returns a fresh array each call", () => {
    expect(visualTabOrder(true)).not.toBe(visualTabOrder(true));
  });

  it("keeps index as the pinned default route regardless of direction", () => {
    // initialRouteName is TAB_ORDER[0], which must not move with the reversal.
    expect(TAB_ORDER[0]).toBe("index");
    expect(visualTabOrder(true)).toContain("index");
  });

  it("contains every tab exactly once in both directions", () => {
    for (const dir of [true, false]) {
      const order = visualTabOrder(dir);
      expect(order).toHaveLength(TAB_ORDER.length);
      expect(new Set(order).size).toBe(TAB_ORDER.length);
    }
  });
});

