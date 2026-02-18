/**
 * Example subview: Text size/style, Input and Color.
 * Demonstrates inputs, text sizes, text styles, number formats, and colors.
 */
import type { SubviewSpec } from '@str/shared';

export const TEXT_INPUT_COLOR_EXAMPLE: SubviewSpec = {
  type: 'readonly',
  name: 'Text, Input & Color',
  description: 'Text sizes/styles, inputs, number formats, and colors',
  maker: 'official',
  categories: ['example'],
  defaultSize: { w: 700, h: 480 },
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
    [
      { flex: { justifyContent: 'center', alignItems: 'flex-start' }, padding: 4, content: [{ text: { value: 'Inputs:', size: 'sm', bold: true } }] },
      { flex: { justifyContent: 'center', alignItems: 'flex-start' }, padding: 4, content: [{ text: { value: 'time_range', size: 'xs' } }, { input: { ref: 'timeRange', padding: 4 } }] },
      { flex: { justifyContent: 'center', alignItems: 'flex-start' }, padding: 4, content: [{ text: { value: 'ticker_selector', size: 'xs' } }, { input: { ref: 'ticker', padding: 4 } }] },
      { flex: { justifyContent: 'center', alignItems: 'flex-start' }, padding: 4, content: [{ text: { value: 'number_input', size: 'xs' } }, { input: { ref: 'count', padding: 4 } }] },
      { flex: { justifyContent: 'center', alignItems: 'flex-start' }, padding: 4, content: [{ text: { value: 'select', size: 'xs' } }, { input: { ref: 'viewMode', padding: 4 } }] },
      { flex: { justifyContent: 'center', alignItems: 'flex-start' }, padding: 4, content: [{ text: { value: 'checkbox', size: 'xs' } }, { input: { ref: 'enabled', padding: 4 } }] },
    ],
    [
      {
        flex: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
        padding: { top: 8, bottom: 4, left: 8, right: 8 },
        content: [
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
    [
      {
        flex: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
        padding: { top: 8, bottom: 4, left: 8, right: 8 },
        content: [
          { text: { value: 'Text styles:', size: 'sm', bold: true } },
          { text: { value: 'Bold', size: 'sm', bold: true, padding: { left: 4 } } },
          { text: { value: 'Italic', size: 'sm', italic: true, padding: { left: 4 } } },
          { text: { value: 'Bold+Italic', size: 'sm', bold: true, italic: true, padding: { left: 4 } } },
        ],
      },
    ],
    [
      {
        flex: { flex: 1, justifyContent: 'center', alignItems: 'flex-start' },
        padding: 8,
        content: [
          { text: { value: 'format: $, decimals: 2', size: 'xs', padding: { bottom: 2 } } },
          { number: { value: 1234.56, format: '$', decimals: 2, size: 'lg', padding: { top: 4 } } },
        ],
      },
      {
        flex: { flex: 1, justifyContent: 'center', alignItems: 'flex-start' },
        padding: 8,
        content: [
          { text: { value: 'format: %, decimals: 1', size: 'xs', padding: { bottom: 2 } } },
          { number: { value: 67.89, format: '%', decimals: 1, size: 'lg', padding: { top: 4 } } },
        ],
      },
      {
        flex: { flex: 1, justifyContent: 'center', alignItems: 'flex-start' },
        padding: 8,
        content: [
          { text: { value: 'value: "py:fn" (e.g. py:get_sample_number)', size: 'xs', padding: { bottom: 2 } } },
          { number: { value: 'py:get_sample_number', format: '$', decimals: 2, size: 'md', padding: { top: 4 } } },
        ],
      },
    ],
    [
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 6, showBorder: true, backgroundColor: 'red', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'red', size: 'sm', alignment: 'center' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 6, showBorder: true, backgroundColor: 'orange', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'orange', size: 'sm', alignment: 'center' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 6, showBorder: true, backgroundColor: 'yellow', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'yellow', size: 'sm', alignment: 'center' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 6, showBorder: true, backgroundColor: 'lime', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'lime', size: 'sm', alignment: 'center' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 6, showBorder: true, backgroundColor: 'green', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'green', size: 'sm', alignment: 'center' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 6, showBorder: true, backgroundColor: 'teal', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'teal', size: 'sm', alignment: 'center' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 6, showBorder: true, backgroundColor: 'cyan', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'cyan', size: 'sm', alignment: 'center' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 6, showBorder: true, backgroundColor: 'blue', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'blue', size: 'sm', alignment: 'center' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 6, showBorder: true, backgroundColor: 'indigo', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'indigo', size: 'sm', alignment: 'center' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 6, showBorder: true, backgroundColor: 'purple', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'purple', size: 'sm', alignment: 'center' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 6, showBorder: true, backgroundColor: 'pink', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'pink', size: 'sm', alignment: 'center' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 6, showBorder: true, backgroundColor: 'gray', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'gray', size: 'sm', alignment: 'center' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 6, showBorder: true, backgroundColor: 'emerald', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'emerald', size: 'sm', alignment: 'center' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 6, showBorder: true, backgroundColor: 'violet', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'violet', size: 'sm', alignment: 'center' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 6, showBorder: true, backgroundColor: 'slate', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'slate', size: 'sm', alignment: 'center' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 6, showBorder: true, backgroundColor: 'navy', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'navy', size: 'sm', alignment: 'center' } }] },
    ],
    [
      {
        flex: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  ],
  python_code: `def get_sample_number(context, inputs):
    return 42.5
`,
  functions: ['get_sample_number'],
};
