/**
 * Official read-write subview: Wallet for non-margin account.
 * Shows balance; Deposit and Withdraw buttons in header.
 */
import type { SubviewSpec } from '@str/shared';

export const WALLET_TABLE: SubviewSpec = {
  type: 'readwrite',
  name: 'Wallet',
  description: 'Strategy wallet balance; deposit and withdraw',
  maker: 'official',
  categories: ['essential'],
  defaultSize: { w: 320, h: 100 },
  inputs: {},
  headerActions: [
    { title: 'Deposit', icon: 'plus', handler: 'depositWallet' },
    { title: 'Withdraw', icon: 'minus', handler: 'withdrawWallet' },
  ],
  layout: [
    [
      {
        flex: { flex: 1, justifyContent: 'center', alignItems: 'stretch' },
        content: [
          {
            number: {
              value: 'py:get_wallet_balance',
              alignment: 'center',
              size: 'xl',
              bold: true,
              format: '$',
              decimals: 2,
              padding: 10,
            },
          },
          {
            text: {
              value: 'py:get_wallet_currency',
              alignment: 'center',
              size: 'sm',
              padding: { top: 0, bottom: 10 },
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
