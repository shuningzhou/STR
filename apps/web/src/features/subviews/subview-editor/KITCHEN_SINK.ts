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
    // --- Row 0: Title ---
    [
      {
        weight: 1,
        alignment: 'center middle',
        content: [
          { text: { value: 'Kitchen Sink — All Layout & Content Options', size: 'xl', bold: true, alignment: 'center', padding: { top: 12, bottom: 8 } } },
        ],
      },
    ],
    // --- Row 1: All 5 input types ---
    [
      { alignment: 'left center', padding: 4, content: [{ text: { value: 'Inputs:', size: 'sm', bold: true } }] },
      { alignment: 'left center', padding: 4, content: [{ input: { ref: 'timeRange', padding: 4 } }] },
      { alignment: 'left center', padding: 4, content: [{ input: { ref: 'ticker', padding: 4 } }] },
      { alignment: 'left center', padding: 4, content: [{ input: { ref: 'count', padding: 4 } }] },
      { alignment: 'left center', padding: 4, content: [{ input: { ref: 'viewMode', padding: 4 } }] },
      { alignment: 'left center', padding: 4, content: [{ input: { ref: 'enabled', padding: 4 } }] },
    ],
    // --- Row 2: Text sizes (xs, sm, md, lg, xl, xxl, xxxl) ---
    [
      {
        weight: 1,
        alignment: 'stretch center',
        padding: { top: 8, bottom: 4, left: 8, right: 8 },
        content: [
          { text: { value: 'Text sizes:', size: 'sm', bold: true } },
          { text: { value: 'xs', size: 'xs', padding: { top: 2 } } },
          { text: { value: 'sm', size: 'sm', padding: { top: 2 } } },
          { text: { value: 'md', size: 'md', padding: { top: 2 } } },
          { text: { value: 'lg', size: 'lg', padding: { top: 2 } } },
          { text: { value: 'xl', size: 'xl', padding: { top: 2 } } },
          { text: { value: 'xxl', size: 'xxl', padding: { top: 2 } } },
          { text: { value: 'xxxl', size: 'xxxl', padding: { top: 2 } } },
        ],
      },
      {
        weight: 1,
        alignment: 'stretch center',
        padding: { top: 8, bottom: 4, left: 8, right: 8 },
        content: [
          { text: { value: 'Text styles:', size: 'sm', bold: true } },
          { text: { value: 'Bold text', size: 'sm', bold: true, padding: { top: 2 } } },
          { text: { value: 'Italic text', size: 'sm', italic: true, padding: { top: 2 } } },
          { text: { value: 'Bold + italic', size: 'sm', bold: true, italic: true, padding: { top: 2 } } },
        ],
      },
    ],
    // --- Row 3: Number formats ---
    [
      {
        weight: 1,
        alignment: 'left center',
        padding: 8,
        content: [
          { text: { value: 'Number format $:', size: 'sm', bold: true } },
          { number: { value: 1234.56, format: '$', decimals: 2, size: 'lg', padding: { top: 4 } } },
        ],
      },
      {
        weight: 1,
        alignment: 'left center',
        padding: 8,
        content: [
          { text: { value: 'Number format %:', size: 'sm', bold: true } },
          { number: { value: 67.89, format: '%', decimals: 1, size: 'lg', padding: { top: 4 } } },
        ],
      },
      {
        weight: 1,
        alignment: 'left center',
        padding: 8,
        content: [
          { text: { value: 'Number from Python:', size: 'sm', bold: true } },
          { number: { value: 'py:get_sample_number', format: '$', decimals: 2, size: 'md', padding: { top: 4 } } },
        ],
      },
    ],
    // --- Row 4: Cell alignments (left center, center middle, right top, stretch center) ---
    [
      {
        alignment: 'left center',
        padding: 8,
        content: [
          { text: { value: 'left center', size: 'xs', alignment: 'left' } },
        ],
      },
      {
        alignment: 'center middle',
        padding: 8,
        content: [
          { text: { value: 'center middle', size: 'xs', alignment: 'center' } },
        ],
      },
      {
        alignment: 'right top',
        padding: 8,
        content: [
          { text: { value: 'right top', size: 'xs', alignment: 'right' } },
        ],
      },
      {
        weight: 1,
        alignment: 'stretch center',
        padding: 8,
        content: [
          { text: { value: 'stretch center (weight:1)', size: 'xs', alignment: 'center' } },
        ],
      },
    ],
    // --- Row 5: Table ---
    [
      {
        weight: 1,
        alignment: 'stretch center',
        content: [
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
    // --- Row 6: Charts (pie renders; line/bar show placeholder until implemented) ---
    [
      {
        weight: 1,
        alignment: 'stretch center',
        padding: 8,
        content: [
          { text: { value: 'Chart (pie) — renders:', size: 'sm', bold: true } },
          {
            Chart: {
              type: 'pie',
              source: 'py:get_sample_pie',
              padding: { top: 8, bottom: 8 },
            },
          },
        ],
      },
      {
        weight: 1,
        alignment: 'stretch center',
        padding: 8,
        content: [
          { text: { value: 'Chart (line) — placeholder:', size: 'sm', bold: true } },
          {
            Chart: {
              type: 'line',
              source: 'py:get_sample_line',
              padding: { top: 8, bottom: 8 },
            },
          },
        ],
      },
      {
        weight: 1,
        alignment: 'stretch center',
        padding: 8,
        content: [
          { text: { value: 'Chart (bar) — placeholder:', size: 'sm', bold: true } },
          {
            Chart: {
              type: 'bar',
              source: 'py:get_sample_bar',
              padding: { top: 8, bottom: 8 },
            },
          },
        ],
      },
    ],
    // --- Row 7: Padding examples ---
    [
      {
        weight: 1,
        alignment: 'left center',
        padding: 20,
        content: [
          { text: { value: 'Cell padding: 20 (uniform)', size: 'sm', padding: 10 } },
        ],
      },
      {
        weight: 1,
        alignment: 'left center',
        padding: { top: 10, right: 20, bottom: 10, left: 20 },
        content: [
          { text: { value: 'Cell padding: { top:10, right:20, bottom:10, left:20 }', size: 'sm', padding: 5 } },
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
