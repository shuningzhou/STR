/**
 * Official read-only subview: Win rate of closed credit vertical spreads.
 * Profiting spread trade = win, losing spread trade = loss.
 */
import type { SubviewSpec } from '@str/shared';

export const SPREAD_WIN_RATE: SubviewSpec = {
  type: 'readonly',
  name: 'Spread Win Rate',
  icon: 'Target',
  iconColor: 'green-2',
  description: '% of closed credit spreads that were profitable',
  maker: 'official',
  categories: ['option'],
  defaultSize: { w: 175, h: 40 },
  inputs: {},
  layout: [
    [
      {
        weight: 1,
        alignment: 'center middle' as const,
        content: [
          {
            number: {
              value: 'py:get_spread_win_rate',
              alignment: 'center',
              size: 'xl',
              bold: true,
              padding: { top: 15, bottom: 15 },
              format: '%',
              decimals: 1,
            },
          },
        ],
      },
    ],
  ],
  python_code: `def get_spread_win_rate(context, inputs):
    """Return win rate of closed credit vertical spreads. Win = P&L > 0, Loss = P&L <= 0."""
    txs = sorted(context.get('transactions') or [], key=lambda t: t.get('timestamp', ''))
    global_inputs = inputs.get('global') or {}
    global_config = inputs.get('globalInputConfig') or []
    ticker_inp = next((c for c in global_config if c.get('type') == 'ticker_selector'), None)
    ticker_id = ticker_inp.get('id') if ticker_inp else None
    ticker = global_inputs.get(ticker_id, 'all') if ticker_id else 'all'

    spreads = {}
    for tx in txs:
        spread_id = (tx.get('customData') or {}).get('spreadId')
        if not spread_id:
            continue
        sym = tx.get('instrumentSymbol') or ''
        if ticker != 'all' and sym != ticker:
            continue
        opt = tx.get('option')
        if not opt or not opt.get('expiration'):
            continue
        side = (tx.get('side') or '').lower()
        qty = tx.get('quantity') or 0
        strike = opt.get('strike', 0)
        cp = (opt.get('callPut') or 'call').lower()
        cash = float(tx.get('cashDelta') or 0)

        if spread_id not in spreads:
            spreads[spread_id] = {'legs': {}, 'sym': sym, 'cp': cp, 'totalCash': 0}
        sp = spreads[spread_id]
        sp['totalCash'] += cash
        legs = sp['legs']
        if strike not in legs:
            legs[strike] = {'qty': 0, 'side': None}
        leg = legs[strike]

        if side == 'sell':
            leg['qty'] += qty
            leg['side'] = 'sell'
        elif side == 'buy':
            leg['qty'] += qty
            leg['side'] = 'buy'
        elif side == 'buy_to_cover':
            leg['qty'] -= qty
        elif side == 'sell_to_cover':
            leg['qty'] -= qty

    closed_count = 0
    winners = 0
    for spread_id, sp in spreads.items():
        legs = sp['legs']
        if len(legs) != 2:
            continue
        all_closed = all(leg['qty'] <= 0 for leg in legs.values())
        if all_closed:
            closed_count += 1
            if sp['totalCash'] > 0:
                winners += 1

    if closed_count == 0:
        return 0.0
    return round((winners / closed_count) * 100, 1)
`,
  functions: ['get_spread_win_rate'],
};
