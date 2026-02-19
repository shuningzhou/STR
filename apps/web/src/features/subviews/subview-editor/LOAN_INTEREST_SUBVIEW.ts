/**
 * Subview: Loan interest rate and daily interest cost.
 * For margin accounts; shows APR and calculated daily interest.
 */
import type { SubviewSpec } from '@str/shared';

export const LOAN_INTEREST_SUBVIEW: SubviewSpec = {
  type: 'readonly',
  name: 'Loan Interest',
  icon: 'Percent',
  iconColor: 'red-2',
  description: 'Loan interest rate (APR) and daily interest cost',
  maker: 'official',
  categories: ['essential'],
  defaultSize: { w: 200, h: 40 },
  inputs: {},
  layout: [
    [
      {
        flex: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
        padding: 10,
        content: [
          { text: { value: 'APR', size: 'sm' } },
          { number: { value: 'py:get_loan_interest', format: '%', decimals: 2, size: 'lg', bold: true } },
        ],
      },
    ],
    [
      {
        flex: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
        padding: { top: 0, right: 10, bottom: 10, left: 10 },
        content: [
          { text: { value: 'Daily interest', size: 'sm' } },
          { number: { value: 'py:get_daily_interest', format: '$', decimals: 2, size: 'md', bold: true } },
        ],
      },
    ],
  ],
  python_code: `def get_loan_interest(context, inputs):
    """Return loan interest rate (APR) as percentage."""
    wallet = context.get('wallet') or {}
    rate = float(wallet.get('loanInterest', 0) or 0)
    return rate

def get_daily_interest(context, inputs):
    """Return daily interest cost: loan_amount * (rate/100) / 365."""
    wallet = context.get('wallet') or {}
    loan = float(wallet.get('loanAmount', 0) or 0)
    rate = float(wallet.get('loanInterest', 0) or 0)
    if loan <= 0 or rate <= 0:
        return 0.0
    return loan * (rate / 100) / 365

`,
  functions: ['get_loan_interest', 'get_daily_interest'],
};
