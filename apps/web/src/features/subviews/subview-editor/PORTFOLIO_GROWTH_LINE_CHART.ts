/**
 * Official read-only subview: Line chart of portfolio growth over time.
 * Portfolio = holdings value - loan + wallet (net equity).
 * Deposit line: cumulative deposit/withdraw/dividend to wallet.
 * Holdings: market value of positions. Loan: borrowed amount (margin).
 */
import type { SubviewSpec } from '@str/shared';

export const PORTFOLIO_GROWTH_LINE_CHART: SubviewSpec = {
  type: 'readonly',
  name: 'Portfolio Growth',
  icon: 'TrendingUp',
  description: 'Line chart of portfolio value over time',
  maker: 'official',
  categories: ['stock-etf'],
  defaultSize: { w: 600, h: 100 },
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
    Portfolio = holdings - loan + wallet (net equity at each date).
    Plots at every trading day (from priceHistory), not just transaction dates — reflects daily price moves.
    Uses EOD prices; forward-fills missing dates; currentPrices for today.
    """
    txs = context.get('transactions') or []
    wallet = context.get('wallet') or {}
    initial = float(wallet.get('initialBalance', 0) or 0)
    current_prices = context.get('currentPrices') or {}
    price_history = context.get('priceHistory') or {}
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

    def date_of(tx):
        ts = tx.get('timestamp') or ''
        return ts[:10] if len(ts) >= 10 else ts

    stock_txs = [t for t in txs if is_non_option(t)]
    stock_txs.sort(key=lambda t: t.get('timestamp') or '')

    if not stock_txs:
        return {'items': []}

    first_tx_date = date_of(stock_txs[0]) or ''
    from datetime import date
    today = date.today().isoformat()

    # Trading days: union of dates in priceHistory, filtered to [first_tx_date, today]
    # Fall back to transaction dates if no price history (e.g. loading)
    all_dates = set()
    for sym, hist in (price_history if isinstance(price_history, dict) else {}).items():
        if isinstance(hist, dict):
            all_dates.update(hist.keys())
    trading_dates = sorted(d for d in all_dates if d and first_tx_date <= d <= today)
    if not trading_dates:
        tx_dates = sorted({date_of(t) for t in stock_txs_sorted if date_of(t)})
        trading_dates = [d for d in tx_dates if first_tx_date <= d <= today]

    # Precompute cumulative deposit/withdraw/dividend at each date (for showDepositWithdraw)
    dw_cumulative = {}
    if show_dw:
        for d in ['Start'] + trading_dates + ([today] if today not in trading_dates else []):
            total = 0.0
            if d != 'Start':
                for t in txs:
                    side = (t.get('side') or t.get('type') or '').lower()
                    if side not in ('deposit', 'withdrawal', 'withdraw', 'dividend'):
                        continue
                    td = date_of(t)
                    if td and td <= d:
                        total += float(t.get('cashDelta') or 0)
            dw_cumulative[d] = round(total, 2)

    last_known_price = {}
    def price_for(sym, date_str):
        hist = price_history.get(sym) if isinstance(price_history, dict) else {}
        if isinstance(hist, dict) and date_str in hist:
            p = float(hist[date_str])
            last_known_price[sym] = p
            return p
        if sym in last_known_price:
            return last_known_price[sym]
        cp = current_prices.get(sym) if isinstance(current_prices, dict) else None
        if cp is not None:
            return float(cp)
        return 0.0

    stock_txs_sorted = sorted(stock_txs, key=date_of)
    cash_only_sides = {'deposit', 'withdrawal', 'withdraw', 'interest', 'fee'}

    items = [{'label': 'Start', 'value': round(initial, 2)}]
    if show_dw:
        items[0]['depositWithdraw'] = dw_cumulative.get('Start', 0.0)
    if show_loan and margin_enabled:
        items[0]['loan'] = round(max(0.0, -initial), 2)
    if show_holdings:
        items[0]['holdingsValue'] = 0.0

    cash = initial
    agg = {}
    tx_idx = 0

    for date_str in trading_dates:
        # Apply all txs with date <= date_str that we haven't applied yet
        while tx_idx < len(stock_txs_sorted):
            tx_date = date_of(stock_txs_sorted[tx_idx])
            if not tx_date or tx_date > date_str:
                break
            tx = stock_txs_sorted[tx_idx]
            cash_delta = float(tx.get('cashDelta') or 0)
            side = (tx.get('side') or tx.get('type') or '').lower()
            cash += cash_delta
            if side not in cash_only_sides:
                sym = tx.get('instrumentSymbol') or ''
                inst_id = tx.get('instrumentId') or sym or ''
                if inst_id:
                    qty = int(tx.get('quantity') or 0)
                    if side in ('sell', 'short'):
                        qty = -qty
                    if inst_id not in agg:
                        agg[inst_id] = {'symbol': sym or inst_id, 'quantity': 0}
                    agg[inst_id]['quantity'] += qty
            tx_idx += 1

        mv = 0.0
        for inst_id, row in agg.items():
            q = row['quantity']
            if q <= 0:
                continue
            sym = row['symbol']
            mv += q * float(price_for(sym, date_str))

        item = {'label': date_str, 'value': round(cash + mv, 2)}
        if show_dw:
            item['depositWithdraw'] = dw_cumulative.get(date_str, 0.0)
        if show_loan and margin_enabled:
            item['loan'] = round(max(0.0, -cash), 2)
        if show_holdings:
            item['holdingsValue'] = round(mv, 2)
        items.append(item)

    # Add today if not already in trading_dates (e.g. market closed, no EOD yet)
    if trading_dates and trading_dates[-1] < today:
        while tx_idx < len(stock_txs_sorted):
            tx = stock_txs_sorted[tx_idx]
            cash_delta = float(tx.get('cashDelta') or 0)
            side = (tx.get('side') or tx.get('type') or '').lower()
            cash += cash_delta
            if side not in cash_only_sides:
                sym = tx.get('instrumentSymbol') or ''
                inst_id = tx.get('instrumentId') or sym or ''
                if inst_id:
                    qty = int(tx.get('quantity') or 0)
                    if side in ('sell', 'short'):
                        qty = -qty
                    if inst_id not in agg:
                        agg[inst_id] = {'symbol': sym or inst_id, 'quantity': 0}
                    agg[inst_id]['quantity'] += qty
            tx_idx += 1
        mv = 0.0
        for inst_id, row in agg.items():
            q = row['quantity']
            if q <= 0:
                continue
            sym = row['symbol']
            p = price_for(sym, today)
            if p == 0 and trading_dates:
                p = price_for(sym, trading_dates[-1])
            mv += q * float(p)
        item = {'label': today, 'value': round(cash + mv, 2)}
        if show_dw:
            item['depositWithdraw'] = dw_cumulative.get(today, dw_cumulative.get(trading_dates[-1], 0.0))
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
