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
    Always returns exactly 10 bars. offset 0 = today (most recent 10). +1 = older, -1 = newer (future)."""
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
    time_range_inp = next((c for c in global_config if c.get('type') == 'time_range'), None)
    time_range_id = time_range_inp.get('id') if time_range_inp else None
    tr = global_inputs.get(time_range_id) if time_range_id else global_inputs.get('timeRange') or global_inputs.get('time_range') or {}
    if isinstance(tr, str):
        try:
            import json
            tr = json.loads(tr) if tr else {}
        except Exception:
            tr = {}
    if not isinstance(tr, dict):
        tr = {}
    start_str = (tr.get('start') or tr.get('startDate') or '')[:10]
    end_str = (tr.get('end') or tr.get('endDate') or '')[:10]
    if not end_str:
        end_dt = datetime.now()
        end_str = end_dt.strftime('%Y-%m-%d')
    if not start_str:
        start_dt = datetime.now() - timedelta(days=730)
        start_str = start_dt.strftime('%Y-%m-%d')
    # Ensure end_str includes latest tx date when using defaults (Pyodide datetime.now() may be UTC, excluding local-day txs)
    if not tr or (not tr.get('end') and not tr.get('endDate')):
        for tx in txs:
            ts = (tx.get('timestamp') or '')[:10]
            if ts and ts > end_str:
                end_str = ts
    range_start = start_str
    range_end = end_str

    # Extend range for buckets so we always have previous (+offset) and next (-offset) pages
    try:
        start_dt = datetime.strptime(start_str, '%Y-%m-%d')
        end_dt = datetime.strptime(end_str, '%Y-%m-%d')
        extra_back = max(0, chart_offset) * BAR_COUNT
        extra_forward = max(0, -chart_offset) * BAR_COUNT
        if period == 'daily':
            start_dt = start_dt - timedelta(days=extra_back)
            end_dt = end_dt + timedelta(days=extra_forward)
        elif period == 'weekly':
            start_dt = start_dt - timedelta(days=7 * extra_back)
            end_dt = end_dt + timedelta(days=7 * extra_forward)
        elif period == 'monthly':
            m = start_dt.month - 1 - extra_back
            y = start_dt.year + m // 12
            m = m % 12 + 1
            start_dt = start_dt.replace(year=y, month=m)
            m = end_dt.month - 1 + extra_forward
            y = end_dt.year + m // 12
            m = m % 12 + 1
            end_dt = end_dt.replace(year=y, month=m)
        else:
            start_dt = start_dt.replace(year=start_dt.year - extra_back)
            end_dt = end_dt.replace(year=end_dt.year + extra_forward)
        start_str = start_dt.strftime('%Y-%m-%d')
        end_str = end_dt.strftime('%Y-%m-%d')
    except ValueError:
        pass

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
        if range_start and date_str < range_start:
            continue
        if range_end and date_str > range_end:
            continue

        side = (tx.get('side') or '').lower()
        if side not in ('sell', 'buy_to_cover'):
            continue
        # cashDelta = wallet impact: positive when premium received (sell), negative when cost paid (buy_to_cover). Sum = net premium income for the day.
        premium = float(tx.get('cashDelta') or 0)

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

    # Slice: offset 0 = today (last 10), +1 = older, -1 = newer (future). start_idx = total - 10 - offset*10
    total = len(all_keys)
    start_idx = total - BAR_COUNT - chart_offset * BAR_COUNT
    start_idx = max(0, min(start_idx, total))
    end_idx = min(total, start_idx + BAR_COUNT)
    keys_slice = list(all_keys[start_idx:end_idx])

    def next_key(k):
        if period == 'daily':
            dt = datetime.strptime(k[:10], '%Y-%m-%d') + timedelta(days=1)
            return dt.strftime('%Y-%m-%d')
        if period == 'weekly':
            parts = k.split('-W')
            y, w = int(parts[0]), int(parts[1])
            jan4 = datetime(y, 1, 4)
            mon = jan4 - timedelta(days=jan4.weekday())
            monday = mon + timedelta(weeks=w - 1)
            nxt = monday + timedelta(days=7)
            y2, w2, _ = nxt.isocalendar()
            return f'{y2}-W{w2:02d}'
        if period == 'monthly':
            y, m = int(k[:4]), int(k[5:7])
            if m == 12:
                return f'{y+1}-01'
            return f'{y}-{m+1:02d}'
        return str(int(k) + 1)

    def prev_key(k):
        if period == 'daily':
            dt = datetime.strptime(k[:10], '%Y-%m-%d') - timedelta(days=1)
            return dt.strftime('%Y-%m-%d')
        if period == 'weekly':
            parts = k.split('-W')
            y, w = int(parts[0]), int(parts[1])
            jan4 = datetime(y, 1, 4)
            mon = jan4 - timedelta(days=jan4.weekday())
            monday = mon + timedelta(weeks=w - 1)
            prev = monday - timedelta(days=7)
            y2, w2, _ = prev.isocalendar()
            return f'{y2}-W{w2:02d}'
        if period == 'monthly':
            y, m = int(k[:4]), int(k[5:7])
            if m == 1:
                return f'{y-1}-12'
            return f'{y}-{m-1:02d}'
        return str(int(k) - 1)

    def key_to_label(k):
        if not k:
            return ''
        if period == 'daily':
            return k[5:10] if len(k) >= 10 else k
        return k

    # Pad to 10 bars with generated date keys so we always display a date
    if not keys_slice and all_keys:
        keys_slice = [all_keys[-1]]
    while len(keys_slice) < BAR_COUNT:
        if keys_slice:
            if end_idx >= total:
                keys_slice.insert(0, prev_key(keys_slice[0]))
            else:
                keys_slice.append(next_key(keys_slice[-1]))
        else:
            try:
                ref = datetime.strptime(range_end, '%Y-%m-%d')
                keys_slice = [ref.strftime('%Y-%m-%d') if period == 'daily' else (ref.strftime('%Y-%m') if period == 'monthly' else str(ref.year))]
            except Exception:
                keys_slice = ['']

    labels = [key_to_label(k) for k in keys_slice]
    covered_call_data = [round(agg[k]['Covered Call'], 2) if k in agg else 0 for k in keys_slice]
    secured_put_data = [round(agg[k]['Secured Put'], 2) if k in agg else 0 for k in keys_slice]

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
