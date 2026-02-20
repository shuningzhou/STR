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
    chartOffset: {
      type: 'chart_nav',
      default: 0,
      min: 0,
      topbar: 1,
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
    Always returns exactly 10 bars. chartOffset scrolls back in history (0 = most recent 10)."""
    from datetime import datetime, timedelta
    from collections import defaultdict

    BAR_COUNT = 10
    txs = context.get('transactions') or []
    period = (inputs.get('period') or 'daily').lower()
    chart_offset = int(inputs.get('chartOffset') or 0)
    global_inputs = inputs.get('global') or {}
    global_config = inputs.get('globalInputConfig') or []
    ticker_inp = next((c for c in global_config if c.get('type') == 'ticker_selector'), None)
    ticker_id = ticker_inp.get('id') if ticker_inp else None
    ticker = global_inputs.get(ticker_id, 'all') if ticker_id else 'all'

    tr = global_inputs.get('timeRange') or global_inputs.get('time_range') or inputs.get('timeRange') or inputs.get('time_range') or {}
    if isinstance(tr, str):
        try:
            import json
            tr = json.loads(tr) if tr else {}
        except Exception:
            tr = {}
    start_str = tr.get('start') or tr.get('startDate') or ''
    end_str = tr.get('end') or tr.get('endDate') or ''
    if not end_str:
        end_dt = datetime.now()
        end_str = end_dt.strftime('%Y-%m-%d')
    if not start_str:
        start_dt = datetime.now() - timedelta(days=730)
        start_str = start_dt.strftime('%Y-%m-%d')

    # Build full range of buckets for period (chronological)
    def bucket_keys():
        keys = []
        try:
            cur = datetime.strptime(start_str, '%Y-%m-%d')
            end_dt = datetime.strptime(end_str, '%Y-%m-%d')
        except ValueError:
            return keys
        if period == 'daily':
            while cur <= end_dt:
                keys.append(cur.strftime('%Y-%m-%d'))
                cur += timedelta(days=1)
        elif period == 'weekly':
            cur = cur - timedelta(days=cur.weekday())
            while cur <= end_dt:
                y, w, _ = cur.isocalendar()
                keys.append(f"{y}-W{w:02d}")
                cur += timedelta(days=7)
        elif period == 'monthly':
            cur = cur.replace(day=1)
            while cur <= end_dt:
                keys.append(cur.strftime('%Y-%m'))
                if cur.month == 12:
                    cur = cur.replace(year=cur.year + 1, month=1)
                else:
                    cur = cur.replace(month=cur.month + 1)
        else:
            y = int(start_str[:4])
            ye = int(end_str[:4])
            for yy in range(y, ye + 1):
                keys.append(str(yy))
        return keys

    all_keys = bucket_keys()
    all_keys = sorted(set(all_keys))

    # Aggregate premium by bucket
    def default_bucket():
        return {'Covered Call': 0.0, 'Secured Put': 0.0, '_label': ''}
    agg = defaultdict(lambda: {'Covered Call': 0.0, 'Secured Put': 0.0, '_label': ''})
    for k in all_keys:
        agg[k]  # ensure key exists
    for k in all_keys:
        if period == 'daily':
            agg[k]['_label'] = k[5:10]
        elif period == 'weekly':
            agg[k]['_label'] = k
        elif period == 'monthly':
            agg[k]['_label'] = k
        else:
            agg[k]['_label'] = k

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
            pass
        elif side == 'buy_to_cover':
            premium = -premium
        else:
            continue

        try:
            dt = datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError:
            continue

        if period == 'daily':
            key = date_str
        elif period == 'weekly':
            iso = dt.isocalendar()
            key = date_str[:4] + '-W' + str(iso[1]).zfill(2)
        elif period == 'monthly':
            key = date_str[:7]
        else:
            key = date_str[:4]
        if key in agg:
            agg[key][category] += premium

    # Slice to 10 bars: offset 0 = last 10, offset 1 = 11-20 from end
    total = len(all_keys)
    start_idx = max(0, total - BAR_COUNT - chart_offset * BAR_COUNT)
    end_idx = min(total, start_idx + BAR_COUNT)
    keys_slice = all_keys[start_idx:end_idx]

    # Pad to 10 bars (empty at start if needed)
    while len(keys_slice) < BAR_COUNT:
        keys_slice.insert(0, '')

    labels = [agg[k]['_label'] if k else '—' for k in keys_slice]
    covered_call_data = [round(agg[k]['Covered Call'], 2) if k else 0 for k in keys_slice]
    secured_put_data = [round(agg[k]['Secured Put'], 2) if k else 0 for k in keys_slice]

    return {
        'labels': labels,
        'series': [
            {'name': 'Covered Call', 'data': covered_call_data},
            {'name': 'Secured Put', 'data': secured_put_data},
        ],
        'colors': {
            'Covered Call': 'green-1',
            'Secured Put': 'blue-1',
        },
    }
`,
  functions: ['get_premium_income_chart'],
};
