/**
 * Official read-only subview: Total dividends earned for the strategy.
 * Sum of cashDelta for all dividend transactions.
 */
import type { SubviewSpec } from '@str/shared';

export const DIVIDENDS_TOTAL: SubviewSpec = {
  type: 'readonly',
  name: 'Dividends',
  icon: 'BanknoteArrowDown',
  iconColor: 'green-2',
  description: 'Total dividends earned for the strategy',
  maker: 'official',
  categories: ['stock-etf', 'income'],
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
              value: 'py:get_total_dividends',
              alignment: 'center',
              size: 'xl',
              bold: true,
              padding: { top: 8, bottom: 8 },
              format: '$',
              decimals: 2,
            },
          },
        ],
      },
    ],
  ],
  python_code: `def get_total_dividends(context, inputs):
    """Return total dividends earned (sum of cashDelta for side=dividend)."""
    txs = context.get('transactions') or []
    total = 0.0
    for tx in txs:
        side = (tx.get('side') or tx.get('type') or '').lower()
        if side != 'dividend':
            continue
        total += float(tx.get('cashDelta') or 0)
    return round(total, 2)
`,
  functions: ['get_total_dividends'],
};
