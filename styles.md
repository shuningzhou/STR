# Styles

All styling properties available in the application, with their possible values.

## JSON layout–usable styling

These properties **can be used in the subview JSON layout** (in `layout` cells and content items):

- **Typography**: `size`, `bold`, `italic` — on text and number content
- **Alignment**: `alignment` — on layout cells (`left center`, `center middle`, etc.) and on text/number content (`left`, `center`, `right`)
- **Padding**: `padding` — on layout cells, text, number, input, Table, Chart
- **Size**: `defaultSize`, `preferredSize` — on the subview spec

Design tokens (e.g. `--color-bg-card`) are app-wide CSS variables and are **not** set in JSON; they come from the theme.

---

## Typography

### Font size (text / number content)

| Value | CSS variable | Pixels |
|-------|--------------|--------|
| `xs` | `--font-size-label` | 11px |
| `sm` | `--font-size-body` | 13px |
| `md` | `--font-size-title` | 15px |
| `lg` | `--font-size-heading` | 18px |
| `xl` | `--font-size-display` | 24px |
| `xxl` | `--font-size-xxl` | 32px |
| `xxxl` | `--font-size-xxxl` | 40px |

### Font weight
| Property | Values |
|----------|--------|
| `bold` | `true`, `false` (omit = normal) |

### Font style
| Property | Values |
|----------|--------|
| `italic` | `true`, `false` (omit = normal) |

### Number formatting (number content only)

| Property | Values | Description |
|----------|--------|-------------|
| `format` | `"$"`, `"%"` | Prefix `$` or suffix `%` |
| `decimals` | number (default: 2) | Decimal places |

---

## Alignment

### Cell alignment (layout cell)

For flex layout: `justifyContent` = vertical, `alignItems` = horizontal.

| Value | Effect |
|-------|--------|
| `left center` | Horizontal: left, Vertical: center |
| `center middle` | Horizontal: center, Vertical: center |
| `right top` | Horizontal: right, Vertical: top |
| `stretch center` | Horizontal: stretch, Vertical: center |

### Text / number alignment

| Value | Effect |
|-------|--------|
| `left` | `text-align: left` |
| `center` | `text-align: center` |
| `right` | `text-align: right` |

---

## Padding

### Format
- **Uniform**: `padding: 20` (number in px, all sides)
- **Per-side**: `padding: { "top": 10, "right": 20, "bottom": 10, "left": 20 }`

### Sides
| Key | Type | Description |
|-----|------|--------------|
| `top` | number | px |
| `right` | number | px |
| `bottom` | number | px |
| `left` | number | px |

### Where it applies
- Layout cell
- Text content
- Number content
- Input content
- Table content
- Chart content

---

## Size (Subview card)

| Property | Type | Description |
|----------|------|-------------|
| `defaultSize` | `{ w: number, h: number }` or string | Initial pixel size. String format: `"15x5"` → 375×100px |
| `preferredSize` | `{ w: number, h: number }` | User-resized pixel size; overrides defaultSize |

---

## Colors (Design tokens)

### Backgrounds
| Token | Dark | Light |
|-------|------|-------|
| `--color-bg-page` | `#1e1e1e` | `#f3f3f3` |
| `--color-bg-card` | `#2d2d30` | `#ffffff` |
| `--color-bg-sidebar` | `#252526` | `#f0f0f0` |
| `--color-bg-input` | `#3c3c3c` | `#eeeeef` |
| `--color-bg-hover` | `#2a2d2e` | `#e8e8ea` |
| `--color-bg-tab` | `#2d2d30` | `#eeeeef` |
| `--color-bg-active-tab` | `#2d2d30` | `#ffffff` |
| `--color-bg-primary` | `#2ecc71` | `#2ecc71` |
| `--color-bg-primary-hover` | `#27ae60` | `#27ae60` |

### Text
| Token | Dark | Light |
|-------|------|-------|
| `--color-text-primary` | `#e0e0e0` | `#333333` |
| `--color-text-secondary` | `#bbbbbb` | `#666666` |
| `--color-text-muted` | `#aaaaaa` | `#888888` |
| `--color-text-active` | `#ffffff` | — |
| `--color-text-on-primary` | `#ffffff` | — |

### Semantic
| Token | Value |
|-------|-------|
| `--color-positive` | `#4caf50` |
| `--color-negative` | `#f87171` |
| `--color-active` | `#22c55e` |
| `--color-accent` | `#6c9dcb` |
| `--color-accent-hover` | `#5a8aba` |

### Borders & accents
| Token | Dark | Light |
|-------|------|-------|
| `--color-border` | `#444446` | `#e5e5e7` |
| `--color-shadow` | `rgba(0,0,0,0.3)` | `rgba(0,0,0,0.08)` |

### Chart series
| Token | Value |
|-------|-------|
| `--color-chart-1` | `#e0e0e0` |
| `--color-chart-2` | `#a78bfa` |
| `--color-chart-3` | `#22d3ee` |
| `--color-chart-4` | `#fbbf24` |
| `--color-chart-5` | `#f472b6` |

---

## Border radius
| Token | Value |
|-------|-------|
| `--radius-card` | 8px |
| `--radius-medium` | 6px |
| `--radius-button` | 8px |
| `--radius-pill` | 9999px |

---

## Spacing
| Token | Value |
|-------|-------|
| `--space-modal` | 20px |
| `--space-section` | 24px |
| `--subview-card-padding` | 5px |
| `--subview-top-bar-height` | 40px |
| `--space-gap` | 8px |
| `--space-sidebar` | 16px |
| `--space-button-x` | 20px |
| `--space-button-y` | 10px |

---

## Control height
| Token | Value |
|-------|-------|
| `--control-height` | 32px |

---

## Chart types (Subview)
| Value |
|-------|
| `line` |
| `bar` |
| `pie` |

---

## Subview type
| Value | Description |
|-------|-------------|
| `readonly` | Display only, no actions |
| `readwrite` | Allows actions (maker must be `official`) |

---

## Maker (Subview)
| Value |
|-------|
| `official` |
| Any user nickname (e.g. `peter`) |
