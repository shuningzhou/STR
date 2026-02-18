/**
 * Official read-only subview: Pie chart of portfolio allocation by holding.
 */
import type { SubviewSpec } from '@str/shared';

export const PORTFOLIO_PIE_CHART: SubviewSpec = {
  type: 'readonly',
  name: 'Portfolio %',
  description: 'Pie chart showing % of portfolio by holding',
  maker: 'official',
  defaultSize: { w: 400, h: 220 },
  inputs: {},
  layout: [
    [
      {
        flex: { flex: 1, justifyContent: 'center', alignItems: 'stretch' },
        content: [
          {
            Chart: {
              type: 'pie',
              source: 'py:get_portfolio_pie',
            },
          },
        ],
      },
    ],
  ],
  python_code: `def get_portfolio_pie(context, inputs):
    """Return pie chart data: { items: [{ label: str, value: float }] } for % of portfolio."""
    txs = context.get('transactions') or []
    current_prices = context.get('currentPrices') or {}
    
    def is_non_option(tx):
        opt = tx.get('option')
        try:
            return not (opt is not None and hasattr(opt, 'get') and opt.get('expiration'))
        except Exception:
            return True
    
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
        cash = float(tx.get('cashDelta') or 0)
        if side in ('sell', 'short'):
            qty = -qty
        if inst_id not in agg:
            agg[inst_id] = {'symbol': sym or inst_id, 'quantity': 0, 'cost_total': 0.0}
        agg[inst_id]['quantity'] += qty
        agg[inst_id]['cost_total'] -= cash
    
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
        holdings.append({'symbol': sym, 'marketValue': market_value})
    
    holdings.sort(key=lambda h: h['marketValue'], reverse=True)
    total_mv = sum(h['marketValue'] for h in holdings)
    items = []
    for h in holdings:
        pct = round(h['marketValue'] / total_mv * 100, 1) if total_mv else 0
        items.append({'label': h['symbol'], 'value': pct})
    return {'items': items}
`,
  functions: ['get_portfolio_pie'],
};
