/**
 * Official readonly subview: Dividend summary per symbol.
 * Shows cumulative dividend, monthly avg, dividend %, yearly est ($ and %).
 */
import type { SubviewSpec } from '@str/shared';

export const DIVIDEND_SUMMARY: SubviewSpec = {
  type: 'readonly',
  name: 'Dividend Summary',
  icon: 'CircleDollarSign',
  description: 'Dividend summary per symbol: cumulative, monthly avg, yield, yearly estimate',
  maker: 'official',
  categories: ['stock-etf', 'income'],
  defaultSize: { w: 650, h: 120 },
  inputs: {},
  layout: [
    [
      {
        flex: { flex: 1, justifyContent: 'center', alignItems: 'stretch' },
        content: [
          {
            Table: {
              header: {
                title: 'Dividend Summary',
              },
              source: 'py:get_dividend_summary',
              columns: ['instrumentSymbol', 'cumulativeDividend', 'monthlyAvg', 'dividendPct'],
              columnLabels: {
                instrumentSymbol: 'Symbol',
                cumulativeDividend: 'Cumulative',
                monthlyAvg: 'Monthly Avg',
                dividendPct: 'Div %',
              },
              columnFormats: {
                cumulativeDividend: 'currency',
                monthlyAvg: 'currency',
                dividendPct: 'percent',
              },
              emptyMessage: 'No dividend data',
            },
          },
        ],
      },
    ],
  ],
  python_code: `def get_dividend_summary(context, inputs):
    """Return dividend summary per symbol: cumulative, monthly avg, div %, yearly est ($ and %)."""
    txs = context.get('transactions') or []
    current_prices = context.get('currentPrices') or {}
    
    def is_non_option(tx):
        opt = tx.get('option')
        try:
            return not (opt is not None and hasattr(opt, 'get') and opt.get('expiration'))
        except Exception:
            return True
    
    # Aggregate dividends by symbol: total, first_date, last_date, count
    div_agg = {}
    for tx in txs:
        side = (tx.get('side') or tx.get('type') or '').lower()
        if side != 'dividend':
            continue
        sym = tx.get('instrumentSymbol')
        if not sym:
            continue
        cash = float(tx.get('cashDelta') or 0)
        ts = tx.get('timestamp') or ''
        date_str = ts[:10] if len(ts) >= 10 else ''
        if sym not in div_agg:
            div_agg[sym] = {'total': 0.0, 'first_date': date_str, 'last_date': date_str, 'count': 0}
        div_agg[sym]['total'] += cash
        div_agg[sym]['count'] += 1
        if date_str:
            if not div_agg[sym]['first_date'] or date_str < div_agg[sym]['first_date']:
                div_agg[sym]['first_date'] = date_str
            if date_str > div_agg[sym]['last_date']:
                div_agg[sym]['last_date'] = date_str
    
    # Compute holdings market value per symbol (for div %)
    cash_only = {'deposit', 'withdrawal', 'interest', 'fee'}
    agg = {}
    for tx in txs:
        if not is_non_option(tx):
            continue
        side = (tx.get('side') or tx.get('type') or '').lower()
        if side in cash_only:
            continue
        sym = tx.get('instrumentSymbol')
        inst_id = tx.get('instrumentId') or sym or ''
        if not inst_id:
            continue
        qty = int(tx.get('quantity') or 0)
        if side in ('sell', 'short'):
            qty = -qty
        if inst_id not in agg:
            agg[inst_id] = {'symbol': sym or inst_id, 'quantity': 0}
        agg[inst_id]['quantity'] += qty
    market_value_by_sym = {}
    for inst_id, row in agg.items():
        qty = row['quantity']
        if qty <= 0:
            continue
        sym = row['symbol']
        price = current_prices.get(sym) if isinstance(current_prices, dict) else None
        if price is None and hasattr(current_prices, 'get'):
            try:
                price = float(current_prices.get(sym, 0))
            except Exception:
                price = 0
        market_value_by_sym[sym] = market_value_by_sym.get(sym, 0) + qty * float(price or 0)
    
    # Build summary rows
    result = []
    for sym, d in div_agg.items():
        cumulative = d['total']
        first_d = d['first_date']
        last_d = d['last_date']
        months = 1.0
        if first_d and last_d and len(first_d) >= 10 and len(last_d) >= 10:
            try:
                y1, m1 = int(first_d[:4]), int(first_d[5:7])
                y2, m2 = int(last_d[:4]), int(last_d[5:7])
                # Inclusive calendar months (Feb to Apr = 3 months)
                months = max((y2 - y1) * 12 + (m2 - m1) + 1, 1.0)
            except Exception:
                months = 1.0
        monthly_avg = cumulative / months if months else 0
        yearly_est = monthly_avg * 12
        mv = market_value_by_sym.get(sym, 0) or 0
        div_pct = (yearly_est / mv * 100) if mv > 0 else None
        result.append({
            'instrumentSymbol': sym,
            'cumulativeDividend': round(cumulative, 2),
            'monthlyAvg': round(monthly_avg, 2),
            'dividendPct': round(div_pct, 2) if div_pct is not None else None,
        })
    
    result.sort(key=lambda r: r.get('cumulativeDividend', 0), reverse=True)
    return result
`,
  functions: ['get_dividend_summary'],
};
