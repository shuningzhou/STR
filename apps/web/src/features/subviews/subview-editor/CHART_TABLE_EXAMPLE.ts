/**
 * Example subview: Chart and Table.
 * Demonstrates Table and Chart (pie, line, bar) content types.
 */
import type { SubviewSpec } from '@str/shared';

export const CHART_TABLE_EXAMPLE: SubviewSpec = {
  type: 'readonly',
  name: 'Chart & Table',
  description: 'Table and Chart (pie, line, bar) examples',
  maker: 'official',
  defaultSize: { w: 800, h: 420 },
  inputs: {},
  layout: [
    [
      {
        flex: { flex: 1, justifyContent: 'center', alignItems: 'stretch' },
        content: [
          { text: { value: 'Table: source = py:fn (e.g. py:get_sample_table)', size: 'xs', padding: { bottom: 2 } } },
          { text: { value: 'Expected: list of objects, keys match columns. E.g. [{ name, amount, pct }, ...]', size: 'xs', padding: { bottom: 4 } } },
          {
            Table: {
              header: { title: 'Table (py:get_sample_table)' },
              source: 'py:get_sample_table',
              columns: ['name', 'amount', 'pct'],
              columnLabels: { name: 'Name', amount: 'Amount', pct: 'Pct' },
              columnFormats: { amount: 'currency', pct: 'percent' },
              emptyMessage: 'No data',
              padding: 8,
            },
          },
        ],
      },
    ],
    [
      {
        flex: { flex: 1, justifyContent: 'center', alignItems: 'stretch' },
        padding: 8,
        content: [
          { text: { value: 'Chart (pie): source = py:fn (e.g. py:get_sample_pie)', size: 'xs', padding: { bottom: 2 } } },
          { text: { value: 'Expected: { items: [{ label: str, value: number }, ...] }', size: 'xs', padding: { bottom: 4 } } },
          { Chart: { type: 'pie', source: 'py:get_sample_pie', padding: { top: 8, bottom: 8 } } },
        ],
      },
      {
        flex: { flex: 1, justifyContent: 'center', alignItems: 'stretch' },
        padding: 8,
        content: [
          { text: { value: 'Chart (line): same { items } format (placeholder)', size: 'xs', padding: { bottom: 4 } } },
          { Chart: { type: 'line', source: 'py:get_sample_line', padding: { top: 8, bottom: 8 } } },
        ],
      },
      {
        flex: { flex: 1, justifyContent: 'center', alignItems: 'stretch' },
        padding: 8,
        content: [
          { text: { value: 'Chart (bar): same { items } format (placeholder)', size: 'xs', padding: { bottom: 4 } } },
          { Chart: { type: 'bar', source: 'py:get_sample_bar', padding: { top: 8, bottom: 8 } } },
        ],
      },
    ],
  ],
  python_code: `def get_sample_table(context, inputs):
    return [
        {"name": "A", "amount": 100.5, "pct": 25.0},
        {"name": "B", "amount": 200.25, "pct": 50.0},
        {"name": "C", "amount": 99.25, "pct": 25.0},
    ]

def get_sample_pie(context, inputs):
    return {"items": [
        {"label": "A", "value": 33.3},
        {"label": "B", "value": 33.4},
        {"label": "C", "value": 33.3},
    ]}

def get_sample_line(context, inputs):
    return {"items": [{"label": "Line", "value": 1}]}

def get_sample_bar(context, inputs):
    return {"items": [{"label": "Bar", "value": 1}]}
`,
  functions: ['get_sample_table', 'get_sample_pie', 'get_sample_line', 'get_sample_bar'],
};
