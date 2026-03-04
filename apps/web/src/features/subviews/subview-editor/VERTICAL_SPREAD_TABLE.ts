/**
 * Official read-write subview: Credit vertical spreads (call credit, put credit).
 * Table of multi-leg option positions. Add credit spreads. Close or delete. No assign, no roll.
 */
import type { SubviewSpec } from '@str/shared';

export const VERTICAL_SPREAD_TABLE: SubviewSpec = {
  type: 'readwrite',
  name: 'Vertical Spreads',
  icon: 'ArrowLeftRight',
  iconColor: 'blue-2',
  description: 'Credit vertical spreads (call credit, put credit). Add, close, or delete',
  maker: 'official',
  categories: ['option'],
  defaultSize: { w: 380, h: 280 },
  inputs: {},
  headerActions: [{ title: 'Add', label: 'Add', handler: 'addVerticalSpreadModal' }],
  layout: [
    [
      {
        weight: 1,
        alignment: 'stretch center' as const,
        content: [
          {
            SpreadCards: {
              source: 'py:get_vertical_spread_transactions',
              emptyMessage: 'No vertical spreads',
              cardActions: [
                { title: 'Edit', icon: 'pencil', handler: 'editSpreadModal' },
                { title: 'Delete', icon: 'trash', handler: 'deleteSpread' },
                { title: 'Close', icon: 'x', handler: 'closeSpreadModal' },
              ],
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

def get_vertical_spread_transactions(context, inputs):
    """Return open credit vertical spreads as list of spread objects for card display."""
    txs = sorted(context.get('transactions') or [], key=lambda t: t.get('timestamp', ''))
    option_quotes = context.get('optionQuotes') or {}
    current_prices = context.get('currentPrices') or {}
    global_inputs = inputs.get('global') or {}
    global_config = inputs.get('globalInputConfig') or []
    ticker_inp = next((c for c in global_config if c.get('type') == 'ticker_selector'), None)
    ticker_id = ticker_inp.get('id') if ticker_inp else None
    ticker = global_inputs.get(ticker_id, 'all') if ticker_id else 'all'

    spreads = {}
    for tx in txs:
        spread_id = (tx.get('customData') or {}).get('spreadId')
        if not spread_id:
            continue
        sym = tx.get('instrumentSymbol') or ''
        if ticker != 'all' and sym != ticker:
            continue
        opt = tx.get('option')
        if not opt or not opt.get('expiration'):
            continue
        side = (tx.get('side') or '').lower()
        qty = tx.get('quantity') or 0
        strike = opt.get('strike', 0)
        cp = (opt.get('callPut') or 'call').lower()
        exp = (opt.get('expiration') or '')[:10]

        if spread_id not in spreads:
            spreads[spread_id] = {'legs': {}, 'sym': sym, 'exp': exp, 'cp': cp}
        legs = spreads[spread_id]['legs']
        if strike not in legs:
            legs[strike] = {'qty': 0, 'cost': 0, 'tx': None, 'option': opt, 'side': None}
        leg = legs[strike]
        if side == 'sell':
            leg['qty'] += qty
            leg['cost'] += (tx.get('cashDelta') or 0)
            leg['tx'] = tx
            leg['side'] = 'sell'
        elif side == 'buy':
            leg['qty'] += qty
            leg['cost'] += -(tx.get('cashDelta') or 0)
            leg['tx'] = tx
            leg['side'] = 'buy'
        elif side == 'buy_to_cover':
            leg['qty'] -= qty
            if leg['qty'] <= 0:
                leg['tx'] = None
        elif side == 'sell_to_cover':
            leg['qty'] -= qty
            if leg['qty'] <= 0:
                leg['tx'] = None

    result = []
    for spread_id, sp in spreads.items():
        legs = sp['legs']
        cp = sp['cp']
        valid_legs = [(strike, leg) for strike, leg in legs.items() if leg['qty'] > 0 and leg['tx']]
        if len(valid_legs) != 2:
            continue
        valid_legs.sort(key=lambda x: x[0])
        low_strike, low_leg = valid_legs[0]
        high_strike, high_leg = valid_legs[1]
        if cp == 'call':
            short_strike, short_leg = low_strike, low_leg
            long_strike, long_leg = high_strike, high_leg
        else:
            short_strike, short_leg = high_strike, high_leg
            long_strike, long_leg = low_strike, low_leg
        spread_qty = min(short_leg['qty'], long_leg['qty'])
        if spread_qty <= 0:
            continue

        sym = sp['sym']
        exp = sp['exp']
        spread_type = 'Call Credit' if cp == 'call' else 'Put Credit'
        multiplier = 100
        underlying = current_prices.get(sym)

        short_tx = short_leg['tx']
        long_tx = long_leg['tx']
        short_book = short_leg['cost'] / (short_leg['qty'] * multiplier) if short_leg['qty'] > 0 else 0
        long_book = long_leg['cost'] / (long_leg['qty'] * multiplier) if long_leg['qty'] > 0 else 0
        net_credit = (short_book - long_book) * spread_qty * multiplier
        net_credit_per_share = short_book - long_book

        short_occ = _to_occ_ticker(sym, exp, short_strike, cp)
        long_occ = _to_occ_ticker(sym, exp, long_strike, cp)
        short_current = option_quotes.get(short_occ)
        long_current = option_quotes.get(long_occ)

        short_gain = None
        long_gain = None
        if short_current is not None and short_book > 0:
            short_gain = (short_book - short_current) * spread_qty * multiplier
        elif short_current is not None:
            short_gain = -short_current * spread_qty * multiplier
        if long_current is not None and long_book > 0:
            long_gain = (long_current - long_book) * spread_qty * multiplier
        elif long_current is not None:
            long_gain = -long_book * spread_qty * multiplier

        spread_gain = None
        gain_pct = None
        if short_gain is not None and long_gain is not None:
            spread_gain = short_gain + long_gain
            if net_credit > 0:
                gain_pct = (spread_gain / net_credit) * 100

        if cp == 'put':
            break_even = short_strike - net_credit_per_share
        else:
            break_even = short_strike + net_credit_per_share

        strike_width = abs(long_strike - short_strike)
        max_loss = (strike_width - net_credit_per_share) * spread_qty * multiplier

        pct_to_break_even = None
        if underlying is not None and underlying > 0:
            if cp == 'put':
                pct_to_break_even = ((underlying - break_even) / underlying) * 100
            else:
                pct_to_break_even = ((break_even - underlying) / underlying) * 100

        from datetime import date
        today = date.today()
        exp_date = date.fromisoformat(exp) if exp else today
        days_to_expire = max(0, (exp_date - today).days)

        ts = short_tx.get('timestamp') or long_tx.get('timestamp') or ''
        date_str = ts[:10] if len(ts) >= 10 else ts
        strikes_str = str(int(short_strike)) + '/' + str(int(long_strike))

        legs_for_handlers = [
            {'id': short_tx.get('id'), 'side': 'sell', 'cashDelta': short_leg['cost'], 'currency': short_tx.get('currency', ''), 'timestamp': short_tx.get('timestamp', ''), 'instrumentSymbol': sym, 'option': short_leg['option'], 'customData': short_tx.get('customData') or {}, 'quantity': spread_qty, 'price': short_tx.get('price', 0)},
            {'id': long_tx.get('id'), 'side': 'buy', 'cashDelta': -long_leg['cost'], 'currency': long_tx.get('currency', ''), 'timestamp': long_tx.get('timestamp', ''), 'instrumentSymbol': sym, 'option': long_leg['option'], 'customData': long_tx.get('customData') or {}, 'quantity': spread_qty, 'price': long_tx.get('price', 0)},
        ]

        short_gain_val = short_gain if short_gain is not None else 0
        long_gain_val = long_gain if long_gain is not None else 0
        leg_details = [
            {'label': 'Short', 'strike': short_strike, 'book': short_book, 'current': short_current, 'gain': short_gain_val},
            {'label': 'Long', 'strike': long_strike, 'book': long_book, 'current': long_current, 'gain': long_gain_val},
        ]

        result.append({
            'spreadId': spread_id,
            'date': date_str,
            'instrumentSymbol': sym,
            'spreadType': spread_type,
            'expiration': exp,
            'daysToExpire': days_to_expire,
            'strikes': strikes_str,
            'underlyingPrice': underlying,
            'quantity': spread_qty,
            'netCredit': net_credit,
            'breakEven': break_even,
            'maxLoss': max_loss,
            'pctToBreakEven': pct_to_break_even,
            'gain': spread_gain,
            'gainPct': gain_pct,
            'legs': legs_for_handlers,
            'legDetails': leg_details,
        })

    result.sort(key=lambda t: (t.get('expiration', ''), t.get('instrumentSymbol', '')))
    return result
`,
  functions: ['get_vertical_spread_transactions'],
};
