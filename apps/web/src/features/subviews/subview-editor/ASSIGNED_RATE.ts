/**
 * Official read-only subview: % of closed CC and SP that were assigned.
 * Assigned = option_assign. Closed = buy_to_cover, option_assign, or option_expire.
 */
import type { SubviewSpec } from '@str/shared';

export const ASSIGNED_RATE: SubviewSpec = {
  type: 'readonly',
  name: 'Assigned Rate',
  icon: 'Target',
  iconColor: 'orange-2',
  description: '% of closed covered calls and secured puts that were assigned',
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
              value: 'py:get_assigned_rate',
              alignment: 'center',
              size: 'xl',
              bold: true,
              padding: { top: 8, bottom: 8 },
              format: '%',
              decimals: 1,
            },
          },
        ],
      },
    ],
  ],
  python_code: `def get_assigned_rate(context, inputs):
    """Return % of closed CC and SP positions that were assigned (option_assign). Closed = buy_to_cover, option_assign, or option_expire."""
    txs = sorted(context.get('transactions') or [], key=lambda t: t.get('timestamp', ''))

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
        if cp not in ('call', 'put'):
            return None
        return (sym, exp, strike, cp)

    positions = {}
    total_closed = 0
    assigned_closed = 0

    for tx in txs:
        sym = tx.get('instrumentSymbol') or ''
        if ticker != 'all' and sym != ticker:
            continue
        side = (tx.get('side') or tx.get('type') or '').lower()
        opt = tx.get('option')
        qty = int(tx.get('quantity') or 0)

        if not opt or not opt.get('expiration'):
            continue

        cp = (opt.get('callPut') or 'call').lower()
        if cp not in ('call', 'put'):
            continue

        k = opt_key(opt, sym)
        if not k:
            continue

        if side == 'sell':
            positions[k] = positions.get(k, 0) + qty

        elif side == 'buy_to_cover':
            if k in positions and positions[k] > 0:
                close_qty = min(qty, positions[k])
                positions[k] -= close_qty
                total_closed += close_qty
                if positions[k] <= 0:
                    del positions[k]

        elif side == 'option_assign':
            if k in positions and positions[k] > 0:
                close_qty = min(qty, positions[k])
                positions[k] -= close_qty
                total_closed += close_qty
                assigned_closed += close_qty
                if positions[k] <= 0:
                    del positions[k]

        elif side == 'option_expire':
            if k in positions and positions[k] > 0:
                close_qty = min(qty, positions[k])
                positions[k] -= close_qty
                total_closed += close_qty
                if positions[k] <= 0:
                    del positions[k]

    if total_closed <= 0:
        return 0.0
    return round((assigned_closed / total_closed) * 100, 1)
`,
  functions: ['get_assigned_rate'],
};
