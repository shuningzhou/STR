/**
 * Official read-only subview: Current holdings sum value.
 * Sum of market value of all stock and ETF positions.
 */
import type { SubviewSpec } from '@str/shared';

export const PORTFOLIO_VALUE: SubviewSpec = {
  type: 'readonly',
  name: 'Holdings Value',
  icon: 'Wallet',
  iconColor: 'green-2',
  description: 'Total market value of current stock and ETF holdings',
  maker: 'official',
  categories: ['stock-etf'],
  defaultSize: { w: 175, h: 40 },
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
              value: 'py:get_portfolio_value',
              alignment: 'center',
              size: 'xl',
              bold: true,
              padding: { top: 8, bottom: 8 },
              format: '$',
              decimals: 2,
            },
          },
        ],
      },
    ],
  ],
  python_code: `def get_portfolio_value(context, inputs):
    """Return total market value of current stock and ETF holdings."""
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
        price = float(tx.get('price') or 0)
        cash = float(tx.get('cashDelta') or 0)
        if side in ('sell', 'short'):
            qty = -qty
        if inst_id not in agg:
            agg[inst_id] = {'symbol': sym or inst_id, 'quantity': 0, 'cost_total': 0.0}
        agg[inst_id]['quantity'] += qty
        agg[inst_id]['cost_total'] -= cash

    total = 0.0
    for row in agg.values():
        qty = row['quantity']
        if qty <= 0:
            continue
        sym = row['symbol']
        cost_total = row['cost_total']
        price = current_prices.get(sym) if isinstance(current_prices, dict) else None
        if price is None:
            try:
                price = float(current_prices.get(sym, 0)) if hasattr(current_prices, 'get') else 0
            except Exception:
                price = 0
        if price <= 0 and cost_total:
            price = cost_total / qty
        total += qty * float(price)

    return round(total, 2)
`,
  functions: ['get_portfolio_value'],
};
