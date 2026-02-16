/**
 * Example subview spec (Load Example) - Win Rate from subviews.md
 */
export const WIN_RATE_EXAMPLE = {
  type: 'readonly',
  name: 'Win Rate Overview',
  description: 'Percentage of profitable closed trades',
  maker: 'peter',
  defaultSize: '2x1',
  inputs: {
    timeRange: { type: 'time_range', title: 'Time Range' },
    ticker: { type: 'ticker_selector', title: 'Ticker', default: 'all' },
  },
  layout: [
    [
      { weight: 1, alignment: 'left center', content: [{ text: { value: 'Win Rate', alignment: 'left' } }] },
      { alignment: 'left center', content: [{ input: { ref: 'timeRange' } }] },
      { alignment: 'left center', content: [{ input: { ref: 'ticker' } }] },
      {
        weight: 1,
        alignment: 'center middle',
        content: [{ number: { value: 'py:calc_win_rate', alignment: 'center', size: 'xl', bold: true } }],
      },
    ],
  ],
  python_code: `def calc_win_rate(context, inputs):
    txs = context['transactions']
    time_filter = inputs.get('timeRange')
    ticker = inputs.get('ticker', 'all')
    closes = []
    for tx in txs:
        if tx['side'] not in ['sell', 'buy_to_cover']:
            continue
        if time_filter and (tx['timestamp'] < time_filter['start'] or tx['timestamp'] > time_filter['end']):
            continue
        if ticker != 'all' and tx.get('instrumentSymbol') != ticker:
            continue
        closes.append(tx)
    if not closes:
        return 0.0
    winners = [tx for tx in closes if tx['cashDelta'] > 0]
    return round((len(winners) / len(closes)) * 100, 1)
`,
  functions: ['calc_win_rate'],
} as const;
