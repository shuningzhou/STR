# Models

Complete JSON shapes for all data models. Enum properties list all possible values.

---

## Enums

### TransactionType
| Value |
|-------|
| `buy` |
| `sell` |
| `dividend` |
| `deposit` |
| `withdrawal` |
| `fee` |
| `interest` |
| `option_exercise` |
| `option_assign` |
| `option_expire` |
| `option_roll` |

### AssetType
| Value |
|-------|
| `stock` |
| `etf` |
| `option` |
| `bond` |
| `crypto` |
| `cash` |
| `other` |

### CacheStatus
| Value |
|-------|
| `valid` |
| `invalid` |

### SubscriptionStatus
| Value |
|-------|
| `free` |
| `active` |
| `past_due` |
| `cancelled` |

---

## User

```json
{
  "_id": "user-1",
  "email": "user@example.com",
  "subscriptionStatus": "active",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

| Property | Type | Enum |
|----------|------|------|
| `_id` | string | — |
| `email` | string | — |
| `subscriptionStatus` | string | `free`, `active`, `past_due`, `cancelled` |
| `createdAt` | string (ISO 8601) | — |

---

## Strategy

```json
{
  "_id": "strat-1",
  "userId": "user-1",
  "name": "My Strategy",
  "walletId": "wallet-1",
  "customData": {},
  "transactionsVersion": 1,
  "subviews": [],
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

| Property | Type |
|----------|------|
| `_id` | string |
| `userId` | string |
| `name` | string |
| `walletId` | string \| null |
| `customData` | object |
| `transactionsVersion` | number |
| `subviews` | Subview[] |
| `createdAt` | string (ISO 8601) |
| `updatedAt` | string (ISO 8601) |

---

## Subview (embedded in Strategy)

```json
{
  "id": "sv-1",
  "name": "Win Rate",
  "position": { "x": 0, "y": 0, "w": 15, "h": 14 },
  "spec": { "type": "readonly", "name": "Win Rate", "layout": [], "python_code": "", "functions": [] },
  "templateId": null,
  "icon": "ChartPie",
  "iconColor": null,
  "inputValues": {},
  "cacheData": null,
  "cachedAt": null,
  "cacheVersion": 0,
  "cacheStatus": "invalid"
}
```

| Property | Type | Enum |
|----------|------|------|
| `id` | string | — |
| `name` | string | — |
| `position` | SubviewPosition | — |
| `spec` | SubviewSpec | JSON+Python spec (see subviews.md); primary content |
| `templateId` | string \| null | When added from gallery |
| `icon` | string \| null | Lucide icon name (overrides spec.icon) |
| `iconColor` | string \| null | Overrides spec.iconColor |
| `inputValues` | object | Runtime values for spec.inputs |
| `pipeline` | object \| null | @deprecated Legacy, replaced by spec |
| `cacheData` | unknown \| null | — |
| `cachedAt` | string \| null | — |
| `cacheVersion` | number | — |
| `cacheStatus` | string | `valid`, `invalid` |

### SubviewPosition
| Property | Type |
|----------|------|
| `x` | number |
| `y` | number |
| `w` | number |
| `h` | number |

---

## Wallet

```json
{
  "_id": "wallet-1",
  "strategyId": "strat-1",
  "baseCurrency": "CAD",
  "balance": 25000.0,
  "margin": 0,
  "collateralValue": 0,
  "collateralMarginRequirement": 0
}
```

| Property | Type |
|----------|------|
| `_id` | string |
| `strategyId` | string |
| `baseCurrency` | string |
| `balance` | number |
| `margin` | number |
| `collateralValue` | number |
| `collateralMarginRequirement` | number |

---

## Instrument

```json
{
  "_id": "inst-1",
  "symbol": "AAPL",
  "assetType": "stock",
  "currency": "USD",
  "contractMetadata": {},
  "marginRequirement": 0
}
```

| Property | Type | Enum |
|----------|------|------|
| `_id` | string | — |
| `symbol` | string | — |
| `assetType` | string | `stock`, `etf`, `option`, `bond`, `crypto`, `cash`, `other` |
| `currency` | string | — |
| `contractMetadata` | object | — |
| `marginRequirement` | number | — |

---

## Transaction (API / database)

```json
{
  "_id": "tx-1",
  "strategyId": "strat-1",
  "instrumentId": "inst-1",
  "type": "sell",
  "quantity": 1,
  "price": 120.5,
  "cashDelta": 120.5,
  "timestamp": "2025-12-01T10:00:00Z",
  "customData": {},
  "fee": 0,
  "option": {
    "expiration": "2026-03-20",
    "strike": 150,
    "callPut": "call",
    "multiplier": 100,
    "underlyingSymbol": "AAPL"
  },
  "createdAt": "2025-12-01T10:00:00Z"
}
```

**Stock transaction (no option):**
```json
{
  "_id": "tx-2",
  "strategyId": "strat-1",
  "instrumentId": "inst-2",
  "type": "buy",
  "quantity": 1,
  "price": 95,
  "cashDelta": -95.0,
  "timestamp": "2025-11-15T14:30:00Z",
  "customData": {},
  "fee": 0,
  "option": null,
  "createdAt": "2025-11-15T14:30:00Z"
}
```

| Property | Type | Enum |
|----------|------|------|
| `_id` | string | — |
| `strategyId` | string | — |
| `instrumentId` | string | — |
| `type` | string | See TransactionType |
| `quantity` | number | — |
| `price` | number | — |
| `cashDelta` | number | — |
| `timestamp` | string (ISO 8601) | — |
| `customData` | object | — |
| `fee` | number | — |
| `option` | Option \| null | — |
| `optionRoll` | OptionRoll (optional) | Present when type is `option_roll` |
| `createdAt` | string (ISO 8601) | — |

### Option (when transaction involves an option)

| Property | Type | Enum |
|----------|------|------|
| `expiration` | string (YYYY-MM-DD) | — |
| `strike` | number | — |
| `callPut` | string | `call`, `put` |
| `multiplier` | number (optional) | — |
| `underlyingSymbol` | string (optional) | — |

### OptionRoll (when type is option_roll)

| Property | Type |
|----------|------|
| `option` | Option (contract being closed) |
| `optionRolledTo` | Option (contract being opened) |

The transaction's `cashDelta` = net P&L (close proceeds − open cost).

---

## Resolved Transaction (subview context)

Used in `context.transactions` when Python subviews run. Backend resolves instruments and may use `side` as an alias for `type`.

```json
{
  "id": 1,
  "side": "sell",
  "cashDelta": 120.5,
  "timestamp": "2025-12-01T10:00:00Z",
  "instrumentId": "inst-1",
  "instrumentSymbol": "AAPL",
  "instrumentName": "Apple Inc.",
  "option": {
    "expiration": "2026-03-20",
    "strike": 150,
    "callPut": "call"
  },
  "customData": {},
  "quantity": 1,
  "price": 120.5
}
```

| Property | Type |
|----------|------|
| `id` | string \| number |
| `side` | string (alias for type) |
| `cashDelta` | number |
| `timestamp` | string (ISO 8601) |
| `instrumentId` | string |
| `instrumentSymbol` | string (resolved) |
| `instrumentName` | string (resolved) |
| `option` | Option \| null |
| `customData` | object |
| `quantity` | number |
| `price` | number |

---

## Input configs (Subview spec)

### time_range
```json
{ "type": "time_range", "title": "Time Range" }
```

### ticker_selector
```json
{ "type": "ticker_selector", "title": "Ticker", "default": "all" }
```

### number_input
```json
{ "type": "number_input", "title": "Count", "default": 42, "min": 0, "max": 100 }
```

### select
```json
{
  "type": "select",
  "title": "View",
  "options": [{ "value": "monthly", "label": "Monthly" }, { "value": "quarterly", "label": "Quarterly" }],
  "default": "monthly"
}
```

### checkbox
```json
{ "type": "checkbox", "title": "Include fees", "default": false }
```
