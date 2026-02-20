/**
 * Official read-only subview: Options timeline.
 * Horizontal timeline of option expirations from open positions. CC=green, SP=blue.
 */
import type { SubviewSpec } from '@str/shared';

export const OPTIONS_TIMELINE: SubviewSpec = {
  type: 'readonly',
  name: 'Options Timeline',
  icon: 'Calendar',
  iconColor: 'white',
  description: 'Timeline of option expirations from open positions',
  maker: 'official',
  categories: ['essential', 'option'],
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
              source: 'py:get_options_timeline',
              padding: { top: 4, bottom: 4 },
            },
          },
        ],
      },
    ],
  ],
  python_code: `def get_options_timeline(context, inputs):
    """Return timeline events: { events: [{ date, tickers, color, dateShort }] }.
    Grouped by date. CC=green, SP=blue, mixed=violet-1."""
    txs = context.get('transactions') or []
    global_inputs = inputs.get('global') or {}
    global_config = inputs.get('globalInputConfig') or []
    ticker_inp = next((c for c in global_config if c.get('type') == 'ticker_selector'), None)
    ticker_id = ticker_inp.get('id') if ticker_inp and hasattr(ticker_inp, 'get') else None
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

        if side == 'sell' and opt and opt.get('expiration'):
            cp = (opt.get('callPut') or 'call').lower()
            if cp not in ('call', 'put'):
                continue
            k = opt_key(opt, sym)
            if k:
                positions[k] = positions.get(k, {'qty': 0})
                positions[k]['qty'] += qty

        elif side == 'buy_to_cover' and opt and opt.get('expiration'):
            k = opt_key(opt, sym)
            if k and k in positions:
                positions[k]['qty'] -= qty
                if positions[k]['qty'] <= 0:
                    del positions[k]

    # (date) -> {tickers, ticker_types: sym -> (has_call, has_put), has_call, has_put}
    by_date = {}
    for (sym, exp, strike, cp), pos in positions.items():
        if pos['qty'] <= 0:
            continue
        if exp not in by_date:
            by_date[exp] = {'tickers': [], 'ticker_types': {}, 'has_call': False, 'has_put': False}
        if sym not in by_date[exp]['ticker_types']:
            by_date[exp]['tickers'].append(sym)
            by_date[exp]['ticker_types'][sym] = [False, False]
        t = by_date[exp]['ticker_types'][sym]
        if cp == 'call':
            t[0] = True
            by_date[exp]['has_call'] = True
        else:
            t[1] = True
            by_date[exp]['has_put'] = True

    from datetime import datetime
    events = []
    for d in sorted(by_date.keys()):
        info = by_date[d]
        try:
            dt = datetime.strptime(d, '%Y-%m-%d')
            short = str(dt.day)
        except Exception:
            short = d[-2:] if len(d) >= 10 else d
        if info['has_call'] and info['has_put']:
            color = 'cyan-3'
        elif info['has_call']:
            color = 'green-3'
        else:
            color = 'blue-3'
        def ticker_color(sym):
            has_call, has_put = info['ticker_types'].get(sym, [False, False])
            if has_call and has_put:
                return 'violet-1'
            return 'green-1' if has_call else 'blue-1'
        ticker_colors = {sym: ticker_color(sym) for sym in info['tickers']}
        events.append({'date': d, 'dateShort': short, 'tickers': info['tickers'], 'color': color, 'tickerColors': ticker_colors})

    return {'events': events}
`,
  functions: ['get_options_timeline'],
};
