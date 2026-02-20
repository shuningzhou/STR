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
              columns: ['date', 'instrumentSymbol', 'optionType', 'expiration', 'strike', 'quantity', 'premium'],
              columnLabels: {
                date: 'Date',
                instrumentSymbol: 'Symbol',
                optionType: 'Type',
                expiration: 'Exp',
                strike: 'Strike',
                quantity: 'Qty',
                premium: 'Premium',
              },
              columnCellColors: {
                optionType: { 'Covered call': 'green-1', 'Secured put': 'blue-1' },
              },
              columnFormats: { strike: 'number', premium: 'currency' },
              emptyMessage: 'No option trades',
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
  python_code: `def get_option_income_transactions(context, inputs):
    """Return open option positions only (covered call, secured put). Excludes rolls and closed positions."""
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

    # positions: key -> {qty, tx, option, premium_received}
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
                positions[k] = positions.get(k, {'qty': 0, 'tx': None, 'option': None, 'premium': 0})
                positions[k]['qty'] += qty
                positions[k]['tx'] = tx
                positions[k]['option'] = opt
                positions[k]['premium'] = positions[k]['premium'] + (tx.get('cashDelta') or 0)

        elif side == 'buy_to_cover' and opt and opt.get('expiration'):
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
            'optionType': opt_type,
            'premium': pos['premium'],
        })

    result.sort(key=lambda t: (t.get('expiration', ''), t.get('strike', 0)), reverse=False)
    return result
`,
  functions: ['get_option_income_transactions'],
};
