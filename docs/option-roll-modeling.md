# Option Roll Modeling

## What is an option roll?

An **option roll** is closing one option contract and opening another—typically to extend duration, move strike, or both. Example: close March 150 call, open April 160 call.

## Modeling options (current implementation)

### Two transactions: buy_to_cover + sell

Rolls are represented as **two transactions**:
1. `buy_to_cover` — closes the original option (same symbol, expiration, strike, callPut)
2. `sell` — opens the new option

**Pros:**
- Reuses existing model (no special transaction type)
- Matches broker statement format (two legs)
- Position aggregation in Option Income subview works naturally (sell minus buy_to_cover)
- Win-rate logic treats the close as one completed trade, the open starts a new position

**Contract identity**

Option contracts are matched by:
- `instrumentSymbol` (underlying, e.g. AAPL)
- `option.expiration` (YYYY-MM-DD)
- `option.strike`
- `option.callPut` (call | put)

## Win rate (option-only)

1. Filter transactions with `option != null`
2. **Regular trades**: Match open (buy) + close (sell) by contract identity. Trade P&L = open.cashDelta + close.cashDelta
3. **Short trades**: Match open (sell) + close (buy_to_cover) same way
4. Win rate = (trades with P&L > 0) / (total completed trades) × 100
