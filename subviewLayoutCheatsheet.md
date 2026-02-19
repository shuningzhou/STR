# Subview JSON Layout Cheatsheet

Quick reference for building subview layouts.

---

## Top-level structure

```json
{
  "type": "readonly",
  "name": "Card Name",
  "description": "What this card shows",
  "maker": "peter",
  "defaultSize": { "w": 400, "h": 70 },
  "inputs": { },
  "layout": [ ],
  "python_code": "def fn(context, inputs): ...",
  "functions": ["fn"]
}
```

| Field | Required | Values |
|-------|----------|--------|
| `type` | ✓ | `readonly` \| `readwrite` |
| `name` | ✓ | string |
| `description` | ✓ | string |
| `maker` | ✓ | `official` or nickname (e.g. `peter`) |
| `defaultSize` | optional | `{ "w": number, "h": number }` or `"WxH"` (px) |
| `preferredSize` | optional | `{ "w": number, "h": number }` — set when user resizes card |
| `icon` | optional | Lucide icon name (PascalCase, e.g. `ChartPie`) |
| `iconColor` | optional | color for icon/title |
| `inputs` | optional | object of input configs |
| `layout` | ✓ | 2D array: rows → cells → content |
| `python_code` | ✓ | string with all function definitions |
| `functions` | ✓ | array of function names used in layout |

---

## Layout structure

```
layout = [ row, row, ... ]
row    = [ cell, cell, ... ]  |  { flex?: FlexProps, cells: [ cell, ... ] }
cell   = { flex: FlexProps, content, padding?, ... }
content = [ contentItem, ... ]
```

**Rows:** Either an array of cells, or `{ flex?, cells }` for row-level flex (e.g. `{ flex: { justifyContent: 'center' }, cells: [...] }`).

**Example: 2 rows, first row has 2 cells, second has 1 cell**

```json
"layout": [
  [
    { "flex": { "justifyContent": "center", "alignItems": "flex-start" }, "content": [...] },
    { "flex": { "justifyContent": "center", "alignItems": "flex-start" }, "content": [...] }
  ],
  [
    { "flex": { "flex": 1, "justifyContent": "center", "alignItems": "center" }, "content": [...] }
  ]
]
```

---

## Cell properties

| Property | Required | Type | Description |
|----------|----------|------|--------------|
| `flex` | ✓ | object | Flex/CSS properties — see [Cell flex](#cell-flex) |
| `content` | ✓ | array | Content items in this cell |
| `padding` | optional | number or object | px; uniform or `{ top, right, bottom, left }` |
| `showBorder` | optional | boolean | Draw outline for debugging |
| `textColor` | optional | string | Built-in name or rgb/#hex |
| `backgroundColor` | optional | string | Built-in name or rgb/#hex |

### Cell flex

Use standard flex property names (camelCase). Applied directly to the cell container.

| Property | Values | Description |
|----------|--------|-------------|
| `flex` | number or string | e.g. `1` for flex-grow; `"1 1 0"` for shorthand |
| `flexDirection` | `row` \| `column` | Main axis (default: `column`) |
| `justifyContent` | `flex-start` \| `center` \| `flex-end` \| `space-between` \| `space-around` \| `stretch` | Main axis |
| `alignItems` | `flex-start` \| `center` \| `flex-end` \| `stretch` | Cross axis |
| `alignSelf` | same as alignItems | Override for this cell |
| `flexGrow` | number | Grow factor (default 0) |
| `flexShrink` | number | Shrink factor |
| `flexBasis` | string/number | Base size |
| `gap` | number | Gap between content items |
| `minWidth` | number/string | Min width |
| `minHeight` | number/string | Min height |

**Common patterns:**
- Fill width, center content: `{ "flex": 1, "justifyContent": "center", "alignItems": "center" }`
- Left-align, center vertically: `{ "justifyContent": "center", "alignItems": "flex-start" }`
- Horizontal layout (content in a row): `{ "flexDirection": "row", "alignItems": "center" }`

---

## Content types

### Text
```json
{ "text": { "value": "Hello" } }
{ "text": { "value": "py:my_fn", "size": "lg", "bold": true, "alignment": "center", "padding": 10 } }
```

| Property | Required | Values |
|----------|----------|--------|
| `value` | ✓ | string (literal or `py:functionName`) |
| `alignment` | optional | `left` \| `center` \| `right` |
| `size` | optional | `xs` \| `sm` \| `md` \| `lg` \| `xl` \| `xxl` \| `xxxl` |
| `bold` | optional | true \| false |
| `italic` | optional | true \| false |
| `padding` | optional | number or `{ top, right, bottom, left }` |

### Number
```json
{ "number": { "value": 42 } }
{ "number": { "value": "py:calc_win_rate", "size": "xl", "bold": true, "alignment": "center", "padding": { "top": 20, "bottom": 20 }, "format": "%", "decimals": 1 } }
```

| Property | Required | Values |
|----------|----------|--------|
| `value` | ✓ | number or `py:functionName` |
| `alignment` | optional | `left` \| `center` \| `right` |
| `size` | optional | `xs` \| `sm` \| `md` \| `lg` \| `xl` \| `xxl` \| `xxxl` |
| `bold` | optional | true \| false |
| `italic` | optional | true \| false |
| `padding` | optional | number or `{ top, right, bottom, left }` |
| `format` | optional | `"$"` (prefix) \| `"%"` (suffix) |
| `decimals` | optional | decimal places (default: 2) |

### Input (reference from `inputs`)
```json
{ "input": { "ref": "timeRange" } }
{ "input": { "ref": "ticker", "padding": 8 } }
```

| Property | Required | Values |
|----------|----------|--------|
| `ref` | ✓ | key in `inputs` object |
| `padding` | optional | number or `{ top, right, bottom, left }` |

**Inputs are not auto-rendered.** Add them in layout where you want them.

### Table
```json
{
  "Table": {
    "header": { "title": "Transactions" },
    "source": "py:get_transactions",
    "columns": ["timestamp", "side", "quantity", "price"],
    "padding": 10
  }
}
```

| Property | Required | Values |
|----------|----------|--------|
| `header.title` | ✓ | string |
| `source` | ✓ | `py:functionName` |
| `columns` | ✓ | array of column keys |
| `padding` | optional | number or object |

### Chart
```json
{
  "Chart": {
    "type": "line",
    "source": "py:get_chart_data",
    "padding": 10
  }
}
```

| Property | Required | Values |
|----------|----------|--------|
| `type` | ✓ | `line` \| `bar` \| `pie` |
| `source` | ✓ | `py:functionName` |
| `padding` | optional | number or object |

**Line chart:** Python returns `{ items: [{ label, value, depositWithdraw? }], colors?: { value?: string, depositWithdraw?: string } }`. Colors from Python override defaults.

---

## Input types (for `inputs` object)

| Type | Config |
|------|--------|
| `time_range` | `{ "type": "time_range", "title": "Time Range", "topbar": 0 }` |
| `ticker_selector` | `{ "type": "ticker_selector", "title": "Ticker", "default": "all", "topbar": 1 }` |
| `number_input` | `{ "type": "number_input", "title": "Count", "default": 42, "min": 0, "max": 100 }` |
| `select` | `{ "type": "select", "title": "View", "options": [...], "default": "a", "topbar": 2 }` |
| `checkbox` | `{ "type": "checkbox", "title": "Enabled", "default": false }` |

**Top bar:** Add `"topbar": number` to show the input in the subview top bar. Lower number = left. Add `"topbarShowTitle": false` to hide the label. Uses same style as strategy inputs bar.

---

## Python functions

- **Call in layout**: Use `py:functionName` as `value` (text/number) or `source` (Table/Chart).
- **Define**: All functions in `python_code`; list names in `functions`.
- **Signature**: `def fn(context, inputs):` — `context` has `transactions`, `wallet`; `inputs` has values from input controls.
- **Return**: Serializable (number, string, array, object). No side effects.

---

## Font sizes (px)
| Value | Pixels |
|-------|--------|
| `xs` | 11 |
| `sm` | 13 |
| `md` | 15 |
| `lg` | 18 |
| `xl` | 24 |
| `xxl` | 32 |
| `xxxl` | 40 |

---

## Padding

**Uniform:** `"padding": 20`  

**Per-side:**
```json
"padding": { "top": 10, "right": 20, "bottom": 10, "left": 20 }
```

Use on: layout cell, text, number, input, Table, Chart.

---

## Minimal example

```json
{
  "type": "readonly",
  "name": "Hello",
  "description": "Says hello",
  "maker": "peter",
  "defaultSize": { "w": 200, "h": 60 },
  "layout": [
    [
      {
        "flex": { "flex": 1, "justifyContent": "center", "alignItems": "center" },
        "content": [{ "text": { "value": "Hello World", "size": "lg", "alignment": "center" } }]
      }
    ]
  ],
  "python_code": "",
  "functions": []
}
```

---

## Win rate example (inputs + number)

```json
{
  "type": "readonly",
  "name": "Win Rate",
  "description": "Percentage of profitable closed trades",
  "maker": "peter",
  "defaultSize": { "w": 400, "h": 70 },
  "inputs": {
    "timeRange": { "type": "time_range", "title": "Time Range" },
    "ticker": { "type": "ticker_selector", "title": "Ticker", "default": "all" }
  },
  "layout": [
    [
      { "flex": { "justifyContent": "center", "alignItems": "flex-start" }, "content": [{ "input": { "ref": "timeRange" } }] },
      { "flex": { "justifyContent": "center", "alignItems": "flex-start" }, "content": [{ "input": { "ref": "ticker" } }] }
    ],
    [
      {
        "flex": { "flex": 1, "justifyContent": "center", "alignItems": "center" },
        "content": [
          {
            "number": {
              "value": "py:calc_win_rate",
              "alignment": "center",
              "size": "xxxl",
              "bold": true,
              "padding": { "top": 20, "bottom": 20 },
              "format": "%",
              "decimals": 1
            }
          }
        ]
      }
    ]
  ],
  "python_code": "def calc_win_rate(context, inputs):\n    ...",
  "functions": ["calc_win_rate"]
}
```
