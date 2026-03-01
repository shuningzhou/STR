/**
 * Official read-only subview: Sum of unrealized gain on leap call positions.
 * Matches the gain sum of all positions in the Leap Calls table.
 */
import type { SubviewSpec } from '@str/shared';

export const LEAP_CALLS_PNL: SubviewSpec = {
  type: 'readonly',
  name: 'Leap Calls P&L',
  icon: 'TrendingUp',
  iconColor: 'green-2',
  description: 'Total unrealized gain of open leap call positions',
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
              value: 'py:get_leap_calls_pnl',
              alignment: 'center',
              size: 'xl',
              bold: true,
              padding: { top: 8, bottom: 8 },
              format: '$',
              decimals: 2,
              color: 'py:get_leap_calls_pnl_color',
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

def get_leap_calls_pnl(context, inputs):
    """Return sum of unrealized gain on leap call positions (same positions as Leap Calls table)."""
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

    total = 0.0
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
        gain = None
        if current is not None and book > 0:
            gain = (current - book) * pos['qty'] * multiplier
        elif current is not None:
            gain = -book * pos['qty'] * multiplier
        if gain is not None:
            total += gain

    return round(total, 2)

def get_leap_calls_pnl_color(context, inputs):
    """Return color class for P&L: green if positive, red if negative."""
    pnl = get_leap_calls_pnl(context, inputs)
    if pnl > 0:
        return 'green-1'
    if pnl < 0:
        return 'red-1'
    return None
`,
  functions: ['get_leap_calls_pnl', 'get_leap_calls_pnl_color'],
};
