/**
 * Official read-only subview: Stacked bar chart of spread income over time.
 * Shows Call Credit and Put Credit spread premiums by daily/weekly/monthly/annually.
 * Includes: sell+buy (net credit when opening), buy_to_cover+sell_to_cover (net debit when closing).
 */
import type { SubviewSpec } from '@str/shared';

export const SPREAD_INCOME_CHART: SubviewSpec = {
  type: 'readonly',
  name: 'Spread Income',
  icon: 'BarChart3',
  iconColor: 'blue-2',
  description: 'Stacked bar chart of credit vertical spread income by Call Credit and Put Credit',
  maker: 'official',
  categories: ['option', 'income'],
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
    includeManualCloses: {
      type: 'checkbox',
      title: 'Include manual closes',
      default: true,
      topbar: 2,
      topbarShowTitle: true,
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
              source: 'py:get_spread_income_chart',
              padding: { top: 4, bottom: 0 },
            },
          },
        ],
      },
    ],
  ],
  python_code: `def get_spread_income_chart(context, inputs):
    """Return stacked bar chart data: { labels, series: [{ name, data }], colors }.
    Always returns exactly 10 bars. Only includes transactions with spreadId in customData."""
    from datetime import datetime, timedelta
    from collections import defaultdict

    BAR_COUNT = 10
    txs = context.get('transactions') or []
    period = (inputs.get('period') or 'daily').lower()
    chart_offset = int(inputs.get('chartOffset') or 0)
    include_manual_closes = inputs.get('includeManualCloses') not in (False, 0, 'false', '0')
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
    if not tr or (not tr.get('end') and not tr.get('endDate')):
        for tx in txs:
            ts = (tx.get('timestamp') or '')[:10]
            if ts and ts > end_str:
                end_str = ts
    range_start = start_str
    range_end = end_str

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

    agg = defaultdict(lambda: {'Call Credit': 0.0, 'Put Credit': 0.0, 'Close': 0.0, '_label': ''})
    for k in all_keys:
        agg[k]
    for k in all_keys:
        if period == 'daily':
            agg[k]['_label'] = k[5:10]
        elif period == 'weekly':
            agg[k]['_label'] = k
        elif period == 'monthly':
            agg[k]['_label'] = k
        else:
            agg[k]['_label'] = k

    txs_sorted = sorted(txs, key=lambda t: t.get('timestamp', ''))

    for tx in txs_sorted:
        spread_id = (tx.get('customData') or {}).get('spreadId')
        if not spread_id:
            continue
        sym = tx.get('instrumentSymbol') or ''
        if ticker != 'all' and sym != ticker:
            continue
        opt = tx.get('option')
        if not opt or not opt.get('expiration'):
            continue
        cp = (opt.get('callPut') or 'call').lower()
        if cp not in ('call', 'put'):
            continue
        category = 'Call Credit' if cp == 'call' else 'Put Credit'
        ts = tx.get('timestamp') or ''
        if len(ts) < 10:
            continue
        date_str = ts[:10]
        if range_start and date_str < range_start:
            continue
        if range_end and date_str > range_end:
            continue

        side = (tx.get('side') or '').lower()
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
        if key not in agg:
            continue

        if side in ('sell', 'buy'):
            agg[key][category] += premium
        elif side in ('buy_to_cover', 'sell_to_cover') and include_manual_closes:
            agg[key]['Close'] += premium

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
    call_credit_data = [round(agg[k]['Call Credit'], 2) if k in agg else 0 for k in keys_slice]
    put_credit_data = [round(agg[k]['Put Credit'], 2) if k in agg else 0 for k in keys_slice]

    series = [
        {'name': 'Call Credit', 'data': call_credit_data},
        {'name': 'Put Credit', 'data': put_credit_data},
    ]
    colors = {
        'Call Credit': 'green-1',
        'Put Credit': 'blue-1',
    }

    if include_manual_closes:
        close_data = [round(agg[k]['Close'], 2) if k in agg else 0 for k in keys_slice]
        series.append({'name': 'Close', 'data': close_data})
        colors['Close'] = 'red-1'

    return {
        'labels': labels,
        'series': series,
        'colors': colors,
    }
`,
  functions: ['get_spread_income_chart'],
};
