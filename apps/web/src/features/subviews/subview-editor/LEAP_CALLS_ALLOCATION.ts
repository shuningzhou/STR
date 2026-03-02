/**
 * Official read-only subview: Pie chart of leap call allocation by current value.
 * Each slice = % of total leap calls market value.
 */
import type { SubviewSpec } from '@str/shared';

export const LEAP_CALLS_ALLOCATION: SubviewSpec = {
  type: 'readonly',
  name: 'Leap Call Allocation',
  icon: 'ChartPie',
  iconColor: 'green-2',
  description: 'Donut chart showing % of leap call portfolio by position (current value)',
  maker: 'official',
  categories: ['option'],
  defaultSize: { w: 375, h: 125 },
  inputs: {},
  layout: [
    [
      {
        flex: { flex: 1, alignItems: 'stretch' },
        content: [
          {
            Chart: {
              type: 'pie',
              source: 'py:get_leap_calls_allocation',
            },
          },
        ],
      },
    ],
  ],
  python_code: `def _to_occ_ticker(sym, expiration, strike, call_put):
    date = expiration.replace('-', '')
    if len(date) >= 8:
        date = date[2:]
    cp = 'C' if call_put.upper().startswith('C') else 'P'
    strike_str = str(int(round(strike * 1000))).zfill(8)
    return 'O:' + sym.upper() + date + cp + strike_str

def get_leap_calls_allocation(context, inputs):
    """Return pie chart data: { items: [{ label: str, value: float }] } for % of leap call portfolio by current value."""
    txs = sorted(context.get('transactions') or [], key=lambda t: t.get('timestamp', ''))
    option_quotes = context.get('optionQuotes') or {}
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
        side = (tx.get('side') or '').lower()
        opt = tx.get('option')
        qty = tx.get('quantity') or 0

        if not opt or not opt.get('expiration'):
            continue
        cp = (opt.get('callPut') or 'call').lower()
        if cp != 'call':
            continue

        k = opt_key(opt, sym)
        if not k:
            continue

        if side == 'buy':
            positions[k] = positions.get(k, {'qty': 0, 'buy_qty': 0, 'option': None, 'cost': 0})
            positions[k]['qty'] += qty
            positions[k]['buy_qty'] += qty
            positions[k]['option'] = opt
            cost = -(tx.get('cashDelta') or 0)
            positions[k]['cost'] += cost

        elif side in ('sell', 'sell_to_cover'):
            if k in positions:
                pos = positions[k]
                before = pos['qty']
                pos['qty'] -= qty
                if pos['qty'] <= 0:
                    del positions[k]
                elif before > 0:
                    pos['cost'] *= pos['qty'] / before

    items = []
    for (sym, exp, strike, cp), pos in positions.items():
        if pos['qty'] <= 0:
            continue
        opt = pos['option']
        if not opt:
            continue
        multiplier = opt.get('multiplier') or 100
        total_buy_qty = pos['buy_qty']
        book = pos['cost'] / (total_buy_qty * multiplier) if total_buy_qty > 0 else 0

        occ = _to_occ_ticker(sym, exp, strike, cp)
        current = option_quotes.get(occ)
        price_per_share = current if current is not None else book
        market_value = pos['qty'] * multiplier * price_per_share

        if market_value <= 0:
            continue
        label = f"{sym} {exp} {int(strike)}"
        items.append({'label': label, 'value': market_value})

    items.sort(key=lambda x: x['value'], reverse=True)
    total = sum(x['value'] for x in items)
    if total <= 0:
        return {'items': []}
    result = [{'label': x['label'], 'value': round(x['value'] / total * 100, 1)} for x in items]
    return {'items': result}
`,
  functions: ['get_leap_calls_allocation'],
};
