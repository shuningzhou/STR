/**
 * Official read-only subview: Count of open secured put contracts.
 */
import type { SubviewSpec } from '@str/shared';

export const SECURED_PUTS_COUNT: SubviewSpec = {
  type: 'readonly',
  name: 'Secured Puts',
  icon: 'Shield',
  iconColor: 'blue-1',
  description: 'Number of open secured put contracts',
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
              value: 'py:get_secured_puts_count',
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
  python_code: `def get_secured_puts_count(context, inputs):
    """Return count of open secured put contracts (sold puts not yet closed, expiration in future)."""
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
            if cp != 'put':
                continue
            k = opt_key(opt, sym)
            if k:
                positions[k] = positions.get(k, {'qty': 0})
                positions[k]['qty'] += qty

        elif side in ('buy_to_cover', 'buy', 'option_assign', 'option_expire') and opt and opt.get('expiration'):
            cp = (opt.get('callPut') or 'call').lower()
            if cp != 'put':
                continue
            k = opt_key(opt, sym)
            if k and k in positions:
                positions[k]['qty'] -= qty
                if positions[k]['qty'] <= 0:
                    del positions[k]

    total = 0
    breakdown_lines = []
    for (sym, exp, strike, cp), pos in positions.items():
        if pos['qty'] <= 0:
            continue
        if exp and exp >= today:
            q = pos['qty']
            total += q
            breakdown_lines.append("\{0\} \$\{1\} × \{2\}".format(sym, strike, q))

    return {"value": total, "breakdown": "\\n".join(breakdown_lines) if breakdown_lines else None}
`,
  functions: ['get_secured_puts_count'],
};
