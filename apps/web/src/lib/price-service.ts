/**
 * Fetches current prices for symbols.
 * When backend is ready, it will provide an API that pulls from FMP (US/CAD stocks, ETFs)
 * and Massive (option chains). Backend caches for 30 seconds.
 *
 * For now, returns mock prices. Replace fetchPrices implementation when backend exists.
 */

export type PriceMap = Record<string, number>;

/**
 * Fetch current prices for the given symbols.
 * Backend API (when ready): GET /api/prices?symbols=AAPL,VOO,...
 */
export async function fetchPrices(symbols: string[]): Promise<PriceMap> {
  const unique = [...new Set(symbols)].filter(Boolean);
  if (unique.length === 0) return {};

  // TODO: when backend is ready, call it:
  // const res = await fetch(`/api/prices?symbols=${unique.join(',')}`);
  // if (res.ok) return res.json();
  // fallback to mock on error

  return getMockPrices(unique);
}

/** Mock prices for development until backend provides real data */
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
