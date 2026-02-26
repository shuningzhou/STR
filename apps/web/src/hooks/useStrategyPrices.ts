import { useState, useEffect, useMemo } from 'react';
import { fetchPrices } from '@/lib/price-service';

/** Extract unique stock/ETF symbols from transactions */
function getSymbolsFromTransactions(transactions: { option?: unknown; instrumentSymbol?: string }[]): string[] {
  const syms = new Set<string>();
  for (const tx of transactions ?? []) {
    if (tx.instrumentSymbol) syms.add(tx.instrumentSymbol);
  }
  return [...syms];
}

/** Extract symbols from synced holdings (SnapTrade) */
function getSymbolsFromHoldings(holdings: { symbol?: string }[] | undefined): string[] {
  const syms = new Set<string>();
  for (const h of holdings ?? []) {
    if (h.symbol) syms.add(h.symbol);
  }
  return [...syms];
}

/**
 * Fetches current prices for stock/ETF symbols from transactions and (for synced strategies) holdings.
 * Using holdings means prices load as soon as holdings are fetched, without waiting for transaction sync.
 * Context.currentPrices is available to all subviews. Prices cached by backend (30s) when backend exists.
 */
export function useStrategyPrices(
  transactions: { option?: unknown; instrumentSymbol?: string }[] | undefined,
  holdings?: { symbol?: string }[] | undefined
) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const symbols = useMemo(() => {
    const fromTx = getSymbolsFromTransactions(transactions ?? []);
    const fromH = getSymbolsFromHoldings(holdings);
    return [...new Set([...fromTx, ...fromH])];
  }, [
    (transactions ?? []).map((t) => t.instrumentSymbol).filter(Boolean).sort().join(','),
    (holdings ?? []).map((h) => h.symbol).filter(Boolean).sort().join(','),
  ]);

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
