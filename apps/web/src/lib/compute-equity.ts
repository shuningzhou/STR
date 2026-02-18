/**
 * Computes equity = sum of strategy holdings (market value of stock/ETF positions).
 * Excludes options; uses current prices when available, otherwise cost basis.
 */
export function computeEquity(
  transactions: Array<{
    option?: { expiration?: string } | null;
    instrumentSymbol?: string;
    instrumentId?: string;
    side?: string;
    type?: string;
    quantity?: number;
    cashDelta?: number;
  }>,
  currentPrices: Record<string, number>
): number {
  const agg: Record<
    string,
    { symbol: string; quantity: number; costTotal: number }
  > = {};

  const CASH_ONLY_SIDES = ['deposit', 'withdrawal', 'interest', 'fee'];

  for (const tx of transactions ?? []) {
    const opt = tx.option;
    const isOption =
      opt != null && typeof opt === 'object' && opt && 'expiration' in opt;
    if (isOption) continue;

    const side = ((tx.side ?? tx.type) ?? '').toLowerCase();
    if (CASH_ONLY_SIDES.includes(side)) continue;

    const sym = tx.instrumentSymbol;
    const instId = tx.instrumentId || sym || '';
    if (!instId) continue;

    let qty = Number(tx.quantity) || 0;
    const cash = Number(tx.cashDelta) || 0;

    if (side === 'sell' || side === 'short') qty = -qty;

    if (!agg[instId]) {
      agg[instId] = { symbol: sym || instId, quantity: 0, costTotal: 0 };
    }
    agg[instId].quantity += qty;
    agg[instId].costTotal -= cash;
  }

  let total = 0;
  for (const row of Object.values(agg)) {
    if (row.quantity <= 0) continue;
    const price =
      currentPrices[row.symbol] ??
      (row.costTotal / row.quantity || 0);
    total += row.quantity * price;
  }
  return total;
}
