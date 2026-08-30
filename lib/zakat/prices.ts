// Live gold/silver prices and FX rates with graceful offline fallback.
// Uses the free frankfurter-style metals endpoint from gold-api.com (no key needed).
import { FxRates, MetalPrices } from "./types";

const OUNCE_TO_GRAM = 31.1034768;
const REQUEST_TIMEOUT_MS = 10_000;
const RETRY_DELAYS_MS = [0, 350, 1_000] as const;

/** Currencies offered in the per-item dropdown. Base list; any ISO code from the API works. */
export const COMMON_CURRENCIES = [
  "SAR", "USD", "EUR", "GBP", "AED", "KWD", "BHD", "QAR", "OMR", "EGP",
  "JOD", "TRY", "INR", "PKR", "IDR", "MYR", "CHF", "JPY", "CNY", "CAD", "AUD",
] as const;

interface GoldApiResponse {
  price: number; // USD per troy ounce
}

async function sleep(ms: number): Promise<void> {
  if (ms <= 0) return;
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

/** A short retry handles the providers' occasional 429/5xx or startup timeout. */
async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (const delay of RETRY_DELAYS_MS) {
    await sleep(delay);
    try {
      return await operation();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("price request failed");
}

async function fetchMetalUSD(symbol: "XAU" | "XAG"): Promise<number> {
  const res = await fetchWithTimeout(`https://api.gold-api.com/price/${symbol}`);
  if (!res.ok) throw new Error(`price fetch failed: ${res.status}`);
  const data = (await res.json()) as GoldApiResponse;
  if (!data.price || data.price <= 0) throw new Error("invalid price");
  return data.price;
}

async function fetchUsdRate(currency: string): Promise<number> {
  if (currency === "USD") return 1;
  const res = await fetchWithTimeout(`https://open.er-api.com/v6/latest/USD`);
  if (!res.ok) throw new Error(`fx fetch failed: ${res.status}`);
  const data = (await res.json()) as { rates?: Record<string, number> };
  const rate = data.rates?.[currency];
  if (!rate) throw new Error(`no rate for ${currency}`);
  return rate;
}

/** Fetch live gold + silver prices per gram in the given currency. Throws when offline. */
export async function fetchLivePrices(currency: string): Promise<MetalPrices> {
  const [gold, silver, fx] = await Promise.all([
    withRetry(() => fetchMetalUSD("XAU")),
    withRetry(() => fetchMetalUSD("XAG")),
    withRetry(() => fetchUsdRate(currency)),
  ]);
  return {
    goldPerGram: Math.round(((gold * fx) / OUNCE_TO_GRAM) * 100) / 100,
    silverPerGram: Math.round(((silver * fx) / OUNCE_TO_GRAM) * 100) / 100,
    updatedAt: new Date().toISOString(),
    source: "live",
  };
}

/** Fetch the full FX table re-based to the app's base currency. rates[code] = code per 1 base. */
export async function fetchFxRates(base: string): Promise<FxRates> {
  const data = await withRetry(async () => {
    const res = await fetchWithTimeout(`https://open.er-api.com/v6/latest/USD`);
    if (!res.ok) throw new Error(`fx fetch failed: ${res.status}`);
    return (await res.json()) as { rates?: Record<string, number> };
  });
  const usdRates = data.rates;
  if (!usdRates) throw new Error("no rates");
  const usdPerBase = usdRates[base];
  if (!usdPerBase || usdPerBase <= 0) throw new Error(`no rate for ${base}`);
  const rates: Record<string, number> = {};
  for (const [code, r] of Object.entries(usdRates)) {
    // r = code per USD; usdPerBase = base per USD → code per base = r / usdPerBase
    rates[code] = r / usdPerBase;
  }
  return { base, rates, updatedAt: new Date().toISOString() };
}
