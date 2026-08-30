import { describe, expect, it } from "vitest";

import { fitFontSize } from "../lib/zakat/fit-text";

describe("fitFontSize", () => {
  const opts = { preferred: 20, minimum: 11, maxWidth: 90 };

  it("keeps the preferred size for short amounts", () => {
    expect(fitFontSize("⃁ 1,200", opts)).toBe(20);
  });

  it("shrinks a long amount rather than letting it overflow", () => {
    // The case that crossed the ring's stroke on a 360px screen.
    const size = fitFontSize("Rp 212,499,700", opts);
    expect(size).toBeLessThan(20);
    expect(size * "Rp 212,499,700".length * 0.58).toBeLessThanOrEqual(90);
  });

  it("never goes below the floor, however long the text", () => {
    expect(fitFontSize("Rp 999,999,999,999,999", opts)).toBe(11);
  });

  it("leaves the preferred size alone when there is no width to fit", () => {
    // A zero width means the ring has not been measured, not that the text must be tiny.
    expect(fitFontSize("Rp 212,499,700", { ...opts, maxWidth: 0 })).toBe(20);
  });

  it("handles empty text without dividing by zero", () => {
    expect(fitFontSize("", opts)).toBe(20);
  });
});

