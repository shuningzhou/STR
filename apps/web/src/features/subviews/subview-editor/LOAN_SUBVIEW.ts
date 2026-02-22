/**
 * Official read-only subview: Current loan amount and loan as % of holdings.
 * Loan % = loan / holdings sum value * 100
 */
import type { SubviewSpec } from '@str/shared';

export const LOAN_SUBVIEW: SubviewSpec = {
  type: 'readonly',
  name: 'Loan',
  icon: 'Banknote',
  iconColor: 'red-2',
  description: 'Current loan amount and loan as % of holdings value',
  maker: 'official',
  categories: ['margin'],
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
              value: 'py:get_loan_amount',
              alignment: 'center',
              size: 'xl',
              bold: true,
              padding: { top: 8, bottom: 2 },
              format: '$',
              decimals: 2,
            },
          },
          {
            number: {
              value: 'py:get_loan_pct',
              alignment: 'center',
              size: 'sm',
              padding: { top: 0, bottom: 8 },
              format: '%',
              decimals: 2,
            },
          },
        ],
      },
    ],
  ],
  python_code: `def _holdings_market_value(context):
    """Return total market value of current stock/ETF holdings."""
    txs = context.get('transactions') or []
    current_prices = context.get('currentPrices') or {}

    def is_non_option(tx):
        opt = tx.get('option')
        try:
            return not (
                opt is not None
                and hasattr(opt, 'get')
                and opt.get('expiration')
            )
        except Exception:
            return True

    cash_only_sides = {'deposit', 'withdrawal', 'interest', 'fee', 'dividend'}
    agg = {}
    for tx in txs:
        if not is_non_option(tx):
            continue
        side = (tx.get('side') or tx.get('type') or '').lower()
        if side in cash_only_sides:
            continue
        sym = tx.get('instrumentSymbol')
        inst_id = tx.get('instrumentId') or sym or ''
        if not inst_id:
            continue
        qty = int(tx.get('quantity') or 0)
        cash = float(tx.get('cashDelta') or 0)
        if side in ('sell', 'short'):
            qty = -qty
        if inst_id not in agg:
            agg[inst_id] = {'symbol': sym or inst_id, 'quantity': 0, 'cost_total': 0.0}
        agg[inst_id]['quantity'] += qty
        agg[inst_id]['cost_total'] -= cash

    total = 0.0
    for row in agg.values():
        qty = row['quantity']
        if qty <= 0:
            continue
        sym = row['symbol']
        cost_total = row['cost_total']
        price = current_prices.get(sym) if isinstance(current_prices, dict) else None
        if price is None:
            try:
                price = float(current_prices.get(sym, 0)) if hasattr(current_prices, 'get') else 0
            except Exception:
                price = 0
        if price <= 0 and cost_total:
            price = cost_total / qty
        total += qty * float(price)

    return total

def get_loan_amount(context, inputs):
    """Return current loan amount from wallet."""
    wallet = context.get('wallet') or {}
    loan = float(wallet.get('loanAmount', 0) or 0)
    return round(loan, 2)

def get_loan_pct(context, inputs):
    """Return loan as % of holdings value: loan / holdings_sum * 100."""
    wallet = context.get('wallet') or {}
    loan = float(wallet.get('loanAmount', 0) or 0)
    holdings_value = _holdings_market_value(context)
    if holdings_value <= 0:
        return 0.0
    return round(loan / holdings_value * 100, 2)
`,
  functions: ['get_loan_amount', 'get_loan_pct'],
};
