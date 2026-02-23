/**
 * Official read-only subview: Count of open covered call contracts.
 */
import type { SubviewSpec } from '@str/shared';

export const COVERED_CALL_COUNT: SubviewSpec = {
  type: 'readonly',
  name: 'Covered Call',
  icon: 'TrendingUp',
  iconColor: 'green-2',
  description: 'Number of open covered call contracts',
  maker: 'official',
  categories: ['option'],
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
              value: 'py:get_covered_call_count',
              alignment: 'center',
              size: 'xl',
              bold: true,
              padding: { top: 8, bottom: 8 },
              decimals: 0,
            },
          },
        ],
      },
    ],
  ],
  python_code: `def get_covered_call_count(context, inputs):
    """Return count of open covered call contracts (sold calls not yet closed, expiration in future)."""
    from datetime import date
    txs = sorted(context.get('transactions') or [], key=lambda t: t.get('timestamp', ''))
    today = date.today().isoformat()

    global_inputs = inputs.get('global') or {}
    global_config = inputs.get('globalInputConfig') or []
    ticker_inp = next((c for c in global_config if c.get('type') == 'ticker_selector'), None)
    ticker_id = ticker_inp.get('id') if ticker_inp else None
    ticker = global_inputs.get(ticker_id, 'all') if ticker_id else 'all'

    def opt_key(opt, sym):
        if not opt or not hasattr(opt, 'get'):
            return None
        exp = (opt.get('expiration') or '')[:10]
        strike = opt.get('strike', 0)
        cp = (opt.get('callPut') or 'call').lower()
        return (sym, exp, strike, cp)

    positions = {}

    for tx in txs:
        sym = tx.get('instrumentSymbol') or ''
        if ticker != 'all' and sym != ticker:
            continue
        side = (tx.get('side') or tx.get('type') or '').lower()
        opt = tx.get('option')
        qty = int(tx.get('quantity') or 0)

        if side == 'sell' and opt and opt.get('expiration'):
            cp = (opt.get('callPut') or 'call').lower()
            if cp != 'call':
                continue
            k = opt_key(opt, sym)
            if k:
                positions[k] = positions.get(k, {'qty': 0})
                positions[k]['qty'] += qty

        elif side == 'buy_to_cover' and opt and opt.get('expiration'):
            cp = (opt.get('callPut') or 'call').lower()
            if cp != 'call':
                continue
            k = opt_key(opt, sym)
            if k and k in positions:
                positions[k]['qty'] -= qty
                if positions[k]['qty'] <= 0:
                    del positions[k]

    total = 0
    for (sym, exp, strike, cp), pos in positions.items():
        if pos['qty'] <= 0:
            continue
        if exp and exp >= today:
            total += pos['qty']

    return total
`,
  functions: ['get_covered_call_count'],
};
