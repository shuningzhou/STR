/**
 * Kitchen sink example subview: demonstrates all layout options, content types,
 * alignments, inputs, text/number formats, Table, and Chart.
 * Use as reference when building custom subviews.
 */
import type { SubviewSpec } from '@str/shared';

export const KITCHEN_SINK: SubviewSpec = {
  type: 'readonly',
  name: 'Kitchen Sink',
  description: 'Complete demo of all layout and content options',
  maker: 'official',
  defaultSize: { w: 900, h: 680 },
  inputs: {
    timeRange: { type: 'time_range', title: 'Time Range' },
    ticker: { type: 'ticker_selector', title: 'Ticker', default: 'all' },
    count: { type: 'number_input', title: 'Count', default: 10, min: 0, max: 100 },
    viewMode: {
      type: 'select',
      title: 'View',
      options: [
        { value: 'compact', label: 'Compact' },
        { value: 'full', label: 'Full' },
      ],
      default: 'compact',
    },
    enabled: { type: 'checkbox', title: 'Enabled', default: true },
  },
  layout: [
    // --- Title ---
    [
      {
        weight: 1,
        alignment: 'center middle',
        content: [
          { text: { value: 'Kitchen Sink — All Layout & Content Options', size: 'xl', bold: true, alignment: 'center', padding: { top: 12, bottom: 8 } } },
        ],
      },
    ],
    [ { weight: 1, alignment: 'stretch center', padding: { top: 4, bottom: 4 }, content: [{ separator: {} }] } ],
    // --- Inputs ---
    [
      { alignment: 'center left', padding: 4, content: [{ text: { value: 'label', size: 'xs' } }, { text: { value: 'Inputs:', size: 'sm', bold: true } }] },
      { alignment: 'center left', padding: 4, content: [{ text: { value: 'time_range', size: 'xs' } }, { input: { ref: 'timeRange', padding: 4 } }] },
      { alignment: 'center left', padding: 4, content: [{ text: { value: 'ticker_selector', size: 'xs' } }, { input: { ref: 'ticker', padding: 4 } }] },
      { alignment: 'center left', padding: 4, content: [{ text: { value: 'number_input', size: 'xs' } }, { input: { ref: 'count', padding: 4 } }] },
      { alignment: 'center left', padding: 4, content: [{ text: { value: 'select', size: 'xs' } }, { input: { ref: 'viewMode', padding: 4 } }] },
      { alignment: 'center left', padding: 4, content: [{ text: { value: 'checkbox', size: 'xs' } }, { input: { ref: 'enabled', padding: 4 } }] },
    ],
    [ { weight: 1, alignment: 'stretch center', padding: { top: 4, bottom: 4 }, content: [{ separator: {} }] } ],
    // --- Text size ---
    [
      {
        weight: 1,
        alignment: 'center middle',
        padding: { top: 8, bottom: 4, left: 8, right: 8 },
        contentDirection: 'row',
        content: [
          { text: { value: 'contentDirection: row', size: 'xs', padding: { right: 4 } } },
          { text: { value: 'Text sizes:', size: 'sm', bold: true } },
          { text: { value: 'xs', size: 'xs', padding: { left: 4 } } },
          { text: { value: 'sm', size: 'sm', padding: { left: 4 } } },
          { text: { value: 'md', size: 'md', padding: { left: 4 } } },
          { text: { value: 'lg', size: 'lg', padding: { left: 4 } } },
          { text: { value: 'xl', size: 'xl', padding: { left: 4 } } },
          { text: { value: 'xxl', size: 'xxl', padding: { left: 4 } } },
          { text: { value: 'xxxl', size: 'xxxl', padding: { left: 4 } } },
        ],
      },
    ],
    [ { weight: 1, alignment: 'stretch center', padding: { top: 4, bottom: 4 }, content: [{ separator: {} }] } ],
    // --- Text style ---
    [
      {
        weight: 1,
        alignment: 'center middle',
        padding: { top: 8, bottom: 4, left: 8, right: 8 },
        contentDirection: 'row',
        content: [
          { text: { value: 'contentDirection: row', size: 'xs', padding: { right: 4 } } },
          { text: { value: 'Text styles:', size: 'sm', bold: true } },
          { text: { value: 'Bold text', size: 'sm', bold: true, padding: { left: 4 } } },
          { text: { value: 'Italic text', size: 'sm', italic: true, padding: { left: 4 } } },
          { text: { value: 'Bold + italic', size: 'sm', bold: true, italic: true, padding: { left: 4 } } },
        ],
      },
    ],
    [ { weight: 1, alignment: 'stretch center', padding: { top: 4, bottom: 4 }, content: [{ separator: {} }] } ],
    // --- Text format (number formats) ---
    [
      {
        weight: 1,
        alignment: 'center left',
        padding: 8,
        content: [
          { text: { value: 'format: $, decimals: 2', size: 'xs', padding: { bottom: 2 } } },
          { text: { value: 'Number format $:', size: 'sm', bold: true } },
          { number: { value: 1234.56, format: '$', decimals: 2, size: 'lg', padding: { top: 4 } } },
        ],
      },
      {
        weight: 1,
        alignment: 'center left',
        padding: 8,
        content: [
          { text: { value: 'format: %, decimals: 1', size: 'xs', padding: { bottom: 2 } } },
          { text: { value: 'Number format %:', size: 'sm', bold: true } },
          { number: { value: 67.89, format: '%', decimals: 1, size: 'lg', padding: { top: 4 } } },
        ],
      },
      {
        weight: 1,
        alignment: 'center left',
        padding: 8,
        content: [
          { text: { value: 'value: "py:function_name"', size: 'xs', padding: { bottom: 2 } } },
          { text: { value: 'Number from Python:', size: 'sm', bold: true } },
          { number: { value: 'py:get_sample_number', format: '$', decimals: 2, size: 'md', padding: { top: 4 } } },
        ],
      },
    ],
    [ { weight: 1, alignment: 'stretch center', padding: { top: 4, bottom: 4 }, content: [{ separator: {} }] } ],
    // --- Colors ---
    [
      { alignment: 'center middle', padding: 6, showBorder: true, backgroundColor: 'red', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'red', size: 'sm', alignment: 'center' } }] },
      { alignment: 'center middle', padding: 6, showBorder: true, backgroundColor: 'orange', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'orange', size: 'sm', alignment: 'center' } }] },
      { alignment: 'center middle', padding: 6, showBorder: true, backgroundColor: 'yellow', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'yellow', size: 'sm', alignment: 'center' } }] },
      { alignment: 'center middle', padding: 6, showBorder: true, backgroundColor: 'lime', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'lime', size: 'sm', alignment: 'center' } }] },
      { alignment: 'center middle', padding: 6, showBorder: true, backgroundColor: 'green', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'green', size: 'sm', alignment: 'center' } }] },
      { alignment: 'center middle', padding: 6, showBorder: true, backgroundColor: 'teal', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'teal', size: 'sm', alignment: 'center' } }] },
      { alignment: 'center middle', padding: 6, showBorder: true, backgroundColor: 'cyan', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'cyan', size: 'sm', alignment: 'center' } }] },
      { alignment: 'center middle', padding: 6, showBorder: true, backgroundColor: 'blue', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'blue', size: 'sm', alignment: 'center' } }] },
      { alignment: 'center middle', padding: 6, showBorder: true, backgroundColor: 'indigo', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'indigo', size: 'sm', alignment: 'center' } }] },
      { alignment: 'center middle', padding: 6, showBorder: true, backgroundColor: 'purple', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'purple', size: 'sm', alignment: 'center' } }] },
      { alignment: 'center middle', padding: 6, showBorder: true, backgroundColor: 'pink', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'pink', size: 'sm', alignment: 'center' } }] },
      { alignment: 'center middle', padding: 6, showBorder: true, backgroundColor: 'gray', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'gray', size: 'sm', alignment: 'center' } }] },
      { alignment: 'center middle', padding: 6, showBorder: true, backgroundColor: 'crimson', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'crimson', size: 'sm', alignment: 'center' } }] },
      { alignment: 'center middle', padding: 6, showBorder: true, backgroundColor: 'amber', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'amber', size: 'sm', alignment: 'center' } }] },
      { alignment: 'center middle', padding: 6, showBorder: true, backgroundColor: 'emerald', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'emerald', size: 'sm', alignment: 'center' } }] },
      { alignment: 'center middle', padding: 6, showBorder: true, backgroundColor: 'sky', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'sky', size: 'sm', alignment: 'center' } }] },
      { alignment: 'center middle', padding: 6, showBorder: true, backgroundColor: 'violet', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'violet', size: 'sm', alignment: 'center' } }] },
      { alignment: 'center middle', padding: 6, showBorder: true, backgroundColor: 'fuchsia', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'fuchsia', size: 'sm', alignment: 'center' } }] },
      { alignment: 'center middle', padding: 6, showBorder: true, backgroundColor: 'rose', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'rose', size: 'sm', alignment: 'center' } }] },
      { alignment: 'center middle', padding: 6, showBorder: true, backgroundColor: 'slate', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'slate', size: 'sm', alignment: 'center' } }] },
      { alignment: 'center middle', padding: 6, showBorder: true, backgroundColor: 'zinc', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'zinc', size: 'sm', alignment: 'center' } }] },
      { alignment: 'center middle', padding: 6, showBorder: true, backgroundColor: 'stone', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'stone', size: 'sm', alignment: 'center' } }] },
      { alignment: 'center middle', padding: 6, showBorder: true, backgroundColor: 'brown', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'brown', size: 'sm', alignment: 'center' } }] },
      { alignment: 'center middle', padding: 6, showBorder: true, backgroundColor: 'navy', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'navy', size: 'sm', alignment: 'center' } }] },
    ],
    [
      {
        weight: 1,
        alignment: 'center middle',
        padding: 8,
        showBorder: true,
        textColor: 'rgb(255, 255, 255)',
        backgroundColor: 'rgb(30, 58, 138)',
        content: [
          { text: { value: 'custom rgb(r,g,b)', size: 'xs', padding: { bottom: 2 } } },
          { text: { value: 'textColor + backgroundColor', size: 'sm', alignment: 'center' } },
        ],
      },
    ],
    [ { weight: 1, alignment: 'stretch center', padding: { top: 4, bottom: 4 }, content: [{ separator: {} }] } ],
    // --- Alignment ---
    [
      { weight: 1, alignment: 'center left', padding: { top: 32, bottom: 32, left: 12, right: 12 }, showBorder: true, backgroundColor: 'slate', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'left + v-center', size: 'xs', padding: { bottom: 2 } } }, { text: { value: 'center left', size: 'sm', alignment: 'left' } }] },
      { alignment: 'stretch center', padding: { left: 4, right: 4 }, content: [{ separator: { orientation: 'vertical' } }] },
      { weight: 1, alignment: 'center middle', padding: { top: 32, bottom: 32, left: 12, right: 12 }, showBorder: true, backgroundColor: 'teal', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'centered both', size: 'xs', padding: { bottom: 2 } } }, { text: { value: 'center middle', size: 'sm', alignment: 'center' } }] },
      { alignment: 'stretch center', padding: { left: 4, right: 4 }, content: [{ separator: { orientation: 'vertical' } }] },
      { weight: 1, alignment: 'center right', padding: { top: 32, bottom: 32, left: 12, right: 12 }, showBorder: true, backgroundColor: 'indigo', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'right + v-center', size: 'xs', padding: { bottom: 2 } } }, { text: { value: 'center right', size: 'sm', alignment: 'right' } }] },
      { alignment: 'stretch center', padding: { left: 4, right: 4 }, content: [{ separator: { orientation: 'vertical' } }] },
      { weight: 1, alignment: 'stretch center', padding: { top: 32, bottom: 32, left: 12, right: 12 }, showBorder: true, backgroundColor: 'emerald', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'fills width', size: 'xs', padding: { bottom: 2 } } }, { text: { value: 'stretch center', size: 'sm', alignment: 'center' } }] },
    ],
    [
      { weight: 1, alignment: 'center left', padding: 8, showBorder: true, contentDirection: 'row', content: [{ text: { value: 'row + center left', size: 'xs', padding: { bottom: 2 } } }, { text: { value: 'A', size: 'sm' } }, { text: { value: 'B', size: 'sm', padding: { left: 4 } } }, { text: { value: 'C', size: 'sm', padding: { left: 4 } } }] },
      { weight: 1, alignment: 'center right', padding: 8, showBorder: true, contentDirection: 'column', content: [{ text: { value: 'column + center right', size: 'xs', padding: { bottom: 2 } } }, { text: { value: 'A', size: 'sm' } }, { text: { value: 'B', size: 'sm', padding: { top: 4 } } }, { text: { value: 'C', size: 'sm', padding: { top: 4 } } }] },
    ],
    [ { weight: 1, alignment: 'stretch center', padding: { top: 4, bottom: 4 }, content: [{ separator: {} }] } ],
    // --- Padding ---
    [
      { alignment: 'center middle', padding: 16, showBorder: true, backgroundColor: 'teal', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'padding: 16', size: 'xs', padding: { bottom: 2 } } }, { text: { value: '16px all sides', size: 'sm' } }] },
      { alignment: 'center middle', padding: { top: 4, right: 32, bottom: 4, left: 32 }, showBorder: true, backgroundColor: 'indigo', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'padding: { top:4, right:32, bottom:4, left:32 }', size: 'xs', padding: { bottom: 2 } } }, { text: { value: '4 top/bottom, 32 left/right', size: 'sm' } }] },
      { alignment: 'center middle', padding: { top: 32, right: 4, bottom: 32, left: 4 }, showBorder: true, backgroundColor: 'emerald', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'padding: { top:32, right:4, bottom:32, left:4 }', size: 'xs', padding: { bottom: 2 } } }, { text: { value: '32 top/bottom, 4 left/right', size: 'sm' } }] },
    ],
    [ { weight: 1, alignment: 'stretch center', padding: { top: 4, bottom: 4 }, content: [{ separator: {} }] } ],
    // --- Table ---
    [
      {
        weight: 1,
        alignment: 'stretch center',
        content: [
          { text: { value: 'Table: source = py:function_name', size: 'xs', padding: { bottom: 2 } } },
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
    [ { weight: 1, alignment: 'stretch center', padding: { top: 4, bottom: 4 }, content: [{ separator: {} }] } ],
    // --- Charts ---
    [
      {
        weight: 1,
        alignment: 'stretch center',
        padding: 8,
        content: [
          { text: { value: 'Chart (pie): source = py:function_name', size: 'xs', padding: { bottom: 2 } } },
          { text: { value: 'Expected: { items: [{ label: str, value: number }, ...] }', size: 'xs', padding: { bottom: 4 } } },
          { Chart: { type: 'pie', source: 'py:get_sample_pie', padding: { top: 8, bottom: 8 } } },
        ],
      },
      {
        weight: 1,
        alignment: 'stretch center',
        padding: 8,
        content: [
          { text: { value: 'Chart (line): same { items } format (placeholder)', size: 'xs', padding: { bottom: 4 } } },
          { Chart: { type: 'line', source: 'py:get_sample_line', padding: { top: 8, bottom: 8 } } },
        ],
      },
      {
        weight: 1,
        alignment: 'stretch center',
        padding: 8,
        content: [
          { text: { value: 'Chart (bar): same { items } format (placeholder)', size: 'xs', padding: { bottom: 4 } } },
          { Chart: { type: 'bar', source: 'py:get_sample_bar', padding: { top: 8, bottom: 8 } } },
        ],
      },
    ],
  ],
  python_code: `def get_sample_number(context, inputs):
    return 42.5

def get_sample_table(context, inputs):
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
  functions: ['get_sample_number', 'get_sample_table', 'get_sample_pie', 'get_sample_line', 'get_sample_bar'],
};
