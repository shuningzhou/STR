/**
 * Official read-write subview: Table of stock/ETF transactions.
 * For strategies focused on owning stocks and ETFs (no options).
 * Filters to non-option transactions only.
 */
import type { SubviewSpec } from '@str/shared';

export const STOCK_ETF_TRANSACTIONS_TABLE: SubviewSpec = {
  type: 'readwrite',
  name: 'Stock & ETF Transactions',
  icon: 'ArrowLeftRight',
  description: 'Table of stock and ETF transactions (no options)',
  maker: 'official',
  categories: ['essential', 'stock-etf'],
  defaultSize: { w: 600, h: 100 },
  inputs: {},
  layout: [
    [
      {
        weight: 1,
        alignment: 'stretch center' as const,
        content: [
          {
            Table: {
              header: {
                title: 'Transactions',
                actions: [
                  { title: 'Add', icon: 'plus', handler: 'addTransactionModal' },
                ],
              },
              source: 'py:get_stock_etf_transactions',
              columns: ['date', 'instrumentSymbol', 'side', 'quantity', 'price', 'cashDelta'],
              columnLabels: {
                date: 'Date',
                instrumentSymbol: 'Symbol',
                side: 'Side',
                quantity: 'Qty',
                price: 'Price',
                cashDelta: 'Amount',
              },
              columnFormats: { price: 'currency', cashDelta: 'currency' },
              emptyMessage: 'No transactions',
              rowActions: [
                { title: 'Edit', icon: 'pencil', handler: 'editTransactionModal' },
                { title: 'Delete', icon: 'trash', handler: 'deleteTransaction' },
              ],
            },
          },
        ],
      },
    ],
  ],
  python_code: `def get_stock_etf_transactions(context, inputs):
    """Return non-option transactions (stocks/ETFs only), filtered by time range and ticker."""
    print("[py] get_stock_etf_transactions called")
    print("[py] context keys:", list(context.keys()) if hasattr(context, 'keys') else "N/A")
    
    txs = context.get('transactions') or []
    print("[py] raw transactions count:", len(txs))
    if txs:
        print("[py] first tx keys:", list(txs[0].keys()) if hasattr(txs[0], 'keys') else "N/A")
        print("[py] first tx option:", txs[0].get('option'), "instrumentSymbol:", txs[0].get('instrumentSymbol'))
    
    global_inputs = inputs.get('global') or {}
    global_config = inputs.get('globalInputConfig') or []
    time_range_inp = next((c for c in global_config if c.get('type') == 'time_range'), None)
    ticker_inp = next((c for c in global_config if c.get('type') == 'ticker_selector'), None)
    time_range_id = time_range_inp.get('id') if time_range_inp else None
    ticker_id = ticker_inp.get('id') if ticker_inp else None
    time_filter = global_inputs.get(time_range_id) if time_range_id else None
    ticker = global_inputs.get(ticker_id, 'all') if ticker_id else 'all'
    print("[py] global_inputs keys:", list(global_inputs.keys()) if hasattr(global_inputs, 'keys') else "N/A")
    print("[py] time_filter:", time_filter, "ticker:", ticker)
    
    if isinstance(time_filter, str):
        try:
            import json
            time_filter = json.loads(time_filter)
            print("[py] parsed time_filter:", time_filter)
        except Exception as e:
            print("[py] time_filter parse error:", e)
            time_filter = None
    
    def is_non_option(tx):
        opt = tx.get('option')
        # Pyodide: JS null becomes jsnull, not Python None - only treat dict-with-expiration as option
        try:
            is_option = (
                opt is not None
                and hasattr(opt, 'get')
                and opt.get('expiration')
            )
        except Exception:
            is_option = False
        ok = not is_option
        if not ok:
            print("[py] FILTERED (option):", tx.get('instrumentSymbol'), "option=", opt)
        return ok
    
    def in_range(tx):
        tx_date = (tx.get('timestamp') or '')[:10]
        if not time_filter or not tx_date:
            return True
        start = (time_filter.get('start') or '')[:10]
        end = (time_filter.get('end') or '')[:10]
        ok = (not start or tx_date >= start) and (not end or tx_date <= end)
        if not ok:
            print("[py] FILTERED (time_range):", tx.get('instrumentSymbol'), "tx_date=", tx_date, "range=", start, "-", end)
        return ok
    
    def symbol_ok(tx):
        sym = tx.get('instrumentSymbol')
        ok = ticker == 'all' or sym == ticker
        if not ok:
            print("[py] FILTERED (ticker):", sym, "ticker_filter=", ticker)
        return ok
    
    cash_only_sides = {'deposit', 'withdrawal', 'interest', 'fee'}
    
    result = []
    for i, tx in enumerate(txs):
        if not is_non_option(tx):
            continue
        side = (tx.get('side') or tx.get('type') or '').lower()
        if side in cash_only_sides:
            continue
        if not in_range(tx):
            continue
        if not symbol_ok(tx):
            continue
        ts = tx.get('timestamp') or ''
        date = ts[:10] if len(ts) >= 10 else ts
        result.append({
            **tx,
            'date': date,
            'side': side,
        })
    
    result.sort(key=lambda t: t.get('timestamp', ''), reverse=True)
    print("[py] result count:", len(result))
    if result:
        print("[py] first result:", result[0].get('instrumentSymbol'), result[0].get('date'), result[0].get('side'))
    return result
`,
  functions: ['get_stock_etf_transactions'],
};
