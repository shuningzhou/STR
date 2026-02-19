/**
 * Example subview: Built-in color system.
 * Demonstrates 12 main colors with variants, plus black and white (no variants).
 */
import type { SubviewSpec } from '@str/shared';

const MAIN_COLORS = [
  'red',
  'orange',
  'yellow',
  'lime',
  'green',
  'mint',
  'cyan',
  'blue',
  'violet',
  'magenta',
  'grey',
  'offwhite',
  'black',
  'white',
] as const;

const SEP: SubviewSpec['layout'] = [[{ flex: { flex: 1, justifyContent: 'center', alignItems: 'stretch' }, padding: { top: 4, bottom: 4 }, content: [{ separator: {} }] }]];

// Row of 14 color swatches (12 main + black, white)
const mainColorsRow: SubviewSpec['layout'][0] = MAIN_COLORS.map((name) => ({
  flex: { flex: 1, minWidth: 80, justifyContent: 'center', alignItems: 'center' },
  padding: 6,
  showBorder: true,
  backgroundColor: name,
  textColor: ['yellow', 'lime', 'green', 'mint', 'grey', 'offwhite', 'white'].includes(name) ? 'black' : 'white',
  content: [{ text: { value: name, size: 'xs', alignment: 'center' as const } }],
}));

// Variant row for a given color (name-0 through name-4)
const variantRow = (name: string): SubviewSpec['layout'][0] =>
  [0, 1, 2, 3, 4].map((i) => ({
    flex: { flex: 1, minWidth: 70, justifyContent: 'center', alignItems: 'center' },
    padding: 6,
    showBorder: true,
    backgroundColor: `${name}-${i}`,
    textColor: i <= 1 ? 'black' : 'white',
    content: [{ text: { value: `${name}-${i}`, size: 'xs', alignment: 'center' as const } }],
  }));

export const COLORS_EXAMPLE: SubviewSpec = {
  type: 'readonly',
  name: 'Color System',
  description: '12 main colors with 5 variants each, plus black and white (no variants)',
  maker: 'official',
  categories: ['example'],
  icon: 'Palette',
  iconColor: 'magenta',
  defaultSize: { w: 900, h: 680 },
  inputs: {},
  layout: [
    [
      {
        flex: { flex: 1, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'stretch' },
        padding: 8,
        content: [
          { text: { value: 'Built-in color system', size: 'md', bold: true } },
          {
            text: {
              value: '12 main colors with 5 variants each. Black and white have no variants. name-0 (lightest, 50% white), name-1 (lighter, 30% white), name-2 (default), name-3 (darker, 20% black), name-4 (darkest, 40% black). Base name (e.g. red) = default.',
              size: 'xs',
              padding: { top: 4 },
            },
          },
        ],
      },
    ],
    ...SEP,
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, content: [{ text: { value: '12 main colors + black, white (default shade)', size: 'sm', bold: true } }] }],
    mainColorsRow,
    ...SEP,
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, content: [{ text: { value: 'Red variants', size: 'sm', bold: true } }] }],
    variantRow('red'),
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, content: [{ text: { value: 'Orange variants', size: 'sm', bold: true } }] }],
    variantRow('orange'),
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, content: [{ text: { value: 'Yellow variants', size: 'sm', bold: true } }] }],
    variantRow('yellow'),
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, content: [{ text: { value: 'Lime variants', size: 'sm', bold: true } }] }],
    variantRow('lime'),
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, content: [{ text: { value: 'Green variants', size: 'sm', bold: true } }] }],
    variantRow('green'),
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, content: [{ text: { value: 'Mint variants', size: 'sm', bold: true } }] }],
    variantRow('mint'),
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, content: [{ text: { value: 'Cyan variants', size: 'sm', bold: true } }] }],
    variantRow('cyan'),
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, content: [{ text: { value: 'Blue variants', size: 'sm', bold: true } }] }],
    variantRow('blue'),
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, content: [{ text: { value: 'Violet variants', size: 'sm', bold: true } }] }],
    variantRow('violet'),
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, content: [{ text: { value: 'Magenta variants', size: 'sm', bold: true } }] }],
    variantRow('magenta'),
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, content: [{ text: { value: 'Grey variants', size: 'sm', bold: true } }] }],
    variantRow('grey'),
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, content: [{ text: { value: 'Offwhite variants', size: 'sm', bold: true } }] }],
    variantRow('offwhite'),
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, content: [{ text: { value: 'Black, white (no variants)', size: 'sm', bold: true } }] }],
    [
      { flex: { flex: 1, minWidth: 80, justifyContent: 'center', alignItems: 'center' }, padding: 6, showBorder: true, backgroundColor: 'black', textColor: 'white', content: [{ text: { value: 'black', size: 'xs', alignment: 'center' as const } }] },
      { flex: { flex: 1, minWidth: 80, justifyContent: 'center', alignItems: 'center' }, padding: 6, showBorder: true, backgroundColor: 'white', textColor: 'black', content: [{ text: { value: 'white', size: 'xs', alignment: 'center' as const } }] },
    ],
    ...SEP,
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, content: [{ text: { value: 'Usage: backgroundColor, textColor, iconColor', size: 'sm', bold: true } }] }],
    [
      {
        flex: { flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 4 },
        padding: 8,
        showBorder: true,
        backgroundColor: 'red-2',
        textColor: 'white',
        content: [
          { text: { value: 'backgroundColor: "red-2"', size: 'xs', bold: true } },
          { text: { value: 'textColor: "white"', size: 'xs' } },
        ],
      },
      {
        flex: { flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 4 },
        padding: 8,
        showBorder: true,
        backgroundColor: 'blue-3',
        textColor: 'yellow-0',
        content: [
          { text: { value: 'backgroundColor: "blue-3"', size: 'xs', bold: true } },
          { text: { value: 'textColor: "yellow-0"', size: 'xs' } },
        ],
      },
      {
        flex: { flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 4 },
        padding: 8,
        showBorder: true,
        content: [
          { text: { value: 'iconColor:', size: 'xs', bold: true } },
          { icon: { name: 'Star', color: 'magenta', size: 24 } },
          { icon: { name: 'Heart', color: 'red-2', size: 24 } },
          { icon: { name: 'Zap', color: 'yellow-2', size: 24 } },
        ],
      },
    ],
  ],
  python_code: '',
  functions: [],
};
