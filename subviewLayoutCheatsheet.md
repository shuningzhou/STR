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
| `defaultSize` | optional | `{ "w": number, "h": number }` (px) |
| `inputs` | optional | object of input configs |
| `layout` | ✓ | 2D array: rows → cells → content |
| `python_code` | ✓ | string with all function definitions |
| `functions` | ✓ | array of function names used in layout |

---

## Layout structure

```
layout = [ row, row, ... ]
row    = [ cell, cell, ... ]
cell   = { alignment, content, weight?, padding? }
content = [ contentItem, ... ]
```

**Example: 2 rows, first row has 2 cells, second has 1 cell**

```json
"layout": [
  [
    { "alignment": "center left", "content": [...] },
    { "alignment": "center left", "content": [...] }
  ],
  [
    { "weight": 1, "alignment": "center middle", "content": [...] }
  ]
]
```

---

## Cell properties

| Property | Required | Type | Description |
|----------|----------|------|--------------|
| `alignment` | ✓ | string | See [Cell alignment](#cell-alignment) |
| `content` | ✓ | array | Content items in this cell |
| `weight` | optional | number ≥ 1 | Flex-grow width; omit for content-sized width |
| `padding` | optional | number or object | px; uniform or `{ top, right, bottom, left }` |

### Cell alignment
| Value | Effect |
|-------|--------|
| `center left` | Left horizontal, center vertical |
| `center middle` | Centered both |
| `center right` | Right horizontal, center vertical |
| `stretch center` | Stretch horizontal, center vertical |

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

---

## Input types (for `inputs` object)

| Type | Config |
|------|--------|
| `time_range` | `{ "type": "time_range", "title": "Time Range" }` |
| `ticker_selector` | `{ "type": "ticker_selector", "title": "Ticker", "default": "all" }` |
| `number_input` | `{ "type": "number_input", "title": "Count", "default": 42, "min": 0, "max": 100 }` |
| `select` | `{ "type": "select", "title": "View", "options": [{ "value": "a", "label": "A" }], "default": "a" }` |
| `checkbox` | `{ "type": "checkbox", "title": "Enabled", "default": false }` |

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
        "weight": 1,
        "alignment": "center middle",
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
      { "alignment": "center left", "content": [{ "input": { "ref": "timeRange" } }] },
      { "alignment": "center left", "content": [{ "input": { "ref": "ticker" } }] }
    ],
    [
      {
        "weight": 1,
        "alignment": "center middle",
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
