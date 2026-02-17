# Option Roll Modeling

## What is an option roll?

An **option roll** is closing one option contract and opening another—typically to extend duration, move strike, or both. Example: close March 150 call, open April 160 call.

## Modeling options

### Option A: Single `option_roll` transaction type (recommended)

**One transaction** representing both legs:
- `type`: `option_roll`
- `option`: the contract being **closed**
- `optionRoll`: `{ option, optionRolledTo }` — closed and opened contracts
- `cashDelta`: net P&L (close proceeds − open cost)

**Pros:**
- Single record, clear intent
- Easy to query rolls ("show all option_roll")
- Net P&L is explicit

**Cons:**
- Schema extension required
- Some brokers report as two legs; you may need to combine on import

### Option B: Two transactions (close + open)

Roll = two separate `buy`/`sell` transactions with optional `rollGroupId` linking them.

**Pros:**
- Reuses existing model
- Matches broker statement format

**Cons:**
- Harder to query "rolls" specifically
- Win-rate logic treats them as separate: the close matches an earlier open (one completed trade), the open starts a new position

## Recommendation

Use **Option A** (`option_roll`) when you want explicit roll tracking. For win rate:
- **Matched open+close** (buy then sell, or sell then buy, same contract): one trade, P&L = sum of both cashDeltas
- **option_roll**: one trade, P&L = `cashDelta` (already net)

## Contract identity

Option contracts are matched by:
- `instrumentSymbol` (underlying, e.g. AAPL)
- `option.expiration` (YYYY-MM-DD)
- `option.strike`
- `option.callPut` (call | put)

## Win rate (option-only)

1. Filter transactions with `option != null`
2. **Regular trades**: Match open (buy) + close (sell) by contract identity. Trade P&L = open.cashDelta + close.cashDelta
3. **Short trades**: Match open (sell) + close (buy) same way
4. **Rolls**: Each `option_roll` is one trade; P&L = cashDelta
5. Win rate = (trades with P&L > 0) / (total completed trades) × 100
