import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchLivePrices } from "../lib/zakat/prices";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("live metal prices", () => {
  it("retries a transient metal-provider failure instead of leaving prices empty", async () => {
    let goldAttempts = 0;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/XAU")) {
        goldAttempts += 1;
        if (goldAttempts === 1) return jsonResponse({ error: "busy" }, 503);
        return jsonResponse({ price: 4_500 });
      }
      if (url.endsWith("/XAG")) return jsonResponse({ price: 65 });
      if (url.includes("open.er-api.com")) return jsonResponse({ rates: { SAR: 3.75 } });
      throw new Error(`unexpected URL: ${url}`);
    });

    const prices = await fetchLivePrices("SAR");

    expect(goldAttempts).toBe(2);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(prices.goldPerGram).toBeGreaterThan(0);
    expect(prices.silverPerGram).toBeGreaterThan(0);
    expect(prices.source).toBe("live");
  });

  it("does not request FX when the selected currency is USD", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/XAU")) return jsonResponse({ price: 4_500 });
      if (url.endsWith("/XAG")) return jsonResponse({ price: 65 });
      throw new Error(`unexpected URL: ${url}`);
    });

    const prices = await fetchLivePrices("USD");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(prices.goldPerGram).toBeGreaterThan(0);
    expect(prices.silverPerGram).toBeGreaterThan(0);
  });
});
