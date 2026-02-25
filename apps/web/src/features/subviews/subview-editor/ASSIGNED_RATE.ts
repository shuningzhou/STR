/**
 * Official read-only subview: % of closed/expired CC and SP that were assigned.
 * Shows both contracts assigned rate and option assign rate (by distinct positions).
 * Excludes roll legs (chainResolved).
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
  defaultSize: { w: 175, h: 80 },
  inputs: {},
  layout: [
    [
      {
        flex: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
        padding: 10,
        content: [
          { text: { value: 'Contracts', size: 'sm' } },
          { number: { value: 'py:get_contracts_assigned_rate', format: '%', decimals: 1, size: 'lg', bold: true } },
        ],
      },
    ],
    [
      {
        flex: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
        padding: { top: 0, right: 10, bottom: 10, left: 10 },
        content: [
          { text: { value: 'Options', size: 'sm' } },
          { number: { value: 'py:get_option_assign_rate', format: '%', decimals: 1, size: 'md', bold: true } },
        ],
      },
    ],
  ],
  python_code: `def _compute_assigned_rates(context, inputs):
    """Returns (contracts_rate, option_rate). Excludes roll legs (customData.chainResolved)."""
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
    positions_closed = set()
    positions_assigned = set()

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

        elif side in ('buy_to_cover', 'buy'):
            if (tx.get('customData') or {}).get('chainResolved'):
                continue
            if k in positions and positions[k] > 0:
                close_qty = min(qty, positions[k])
                positions[k] -= close_qty
                total_closed += close_qty
                if positions[k] <= 0:
                    del positions[k]
                    positions_closed.add(k)

        elif side == 'option_assign':
            if k in positions and positions[k] > 0:
                close_qty = min(qty, positions[k])
                positions[k] -= close_qty
                total_closed += close_qty
                assigned_closed += close_qty
                if positions[k] <= 0:
                    del positions[k]
                    positions_closed.add(k)
                    positions_assigned.add(k)

        elif side == 'option_expire':
            if k in positions and positions[k] > 0:
                close_qty = min(qty, positions[k])
                positions[k] -= close_qty
                total_closed += close_qty
                if positions[k] <= 0:
                    del positions[k]
                    positions_closed.add(k)

    contracts_rate = round((assigned_closed / total_closed) * 100, 1) if total_closed > 0 else 0.0
    option_rate = round((len(positions_assigned) / len(positions_closed)) * 100, 1) if positions_closed else 0.0
    return (contracts_rate, option_rate)

def get_contracts_assigned_rate(context, inputs):
    r, _ = _compute_assigned_rates(context, inputs)
    return r

def get_option_assign_rate(context, inputs):
    _, r = _compute_assigned_rates(context, inputs)
    return r
`,
  functions: ['get_contracts_assigned_rate', 'get_option_assign_rate'],
};
