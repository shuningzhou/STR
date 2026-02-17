/**
 * Example subview spec (Load Example) - Win Rate from subviews.md
 */
export const WIN_RATE_EXAMPLE = {
  type: 'readonly',
  name: 'Win Rate',
  description: 'Percentage of profitable closed option trades',
  maker: 'peter',
  defaultSize: { w: 400, h: 70 },
  inputs: {},
  layout: [
    [
      {
        weight: 1,
        alignment: 'center middle',
        content: [
          {
            number: {
              value: 'py:calc_win_rate',
              alignment: 'center',
              size: 'xxxl',
              bold: true,
              padding: { top: 20, bottom: 20 },
              format: '%',
              decimals: 1,
            },
          },
        ],
      },
    ],
  ],
  python_code: `def calc_win_rate(context, inputs):
    txs = context['transactions']
    global_inputs = inputs.get('global') or {}
    time_filter = global_inputs.get('timeRange') if global_inputs else None
    ticker = global_inputs.get('ticker', 'all') if global_inputs else 'all'
    print(f"[calc_win_rate] inputs: timeRange={time_filter}, ticker={ticker}")
    if isinstance(time_filter, str):
        try:
            import json
            time_filter = json.loads(time_filter)
        except Exception:
            time_filter = None
    def in_range(tx):
        tx_date = (tx.get('timestamp') or '')[:10]
        if not time_filter or not tx_date:
            return True
        start, end = time_filter.get('start') or '', time_filter.get('end') or ''
        return (not start or tx_date >= start) and (not end or tx_date <= end)
    def symbol_ok(tx):
        return ticker == 'all' or tx.get('instrumentSymbol') == ticker
    def opt_key(opt):
        return (opt.get('expiration'), opt.get('strike'), opt.get('callPut'))
    option_txs = [tx for tx in txs if tx.get('option') and in_range(tx) and symbol_ok(tx)]
    option_txs.sort(key=lambda tx: tx.get('timestamp', ''))
    print(f"[calc_win_rate] filtered: {len(option_txs)} option txns (from {len(txs)} total)")
    trades = []
    long_opens = {}
    short_opens = {}
    for tx in option_txs:
        opt = tx['option']
        key = (tx.get('instrumentSymbol'), opt_key(opt))
        sym, (exp, strike, cp) = tx.get('instrumentSymbol', ''), opt_key(opt)
        side = tx.get('side', '')
        qty = max(0, tx.get('quantity', 1))
        cash = tx.get('cashDelta', 0)
        if side == 'option_roll':
            trades.append(cash)
            print(f"  roll {sym} {exp} {strike} {cp}: P&L={cash:.2f}")
            continue
        if side == 'buy':
            remaining = qty
            while remaining > 0 and short_opens.get(key):
                op = short_opens[key][0]
                match_qty = min(remaining, op['qty'])
                open_cash = op['cash'] * (match_qty / op['qty']) if op['qty'] else 0
                close_cash = cash * (match_qty / qty) if qty else 0
                pnl = open_cash + close_cash
                trades.append(pnl)
                print(f"  close short {sym} {exp} {strike} {cp}: open={open_cash:.2f}+close={close_cash:.2f} => P&L={pnl:.2f}")
                op['qty'] -= match_qty
                op['cash'] -= open_cash
                remaining -= match_qty
                if op['qty'] <= 0:
                    short_opens[key].pop(0)
            if key in short_opens and not short_opens[key]:
                del short_opens[key]
            if remaining > 0:
                long_opens.setdefault(key, []).append({'qty': remaining, 'cash': cash * (remaining / qty) if qty else 0})
        else:
            remaining = qty
            while remaining > 0 and long_opens.get(key):
                op = long_opens[key][0]
                match_qty = min(remaining, op['qty'])
                open_cash = op['cash'] * (match_qty / op['qty']) if op['qty'] else 0
                close_cash = cash * (match_qty / qty) if qty else 0
                pnl = open_cash + close_cash
                trades.append(pnl)
                print(f"  close long {sym} {exp} {strike} {cp}: open={open_cash:.2f}+close={close_cash:.2f} => P&L={pnl:.2f}")
                op['qty'] -= match_qty
                op['cash'] -= open_cash
                remaining -= match_qty
                if op['qty'] <= 0:
                    long_opens[key].pop(0)
            if key in long_opens and not long_opens[key]:
                del long_opens[key]
            if remaining > 0:
                short_opens.setdefault(key, []).append({'qty': remaining, 'cash': cash * (remaining / qty) if qty else 0})
    if not trades:
        print("[calc_win_rate] no completed trades => 0.0%")
        return 0.0
    winners = sum(1 for pnl in trades if pnl > 0)
    rate = round((winners / len(trades)) * 100, 1)
    print(f"[calc_win_rate] total={len(trades)} trades, winners={winners}, win_rate={rate}%")
    return rate
`,
  functions: ['calc_win_rate'],
} as const;
