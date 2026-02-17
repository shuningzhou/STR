import { useState, useEffect } from 'react';
import { fetchPrices } from '@/lib/price-service';

/** Extract unique stock/ETF symbols from transactions (excludes options) */
function getStockEtfSymbols(transactions: { option?: unknown; instrumentSymbol?: string }[]): string[] {
  const syms = new Set<string>();
  for (const tx of transactions ?? []) {
    const opt = tx.option;
    const isOption =
      opt != null &&
      typeof opt === 'object' &&
      'expiration' in (opt as object);
    if (!isOption && tx.instrumentSymbol) {
      syms.add(tx.instrumentSymbol);
    }
  }
  return [...syms];
}

/**
 * Fetches current prices for stock/ETF symbols in the strategy's transactions.
 * Context.currentPrices is available to all subviews. Prices cached by backend (30s) when backend exists.
 */
export function useStrategyPrices(transactions: { option?: unknown; instrumentSymbol?: string }[] | undefined) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const symbols = getStockEtfSymbols(transactions ?? []);

  useEffect(() => {
    if (symbols.length === 0) {
      setPrices({});
      return;
    }
    let cancelled = false;
    fetchPrices(symbols).then((result) => {
      if (!cancelled) setPrices(result);
    });
    return () => {
      cancelled = true;
    };
  }, [symbols.join(',')]);

  return prices;
}
