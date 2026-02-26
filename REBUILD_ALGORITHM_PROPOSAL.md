# Proposed Rebuild Algorithm: Forward Apply

## Overview

Replace the current **reverse-apply** (start from SnapTrade holdings, work backward) with a **forward-apply** approach: start from empty holdings, apply raw transactions earliest → latest, and maintain derived holdings as we go.

## Core Flow

1. Start with empty derived holdings (equity positions + option positions)
2. Sort raw transactions by timestamp ascending
3. For each transaction in order:
   - Apply it to derived holdings (or handle as unresolved multileg)
4. Resolve remaining unresolved multileg chains using SnapTrade current option holdings

## Unresolved Multileg Chains

When we see an `options_multileg`:
- We know the **closed option** (the old leg)
- We do **NOT** know the **new/opening leg**
- Create an **unresolved multileg chain**: `{ closedOptionKey, contracts: N, underlying, callPut }` — we closed N contracts of this option via a roll, and opened N contracts of ??? (unknown)

Chains are keyed by `underlying|callPut` (same as current logic). Multiple chains can exist for the same underlying+callPut if there are nested rolls.

## Resolution Rules

### Rule 1: Close transaction (option_assign, option_expire, buy-to-cover, sell-to-close)

When we see a close of option X with M contracts, and option X is **not** in derived holdings:

- Match to one unresolved chain for same underlying+callPut where the closed option matches
- Deduct M contracts from that chain
- If chain contracts → 0: **chain resolved** (remove it)
- If chain contracts > 0: chain continues, contracts = N - M

**Question A:** When multiple chains exist for same underlying+callPut, which do we match to? Options: (a) FIFO (oldest), (b) LIFO (newest), (c) match by the specific closed option symbol.

### Rule 2: Another multileg on unresolved chain

When we see another `options_multileg` that closes option X with M contracts, and option X is **not** in derived holdings:

- This multileg is a roll-on-roll (multileg on an unresolved chain)
- Match to one unresolved chain (same underlying+callPut, closed option matches)
- Deduct M from that chain
- If chain contracts → 0: **old chain resolved**. Create **new** unresolved chain with M contracts (the unknown new leg)
- If chain contracts > 0: old chain has N-M contracts. Create **new** unresolved chain with M contracts

**Question B:** Your text said "if the number of contracts in the unresolved chain reaches 0, the multileg chain is still unresolved, and the number of contract is unchanged." I interpreted this as: the *old* chain is resolved/removed, and we create a *new* unresolved chain with M contracts — so we still have something unresolved. Is that right? Or did you mean the old chain stays with 0 contracts and remains in the unresolved set?

## Final Resolution

After all raw transactions are applied:

- We have remaining unresolved chains (each: closedOptionKey, contracts, underlying, callPut)
- SnapTrade `currentHoldings` gives us the **final option positions**
- For each remaining chain: the unknown leg must be the option currently held for that underlying+callPut
- Use SnapTrade holdings to infer the new option symbol and produce the expanded buy/sell legs

## Transaction Application (Non-Multileg)

For normal transactions (buy, sell, option_assign, option_exercise, option_expire, etc.):

- Apply directly to derived holdings
- Buy/sell: update position
- option_assign: remove option, add/remove shares per put/call
- option_exercise: remove option, add/remove shares
- option_expire: remove option (short)

## Implementation Scope

- Rewrite `rebuildAccount` (or new `rebuildAccountForward`) in `snaptrade.service.ts`
- Replace `resolveMultilegChains` + reverse-apply with forward-apply + unresolved-chain tracking
- Keep `mapActivity`, `fetchAllActivities`, `rawTransactions`/`adjustedTransactions` semantics
- Incremental sync may need adjustment to align with new rebuild output format
