/**
 * Official read-write subview: Leap calls (long call positions).
 * Table of long call option positions. Buy leap calls. Edit, delete, roll, close.
 * Similar to Open Options but for long calls only; no Type or Premium received columns.
 */
import type { SubviewSpec } from '@str/shared';

export const LEAP_CALLS_TABLE: SubviewSpec = {
  type: 'readwrite',
  name: 'Leap Calls',
  icon: 'TrendingUp',
  iconColor: 'green-2',
  description: 'Long call positions (LEAPS). Add, edit, delete, roll, or close',
  maker: 'official',
  categories: ['option'],
  defaultSize: { w: 700, h: 180 },
  inputs: {},
  headerActions: [{ title: 'Buy', label: 'Buy', handler: 'buyLeapModal' }],
  layout: [
    [
      {
        weight: 1,
        alignment: 'stretch center' as const,
        content: [
          {
            Table: {
              header: {
                title: 'Leap Calls',
                actions: [
                  { title: 'Add', icon: 'plus', handler: 'buyLeapModal' },
                ],
              },
              source: 'py:get_leap_calls_transactions',
              columns: ['date', 'instrumentSymbol', 'expiration', 'strike', 'underlyingPrice', 'quantity', 'status', 'premiumPerShare', 'currentPrice', 'gain', 'gainPct'],
              columnLabels: {
                date: 'Date',
                instrumentSymbol: 'Symbol',
                expiration: 'Exp',
                strike: 'Strike',
                underlyingPrice: 'Stock',
                quantity: 'Qty',
                status: 'Status',
                premiumPerShare: 'Book',
                currentPrice: 'Current',
                gain: 'Gain',
                gainPct: 'Gain%',
              },
              columnCellColors: {
                gain: { _positive: 'green-1', _negative: 'red-1' },
                gainPct: { _positive: 'green-1', _negative: 'red-1' },
              },
              columnCellBackgroundColors: {
                status: { 'ITM': 'red-4' },
              },
              columnFormats: { strike: 'number', underlyingPrice: 'currency', premiumPerShare: 'currency', currentPrice: 'currency', gain: 'currency', gainPct: 'percent' },
              emptyMessage: 'No leap call positions',
              rowActions: [
                { title: 'Edit', icon: 'pencil', handler: 'editTransactionModal' },
                { title: 'Delete', icon: 'trash', handler: 'deleteTransaction' },
                { title: 'Roll', icon: 'repeat', handler: 'rollOptionModal' },
                { title: 'Close', icon: 'x', handler: 'closeOptionModal' },
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

def get_leap_calls_transactions(context, inputs):
    """Return open long call positions. Buy opens, sell closes. Shows all call buys regardless of expiration."""
    txs = sorted(context.get('transactions') or [], key=lambda t: t.get('timestamp', ''))
    option_quotes = context.get('optionQuotes') or {}
    current_prices = context.get('currentPrices') or {}
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
            positions[k] = positions.get(k, {'qty': 0, 'buy_qty': 0, 'tx': None, 'option': None, 'cost': 0})
            positions[k]['qty'] += qty
            positions[k]['buy_qty'] += qty
            positions[k]['tx'] = tx
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

    result = []
    for (sym, exp, strike, cp), pos in positions.items():
        if pos['qty'] <= 0:
            continue
        tx = pos['tx']
        opt = pos['option']
        if not tx or not opt:
            continue
        ts = tx.get('timestamp') or ''
        date_str = ts[:10] if len(ts) >= 10 else ts
        exp_short = (opt.get('expiration') or '')[:10]
        multiplier = opt.get('multiplier') or 100
        total_buy_qty = pos['buy_qty']
        book = pos['cost'] / (total_buy_qty * multiplier) if total_buy_qty > 0 else 0

        occ = _to_occ_ticker(sym, exp, strike, cp)
        current = option_quotes.get(occ)
        gain = None
        gain_pct = None
        if current is not None and book > 0:
            gain = (current - book) * pos['qty'] * multiplier
            gain_pct = ((current - book) / book) * 100
        elif current is not None:
            gain = -book * pos['qty'] * multiplier

        underlying = current_prices.get(sym)
        status = '—'
        if underlying is not None:
            status = 'ITM' if underlying > strike else 'OTM'

        result.append({
            'id': tx.get('id'),
            'side': tx.get('side'),
            'cashDelta': -pos['cost'],
            'timestamp': ts,
            'instrumentSymbol': sym,
            'option': opt,
            'customData': tx.get('customData') or {},
            'quantity': pos['qty'],
            'price': tx.get('price', 0),
            'date': date_str,
            'expiration': exp_short,
            'strike': strike,
            'underlyingPrice': underlying,
            'premiumPerShare': book,
            'currentPrice': current,
            'gain': gain,
            'gainPct': gain_pct,
            'status': status,
        })

    result.sort(key=lambda t: (t.get('expiration', ''), t.get('strike', 0), t.get('instrumentSymbol', '')))
    return result
`,
  functions: ['get_leap_calls_transactions'],
};
