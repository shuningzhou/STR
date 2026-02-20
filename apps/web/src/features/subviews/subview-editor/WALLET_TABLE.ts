/**
 * Official read-write subview: Wallet for non-margin account.
 * Shows balance; Deposit and Withdraw buttons in header.
 */
import type { SubviewSpec } from '@str/shared';

export const WALLET_TABLE: SubviewSpec = {
  type: 'readwrite',
  name: 'Wallet',
  icon: 'Wallet',
  description: 'Strategy wallet balance; deposit and withdraw',
  maker: 'official',
  categories: ['essential'],
  defaultSize: { w: 175, h: 40 },
  inputs: {},
  headerActions: [
    { title: 'Deposit', label: 'Deposit', handler: 'depositWallet' },
    { title: 'Withdraw', label: 'Withdraw', color: 'red-2', handler: 'withdrawWallet' },
  ],
  layout: [
    [
      {
        weight: 1,
        alignment: 'center middle',
        contentDirection: 'column',
        content: [
          {
            number: {
              value: 'py:get_wallet_balance',
              alignment: 'center',
              size: 'xl',
              bold: true,
              padding: { top: 15, bottom: 15 },
              format: '$',
              decimals: 2,
            },
          },
        ],
      },
    ],
  ],
  python_code: `def get_wallet_balance(context, inputs):
    """Return wallet balance (float)."""
    wallet = context.get('wallet') or {}
    return float(wallet.get('balance', 0))

def get_wallet_currency(context, inputs):
    """Return wallet currency (string)."""
    wallet = context.get('wallet') or {}
    return wallet.get('baseCurrency', 'USD') or 'USD'
`,
  functions: ['get_wallet_balance', 'get_wallet_currency'],
};
