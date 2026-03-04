import type { SubviewSpec } from '@str/shared';

export const OPTIMIZED_LOAN: SubviewSpec = {
  type: 'readonly',
  name: 'Optimized Loan',
  icon: 'Target',
  iconColor: 'indigo-2',
  description: 'Optimal loan based on target amplification with margin health gauge',
  maker: 'official',
  categories: ['margin'],
  defaultSize: { w: 375, h: 200 },
  inputs: {
    targetAmplification: {
      type: 'slider',
      title: 'Target Amplification',
      default: 25,
      min: 0,
      max: 100,
      step: 1,
      suffix: '%',
      hideValue: true,
      hideLabel: true,
    },
  },
  layout: [
    [
      {
        flex: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        padding: { top: 6, left: 12, right: 12, bottom: 0 },
        content: [
          { text: { value: 'Target Amplification %', size: 'xs', bold: true } },
          { text: { value: 'py:get_target_amplification_label', size: 'sm', bold: true } },
        ],
      },
    ],
    [
      {
        flex: { flex: 1 },
        padding: { top: 15, left: 12, right: 12, bottom: 15 },
        content: [
          { input: { ref: 'targetAmplification' } },
        ],
      },
    ],
    [
      {
        flex: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        padding: { top: 6, left: 12, right: 12, bottom: 2 },
        content: [
          { text: { value: 'Net Equity', size: 'sm' } },
          { number: { value: 'py:get_net_equity', size: 'sm', bold: true, format: '$', decimals: 2 } },
        ],
      },
    ],
    [
      {
        flex: { flex: 1 },
        padding: { top: 0, left: 12, right: 12, bottom: 4 },
        content: [
          { text: { value: 'holdings − loan + collateral available + collateral cash', size: 'xs', color: 'grey-2' } },
        ],
      },
    ],
    [
      {
        flex: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        padding: { top: 4, left: 12, right: 12, bottom: 2 },
        content: [
          { text: { value: 'Optimal Loan', size: 'sm' } },
          { number: { value: 'py:get_optimal_loan', size: 'sm', bold: true, format: '$', decimals: 2 } },
        ],
      },
    ],
    [
      {
        flex: { flex: 1 },
        padding: { top: 0, left: 12, right: 12, bottom: 4 },
        content: [
          { text: { value: 'py:get_optimal_loan_formula', size: 'xs', color: 'grey-2' } },
        ],
      },
    ],
    [
      {
        flex: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        padding: { top: 4, left: 12, right: 12, bottom: 2 },
        content: [
          { text: { value: 'Current Loan', size: 'sm' } },
          { number: { value: 'py:get_current_loan', size: 'sm', bold: true, format: '$', decimals: 2 } },
        ],
      },
    ],
    [
      {
        flex: { flex: 1 },
        padding: { top: 0, left: 12, right: 12, bottom: 4 },
        content: [
          { text: { value: 'loan + borrow amount', size: 'xs', color: 'grey-2' } },
        ],
      },
    ],
    [
      {
        flex: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
        padding: { top: 4, left: 12, right: 12, bottom: 6 },
        content: [
          { text: { value: 'py:get_borrow_message', size: 'sm', bold: true, alignment: 'center', color: 'py:get_loan_status_color' } },
        ],
      },
    ],
    [
      {
        flex: { flex: 1, flexDirection: 'column' },
        padding: { top: 0, left: 12, right: 12 },
        content: [{ separator: { orientation: 'horizontal', padding: { top: 5, bottom: 5 } } }],
      },
    ],
    [
      {
        flex: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
        padding: { top: 8, left: 12, right: 12, bottom: 4 },
        content: [
          { text: { value: 'py:get_margin_verdict', size: 'lg', bold: true, alignment: 'center', color: 'py:get_margin_verdict_color' } },
        ],
      },
    ],
    [
      {
        flex: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        padding: { top: 4, left: 12, right: 12, bottom: 2 },
        content: [
          { text: { value: 'Holdings after crash', size: 'sm' } },
          { number: { value: 'py:get_holdings_after_crash', size: 'sm', bold: true, format: '$', decimals: 2 } },
        ],
      },
    ],
    [
      {
        flex: { flex: 1 },
        padding: { top: 0, left: 12, right: 12, bottom: 4 },
        content: [
          { text: { value: 'py:get_holdings_after_crash_formula', size: 'xs', color: 'grey-2' } },
        ],
      },
    ],
    [
      {
        flex: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        padding: { top: 4, left: 12, right: 12, bottom: 2 },
        content: [
          { text: { value: 'Collateral after crash', size: 'sm' } },
          { number: { value: 'py:get_collateral_after_crash', size: 'sm', bold: true, format: '$', decimals: 2 } },
        ],
      },
    ],
    [
      {
        flex: { flex: 1 },
        padding: { top: 0, left: 12, right: 12, bottom: 4 },
        content: [
          { text: { value: 'py:get_collateral_after_crash_formula', size: 'xs', color: 'grey-2' } },
        ],
      },
    ],
    [
      {
        flex: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        padding: { top: 4, left: 12, right: 12, bottom: 2 },
        content: [
          { text: { value: 'Margin required', size: 'sm' } },
          { number: { value: 'py:get_margin_required_at_crash', size: 'sm', bold: true, format: '$', decimals: 2 } },
        ],
      },
    ],
    [
      {
        flex: { flex: 1 },
        padding: { top: 0, left: 12, right: 12, bottom: 4 },
        content: [
          { text: { value: 'py:get_margin_required_formula', size: 'xs', color: 'grey-2' } },
        ],
      },
    ],
    [
      {
        flex: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
        padding: { top: 0, left: 12, bottom: 5 },
        content: [
          { Chart: { type: 'gauge', source: 'py:get_margin_health' } },
        ],
      },
      {
        flex: { flex: 1, flexDirection: 'column', justifyContent: 'center' },
        padding: { top: 0, right: 12, bottom: 4 },
        content: [
          { text: { value: 'py:get_margin_message', size: 'xs', padding: { bottom: 8 } } },
        ],
      },
    ],
    [
      {
        flex: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
        padding: { top: 4, left: 12, right: 12, bottom: 6 },
        marginTop: -20,
        content: [
          { text: { value: 'py:get_max_crash_calculation', size: 'xs', color: 'grey-2', alignment: 'center' } },
        ],
      },
    ],
  ],
  python_code: `
def _holdings_market_value(context):
    precomputed = context.get('holdings')
    if precomputed is not None and isinstance(precomputed, list):
        return sum(float(h.get('marketValue', 0) or 0) for h in precomputed)
    txs = context.get('transactions') or []
    current_prices = context.get('currentPrices') or {}
    def is_non_option(tx):
        opt = tx.get('option')
        try:
            return not (opt is not None and hasattr(opt, 'get') and opt.get('expiration'))
        except Exception:
            return True
    cash_only_sides = {'deposit', 'withdrawal', 'interest', 'fee', 'dividend'}
    agg = {}
    for tx in txs:
        side = (tx.get('side') or tx.get('type') or '').lower()
        if side in cash_only_sides:
            continue
        if side == 'option_assign':
            opt = tx.get('option') or {}
            if not opt.get('expiration'):
                continue
            contracts = int(tx.get('quantity') or 0)
            mult = int(opt.get('multiplier') or 100)
            cp = (opt.get('callPut') or 'call').lower()
            qty = contracts * mult if cp == 'put' else -contracts * mult
            sym = tx.get('instrumentSymbol')
            inst_id = tx.get('instrumentId') or sym or ''
            if not inst_id:
                continue
            cash = float(tx.get('cashDelta') or 0)
        else:
            if not is_non_option(tx):
                continue
            sym = tx.get('instrumentSymbol')
            inst_id = tx.get('instrumentId') or sym or ''
            if not inst_id:
                continue
            qty = int(tx.get('quantity') or 0)
            cash = float(tx.get('cashDelta') or 0)
            if side in ('sell', 'short'):
                qty = -qty
        if inst_id not in agg:
            agg[inst_id] = {'symbol': sym or inst_id, 'quantity': 0, 'cost_total': 0.0}
        agg[inst_id]['quantity'] += qty
        agg[inst_id]['cost_total'] -= cash
    total = 0.0
    for row in agg.values():
        qty = row['quantity']
        if qty <= 0:
            continue
        sym = row['symbol']
        cost_total = row['cost_total']
        price = current_prices.get(sym) if isinstance(current_prices, dict) else None
        if price is None:
            try:
                price = float(current_prices.get(sym, 0)) if hasattr(current_prices, 'get') else 0
            except Exception:
                price = 0
        if price <= 0 and cost_total:
            price = cost_total / qty
        total += qty * float(price)
    return total

def _holdings_per_symbol(context):
    """Return {symbol: market_value} for each held stock/ETF."""
    precomputed = context.get('holdings')
    if precomputed is not None and isinstance(precomputed, list):
        return {str(h.get('instrumentSymbol', h.get('symbol', ''))): float(h.get('marketValue', 0) or 0) for h in precomputed if h.get('instrumentSymbol') or h.get('symbol')}
    txs = context.get('transactions') or []
    current_prices = context.get('currentPrices') or {}
    def is_non_option(tx):
        opt = tx.get('option')
        try:
            return not (opt is not None and hasattr(opt, 'get') and opt.get('expiration'))
        except Exception:
            return True
    cash_only_sides = {'deposit', 'withdrawal', 'interest', 'fee', 'dividend'}
    agg = {}
    for tx in txs:
        side = (tx.get('side') or tx.get('type') or '').lower()
        if side in cash_only_sides:
            continue
        if side == 'option_assign':
            opt = tx.get('option') or {}
            if not opt.get('expiration'):
                continue
            contracts = int(tx.get('quantity') or 0)
            mult = int(opt.get('multiplier') or 100)
            cp = (opt.get('callPut') or 'call').lower()
            qty = contracts * mult if cp == 'put' else -contracts * mult
            sym = tx.get('instrumentSymbol')
            inst_id = tx.get('instrumentId') or sym or ''
            if not inst_id:
                continue
            cash = float(tx.get('cashDelta') or 0)
        else:
            if not is_non_option(tx):
                continue
            sym = tx.get('instrumentSymbol')
            inst_id = tx.get('instrumentId') or sym or ''
            if not inst_id:
                continue
            qty = int(tx.get('quantity') or 0)
            cash = float(tx.get('cashDelta') or 0)
            if side in ('sell', 'short'):
                qty = -qty
        if inst_id not in agg:
            agg[inst_id] = {'symbol': sym or inst_id, 'quantity': 0, 'cost_total': 0.0}
        agg[inst_id]['quantity'] += qty
        agg[inst_id]['cost_total'] -= cash
    result = {}
    for row in agg.values():
        qty = row['quantity']
        if qty <= 0:
            continue
        sym = row['symbol']
        cost_total = row['cost_total']
        price = current_prices.get(sym) if isinstance(current_prices, dict) else None
        if price is None:
            try:
                price = float(current_prices.get(sym, 0)) if hasattr(current_prices, 'get') else 0
            except Exception:
                price = 0
        if price <= 0 and cost_total:
            price = cost_total / qty
        result[sym] = qty * float(price)
    return result

def get_target_amplification_label(context, inputs):
    val = int(inputs.get('targetAmplification', 25))
    return "%d%%" % val

def _wallet_fields(context):
    wallet = context.get('wallet') or {}
    loan = float(wallet.get('loanAmount', 0) or 0)
    borrow = float(wallet.get('borrowAmount', 0) or 0)
    col_sec = float(wallet.get('collateralSecurities', 0) or 0)
    col_cash = float(wallet.get('collateralCash', 0) or 0)
    col_req = float(wallet.get('collateralRequirement', 0) or 0)
    margin_req = float(wallet.get('marginRequirement', 0) or 0)
    return loan, borrow, col_sec, col_cash, col_req, margin_req

def get_net_equity(context, inputs):
    holdings_value = _holdings_market_value(context)
    loan, _, col_sec, col_cash, col_req, _ = _wallet_fields(context)
    col_available = col_sec * (1 - col_req / 100)
    net_equity = holdings_value - loan + col_available + col_cash
    return round(net_equity, 2)

def get_optimal_loan(context, inputs):
    holdings_value = _holdings_market_value(context)
    loan, _, col_sec, col_cash, col_req, _ = _wallet_fields(context)
    col_available = col_sec * (1 - col_req / 100)
    net_equity = holdings_value - loan + col_available + col_cash
    target = float(inputs.get('targetAmplification', 25)) / 100
    return round(net_equity * target, 2)

def get_optimal_loan_formula(context, inputs):
    target = int(inputs.get('targetAmplification', 25))
    return "net equity × (target amplification / 100) = net equity × %d%%" % target

def get_current_loan(context, inputs):
    """Return effective current loan: actual loan + borrowed margin amount."""
    loan, borrow, _, _, _, _ = _wallet_fields(context)
    return round(loan + borrow, 2)

def get_loan_status_color(context, inputs):
    optimal = get_optimal_loan(context, inputs)
    current = get_current_loan(context, inputs)
    return "green-2" if current <= optimal else "red-2"

def get_borrow_message(context, inputs):
    optimal = get_optimal_loan(context, inputs)
    current = get_current_loan(context, inputs)
    diff = optimal - current
    if abs(diff) < 0.01:
        return "Loan matches target"
    sign = "Under" if diff > 0 else "Over"
    return "%s-borrowed by $%s" % (sign, "{:,.2f}".format(abs(diff)))

def _max_crash_pct(context, inputs):
    """Binary search for max crash % where: (holdings after crash + collateral after crash − optimal loan) ≥ margin required."""
    holdings_per_sym = _holdings_per_symbol(context)
    holdings_value = sum(holdings_per_sym.values())
    loan, _, col_sec, col_cash, col_req, strategy_margin_req = _wallet_fields(context)
    inst_margin_reqs = context.get('instrumentMarginRequirements') or {}
    target = float(inputs.get('targetAmplification', 25)) / 100
    col_available = col_sec * (1 - col_req / 100)
    net_equity = holdings_value - loan + col_available + col_cash
    optimal_loan = net_equity * target

    if optimal_loan <= 0:
        return 100.0

    lo, hi = 0.0, 100.0
    for _ in range(64):
        mid = (lo + hi) / 2
        crash = mid / 100
        h_after = holdings_value * (1 - crash)
        col_sec_after = col_sec * (1 - crash)
        col_avail_after = col_sec_after * (1 - col_req / 100) + col_cash
        left_side = h_after + col_avail_after - optimal_loan

        margin_required_after = 0.0
        for sym, val in holdings_per_sym.items():
            val_after = val * (1 - crash)
            req_pct = float(inst_margin_reqs.get(sym, 0)) if isinstance(inst_margin_reqs, dict) else 0
            if req_pct <= 0:
                req_pct = strategy_margin_req
            margin_required_after += val_after * (req_pct / 100)

        if left_side >= margin_required_after:
            lo = mid
        else:
            hi = mid
    return round(lo, 1)

def get_margin_verdict(context, inputs):
    h = get_margin_health(context, inputs)
    return h.get("verdict", "") if isinstance(h, dict) else ""

def get_margin_verdict_color(context, inputs):
    h = get_margin_health(context, inputs)
    color = h.get("verdictColor", "grey") if isinstance(h, dict) else "grey"
    # Use built-in color system: green-2, yellow-2, orange-2, red-2
    builtin_map = {"green": "green-2", "yellow": "yellow-2", "orange": "orange-2", "red": "red-2"}
    return builtin_map.get(color, "grey-2")

def get_margin_health(context, inputs):
    crash_pct = _max_crash_pct(context, inputs)
    if crash_pct >= 80:
        verdict = "Crash-proof"
        color = "green"
    elif crash_pct >= 50:
        verdict = "Resilient"
        color = "yellow"
    elif crash_pct >= 25:
        verdict = "Fragile"
        color = "orange"
    else:
        verdict = "One bad day away"
        color = "red"
    return {"value": crash_pct, "label": "%g%%" % crash_pct, "verdict": verdict, "verdictColor": color}

def get_margin_message(context, inputs):
    crash_pct = _max_crash_pct(context, inputs)
    holdings_value = _holdings_market_value(context)
    drop_amount = holdings_value * (crash_pct / 100)
    return "Investments would have to drop %g%% ($%s) to face a margin call." % (crash_pct, "{:,.0f}".format(drop_amount))

def _crash_values_at_pct(context, inputs, crash_pct):
    """Return (holdings_after, collateral_after, margin_required) at given crash %."""
    holdings_per_sym = _holdings_per_symbol(context)
    holdings_value = sum(holdings_per_sym.values())
    loan, borrow, col_sec, col_cash, col_req, strategy_margin_req = _wallet_fields(context)
    inst_margin_reqs = context.get('instrumentMarginRequirements') or {}
    target = float(inputs.get('targetAmplification', 25)) / 100
    col_available = col_sec * (1 - col_req / 100)
    net_equity = holdings_value - loan + col_available + col_cash
    optimal_loan = net_equity * target

    crash = crash_pct / 100
    h_after = holdings_value * (1 - crash)
    col_sec_after = col_sec * (1 - crash)
    col_avail_after = col_sec_after * (1 - col_req / 100) + col_cash

    margin_required_after = 0.0
    for sym, val in holdings_per_sym.items():
        val_after = val * (1 - crash)
        req_pct = float(inst_margin_reqs.get(sym, 0)) if isinstance(inst_margin_reqs, dict) else 0
        if req_pct <= 0:
            req_pct = strategy_margin_req
        margin_required_after += val_after * (req_pct / 100)

    return h_after, col_avail_after, margin_required_after

def get_holdings_after_crash(context, inputs):
    crash_pct = _max_crash_pct(context, inputs)
    h_after, _, _ = _crash_values_at_pct(context, inputs, crash_pct)
    return round(h_after, 2)

def get_holdings_after_crash_formula(context, inputs):
    crash_pct = _max_crash_pct(context, inputs)
    return "holdings × (1 − crash%%) = holdings × (1 − %g%%)" % crash_pct

def get_collateral_after_crash(context, inputs):
    crash_pct = _max_crash_pct(context, inputs)
    _, col_after, _ = _crash_values_at_pct(context, inputs, crash_pct)
    return round(col_after, 2)

def get_collateral_after_crash_formula(context, inputs):
    return "collateral securities × (1 − crash%) × (1 − collateral req%) + collateral cash"

def get_margin_required_at_crash(context, inputs):
    crash_pct = _max_crash_pct(context, inputs)
    _, _, margin_req = _crash_values_at_pct(context, inputs, crash_pct)
    return round(margin_req, 2)

def get_margin_required_formula(context, inputs):
    return "Σ (each holding × (1 − crash%) × its margin req%)"

def get_max_crash_calculation(context, inputs):
    """Show actual amounts: holdings after crash + collateral after crash − optimal loan = X > margin required"""
    crash_pct = _max_crash_pct(context, inputs)
    h_after, col_after, margin_req = _crash_values_at_pct(context, inputs, crash_pct)
    optimal_loan = get_optimal_loan(context, inputs)
    left_side = h_after + col_after - optimal_loan
    return "%s + %s − %s = %s > %s" % (
        "{:.2f}".format(h_after),
        "{:.2f}".format(col_after),
        "{:.2f}".format(optimal_loan),
        "{:.2f}".format(left_side),
        "{:.2f}".format(margin_req),
    )
`,
  functions: [
    'get_target_amplification_label',
    'get_net_equity',
    'get_optimal_loan_formula',
    'get_optimal_loan',
    'get_current_loan',
    'get_loan_status_color',
    'get_borrow_message',
    'get_margin_verdict',
    'get_margin_verdict_color',
    'get_margin_health',
    'get_margin_message',
    'get_holdings_after_crash',
    'get_holdings_after_crash_formula',
    'get_collateral_after_crash',
    'get_collateral_after_crash_formula',
    'get_margin_required_at_crash',
    'get_margin_required_formula',
    'get_max_crash_calculation',
  ],
};
