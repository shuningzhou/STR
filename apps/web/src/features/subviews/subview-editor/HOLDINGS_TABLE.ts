/**
 * Official read-only subview: Table of current stock/ETF holdings.
 * Aggregates transactions by instrument; uses current prices for gain and % of portfolio.
 * No action buttons; no Add in header.
 */
import type { SubviewSpec } from '@str/shared';

export const HOLDINGS_TABLE: SubviewSpec = {
  type: 'readonly',
  name: 'Holdings',
  icon: 'Table',
  description: 'Current stock and ETF holdings with cost basis, market value, and gain',
  maker: 'official',
  categories: ['essential', 'stock-etf'],
  defaultSize: { w: 600, h: 100 },
  inputs: {},
  layout: [
    [
      {
        flex: { flex: 1, justifyContent: 'center', alignItems: 'stretch' },
        content: [
          {
            Table: {
              header: {
                title: 'Holdings',
              },
              source: 'py:get_holdings',
              columns: ['instrumentSymbol', 'quantity', 'costBasis', 'currentPrice', 'marketValue', 'gain', 'gainPct', 'portfolioPct'],
              columnLabels: {
                instrumentSymbol: 'Symbol',
                quantity: 'Qty',
                costBasis: 'Cost Basis',
                currentPrice: 'Current',
                marketValue: 'Market Value',
                gain: 'Gain',
                gainPct: 'Gain %',
                portfolioPct: '% of Portfolio',
              },
              columnFormats: {
                costBasis: 'currency',
                currentPrice: 'currency',
                marketValue: 'currency',
                gain: 'currency',
                gainPct: 'percent',
                portfolioPct: 'percent',
              },
              emptyMessage: 'No holdings',
            },
          },
        ],
      },
    ],
  ],
  python_code: `def get_holdings(context, inputs):
    """Return current stock/ETF holdings with cost basis, market value, gain, and % of portfolio."""
    txs = context.get('transactions') or []
    current_prices = context.get('currentPrices') or {}
    base_currency = (context.get('wallet') or {}).get('baseCurrency') or 'USD'
    
    def is_non_option(tx):
        opt = tx.get('option')
        try:
            return not (
                opt is not None
                and hasattr(opt, 'get')
                and opt.get('expiration')
            )
        except Exception:
            return True
    
    # Aggregate by instrument (instrumentId or instrumentSymbol for stocks/ETFs)
    # Exclude deposit, withdrawal, interest, fee (cash-only, not holdings)
    cash_only_sides = {'deposit', 'withdrawal', 'interest', 'fee'}
    agg = {}
    for tx in txs:
        if not is_non_option(tx):
            continue
        side = (tx.get('side') or tx.get('type') or '').lower()
        if side in cash_only_sides:
            continue
        sym = tx.get('instrumentSymbol')
        inst_id = tx.get('instrumentId') or sym or ''
        if not inst_id:
            continue
        qty = int(tx.get('quantity') or 0)
        price = float(tx.get('price') or 0)
        cash = float(tx.get('cashDelta') or 0)
        if side in ('sell', 'short'):
            qty = -qty
        if inst_id not in agg:
            agg[inst_id] = {'symbol': sym or inst_id, 'quantity': 0, 'cost_total': 0.0}
        agg[inst_id]['quantity'] += qty
        agg[inst_id]['cost_total'] -= cash
    # Filter to positive quantity only (current holdings)
    holdings = []
    for inst_id, row in agg.items():
        qty = row['quantity']
        if qty <= 0:
            continue
        cost_total = row['cost_total']
        cost_basis = cost_total / qty if qty else 0
        sym = row['symbol']
        price = current_prices.get(sym) if isinstance(current_prices, dict) else None
        if price is None:
            try:
                price = float(current_prices.get(sym, 0)) if hasattr(current_prices, 'get') else 0
            except Exception:
                price = cost_basis
        market_value = qty * float(price)
        gain = market_value - cost_total
        gain_pct = (gain / cost_total * 100) if cost_total else 0
        holdings.append({
            'instrumentSymbol': sym,
            'instrumentId': inst_id,
            'quantity': qty,
            'costBasis': round(cost_basis, 2),
            'currentPrice': round(float(price), 2),
            'marketValue': round(market_value, 2),
            'gain': round(gain, 2),
            'gainPct': round(gain_pct, 2),
            'portfolioPct': 0,
        })
    # Sort by market value desc
    holdings.sort(key=lambda h: h.get('marketValue', 0), reverse=True)
    total_mv = sum(h.get('marketValue', 0) for h in holdings)
    for h in holdings:
        mv = h.get('marketValue', 0)
        h['portfolioPct'] = round(mv / total_mv * 100, 1) if total_mv else 0
    return holdings
`,
  functions: ['get_holdings'],
};
