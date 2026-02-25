/**
 * Official read-only subview: Total interest paid for the strategy.
 * Sum of cashDelta for all interest transactions (interest payments are typically negative).
 */
import type { SubviewSpec } from '@str/shared';

export const INTEREST_PAID_SUBVIEW: SubviewSpec = {
  type: 'readonly',
  name: 'Interest Paid',
  icon: 'Percent',
  iconColor: 'red-2',
  description: 'Total interest paid for the strategy',
  maker: 'official',
  categories: ['margin', 'income'],
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
              value: 'py:get_total_interest_paid',
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
  python_code: `def get_total_interest_paid(context, inputs):
    """Return total interest paid (sum of cashDelta for side=interest). Interest payments are typically negative."""
    txs = context.get('transactions') or []
    total = 0.0
    for tx in txs:
        side = (tx.get('side') or tx.get('type') or '').lower()
        if side != 'interest':
            continue
        total += float(tx.get('cashDelta') or 0)
    return round(total, 2)
`,
  functions: ['get_total_interest_paid'],
};
