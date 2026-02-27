/**
 * Official read-write subview: Option income (covered call, secured put).
 * Table of option transactions. Add covered call or secured put. Edit, delete, roll, close (partial close supported).
 */
import type { SubviewSpec } from '@str/shared';

export const OPTION_INCOME_TABLE: SubviewSpec = {
  type: 'readwrite',
  name: 'Open Options',
  icon: 'Coins',
  iconColor: 'yellow-2',
  description: 'Covered calls and secured puts. Add, edit, delete, roll, or close (partial close supported)',
  maker: 'official',
  categories: ['essential', 'option'],
  defaultSize: { w: 700, h: 180 },
  inputs: {},
  headerActions: [{ title: 'Sell', label: 'Sell', handler: 'addOptionTransactionModal' }],
  layout: [
    [
      {
        weight: 1,
        alignment: 'stretch center' as const,
        content: [
          {
            Table: {
              header: {
                title: 'Open Options',
                actions: [
                  { title: 'Add', icon: 'plus', handler: 'addOptionTransactionModal' },
                ],
              },
              source: 'py:get_option_income_transactions',
              columns: ['date', 'instrumentSymbol', 'optionType', 'expiration', 'strike', 'underlyingPrice', 'quantity', 'status', 'premiumPerShare', 'premiumReceived', 'currentPrice', 'gain', 'gainPct'],
              columnLabels: {
                date: 'Date',
                instrumentSymbol: 'Symbol',
                optionType: 'Type',
                expiration: 'Exp',
                strike: 'Strike',
                underlyingPrice: 'Stock',
                quantity: 'Qty',
                status: 'Status',
                premiumPerShare: 'Book',
                premiumReceived: 'Premium received',
                currentPrice: 'Current',
                gain: 'Gain',
                gainPct: 'Gain%',
              },
              columnCellColors: {
                optionType: { 'Covered call': 'green-1', 'Secured put': 'blue-1' },
                gain: { _positive: 'green-1', _negative: 'red-1' },
                gainPct: { _positive: 'green-1', _negative: 'red-1' },
              },
              columnCellBackgroundColors: {
                status: { 'ITM': 'red-4' },
              },
              columnFormats: { strike: 'number', underlyingPrice: 'currency', premiumPerShare: 'currency', premiumReceived: 'currency', currentPrice: 'currency', gain: 'currency', gainPct: 'percent' },
              emptyMessage: 'No option trades',
              rowActions: [
                { title: 'Edit', icon: 'pencil', handler: 'editTransactionModal' },
                { title: 'Delete', icon: 'trash', handler: 'deleteTransaction' },
                { title: 'Roll', icon: 'repeat', handler: 'rollOptionModal' },
                { title: 'Close', icon: 'x', handler: 'closeOptionModal' },
                { title: 'Assign', icon: 'file-check', handler: 'assignOptionModal' },
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

def _parse_option_symbol(sym):
    """Parse SnapTrade symbol 'MTRX $34 C 2026-03-21' -> (underlying, strike, callPut, expiration)."""
    import re
    m = re.match(r'^(.+?)\s+\$([\d.]+)\s+([CP])\s+(\d{4}-\d{2}-\d{2})$', sym)
    if not m:
        return None
    return (m.group(1).strip(), float(m.group(2)), 'call' if m.group(3) == 'C' else 'put', m.group(4))

def get_option_income_transactions(context, inputs):
    """Return open option positions with live pricing. For synced strategies, uses optionHoldings from SnapTrade."""
    option_holdings = context.get('optionHoldings')
    if option_holdings is not None and isinstance(option_holdings, list) and len(option_holdings) > 0:
        return _result_from_option_holdings(context, inputs, option_holdings)

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

        if side == 'sell' and opt and opt.get('expiration'):
            cp = (opt.get('callPut') or 'call').lower()
            if cp not in ('call', 'put'):
                continue
            k = opt_key(opt, sym)
            if k:
                positions[k] = positions.get(k, {'qty': 0, 'sell_qty': 0, 'tx': None, 'option': None, 'premium': 0})
                positions[k]['qty'] += qty
                positions[k]['sell_qty'] += qty
                positions[k]['tx'] = tx
                positions[k]['option'] = opt
                positions[k]['premium'] = positions[k]['premium'] + (tx.get('cashDelta') or 0)

        elif side in ('buy_to_cover', 'buy', 'option_assign', 'option_expire') and opt and opt.get('expiration'):
            # SnapTrade/rebuild: 'buy' for close legs (rolls); 'buy_to_cover' for manual; assign/expire close short
            k = opt_key(opt, sym)
            if k and k in positions:
                positions[k]['qty'] -= qty
                if positions[k]['qty'] <= 0:
                    del positions[k]

    result = []
    for (sym, exp, strike, cp), pos in positions.items():
        if pos['qty'] <= 0:
            continue
        tx = pos['tx']
        opt = pos['option']
        if not tx or not opt:
            continue
        ts = tx.get('timestamp') or ''
        date = ts[:10] if len(ts) >= 10 else ts
        exp_short = (opt.get('expiration') or '')[:10]
        opt_type = 'Covered call' if cp == 'call' else 'Secured put'

        multiplier = opt.get('multiplier') or 100
        total_sold_qty = pos['sell_qty']
        book = abs(pos['premium']) / (total_sold_qty * multiplier) if total_sold_qty > 0 else 0

        occ = _to_occ_ticker(sym, exp, strike, cp)
        current = option_quotes.get(occ)
        gain = None
        gain_pct = None
        if current is not None and book > 0:
            gain = (book - current) * pos['qty'] * multiplier
            gain_pct = ((book - current) / book) * 100
        elif current is not None:
            gain = -current * pos['qty'] * multiplier

        # ITM: call when underlying > strike; put when underlying < strike
        underlying = current_prices.get(sym)
        status = '—'
        if underlying is not None:
            if cp == 'call':
                status = 'ITM' if underlying > strike else 'OTM'
            else:
                status = 'ITM' if underlying < strike else 'OTM'

        result.append({
            'id': tx.get('id'),
            'side': tx.get('side'),
            'cashDelta': pos['premium'],
            'timestamp': ts,
            'instrumentSymbol': sym,
            'option': opt,
            'customData': tx.get('customData') or {},
            'quantity': pos['qty'],
            'price': tx.get('price', 0),
            'date': date,
            'expiration': exp_short,
            'strike': strike,
            'underlyingPrice': underlying,
            'optionType': opt_type,
            'premiumPerShare': book,
            'premiumReceived': abs(pos['premium']),
            'currentPrice': current,
            'gain': gain,
            'gainPct': gain_pct,
            'status': status,
        })

    # Sort by expiration (earliest first), then strike, then symbol
    result.sort(key=lambda t: (t.get('expiration', ''), t.get('strike', 0), t.get('instrumentSymbol', '')))
    return result

def _result_from_option_holdings(context, inputs, option_holdings):
    """Build Open Options result from SnapTrade option holdings (synced strategy)."""
    option_quotes = context.get('optionQuotes') or {}
    current_prices = context.get('currentPrices') or {}
    global_inputs = inputs.get('global') or {}
    global_config = inputs.get('globalInputConfig') or []
    ticker_inp = next((c for c in global_config if c.get('type') == 'ticker_selector'), None)
    ticker_id = ticker_inp.get('id') if ticker_inp else None
    ticker_filter = global_inputs.get(ticker_id, 'all') if ticker_id else 'all'

    result = []
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
        gain_pct = None
        if current is not None and book > 0:
            gain = (book - current) * qty * 100
            gain_pct = ((book - current) / book) * 100
        elif current is not None:
            gain = -current * qty * 100
        underlying = current_prices.get(sym)
        status = '—'
        if underlying is not None:
            status = ('ITM' if underlying > strike else 'OTM') if cp == 'call' else ('ITM' if underlying < strike else 'OTM')
        opt_type = 'Covered call' if cp == 'call' else 'Secured put'
        result.append({
            'id': None,
            'side': 'sell',
            'cashDelta': -book * qty * 100,
            'timestamp': '',
            'instrumentSymbol': sym,
            'option': {'expiration': exp, 'strike': strike, 'callPut': cp, 'multiplier': 100},
            'customData': {},
            'quantity': qty,
            'price': book,
            'date': exp[:10] if len(exp) >= 10 else exp,
            'expiration': exp[:10] if len(exp) >= 10 else exp,
            'strike': strike,
            'underlyingPrice': underlying,
            'optionType': opt_type,
            'premiumPerShare': book,
            'premiumReceived': book * qty * 100,
            'currentPrice': current,
            'gain': gain,
            'gainPct': gain_pct,
            'status': status,
        })
    result.sort(key=lambda t: (t.get('expiration', ''), t.get('strike', 0), t.get('instrumentSymbol', '')))
    return result
`,
  functions: ['get_option_income_transactions'],
};
