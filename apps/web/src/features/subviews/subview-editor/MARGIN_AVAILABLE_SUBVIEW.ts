/**
 * Official read-only subview: Margin available and Buying power from wallet.
 */
import type { SubviewSpec } from '@str/shared';

export const MARGIN_AVAILABLE_SUBVIEW: SubviewSpec = {
  type: 'readonly',
  name: 'Margin Available',
  icon: 'Wallet',
  iconColor: 'blue-2',
  description: 'Margin available and buying power',
  maker: 'official',
  categories: ['margin'],
  defaultSize: { w: 220, h: 80 },
  inputs: {},
  layout: [
    [
      {
        flex: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
        padding: 10,
        content: [
          { text: { value: 'Margin available', size: 'sm' } },
          { number: { value: 'py:get_margin_available', format: 'currency', decimals: 2, size: 'md', bold: true } },
        ],
      },
    ],
    [
      {
        flex: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
        padding: { top: 0, right: 10, bottom: 10, left: 10 },
        content: [
          { text: { value: 'Buying power', size: 'sm' } },
          { number: { value: 'py:get_buying_power', format: 'currency', decimals: 2, size: 'md', bold: true } },
        ],
      },
    ],
  ],
  python_code: `def get_margin_available(context, inputs):
    """Return margin available from wallet (after borrow amount)."""
    wallet = context.get('wallet') or {}
    return round(float(wallet.get('marginAvailable', 0) or 0), 2)

def get_buying_power(context, inputs):
    """Return buying power from wallet."""
    wallet = context.get('wallet') or {}
    return round(float(wallet.get('buyingPower', 0) or 0), 2)
`,
  functions: ['get_margin_available', 'get_buying_power'],
};
