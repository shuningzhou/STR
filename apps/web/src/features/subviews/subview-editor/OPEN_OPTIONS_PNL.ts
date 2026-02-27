/**
 * Official read-only subview: Sum of unrealized gain on open options (Covered calls + Secured puts).
 * Matches the gain sum of all positions in the Open Options table.
 */
import type { SubviewSpec } from '@str/shared';

export const OPEN_OPTIONS_PNL: SubviewSpec = {
  type: 'readonly',
  name: 'Open Options P&L',
  icon: 'TrendingUp',
  iconColor: 'yellow-2',
  description: 'Total unrealized gain of open covered calls and secured puts',
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
              value: 'py:get_open_options_pnl',
              alignment: 'center',
              size: 'xl',
              bold: true,
              padding: { top: 8, bottom: 8 },
              format: '$',
              decimals: 2,
              color: 'py:get_open_options_pnl_color',
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

def _parse_option_symbol(sym):
    import re
    m = re.match(r'^(.+?)\s+\$([\d.]+)\s+([CP])\s+(\d{4}-\d{2}-\d{2})$', sym)
    if not m:
        return None
    return (m.group(1).strip(), float(m.group(2)), 'call' if m.group(3) == 'C' else 'put', m.group(4))

def get_open_options_pnl(context, inputs):
    """Return sum of unrealized gain on open option positions (same positions as Open Options table)."""
    option_holdings = context.get('optionHoldings')
    if option_holdings is not None and isinstance(option_holdings, list) and len(option_holdings) > 0:
        return _sum_gain_from_option_holdings(context, inputs, option_holdings)

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

        if side == 'sell' and opt and opt.get('expiration'):
            cp = (opt.get('callPut') or 'call').lower()
            if cp not in ('call', 'put'):
                continue
            k = opt_key(opt, sym)
            if k:
                positions[k] = positions.get(k, {'qty': 0, 'sell_qty': 0, 'option': None, 'premium': 0})
                positions[k]['qty'] += qty
                positions[k]['sell_qty'] += qty
                positions[k]['option'] = opt
                positions[k]['premium'] = positions[k]['premium'] + (tx.get('cashDelta') or 0)

        elif side in ('buy_to_cover', 'buy', 'option_assign', 'option_expire') and opt and opt.get('expiration'):
            k = opt_key(opt, sym)
            if k and k in positions:
                positions[k]['qty'] -= qty
                if positions[k]['qty'] <= 0:
                    del positions[k]

    total = 0.0
    for (sym, exp, strike, cp), pos in positions.items():
        if pos['qty'] <= 0:
            continue
        opt = pos['option']
        if not opt:
            continue
        multiplier = opt.get('multiplier') or 100
        total_sold_qty = pos['sell_qty']
        book = abs(pos['premium']) / (total_sold_qty * multiplier) if total_sold_qty > 0 else 0
        occ = _to_occ_ticker(sym, exp, strike, cp)
        current = option_quotes.get(occ)
        gain = None
        if current is not None and book > 0:
            gain = (book - current) * pos['qty'] * multiplier
        elif current is not None:
            gain = -current * pos['qty'] * multiplier
        if gain is not None:
            total += gain

    return round(total, 2)

def get_open_options_pnl_color(context, inputs):
    """Return color class for P&L: green if positive, red if negative."""
    pnl = get_open_options_pnl(context, inputs)
    if pnl > 0:
        return 'green-1'
    if pnl < 0:
        return 'red-1'
    return None

def _sum_gain_from_option_holdings(context, inputs, option_holdings):
    option_quotes = context.get('optionQuotes') or {}
    global_inputs = inputs.get('global') or {}
    global_config = inputs.get('globalInputConfig') or []
    ticker_inp = next((c for c in global_config if c.get('type') == 'ticker_selector'), None)
    ticker_id = ticker_inp.get('id') if ticker_inp else None
    ticker_filter = global_inputs.get(ticker_id, 'all') if ticker_id else 'all'

    total = 0.0
    for h in option_holdings:
        parsed = _parse_option_symbol(h.get('symbol') or '')
        if not parsed:
            continue
        sym, strike, cp, exp = parsed
        if ticker_filter != 'all' and sym != ticker_filter:
            continue
        qty = abs(int(h.get('quantity') or 0))
        if qty <= 0:
            continue
        book = float(h.get('averagePrice') or 0)
        occ = _to_occ_ticker(sym, exp, strike, cp)
        current = option_quotes.get(occ)
        gain = None
        if current is not None and book > 0:
            gain = (book - current) * qty * 100
        elif current is not None:
            gain = -current * qty * 100
        if gain is not None:
            total += gain
    return round(total, 2)
`,
  functions: ['get_open_options_pnl', 'get_open_options_pnl_color'],
};
