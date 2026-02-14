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
const textContentSchema = z.object({
  text: z.object({
    value: z.string(),
    alignment: z.string().optional(),
  }),
});

const numberContentSchema = z.object({
  number: z.object({
    value: z.union([z.string(), z.number()]), // "py:fn" or literal
    alignment: z.string().optional(),
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
  }),
});

const contentItemSchema = z.union([
  textContentSchema,
  numberContentSchema,
  tableContentSchema,
  chartContentSchema,
]);

// --- Layout cell ---
const layoutCellSchema = z.object({
  weight: z.number().min(1),
  alignment: z.string(),
  content: z.array(contentItemSchema),
});

// --- Top-level spec ---
export const subviewSpecSchema = z
  .object({
    type: z.enum(['readonly', 'readwrite']),
    name: z.string(),
    description: z.string(),
    maker: z.string(),
    size: z.string(),
    inputs: z.record(z.string(), inputConfigSchema).optional(),
    layout: z.array(z.array(layoutCellSchema)),
    python_code: z.string(),
    functions: z.array(z.string()),
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
