/**
 * Official read-only subview: Leap calls timeline.
 * Horizontal timeline of leap call expirations from open long call positions.
 */
import type { SubviewSpec } from '@str/shared';

export const LEAP_CALLS_TIMELINE: SubviewSpec = {
  type: 'readonly',
  name: 'Leap Calls Timeline',
  icon: 'Calendar',
  iconColor: 'green-2',
  description: 'Timeline of leap call expirations from open positions',
  maker: 'official',
  categories: ['option'],
  defaultSize: { w: 700, h: 80 },
  inputs: {},
  layout: [
    [
      {
        flex: { flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'stretch' },
        padding: { top: 12, bottom: 12, left: 12, right: 12 },
        content: [
          {
            Chart: {
              type: 'timeline',
              source: 'py:get_leap_calls_timeline',
              padding: { top: 4, bottom: 4 },
            },
          },
        ],
      },
    ],
  ],
  python_code: `def get_leap_calls_timeline(context, inputs):
    """Return timeline events: { events: [{ date, tickers, color, dateShort }] }.
    Grouped by expiration date. Leap calls = long call positions."""
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
            positions[k] = positions.get(k, {'qty': 0})
            positions[k]['qty'] += qty

        elif side in ('sell', 'sell_to_cover'):
            if k in positions:
                pos = positions[k]
                pos['qty'] -= qty
                if pos['qty'] <= 0:
                    del positions[k]

    by_date = {}
    for (sym, exp, strike, cp), pos in positions.items():
        if pos['qty'] <= 0:
            continue
        if exp not in by_date:
            by_date[exp] = {'tickers': []}
        if sym not in by_date[exp]['tickers']:
            by_date[exp]['tickers'].append(sym)

    from datetime import datetime
    events = []
    for d in sorted(by_date.keys()):
        info = by_date[d]
        try:
            dt = datetime.strptime(d, '%Y-%m-%d')
            short = str(dt.day)
        except Exception:
            short = d[-2:] if len(d) >= 10 else d
        ticker_colors = {s: 'green-1' for s in info['tickers']}
        events.append({'date': d, 'dateShort': short, 'tickers': info['tickers'], 'color': 'green-3', 'tickerColors': ticker_colors})

    return {'events': events}
`,
  functions: ['get_leap_calls_timeline'],
};
