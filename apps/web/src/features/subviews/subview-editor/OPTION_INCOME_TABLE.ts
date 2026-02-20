/**
 * Official read-write subview: Option income (covered call, secured put).
 * Table of option transactions. Add covered call or secured put. Edit, delete, roll, close (partial close supported).
 */
import type { SubviewSpec } from '@str/shared';

export const OPTION_INCOME_TABLE: SubviewSpec = {
  type: 'readwrite',
  name: 'Option Income',
  icon: 'TrendingUp',
  iconColor: 'orange-2',
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
                title: 'Option Income',
                actions: [
                  { title: 'Add', icon: 'plus', handler: 'addOptionTransactionModal' },
                ],
              },
              source: 'py:get_option_income_transactions',
              columns: ['date', 'instrumentSymbol', 'optionType', 'expiration', 'strike', 'callPut', 'quantity', 'premium'],
              columnLabels: {
                date: 'Date',
                instrumentSymbol: 'Symbol',
                optionType: 'Type',
                expiration: 'Exp',
                strike: 'Strike',
                callPut: 'C/P',
                quantity: 'Qty',
                premium: 'Premium',
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
    """Return option transactions (covered call, secured put). Filter by time range and ticker."""
    txs = context.get('transactions') or []
    global_inputs = inputs.get('global') or {}
    global_config = inputs.get('globalInputConfig') or []
    time_range_inp = next((c for c in global_config if c.get('type') == 'time_range'), None)
    ticker_inp = next((c for c in global_config if c.get('type') == 'ticker_selector'), None)
    time_range_id = time_range_inp.get('id') if time_range_inp else None
    ticker_id = ticker_inp.get('id') if ticker_inp else None
    time_filter = global_inputs.get(time_range_id) if time_range_id else None
    ticker = global_inputs.get(ticker_id, 'all') if ticker_id else 'all'

    if isinstance(time_filter, str):
        try:
            import json
            time_filter = json.loads(time_filter)
        except Exception:
            time_filter = None

    def is_option(tx):
        opt = tx.get('option')
        try:
            return opt is not None and hasattr(opt, 'get') and opt.get('expiration')
        except Exception:
            return False

    def is_covered_call_or_secured_put(tx):
        side = (tx.get('side') or '').lower()
        opt = tx.get('option')
        if not opt or not hasattr(opt, 'get'):
            return False
        cp = (opt.get('callPut') or 'call').lower()
        # Covered call = sell call; Secured put = sell put
        if side == 'sell' and cp == 'call':
            return True
        if side == 'sell' and cp == 'put':
            return True
        # Option roll
        if tx.get('optionRoll'):
            return True
        return False

    def in_range(tx):
        tx_date = (tx.get('timestamp') or '')[:10]
        if not time_filter or not tx_date:
            return True
        start = (time_filter.get('start') or '')[:10]
        end = (time_filter.get('end') or '')[:10]
        return (not start or tx_date >= start) and (not end or tx_date <= end)

    def symbol_ok(tx):
        sym = tx.get('instrumentSymbol')
        return ticker == 'all' or sym == ticker

    result = []
    for tx in txs:
        if not is_option(tx):
            continue
        if not is_covered_call_or_secured_put(tx):
            continue
        if not in_range(tx):
            continue
        if not symbol_ok(tx):
            continue
        opt = tx.get('option') or {}
        ts = tx.get('timestamp') or ''
        date = ts[:10] if len(ts) >= 10 else ts
        exp = opt.get('expiration') or ''
        exp_short = exp[:10] if len(exp) >= 10 else exp
        cp = (opt.get('callPut') or 'call').upper()
        cp_short = cp[0] if cp else 'C'
        side = (tx.get('side') or '').lower()
        opt_type = 'CC' if (side == 'sell' and cp == 'CALL') else ('SP' if (side == 'sell' and cp == 'PUT') else ('Roll' if tx.get('optionRoll') else ''))
        result.append({
            **tx,
            'date': date,
            'expiration': exp_short,
            'strike': opt.get('strike', 0),
            'callPut': cp_short,
            'optionType': opt_type,
            'premium': tx.get('cashDelta') or 0,
        })

    result.sort(key=lambda t: t.get('timestamp', ''), reverse=True)
    return result
`,
  functions: ['get_option_income_transactions'],
};
