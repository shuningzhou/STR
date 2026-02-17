import { z } from 'zod';

// --- Input types (from subviews.md) ---
const timeRangeInputSchema = z.object({
  type: z.literal('time_range'),
  title: z.string(),
});

const tickerSelectorInputSchema = z.object({
  type: z.literal('ticker_selector'),
  title: z.string(),
  default: z.string().optional(),
});

const numberInputSchema = z.object({
  type: z.literal('number_input'),
  title: z.string(),
  default: z.number(),
  min: z.number().optional(),
  max: z.number().optional(),
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
});

const checkboxInputSchema = z.object({
  type: z.literal('checkbox'),
  title: z.string(),
  default: z.boolean(),
});

const inputConfigSchema = z.discriminatedUnion('type', [
  timeRangeInputSchema,
  tickerSelectorInputSchema,
  numberInputSchema,
  selectInputSchema,
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

const tableContentSchema = z.object({
  Table: z.object({
    header: tableHeaderSchema,
    source: z.string(), // "py:fn"
    columns: z.array(z.string()),
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
    type: z.enum(['line', 'bar', 'pie']),
    source: z.string(), // "py:fn"
    padding: paddingSchema,
  }),
});

/** References an input from spec.inputs; rendered in layout where placed */
const inputContentSchema = z.object({
  input: z.object({
    ref: z.string(), // key in spec.inputs
    padding: paddingSchema,
  }),
});


const contentItemSchema = z.union([
  textContentSchema,
  numberContentSchema,
  tableContentSchema,
  chartContentSchema,
  inputContentSchema,
]);

// --- Layout cell ---
const layoutCellSchema = z.object({
  weight: z.number().min(1).optional(), // when omitted, cell width is based on content size
  alignment: z.string(),
  padding: paddingSchema,
  content: z.array(contentItemSchema),
});

const sizeShapeSchema = z.object({
  w: z.number().min(1),
  h: z.number().min(1),
});

function parseSizeString(s: string): { w: number; h: number } {
  const m = s.match(/^(\d+)x(\d+)$/);
  if (m) return { w: parseInt(m[1], 10) * 25, h: parseInt(m[2], 10) * 20 };
  return { w: 400, h: 100 };
}

// --- Top-level spec ---
export const subviewSpecSchema = z
  .object({
    type: z.enum(['readonly', 'readwrite']),
    name: z.string(),
    description: z.string(),
    maker: z.string(),
    defaultSize: z.union([sizeShapeSchema, z.string()]).optional(),
    preferredSize: sizeShapeSchema.optional(),
    inputs: z.record(z.string(), inputConfigSchema).optional(),
    layout: z.array(z.array(layoutCellSchema)),
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
export type ContentItem = z.infer<typeof contentItemSchema>;
export type InputConfig = z.infer<typeof inputConfigSchema>;

/** Parse and validate a subview spec from JSON string */
export function parseSubviewSpec(json: string): SubviewSpec {
  const parsed = JSON.parse(json) as unknown;
  return subviewSpecSchema.parse(parsed);
}

/** Safe parse - returns success/error */
export function safeParseSubviewSpec(
  json: string
): { success: true; data: SubviewSpec } | { success: false; error: z.ZodError } {
  try {
    const parsed = JSON.parse(json) as unknown;
    return subviewSpecSchema.safeParse(parsed) as
      | { success: true; data: SubviewSpec }
      | { success: false; error: z.ZodError };
  } catch {
    return {
      success: false,
      error: new z.ZodError([{ code: 'custom', path: [], message: 'Invalid JSON' }]),
    } as { success: false; error: z.ZodError };
  }
}
