/**
 * Official read-only subview: Average win dollar amount and average loss dollar amount
 * for closed credit vertical spreads.
 */
import type { SubviewSpec } from '@str/shared';

export const SPREAD_AVG_WIN_LOSS: SubviewSpec = {
  type: 'readonly',
  name: 'Spread Avg Win/Loss',
  icon: 'TrendingUp',
  iconColor: 'green-2',
  description: 'Average win $ and average loss $ for closed spreads',
  maker: 'official',
  categories: ['option'],
  defaultSize: { w: 220, h: 80 },
  inputs: {},
  layout: [
    [
      {
        flex: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
        padding: 10,
        content: [
          { text: { value: 'Avg Win', size: 'sm' } },
          { number: { value: 'py:get_spread_avg_win', format: 'currency', decimals: 2, size: 'md', bold: true } },
        ],
      },
    ],
    [
      {
        flex: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
        padding: { top: 0, right: 10, bottom: 10, left: 10 },
        content: [
          { text: { value: 'Avg Loss', size: 'sm' } },
          { number: { value: 'py:get_spread_avg_loss', format: 'currency', decimals: 2, size: 'md', bold: true } },
        ],
      },
    ],
  ],
  python_code: `def _compute_spread_avg_win_loss(context, inputs):
    """Returns (avg_win, avg_loss_magnitude). Only closed spreads."""
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
        cash = float(tx.get('cashDelta') or 0)

        if spread_id not in spreads:
            spreads[spread_id] = {'legs': {}, 'totalCash': 0}
        sp = spreads[spread_id]
        sp['totalCash'] += cash
        legs = sp['legs']
        if strike not in legs:
            legs[strike] = {'qty': 0}
        leg = legs[strike]

        if side == 'sell':
            leg['qty'] += qty
        elif side == 'buy':
            leg['qty'] += qty
        elif side == 'buy_to_cover':
            leg['qty'] -= qty
        elif side == 'sell_to_cover':
            leg['qty'] -= qty

    wins = []
    losses = []
    for spread_id, sp in spreads.items():
        legs = sp['legs']
        if len(legs) != 2:
            continue
        if not all(leg['qty'] <= 0 for leg in legs.values()):
            continue
        pnl = sp['totalCash']
        if pnl > 0:
            wins.append(pnl)
        elif pnl < 0:
            losses.append(abs(pnl))

    avg_win = round(sum(wins) / len(wins), 2) if wins else 0.0
    avg_loss = round(sum(losses) / len(losses), 2) if losses else 0.0
    return (avg_win, avg_loss)

def get_spread_avg_win(context, inputs):
    a, _ = _compute_spread_avg_win_loss(context, inputs)
    return a

def get_spread_avg_loss(context, inputs):
    _, a = _compute_spread_avg_win_loss(context, inputs)
    return a
`,
  functions: ['get_spread_avg_win', 'get_spread_avg_loss'],
};
