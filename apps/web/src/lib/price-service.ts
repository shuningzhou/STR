import { getQuotes } from '@/api/market-data-api';

export type PriceMap = Record<string, number>;

/**
 * Fetch current prices for the given stock/ETF symbols via backend API.
 * Backend handles EODHD provider and caching.
 */
export async function fetchPrices(symbols: string[]): Promise<PriceMap> {
  const unique = [...new Set(symbols)].filter(Boolean);
  if (unique.length === 0) return {};

  try {
    const quotes = await getQuotes(unique);
    const result: PriceMap = {};
    for (const q of quotes) {
      result[q.symbol] = q.price;
    }
    return result;
  } catch {
    return getMockPrices(unique);
  }
}

/** Fallback mock prices when backend is unavailable */
function getMockPrices(symbols: string[]): PriceMap {
  const MOCK_PRICES: Record<string, number> = {
    AAPL: 185.5,
    MSFT: 420.0,
    VOO: 405.0,
    SPY: 485.0,
  };
  const result: PriceMap = {};
  for (const s of symbols) {
    result[s] = MOCK_PRICES[s] ?? 100;
  }
  return result;
}
