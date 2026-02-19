/**
 * Example subview: All available icons with names and JSON layout usage.
 * Demonstrates:
 * - spec.icon and spec.iconColor (card title bar)
 * - layout icon content: { icon: { name, color?, size? } }
 */
import type { SubviewSpec } from '@str/shared';
import { ICONS_BY_CATEGORY } from '@/lib/icons';

const COLORS = ['#22c55e', '#6c9dcb', '#a78bfa', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#8b5cf6'];
const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

// Build layout: header + category sections. Each category has a title + grid of icon cells.
const COLS = 6;
const categorySections: SubviewSpec['layout'] = [];

for (const cat of ICONS_BY_CATEGORY) {
  // Section header
  categorySections.push([
    {
      flex: { flex: 1, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'stretch' },
      padding: { top: 12, bottom: 4, left: 0, right: 0 },
      content: [
        { text: { value: cat.label, size: 'sm', bold: true } },
      ],
    },
  ]);
  // Icon grid rows
  for (let i = 0; i < cat.icons.length; i += COLS) {
    const row = cat.icons.slice(i, i + COLS).map((name) => {
      const iconColor = randomColor();
      return {
        flex: { flex: 1, minWidth: 120, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 2 },
        padding: 4,
        showBorder: true,
        content: [
          { icon: { name, color: iconColor, size: 18 } },
          { text: { value: name, size: 'xs', bold: true } },
          { text: { value: `{ "icon": { "name": "${name}", "color": "${iconColor}" } }`, size: 'xs' } },
        ],
      };
    });
    categorySections.push(row);
  }
}

const layoutRows: SubviewSpec['layout'] = [
  [
    {
      flex: { flex: 1, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'stretch' },
      padding: 8,
      content: [
        { text: { value: 'Icon gallery — use in JSON layout', size: 'md', bold: true } },
        { text: { value: 'Card bar: "icon": "Star", "iconColor": "green"', size: 'xs', padding: { top: 4 } } },
        { text: { value: 'Layout: { "icon": { "name": "Wallet", "color": "#22c55e", "size": 20 } }', size: 'xs', padding: { top: 2 } } },
      ],
    },
  ],
  ...categorySections,
];

export const ICONS_EXAMPLE: SubviewSpec = {
  type: 'readonly',
  name: 'Icon Gallery',
  description: 'All available icons with names and JSON layout usage',
  maker: 'official',
  categories: ['example'],
  icon: 'Star',
  iconColor: '#f59e0b',
  defaultSize: { w: 800, h: 600 },
  inputs: {},
  layout: layoutRows,
  python_code: 'def run(context, inputs): return {}',
  functions: ['run'],
};
