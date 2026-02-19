/**
 * Official read-only subview: Line chart of portfolio growth over time.
 * Plots cumulative portfolio value (cash + holdings at current prices) at each transaction date.
 */
import type { SubviewSpec } from '@str/shared';

export const PORTFOLIO_GROWTH_LINE_CHART: SubviewSpec = {
  type: 'readonly',
  name: 'Portfolio Growth',
  icon: 'TrendingUp',
  description: 'Line chart of portfolio value over time',
  maker: 'official',
  categories: ['essential', 'stock-etf'],
  defaultSize: { w: 600, h: 200 },
  inputs: {},
  layout: [
    [
      {
        flex: { flex: 1, justifyContent: 'center', alignItems: 'stretch' },
        content: [
          {
            Chart: {
              type: 'line',
              source: 'py:get_portfolio_growth',
              padding: 8,
            },
          },
        ],
      },
    ],
  ],
  python_code: `def get_portfolio_growth(context, inputs):
    """Return line chart data: { items: [{ label: date_str, value: portfolio_value }, ...] }.
    Portfolio value at each date = cash balance + market value of holdings (using current prices)."""
    txs = context.get('transactions') or []
    wallet = context.get('wallet') or {}
    initial = float(wallet.get('initialBalance', 0) or 0)
    current_prices = context.get('currentPrices') or {}

    def is_non_option(tx):
        opt = tx.get('option')
        try:
            return not (opt is not None and hasattr(opt, 'get') and opt.get('expiration'))
        except Exception:
            return True

    # Sort transactions by timestamp
    stock_txs = [t for t in txs if is_non_option(t)]
    stock_txs.sort(key=lambda t: t.get('timestamp') or '')

    if not stock_txs:
        return {'items': []}

    # Build portfolio value at each transaction date; start with initial balance
    dates_seen = set()
    items = [{'label': 'Start', 'value': round(initial, 2)}]
    cash = initial
    agg = {}

    for tx in stock_txs:
        ts = tx.get('timestamp') or ''
        date_str = ts[:10] if len(ts) >= 10 else ts
        if not date_str or date_str in dates_seen:
            continue
        dates_seen.add(date_str)

        # Apply this tx to state (we process txs before this date for the point)
        sym = tx.get('instrumentSymbol') or ''
        inst_id = tx.get('instrumentId') or sym or ''
        if not inst_id:
            continue
        qty = int(tx.get('quantity') or 0)
        cash_delta = float(tx.get('cashDelta') or 0)
        side = (tx.get('side') or tx.get('type') or '').lower()
        if side in ('sell', 'short'):
            qty = -qty
        cash += cash_delta
        if inst_id not in agg:
            agg[inst_id] = {'symbol': sym or inst_id, 'quantity': 0}
        agg[inst_id]['quantity'] += qty

        # Market value of holdings (current prices as proxy)
        mv = 0.0
        for inst_id, row in agg.items():
            q = row['quantity']
            if q <= 0:
                continue
            sym = row['symbol']
            price = current_prices.get(sym) if isinstance(current_prices, dict) else None
            if price is None:
                try:
                    price = float(current_prices.get(sym, 0)) if hasattr(current_prices, 'get') else 0
                except Exception:
                    price = 0
            mv += q * float(price)

        items.append({'label': date_str, 'value': round(cash + mv, 2)})

    return {'items': items}
`,
  functions: ['get_portfolio_growth'],
};
