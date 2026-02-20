/**
 * Official read-only subview: Stacked bar chart of premium income over time.
 * Shows Covered Call (green) and Secured Put (blue) premiums by daily/weekly/monthly/annually.
 */
import type { SubviewSpec } from '@str/shared';

export const PREMIUM_INCOME_CHART: SubviewSpec = {
  type: 'readonly',
  name: 'Premium Income',
  icon: 'BarChart3',
  iconColor: 'yellow-2',
  description: 'Stacked bar chart of option premium income by Covered Call and Secured Put',
  maker: 'official',
  categories: ['essential', 'option', 'income'],
  defaultSize: { w: 700, h: 220 },
  inputs: {
    period: {
      type: 'segment',
      title: 'Period',
      options: [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'annually', label: 'Annually' },
      ],
      default: 'daily',
      topbar: 0,
      topbarShowTitle: false,
    },
  },
  layout: [
    [
      {
        flex: { flex: 1, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'stretch' },
        padding: { top: 8, bottom: 8, left: 8, right: 8 },
        content: [
          {
            Chart: {
              type: 'bar',
              source: 'py:get_premium_income_chart',
              padding: { top: 4, bottom: 0 },
            },
          },
        ],
      },
    ],
  ],
  python_code: `def get_premium_income_chart(context, inputs):
    """Return stacked bar chart data: { labels, series: [{ name, data }], colors }.
    Aggregates option premium (cashDelta) by Covered Call vs Secured Put, grouped by period."""
    from datetime import datetime
    from collections import defaultdict

    txs = context.get('transactions') or []
    period = (inputs.get('period') or 'daily').lower()
    global_inputs = inputs.get('global') or {}
    global_config = inputs.get('globalInputConfig') or []
    ticker_inp = next((c for c in global_config if c.get('type') == 'ticker_selector'), None)
    ticker_id = ticker_inp.get('id') if ticker_inp else None
    ticker = global_inputs.get(ticker_id, 'all') if ticker_id else 'all'

    # time_range from global or top-level inputs
    tr = global_inputs.get('timeRange') or global_inputs.get('time_range') or inputs.get('timeRange') or inputs.get('time_range') or {}
    if isinstance(tr, str):
        try:
            import json
            tr = json.loads(tr) if tr else {}
        except Exception:
            tr = {}
    start_str = tr.get('start') or tr.get('startDate') or ''
    end_str = tr.get('end') or tr.get('endDate') or ''

    # Aggregate premium by (bucket_key, category) where category = 'Covered Call' | 'Secured Put'
    def default_bucket():
        return {'Covered Call': 0.0, 'Secured Put': 0.0, '_label': ''}
    agg = defaultdict(default_bucket)

    for tx in txs:
        sym = tx.get('instrumentSymbol') or ''
        if ticker != 'all' and sym != ticker:
            continue
        opt = tx.get('option')
        if not opt or not opt.get('expiration'):
            continue
        cp = (opt.get('callPut') or 'call').lower()
        if cp not in ('call', 'put'):
            continue
        category = 'Covered Call' if cp == 'call' else 'Secured Put'
        ts = tx.get('timestamp') or ''
        if len(ts) < 10:
            continue
        date_str = ts[:10]
        if start_str and date_str < start_str:
            continue
        if end_str and date_str > end_str:
            continue

        side = (tx.get('side') or '').lower()
        premium = float(tx.get('cashDelta') or 0)
        if side == 'sell':
            pass  # premium is positive
        elif side == 'buy_to_cover':
            premium = -premium  # closing cost as negative
        else:
            continue

        try:
            dt = datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError:
            continue

        if period == 'daily':
            key = date_str
            label = date_str[5:10]  # MM-DD for display
        elif period == 'weekly':
            iso = dt.isocalendar()
            key = f"{date_str[:4]}-W{iso[1]:02d}"
            label = key
        elif period == 'monthly':
            key = date_str[:7]
            label = key
        else:  # annually
            key = date_str[:4]
            label = key

        agg[key][category] += premium
        agg[key]['_label'] = label

    # Build labels sorted chronologically
    keys_sorted = sorted(agg.keys())
    labels = [agg[k]['_label'] for k in keys_sorted]
    covered_call_data = [round(agg[k]['Covered Call'], 2) for k in keys_sorted]
    secured_put_data = [round(agg[k]['Secured Put'], 2) for k in keys_sorted]

    return {
        'labels': labels,
        'series': [
            {'name': 'Covered Call', 'data': covered_call_data},
            {'name': 'Secured Put', 'data': secured_put_data},
        ],
        'colors': {
            'Covered Call': 'mint-2',
            'Secured Put': 'cyan-2',
        },
    }
`,
  functions: ['get_premium_income_chart'],
};
