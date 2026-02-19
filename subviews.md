### 1. Rules

**Subview JSON Structure Rules**

- **Two types only**:
  - `"readonly"` → display only (no actions, no side effects, no modals, no writes)
  - `"readwrite"` → allows actions to edit the transaction and wallet (only for premade/official subviews)

- **Top-level fields** (all required unless noted):
  - `type`: `"readonly"` or `"readwrite"`
  - `name`: human-readable name (string)
  - `description`: human-readable description (show in the subview gallery)
  - `maker`: `"official"` (officially premades) or user nickname for readyonly subviews (e.g. `"peter"`)
  - `icon`: optional — Lucide icon name (PascalCase, e.g. `"ChartPie"`, `"Wallet"`) shown in subview card title bar (left of name)
  - `iconColor`: optional — color for spec icon and title (built-in name or rgb/#hex). When icon present, applies to both icon and title.
  - `titleColor`: optional — color for title text when no icon. When icon present, iconColor is used for title. 
  - `defaultSize`: `{ w, h }` — initial placement hint (absolute pixels)
  - `preferredSize`: optional `{ w, h }` — written when user scales the card on canvas; overrides defaultSize when present
  - `inputs`: object of controls (optional) — see **Input types and data schemas** below for allowed types and data shapes.
  - `layout`: 2D array of rows → each row is array of cells (or `{ flex?, cells }` for row-level flex) → each cell has:
    - `flex`: object with flex property names (`flex`, `flexDirection`, `justifyContent`, `alignItems`, `flexGrow`, `gap`, etc.) — 100% exposed
    - `padding`: optional, number or `{ top, right, bottom, left }` (px)
    - `content`: array of content items (text, number, Table, Chart, **input**, etc.)
  - **Icon content in layout**: `{ "icon": { "name": "Wallet", "color": "#22c55e", "size": 20 } }` — renders a Lucide icon. `name` required (PascalCase); `color` and `size` optional. See Icon Gallery example for all available icons.
  - **Inputs in layout**: Inputs are **not** auto-rendered. Place them where desired using `{ "input": { "ref": "key" } }` in a cell's content. The `ref` must match a key in `spec.inputs`. This lets the user control input placement (e.g. same row as title, separate filter row).
  - `python_code`: single string containing **all** Python function definitions for this subview (combined)
  - `functions`: array of strings — **names only** of functions actually used in this subview (no prefix here)

  - **Function calling convention in content**:
  - Use prefix `py:` to indicate a Python function call when used in the subview JSON structure
  - Example: `{ "number": { "value": "py:calc_win_rate" } }`
  - Without `py:` → literal value (string/number)

- **Text and number styling** (optional on text/number content; only applies when specified in JSON):
  - `size`: `"xs"` (11px) | `"sm"` (13px) | `"md"` (15px) | `"lg"` (18px) | `"xl"` (24px) | `"xxl"` (32px) | `"xxxl"` (40px)
  - `bold`: boolean
  - `italic`: boolean

- **Number formatting** (optional on number content):
  - `format`: `"$"` (prefix with $) | `"%"` (suffix with %)
  - `decimals`: number of decimal places (default: 2)

- **Padding** (optional; supported at all levels):
  - Uniform: `padding: 20` (all sides in px)
  - Per-side: `padding: { top?: number; right?: number; bottom?: number; left?: number }` (px)
  - Applies to: layout cell, text content, number content, input content, Table, Chart

- **Read-only restrictions**:
  - No `actions` field allowed anywhere (header or row)
  - Functions must return immutable values (number, string, array, object)
  - No side effects, no modals, no database writes

- **Read-write restrictions / allowances**:
  - Only allowed when `type === "readwrite"`
  - this is built-in to the frontend
  - Actions must use **predefined handler names** (e.g. `"addTransactionModal"`, `"editTransactionModal"`)
  - Row actions and header actions are allowed in `Table` content
  - the actions are usually writes to the transcations or the wallet. But with different focus, we will create modal view for editing transaction normally, or a option based transcation, etc. To make the UX better as transcation can have many fields.

- **Charts** (line, bar, pie — expand later):
  - See **Chart schemas** below for required data shapes.

- **Context** (injected into Python):
  - `context.transactions` — each tx has **resolved** instrument data (e.g. `instrumentSymbol`, `instrumentName`) in addition to `instrumentId`; backend resolves before passing to Pyodide.
  - `context.wallet` — baseCurrency, balance, etc.

- **python_code rules**:
  - Must contain valid Python (multiple `def` statements allowed)
  - Must define functions matching names in `functions` array
  - Must accept exactly two arguments: `context`, `inputs`
  - Must return serializable value (no prints, no file I/O, no network)

**Chart schemas** (line, bar, pie — expand later):

| Chart type | Content key | Python return shape | Notes |
|------------|-------------|---------------------|-------|
| **line** | `Chart: { type: "line", source: "py:fn" }` | `{ labels: string[], series: { name: string, data: number[] }[] }` | labels = x-axis; each series is a line |
| **bar** | `Chart: { type: "bar", source: "py:fn" }` | `{ labels: string[], series: { name: string, data: number[] }[] }` | labels = x-axis; supports grouped/stacked |
| **pie** | `Chart: { type: "pie", source: "py:fn" }` | `{ items: { label: string, value: number }[] }` | items = slices |

**Input types and data schemas**:

| Type | Input config | `inputs[key]` shape | Example | Notes |
|------|--------------|---------------------|---------|------|
| `time_range` | `{ type: "time_range", title: string }` | Always `{ start, end }` (ISO dates). Default: `{ start: today-30d, end: now }` | `{ start: "2025-01-15", end: "2026-02-12" }` | |
| `ticker_selector` | `{ type: "ticker_selector", title: string, default: "all" }` | `string` — `"all"` or symbol | `"all"` or `"AAPL"` | |
| `number_input` | `{ type: "number_input", title: string, default: number, min?: number, max?: number }` | `number` | `42` | |
| `select` | `{ type: "select", title: string, options: { value: string, label: string }[], default: string }` | `string` — one of option values | `"monthly"` | Dropdown to pick one option (e.g. group-by: monthly/quarterly, view: compact/detailed) |
| `checkbox` | `{ type: "checkbox", title: string, default: boolean }` | `boolean` | `true` | |

**Strategy-scoped inputs:**
- Configured in **Strategy settings** (per-strategy): add inputs with unique id, title, type.
- **Displayed at the top of the strategy canvas** for the user to adjust.
- Subviews reference them in layout via `{ "input": { "ref": "global.&lt;id&gt;" } }` (e.g. `global.timeRange`).
- In Python: strategy inputs are in `inputs.global` (e.g. `inputs.global['timeRange']`). Subview’s own inputs are in `inputs` (e.g. `inputs['ticker']`).

### 2. Subview Editor UX Description

**Modal / Editor View**

Three-column layout (desktop):

- **Left column (25–30% width)** — JSON Object Editor
  - Monaco Editor (or CodeMirror) in JSON mode
  - Syntax highlighting + auto-format (prettier on save)
  - Real-time Zod validation → red error underlines + error list panel below editor
  - Toolbar buttons: Validate, Format, Reset to Template, Load Example

- **Middle column (35–40% width)** — Python Code Editor
  - Monaco Editor in Python mode
  - Syntax highlighting, linting (pylint/pyright via extension or simple regex)
  - Editing a single file with different classed used in the subview
  - Top bar: “Python Code for all functions in this subview”
  - Button: “Test Functions” → executes with seed data → shows results/errors in a console-like panel below
  - Seed data (always injected); transactions include **resolved** instrument data:
    ```python
    context = {
        'transactions': [  # 10–20 fake transactions
            {'id': 1, 'side': 'sell', 'cashDelta': 120.5, 'timestamp': '2025-12-01T10:00:00Z', 'instrumentId': '...', 'instrumentSymbol': 'AAPL', 'instrumentName': 'Apple Inc.', 'option': {'expiration': '2026-03-20', 'strike': 150, 'callPut': 'call'}},
            # ...
        ],
        'wallet': {'baseCurrency': 'CAD', 'initialBalance': 25000.0}
    }
    inputs = {
        'timeRange': {'start': '2025-01-01', 'end': '2026-02-13'},
        'ticker': 'all'
    }
    ```

- **Right column (35–40% width)** — Live Preview
  - Renders the subview exactly as it would appear in a real tab
  - Updates in real-time (debounced 500–800 ms) when JSON or Python changes
  - Interactive controls: timeRange dropdown, ticker selector (populated from seed data)
  - Shows loading spinner while Python executes
  - If errors → overlay with error message + line number link to editor
  - Size selector dropdown to test different grid sizes
  - “Refresh Preview” button (manual trigger)

**Additional UX features**
- Splitter between columns (draggable resize)
- Mobile: collapses to stacked view (JSON → Python → Preview tabs)
- Save button → validates → sends to backend (strategy.subviews array)
- “Cancel” / “Discard” button
- Status bar at bottom: “Valid JSON” / “Python syntax ok” / “Preview updated”

### 3. Example: Read-only subview (win rate with filters)

Inputs are placed in the layout via `{ "input": { "ref": "key" } }` — they are not auto-rendered.

```json
{
  "type": "readonly",
  "name": "Win Rate Overview",
  "description": "Percentage of profitable closed option trades (matches open/close by contract)",
  "maker": "peter",
  "defaultSize": { "w": 400, "h": 70 },
  "inputs": {
    "timeRange": {
      "type": "time_range",
      "title": "Time Range"
    },
    "ticker": {
      "type": "ticker_selector",
      "title": "Ticker",
      "default": "all"
    }
  },
  "layout": [
    [
      {
        "weight": 1,
        "alignment": "center left",
        "content": [
          { "text": { "value": "Win Rate", "alignment": "left" } }
        ]
      },
      {
        "alignment": "center left",
        "content": [{ "input": { "ref": "timeRange" } }]
      },
      {
        "alignment": "center left",
        "content": [{ "input": { "ref": "ticker" } }]
      },
      {
        "weight": 1,
        "alignment": "center middle",
        "content": [
          { "number": { "value": "py:calc_win_rate", "alignment": "center", "size": "xl", "bold": true } }
        ]
      }
    ]
  ],
  "python_code": "def calc_win_rate(context, inputs): ...",
  "functions": [
    "calc_win_rate"
  ]
}
```

### 4. Example: Read-write subview (options table with actions)

```json
{
  "type": "readwrite",
  "name": "Open Options Positions",
  "description": "Table of open option positions with add/edit/close/roll actions",
  "maker": "official",
  "defaultSize": { "w": 600, "h": 160 },
  "inputs": {
    "timeRange": {
      "type": "time_range",
      "title": "Filter by Date"
    }
  },
  "layout": [
    [
      {
        "weight": 1,
        "alignment": "center left",
        "content": [{ "input": { "ref": "timeRange" } }]
      }
    ],
    [
      {
        "weight": 1,
        "alignment": "stretch center",
        "content": [
          {
            "Table": {
              "header": {
                "title": "Open Options Trades",
                "actions": [
                  { "title": "Add New", "icon": "plus", "handler": "addTransactionModal" }
                ]
              },
              "source": "py:get_open_options",
              "columns": [
                "instrumentId",
                "option.expiration",
                "option.strike",
                "option.callPut",
                "quantity",
                "price",
                "cashDelta"
              ],
              "rowActions": [
                { "title": "Edit", "icon": "pencil", "handler": "editTransactionModal" },
                { "title": "Close", "icon": "x", "handler": "closeTransactionModal" },
                { "title": "Roll", "icon": "repeat", "handler": "rollTransactionModal" }
              ]
            }
          }
        ]
      }
    ]
  ],
  "python_code": "def get_open_options(context, inputs):\n    txs = context['transactions']\n    result = []\n    for tx in txs:\n        opt = tx.get('option')\n        if not opt:\n            continue\n        if opt.get('expiration') and opt['expiration'] < '2026-02-13':  # simplistic check\n            continue\n        result.append(tx)\n    return result\n",
  "functions": [
    "get_open_options"
  ]
}
```

In this read-write example, the table source is still a Python function (for filtering), but actions use **predefined handlers** (no Python side effects).