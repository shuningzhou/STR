import { z } from 'zod';

/** Optional: when set, input is shown in subview top bar. Lower number = left. */
const topbarSchema = z.number().optional();
/** Optional: when input is in top bar, show the title label. Default true. */
const topbarShowTitleSchema = z.boolean().optional();

// --- Input types (from subviews.md) ---
const timeRangeInputSchema = z.object({
  type: z.literal('time_range'),
  title: z.string(),
  topbar: topbarSchema,
  topbarShowTitle: topbarShowTitleSchema,
});

const tickerSelectorInputSchema = z.object({
  type: z.literal('ticker_selector'),
  title: z.string(),
  default: z.string().optional(),
  topbar: topbarSchema,
  topbarShowTitle: topbarShowTitleSchema,
});

const numberInputSchema = z.object({
  type: z.literal('number_input'),
  title: z.string(),
  default: z.number(),
  min: z.number().optional(),
  max: z.number().optional(),
  topbar: topbarSchema,
  topbarShowTitle: topbarShowTitleSchema,
});

const selectOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const selectInputSchema = z.object({
  type: z.literal('select'),
  title: z.string(),
  options: z.array(selectOptionSchema),
  default: z.string(),
  topbar: topbarSchema,
  topbarShowTitle: topbarShowTitleSchema,
});

const segmentInputSchema = z.object({
  type: z.literal('segment'),
  title: z.string(),
  options: z.array(selectOptionSchema),
  default: z.string(),
  topbar: topbarSchema,
  topbarShowTitle: topbarShowTitleSchema,
});

const chartNavInputSchema = z.object({
  type: z.literal('chart_nav'),
  title: z.string().optional(),
  default: z.number(),
  min: z.number().optional(),
  topbar: topbarSchema,
  topbarShowTitle: topbarShowTitleSchema,
});

const checkboxInputSchema = z.object({
  type: z.literal('checkbox'),
  title: z.string(),
  default: z.boolean(),
  topbar: topbarSchema,
  topbarShowTitle: topbarShowTitleSchema,
});

const inputConfigSchema = z.discriminatedUnion('type', [
  timeRangeInputSchema,
  tickerSelectorInputSchema,
  numberInputSchema,
  selectInputSchema,
  segmentInputSchema,
  chartNavInputSchema,
  checkboxInputSchema,
]);

// --- Content items (text, number, Table, Chart) ---
const fontSizeSchema = z.enum(['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl']).optional();

/** Uniform (number) or per-side (top, right, bottom, left in px) */
const paddingSchema = z
  .union([
    z.number(),
    z.object({
      top: z.number().optional(),
      right: z.number().optional(),
      bottom: z.number().optional(),
      left: z.number().optional(),
    }),
  ])
  .optional();

const textContentSchema = z.object({
  text: z.object({
    value: z.string(),
    alignment: z.string().optional(),
    size: fontSizeSchema,
    bold: z.boolean().optional(),
    italic: z.boolean().optional(),
    padding: paddingSchema,
  }),
});

const numberContentSchema = z.object({
  number: z.object({
    value: z.union([z.string(), z.number()]), // "py:fn" or literal
    alignment: z.string().optional(),
    size: fontSizeSchema,
    bold: z.boolean().optional(),
    italic: z.boolean().optional(),
    padding: paddingSchema,
    format: z.enum(['$', '%']).optional(), // prefix $ or suffix %
    decimals: z.number().int().min(0).optional(), // default 2
  }),
});

const tableHeaderSchema = z.object({
  title: z.string(),
  actions: z
    .array(
      z.object({
        title: z.string(),
        icon: z.string(),
        handler: z.string(),
      })
    )
    .optional(),
});

const columnFormatSchema = z.enum(['currency', 'percent', 'number']);

const tableContentSchema = z.object({
  Table: z.object({
    header: tableHeaderSchema,
    source: z.string(), // "py:fn"
    columns: z.array(z.string()),
    /** Column key -> display label. If absent, humanized key used */
    columnLabels: z.record(z.string(), z.string()).optional(),
    /** Column key -> format: currency ($), percent (%), or number */
    columnFormats: z.record(z.string(), columnFormatSchema).optional(),
    /** Column key -> { cellValue: color } e.g. { optionType: { 'Covered call': 'green-1', 'Secured put': 'blue-1' } } */
    columnCellColors: z.record(z.string(), z.record(z.string(), z.string())).optional(),
    /** Message when table has no rows */
    emptyMessage: z.string().optional(),
    padding: paddingSchema,
    rowActions: z
      .array(
        z.object({
          title: z.string(),
          icon: z.string(),
          handler: z.string(),
        })
      )
      .optional(),
  }),
});

const chartContentSchema = z.object({
  Chart: z.object({
    type: z.enum(['line', 'bar', 'pie', 'timeline']),
    source: z.string(), // "py:fn"
    padding: paddingSchema,
    /** Line/bar color: built-in name or #hex. Overridden by colorInputRef when inputs has value. */
    color: z.string().optional(),
    /** Input key for runtime color selection; value from inputs[key] used for line/bar stroke */
    colorInputRef: z.string().optional(),
  }),
});

/** References an input from spec.inputs; rendered in layout where placed */
const inputContentSchema = z.object({
  input: z.object({
    ref: z.string(), // key in spec.inputs
    padding: paddingSchema,
  }),
});

/** Horizontal or vertical line separator */
const separatorContentSchema = z.object({
  separator: z.object({
    /** horizontal (default) or vertical */
    orientation: z.enum(['horizontal', 'vertical']).optional(),
    padding: paddingSchema,
  }),
});

/** Icon content: Lucide icon by name. Color: built-in name, rgb, #hex, etc. */
const iconContentSchema = z.object({
  icon: z.object({
    /** Lucide icon name (PascalCase), e.g. ChartPie, Wallet, TrendingUp */
    name: z.string(),
    /** Color: built-in name (green, red, blue) or rgb(r,g,b), #hex */
    color: z.string().optional(),
    /** Size in px; default 16 */
    size: z.number().optional(),
    padding: paddingSchema.optional(),
  }),
});

const contentItemSchema = z.union([
  textContentSchema,
  numberContentSchema,
  tableContentSchema,
  chartContentSchema,
  inputContentSchema,
  separatorContentSchema,
  iconContentSchema,
]);

/** Built-in: red, orange, yellow, lime, green, teal, cyan, blue, indigo, purple, pink, gray, crimson, amber, emerald, sky, violet, fuchsia, rose, slate, zinc, stone, brown, navy. Or custom: rgb(r,g,b), #hex, hsl(...) */
const colorSchema = z.string().optional();

/** Flex/CSS properties passed through to the rendered element. Use standard flex names: flex, flexDirection, justifyContent, alignItems, alignSelf, flexGrow, flexShrink, flexBasis, gap, etc. */
const flexSchema = z.record(z.string(), z.union([z.string(), z.number()])).optional();

// --- Layout cell ---
const layoutCellSchema = z.object({
  /** Direct flex properties (e.g. flex, flexDirection, justifyContent, alignItems). Overrides alignment/weight/contentDirection when specified. */
  flex: flexSchema,
  /** @deprecated Use flex: { justifyContent, alignItems } instead */
  weight: z.number().min(1).optional(),
  /** @deprecated Use flex: { justifyContent, alignItems } instead */
  alignment: z.string().optional(),
  padding: paddingSchema,
  /** @deprecated Use flex: { flexDirection: 'row'|'column' } instead */
  contentDirection: z.enum(['row', 'column']).optional(),
  /** When true, draws a box outlining the cell for layout debugging */
  showBorder: z.boolean().optional(),
  /** Text color: built-in name or rgb/rgba/#hex */
  textColor: colorSchema,
  /** Background color: built-in name or rgb/rgba/#hex */
  backgroundColor: colorSchema,
  content: z.array(contentItemSchema),
});

/** Row: array of cells, or object with flex props + cells. */
const layoutRowSchema = z.union([
  z.array(layoutCellSchema),
  z.object({
    flex: flexSchema,
    cells: z.array(layoutCellSchema),
  }),
]);

const sizeShapeSchema = z.object({
  w: z.number().min(1),
  h: z.number().min(1),
});

function parseSizeString(s: string): { w: number; h: number } {
  const m = s.match(/^(\d+)x(\d+)$/);
  if (m) return { w: parseInt(m[1], 10) * 25, h: parseInt(m[2], 10) * 20 };
  return { w: 400, h: 100 };
}

const headerActionSchema = z.object({
  title: z.string(),
  icon: z.string().optional(),
  label: z.string().optional(),
  color: z.string().optional(),
  handler: z.string(),
});

/** Category IDs for gallery grouping. A subview can be in multiple categories. */
export const SUBVIEW_CATEGORIES = ['example', 'essential', 'stock-etf', 'margin', 'option', 'income'] as const;
export type SubviewCategory = (typeof SUBVIEW_CATEGORIES)[number];

// --- Top-level spec ---
export const subviewSpecSchema = z
  .object({
    type: z.enum(['readonly', 'readwrite']),
    name: z.string(),
    description: z.string(),
    maker: z.string(),
    /** Icon shown in subview card title bar (left of title). Lucide name, e.g. ChartPie, Wallet. */
    icon: z.string().optional(),
    /** Color for spec icon and title: built-in name or rgb/#hex */
    iconColor: z.string().optional(),
    /** Color for title text when no icon. When icon present, iconColor applies to both. */
    titleColor: z.string().optional(),
    /** Categories for gallery: example, essential, stock-etf, margin, option, income. A subview can be in multiple. */
    categories: z.array(z.enum(['example', 'essential', 'stock-etf', 'margin', 'option', 'income'])).optional(),
    defaultSize: z.union([sizeShapeSchema, z.string()]).optional(),
    preferredSize: sizeShapeSchema.optional(),
    /** Buttons in subview card header (e.g. Add, Deposit, Withdraw) */
    headerActions: z.array(headerActionSchema).optional(),
    inputs: z.record(z.string(), inputConfigSchema).optional(),
    layout: z.array(layoutRowSchema),
    python_code: z.string(),
    functions: z.array(z.string()),
  })
  .transform((data) => {
    const d = data as { size?: string; defaultSize?: { w: number; h: number } | string };
    let defaultSize: { w: number; h: number };
    if (d.defaultSize != null) {
      defaultSize = typeof d.defaultSize === 'object' ? d.defaultSize : parseSizeString(d.defaultSize);
    } else if (d.size != null) {
      defaultSize = parseSizeString(d.size);
    } else {
      defaultSize = { w: 400, h: 100 };
    }
    const { size: _, ...rest } = d;
    return { ...rest, defaultSize };
  })
  .refine(
    (data) => {
      if (data.type === 'readonly') return true;
      return data.maker === 'official';
    },
    { message: 'Readwrite subviews must have maker: "official"', path: ['maker'] }
  );

export type SubviewSpec = z.infer<typeof subviewSpecSchema>;
export type LayoutCell = z.infer<typeof layoutCellSchema>;
export type LayoutRow = z.infer<typeof layoutRowSchema>;
export type ContentItem = z.infer<typeof contentItemSchema>;
export type InputConfig = z.infer<typeof inputConfigSchema>;

/** Parse and validate a subview spec from JSON string */
export function parseSubviewSpec(json: string): SubviewSpec {
  const parsed = JSON.parse(json) as unknown;
  return subviewSpecSchema.parse(parsed);
}

/** Safe parse - returns success/error. Parse errors return error as string; schema errors return ZodError. */
export function safeParseSubviewSpec(
  json: string
): { success: true; data: SubviewSpec } | { success: false; error: z.ZodError | string } {
  try {
    // Strip BOM and normalize; re-parse to ensure plain object (avoids Monaco/invisible-char corruption)
    const trimmed = json.replace(/^\uFEFF/, '').trim();
    const parsed = JSON.parse(trimmed) as unknown;
    const plain = JSON.parse(JSON.stringify(parsed)) as unknown;
    return subviewSpecSchema.safeParse(plain) as
      | { success: true; data: SubviewSpec }
      | { success: false; error: z.ZodError };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid JSON';
    return { success: false, error: msg };
  }
}
