/**
 * Official read-only subview: Unrealized gain on current holdings.
 * Unrealized Gain = current holdings value - holdings book value
 * Unrealized Gain % = gain / book value * 100
 */
import type { SubviewSpec } from '@str/shared';

export const UNREALIZED_GAIN: SubviewSpec = {
  type: 'readonly',
  name: 'Unrealized Gain',
  icon: 'TrendingUp',
  iconColor: 'green-2',
  description: 'Unrealized gain: current holdings value minus book value',
  maker: 'official',
  categories: ['stock-etf'],
  defaultSize: { w: 200, h: 70 },
  inputs: {},
  layout: [
    [
      {
        weight: 1,
        alignment: 'center middle',
        contentDirection: 'column',
        content: [
          {
            number: {
              value: 'py:get_unrealized_gain',
              alignment: 'center',
              size: 'xl',
              bold: true,
              padding: { top: 8, bottom: 2 },
              format: '$',
              decimals: 2,
            },
          },
          {
            number: {
              value: 'py:get_unrealized_gain_pct',
              alignment: 'center',
              size: 'sm',
              padding: { top: 0, bottom: 8 },
              format: '%',
              decimals: 2,
            },
          },
        ],
      },
    ],
  ],
  python_code: `def _holdings_market_and_book(context):
    """Return (market_value, book_value) for current stock/ETF holdings."""
    txs = context.get('transactions') or []
    current_prices = context.get('currentPrices') or {}

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

    cash_only_sides = {'deposit', 'withdrawal', 'interest', 'fee', 'dividend'}
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

    market_value = 0.0
    book_value = 0.0
    for row in agg.values():
        qty = row['quantity']
        if qty <= 0:
            continue
        sym = row['symbol']
        cost_total = row['cost_total']
        book_value += cost_total
        price = current_prices.get(sym) if isinstance(current_prices, dict) else None
        if price is None:
            try:
                price = float(current_prices.get(sym, 0)) if hasattr(current_prices, 'get') else 0
            except Exception:
                price = 0
        if price <= 0 and cost_total:
            price = cost_total / qty
        market_value += qty * float(price)

    return (market_value, book_value)

def get_unrealized_gain(context, inputs):
    """Return unrealized gain in dollars: market value - book value."""
    market_value, book_value = _holdings_market_and_book(context)
    return round(market_value - book_value, 2)

def get_unrealized_gain_pct(context, inputs):
    """Return unrealized gain as percentage: (market - book) / book * 100."""
    market_value, book_value = _holdings_market_and_book(context)
    if book_value <= 0:
        return 0.0
    return round((market_value - book_value) / book_value * 100, 2)
`,
  functions: ['get_unrealized_gain', 'get_unrealized_gain_pct'],
};
