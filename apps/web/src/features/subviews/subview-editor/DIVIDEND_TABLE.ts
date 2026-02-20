/**
 * Official read-write subview: Table of dividend transactions.
 * Filter to side=dividend only. Add, edit, delete dividends.
 */
import type { SubviewSpec } from '@str/shared';

export const DIVIDEND_TABLE: SubviewSpec = {
  type: 'readwrite',
  name: 'Dividends',
  icon: 'BanknoteArrowDown',
  description: 'Track dividend income from stocks and ETFs',
  maker: 'official',
  categories: ['essential', 'stock-etf', 'income'],
  defaultSize: { w: 500, h: 120 },
  inputs: {},
  headerActions: [{ title: 'Add', icon: 'plus', handler: 'addDividendTransactionModal' }],
  layout: [
    [
      {
        weight: 1,
        alignment: 'stretch center' as const,
        content: [
          {
            Table: {
              header: {
                title: 'Dividends',
              },
              source: 'py:get_dividend_transactions',
              columns: ['date', 'instrumentSymbol', 'cashDelta'],
              columnLabels: {
                date: 'Date',
                instrumentSymbol: 'Symbol',
                cashDelta: 'Amount',
              },
              columnFormats: { cashDelta: 'currency' },
              emptyMessage: 'No dividends',
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
  python_code: `def get_dividend_transactions(context, inputs):
    """Return dividend transactions (side=dividend) only, sorted by date desc."""
    txs = context.get('transactions') or []
    result = []
    for tx in txs:
        side = (tx.get('side') or tx.get('type') or '').lower()
        if side != 'dividend':
            continue
        ts = tx.get('timestamp') or ''
        date = ts[:10] if len(ts) >= 10 else ts
        result.append({
            **tx,
            'date': date,
        })
    result.sort(key=lambda t: t.get('timestamp', ''), reverse=True)
    return result
`,
  functions: ['get_dividend_transactions'],
};
