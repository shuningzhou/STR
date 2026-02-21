/**
 * Official read-only subview: Line chart of portfolio growth over time.
 * Plots cumulative portfolio value (cash + holdings at current prices) at each transaction date.
 */
import type { SubviewSpec } from '@str/shared';

export const PORTFOLIO_GROWTH_LINE_CHART: SubviewSpec = {
  type: 'readonly',
  name: 'Portfolio Growth',
  icon: 'TrendingUp',
  description: 'Line chart of portfolio value over time',
  maker: 'official',
  categories: ['essential', 'stock-etf'],
  defaultSize: { w: 600, h: 100 },
  icon: 'TrendingUp',
  iconColor: 'green-2',
  titleColor: 'green-2',
  inputs: {
    showDepositWithdraw: {
      type: 'checkbox',
      title: 'Show deposit',
      default: false,
      topbar: 0,
      topbarShowTitle: true,
    },
    showLoan: {
      type: 'checkbox',
      title: 'Show loan',
      default: false,
      topbar: 1,
      topbarShowTitle: true,
    },
    showHoldingsValue: {
      type: 'checkbox',
      title: 'Show holdings',
      default: false,
      topbar: 2,
      topbarShowTitle: true,
    },
  },
  layout: [
    [
      {
        flex: { flex: 1, justifyContent: 'center', alignItems: 'stretch' },
        content: [
          {
            Chart: {
              type: 'line',
              source: 'py:get_portfolio_growth',
              padding: 8,
            },
          },
        ],
      },
    ],
  ],
  python_code: `def get_portfolio_growth(context, inputs):
    """Return line chart data: { items: [{ label, value, depositWithdraw?, loan?, holdingsValue? }, ...] }.
    Portfolio value at each date = cash balance + market value of holdings.
    When showDepositWithdraw is true, also include cumulative deposit/withdraw sum (orange line).
    When showLoan is true and margin account enabled, include loan amount at each date (red line).
    When showHoldingsValue is true, include market value of holdings at each date (blue line)."""
    txs = context.get('transactions') or []
    wallet = context.get('wallet') or {}
    initial = float(wallet.get('initialBalance', 0) or 0)
    current_prices = context.get('currentPrices') or {}
    def _truthy(v):
        if v is None: return False
        if v == True or v == 1: return True
        if v == False or v == 0: return False
        try: return bool(int(v))
        except (TypeError, ValueError): return str(v).lower() in ('true', '1', 'yes')
    show_dw = _truthy(inputs.get('showDepositWithdraw'))
    show_loan = _truthy(inputs.get('showLoan'))
    show_holdings = _truthy(inputs.get('showHoldingsValue'))
    margin_enabled = bool(wallet.get('marginAccountEnabled'))

    def is_non_option(tx):
        opt = tx.get('option')
        try:
            return not (opt is not None and hasattr(opt, 'get') and opt.get('expiration'))
        except Exception:
            return True

    # Sort transactions by timestamp
    stock_txs = [t for t in txs if is_non_option(t)]
    stock_txs.sort(key=lambda t: t.get('timestamp') or '')

    if not stock_txs:
        return {'items': []}

    # Precompute cumulative deposit/withdraw at each date (for showDepositWithdraw)
    # dw_cumulative[date] = sum of deposit/withdraw cashDelta for txs with date <= date
    dw_cumulative = {}
    if show_dw:
        date_set = set()
        for t in txs:
            ts = t.get('timestamp') or ''
            d = ts[:10] if len(ts) >= 10 else ''
            if d:
                date_set.add(d)
        all_dates = ['Start'] + sorted(date_set)
        for d in all_dates:
            total = 0.0
            if d != 'Start':
                for t in txs:
                    side = (t.get('side') or t.get('type') or '').lower()
                    if side not in ('deposit', 'withdrawal'):
                        continue
                    td = (t.get('timestamp') or '')[:10]
                    if td and td <= d:
                        total += float(t.get('cashDelta') or 0)
            dw_cumulative[d] = round(total, 2)

    # Build portfolio value at each transaction date; start with initial balance
    # Group transactions by date so we process ALL txs on a date before emitting
    from itertools import groupby
    def date_of(tx):
        ts = tx.get('timestamp') or ''
        return ts[:10] if len(ts) >= 10 else ts
    stock_txs_sorted = sorted(stock_txs, key=date_of)
    cash_only_sides = {'deposit', 'withdrawal', 'interest', 'fee'}

    items = [{'label': 'Start', 'value': round(initial, 2)}]
    if show_dw:
        items[0]['depositWithdraw'] = dw_cumulative.get('Start', 0.0)
    if show_loan and margin_enabled:
        items[0]['loan'] = round(max(0.0, -initial), 2)
    if show_holdings:
        items[0]['holdingsValue'] = 0.0
    cash = initial
    agg = {}

    for date_str, group in groupby(stock_txs_sorted, key=date_of):
        if not date_str:
            continue
        # Apply all transactions on this date to state
        for tx in group:
            sym = tx.get('instrumentSymbol') or ''
            inst_id = tx.get('instrumentId') or sym or ''
            cash_delta = float(tx.get('cashDelta') or 0)
            side = (tx.get('side') or tx.get('type') or '').lower()
            cash += cash_delta
            # Skip deposit/withdrawal from holdings (cash-only)
            if side in cash_only_sides:
                continue
            if not inst_id:
                continue
            qty = int(tx.get('quantity') or 0)
            if side in ('sell', 'short'):
                qty = -qty
            if inst_id not in agg:
                agg[inst_id] = {'symbol': sym or inst_id, 'quantity': 0}
            agg[inst_id]['quantity'] += qty

        # Market value of holdings (current prices as proxy)
        mv = 0.0
        for inst_id, row in agg.items():
            q = row['quantity']
            if q <= 0:
                continue
            sym = row['symbol']
            price = current_prices.get(sym) if isinstance(current_prices, dict) else None
            if price is None:
                try:
                    price = float(current_prices.get(sym, 0)) if hasattr(current_prices, 'get') else 0
                except Exception:
                    price = 0
            mv += q * float(price)

        item = {'label': date_str, 'value': round(cash + mv, 2)}
        if show_dw:
            item['depositWithdraw'] = dw_cumulative.get(date_str, 0.0)
        if show_loan and margin_enabled:
            item['loan'] = round(max(0.0, -cash), 2)
        if show_holdings:
            item['holdingsValue'] = round(mv, 2)
        items.append(item)

    colors = {'value': 'green-2', 'depositWithdraw': 'orange-2', 'loan': 'red-2', 'holdingsValue': 'blue-1'}
    return {'items': items, 'colors': colors}
`,
  functions: ['get_portfolio_growth'],
};
