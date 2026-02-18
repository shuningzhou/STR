/**
 * Example subview: Flex and Padding.
 * Demonstrates every flex property and padding options.
 */
import type { SubviewSpec } from '@str/shared';

const SEP: SubviewSpec['layout'] = [[{ flex: { flex: 1, justifyContent: 'center', alignItems: 'stretch' }, padding: { top: 4, bottom: 4 }, content: [{ separator: {} }] }]];

export const FLEX_PADDING_EXAMPLE: SubviewSpec = {
  type: 'readonly',
  name: 'Flex & Padding',
  description: 'Every flex property and padding examples',
  maker: 'official',
  defaultSize: { w: 900, h: 680 },
  inputs: {},
  layout: [
    // ═══ 1. UNIVERSAL PROPERTIES ═══
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, content: [{ text: { value: '1. Universal properties', size: 'md', bold: true } }] }],
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, content: [{ text: { value: 'Work on both row (as container) and cell (as container or item): flexDirection, justifyContent, alignItems, flexWrap, gap, flex, flexGrow, flexShrink, flexBasis, alignSelf, minWidth, minHeight', size: 'xs' } }] }],
    ...SEP,

    // --- flexDirection ---
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, content: [{ text: { value: 'flexDirection', size: 'md', bold: true } }] }],
    ...SEP,
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, showBorder: true, content: [{ text: { value: 'row', size: 'xs' } }] }],
    { flex: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }, cells: [
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'red', textColor: 'white', content: [{ text: { value: 'A', size: 'sm' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'orange', textColor: 'white', content: [{ text: { value: 'B', size: 'sm' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'yellow', textColor: 'black', content: [{ text: { value: 'C', size: 'sm' } }] },
    ]},
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, showBorder: true, content: [{ text: { value: 'column', size: 'xs' } }] }],
    { flex: { flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 8 }, cells: [
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'teal', textColor: 'white', content: [{ text: { value: 'A', size: 'sm' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'cyan', textColor: 'black', content: [{ text: { value: 'B', size: 'sm' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'blue', textColor: 'white', content: [{ text: { value: 'C', size: 'sm' } }] },
    ]},
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, showBorder: true, content: [{ text: { value: 'row-reverse', size: 'xs' } }] }],
    { flex: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8 }, cells: [
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'indigo', textColor: 'white', content: [{ text: { value: 'A', size: 'sm' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'violet', textColor: 'white', content: [{ text: { value: 'B', size: 'sm' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'purple', textColor: 'white', content: [{ text: { value: 'C', size: 'sm' } }] },
    ]},
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, showBorder: true, content: [{ text: { value: 'column-reverse', size: 'xs' } }] }],
    { flex: { flexDirection: 'column-reverse', justifyContent: 'center', alignItems: 'center', gap: 8 }, cells: [
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'emerald', textColor: 'white', content: [{ text: { value: 'A', size: 'sm' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'green', textColor: 'white', content: [{ text: { value: 'B', size: 'sm' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'lime', textColor: 'black', content: [{ text: { value: 'C', size: 'sm' } }] },
    ]},
    ...SEP,

    // --- justifyContent ---
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, content: [{ text: { value: 'justifyContent', size: 'md', bold: true } }] }],
    ...SEP,
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, showBorder: true, content: [{ text: { value: 'flex-start', size: 'xs' } }] }],
    { flex: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', minHeight: 48 }, cells: [
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'slate', textColor: 'white', content: [{ text: { value: 'A', size: 'sm' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'teal', textColor: 'white', content: [{ text: { value: 'B', size: 'sm' } }] },
    ]},
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, showBorder: true, content: [{ text: { value: 'center', size: 'xs' } }] }],
    { flex: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', minHeight: 48 }, cells: [
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'slate', textColor: 'white', content: [{ text: { value: 'A', size: 'sm' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'teal', textColor: 'white', content: [{ text: { value: 'B', size: 'sm' } }] },
    ]},
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, showBorder: true, content: [{ text: { value: 'flex-end', size: 'xs' } }] }],
    { flex: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', minHeight: 48 }, cells: [
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'indigo', textColor: 'white', content: [{ text: { value: 'A', size: 'sm' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'violet', textColor: 'white', content: [{ text: { value: 'B', size: 'sm' } }] },
    ]},
    [
      { flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, showBorder: true, content: [{ text: { value: 'space-between', size: 'xs' } }] },
    ],
    {
      flex: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 48 },
      cells: [
        { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'red', textColor: 'white', content: [{ text: { value: 'A', size: 'sm' } }] },
        { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'orange', textColor: 'white', content: [{ text: { value: 'B', size: 'sm' } }] },
        { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'yellow', textColor: 'black', content: [{ text: { value: 'C', size: 'sm' } }] },
      ],
    },
    [
      { flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, showBorder: true, content: [{ text: { value: 'space-around', size: 'xs' } }] },
    ],
    {
      flex: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', minHeight: 48 },
      cells: [
        { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'lime', textColor: 'black', content: [{ text: { value: 'A', size: 'sm' } }] },
        { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'green', textColor: 'white', content: [{ text: { value: 'B', size: 'sm' } }] },
        { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'teal', textColor: 'white', content: [{ text: { value: 'C', size: 'sm' } }] },
      ],
    },
    [
      { flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, showBorder: true, content: [{ text: { value: 'space-evenly', size: 'xs' } }] },
    ],
    {
      flex: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', minHeight: 48 },
      cells: [
        { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'blue', textColor: 'white', content: [{ text: { value: 'A', size: 'sm' } }] },
        { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'indigo', textColor: 'white', content: [{ text: { value: 'B', size: 'sm' } }] },
        { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'violet', textColor: 'white', content: [{ text: { value: 'C', size: 'sm' } }] },
      ],
    },
    ...SEP,

    // --- alignItems ---
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, content: [{ text: { value: 'alignItems', size: 'md', bold: true } }] }],
    ...SEP,
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, showBorder: true, content: [{ text: { value: 'flex-start', size: 'xs' } }] }],
    { flex: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: 8, minHeight: 56 }, cells: [
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'slate', textColor: 'white', content: [{ text: { value: 'A', size: 'sm' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'teal', textColor: 'white', content: [{ text: { value: 'B', size: 'sm' } }] },
    ]},
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, showBorder: true, content: [{ text: { value: 'center', size: 'xs' } }] }],
    { flex: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, minHeight: 56 }, cells: [
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'slate', textColor: 'white', content: [{ text: { value: 'A', size: 'sm' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'teal', textColor: 'white', content: [{ text: { value: 'B', size: 'sm' } }] },
    ]},
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, showBorder: true, content: [{ text: { value: 'flex-end', size: 'xs' } }] }],
    { flex: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 8, minHeight: 56 }, cells: [
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'indigo', textColor: 'white', content: [{ text: { value: 'A', size: 'sm' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'violet', textColor: 'white', content: [{ text: { value: 'B', size: 'sm' } }] },
    ]},
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, showBorder: true, content: [{ text: { value: 'stretch', size: 'xs' } }] }],
    { flex: { flexDirection: 'row', justifyContent: 'center', alignItems: 'stretch', gap: 8, minHeight: 56 }, cells: [
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'emerald', textColor: 'white', content: [{ text: { value: 'A', size: 'sm' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'green', textColor: 'white', content: [{ text: { value: 'B', size: 'sm' } }] },
    ]},
    ...SEP,

    // --- flexWrap ---
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, content: [{ text: { value: 'flexWrap', size: 'md', bold: true } }] }],
    ...SEP,
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, showBorder: true, content: [{ text: { value: 'nowrap — items overflow container', size: 'xs' } }] }],
    {
      flex: { flexDirection: 'row', flexWrap: 'nowrap', gap: 8, justifyContent: 'flex-start', alignItems: 'center', maxWidth: 280 },
      cells: [
        { flex: { flex: '0 0 70px', justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'red', textColor: 'white', content: [{ text: { value: 'A', size: 'sm' } }] },
        { flex: { flex: '0 0 70px', justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'orange', textColor: 'white', content: [{ text: { value: 'B', size: 'sm' } }] },
        { flex: { flex: '0 0 70px', justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'yellow', textColor: 'black', content: [{ text: { value: 'C', size: 'sm' } }] },
        { flex: { flex: '0 0 70px', justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'lime', textColor: 'black', content: [{ text: { value: 'D', size: 'sm' } }] },
        { flex: { flex: '0 0 70px', justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'teal', textColor: 'white', content: [{ text: { value: 'E', size: 'sm' } }] },
        { flex: { flex: '0 0 70px', justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'blue', textColor: 'white', content: [{ text: { value: 'F', size: 'sm' } }] },
      ],
    },
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, showBorder: true, content: [{ text: { value: 'wrap — items wrap to next line', size: 'xs' } }] }],
    {
      flex: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start', alignItems: 'center', maxWidth: 280 },
      cells: [
        { flex: { flex: '0 0 70px', justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'red', textColor: 'white', content: [{ text: { value: 'A', size: 'sm' } }] },
        { flex: { flex: '0 0 70px', justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'orange', textColor: 'white', content: [{ text: { value: 'B', size: 'sm' } }] },
        { flex: { flex: '0 0 70px', justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'yellow', textColor: 'black', content: [{ text: { value: 'C', size: 'sm' } }] },
        { flex: { flex: '0 0 70px', justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'lime', textColor: 'black', content: [{ text: { value: 'D', size: 'sm' } }] },
        { flex: { flex: '0 0 70px', justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'teal', textColor: 'white', content: [{ text: { value: 'E', size: 'sm' } }] },
        { flex: { flex: '0 0 70px', justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'blue', textColor: 'white', content: [{ text: { value: 'F', size: 'sm' } }] },
      ],
    },
    ...SEP,

    // --- gap ---
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, content: [{ text: { value: 'gap', size: 'md', bold: true } }] }],
    ...SEP,
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, showBorder: true, content: [{ text: { value: 'gap: 4', size: 'xs' } }] }],
    { flex: { flexDirection: 'row', gap: 4, alignItems: 'center' }, cells: [
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'fuchsia', textColor: 'white', content: [{ text: { value: 'A', size: 'sm' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'pink', textColor: 'white', content: [{ text: { value: 'B', size: 'sm' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'rose', textColor: 'white', content: [{ text: { value: 'C', size: 'sm' } }] },
    ]},
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, showBorder: true, content: [{ text: { value: 'gap: 16', size: 'xs' } }] }],
    { flex: { flexDirection: 'row', gap: 16, alignItems: 'center' }, cells: [
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'fuchsia', textColor: 'white', content: [{ text: { value: 'A', size: 'sm' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'pink', textColor: 'white', content: [{ text: { value: 'B', size: 'sm' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'rose', textColor: 'white', content: [{ text: { value: 'C', size: 'sm' } }] },
    ]},
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, showBorder: true, content: [{ text: { value: 'gap: 32', size: 'xs' } }] }],
    { flex: { flexDirection: 'row', gap: 32, alignItems: 'center' }, cells: [
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'crimson', textColor: 'white', content: [{ text: { value: 'A', size: 'sm' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'red', textColor: 'white', content: [{ text: { value: 'B', size: 'sm' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'rose', textColor: 'white', content: [{ text: { value: 'C', size: 'sm' } }] },
    ]},
    ...SEP,

    // ═══ 2. ROW-ONLY (none) ═══
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, content: [{ text: { value: '2. Row-only properties', size: 'md', bold: true } }] }],
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, content: [{ text: { value: 'None. All flex properties are universal — they work wherever applied.', size: 'xs' } }] }],
    ...SEP,

    // ═══ 3. CELL-ONLY (flex item properties) ═══
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, content: [{ text: { value: '3. Cell-only properties', size: 'md', bold: true } }] }],
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, content: [{ text: { value: 'alignSelf, flex, flexGrow, flexShrink, flexBasis, minWidth, minHeight — control a flex item (e.g. cell) within its container. Typically used on cells.', size: 'xs' } }] }],
    ...SEP,

    // --- alignSelf ---
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, content: [{ text: { value: 'alignSelf (middle cell overrides row alignItems)', size: 'md', bold: true } }] }],
    ...SEP,
    {
      flex: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'stretch', gap: 8, minHeight: 80 },
      cells: [
        { flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'slate', textColor: 'white', content: [{ text: { value: 'A (stretch)', size: 'xs' } }] },
        { flex: { flex: 1, alignSelf: 'flex-end', justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'teal', textColor: 'white', content: [{ text: { value: 'B (alignSelf: flex-end)', size: 'xs' } }] },
        { flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'indigo', textColor: 'white', content: [{ text: { value: 'C (stretch)', size: 'xs' } }] },
      ],
    },
    ...SEP,

    // --- flex, flexGrow, flexShrink, flexBasis ---
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, content: [{ text: { value: 'flex / flexGrow / flexShrink / flexBasis', size: 'md', bold: true } }] }],
    ...SEP,
    [
      { flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'slate', textColor: 'white', content: [{ text: { value: 'flex: 1', size: 'xs' } }] },
      { flex: { flex: 2, justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'teal', textColor: 'white', content: [{ text: { value: 'flex: 2', size: 'xs' } }] },
      { flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'indigo', textColor: 'white', content: [{ text: { value: 'flex: 1', size: 'xs' } }] },
    ],
    [
      { flex: { flexGrow: 0, flexShrink: 1, flexBasis: 100, justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'amber', textColor: 'black', content: [{ text: { value: 'flexBasis: 100', size: 'xs' } }] },
      { flex: { flexGrow: 1, flexShrink: 0, flexBasis: 'auto', justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'sky', textColor: 'black', content: [{ text: { value: 'flexGrow: 1', size: 'xs' } }] },
      { flex: { flex: '0 0 80px', justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'rose', textColor: 'white', content: [{ text: { value: 'flex: "0 0 80px"', size: 'xs' } }] },
    ],
    ...SEP,

    // --- minWidth, minHeight ---
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, content: [{ text: { value: 'minWidth / minHeight', size: 'md', bold: true } }] }],
    ...SEP,
    [
      { flex: { minWidth: 60, minHeight: 40, justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'lime', textColor: 'black', content: [{ text: { value: 'minWidth: 60, minHeight: 40', size: 'xs' } }] },
      { flex: { minWidth: 120, minHeight: 50, justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'green', textColor: 'white', content: [{ text: { value: 'minWidth: 120, minHeight: 50', size: 'xs' } }] },
      { flex: { flex: 1, minWidth: 80, minHeight: 30, justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'orange', textColor: 'black', content: [{ text: { value: 'flex:1 + min', size: 'xs' } }] },
    ],
    ...SEP,

    // ═══ 4. HOW TO USE ROW-LEVEL FLEX ═══
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, content: [{ text: { value: '4. How to use row-level flex', size: 'md', bold: true } }] }],
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, content: [{ text: { value: 'Use { flex, cells } instead of [cell, cell]. The row\'s flex controls how cells are laid out.', size: 'xs' } }] }],
    ...SEP,
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, showBorder: true, content: [{ text: { value: 'Regular row [A, B, C]', size: 'xs' } }] }],
    [
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'emerald', textColor: 'white', content: [{ text: { value: 'A', size: 'sm' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'teal', textColor: 'white', content: [{ text: { value: 'B', size: 'sm' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'indigo', textColor: 'white', content: [{ text: { value: 'C', size: 'sm' } }] },
    ],
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, showBorder: true, content: [{ text: { value: 'Row-level { flex, cells }: space-between', size: 'xs' } }] }],
    {
      flex: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
      cells: [
        { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'emerald', textColor: 'white', content: [{ text: { value: 'A', size: 'sm' } }] },
        { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'teal', textColor: 'white', content: [{ text: { value: 'B', size: 'sm' } }] },
        { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'indigo', textColor: 'white', content: [{ text: { value: 'C', size: 'sm' } }] },
      ],
    },
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, showBorder: true, content: [{ text: { value: 'Row-level: center | flex-end | column', size: 'xs' } }] }],
    {
      flex: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
      cells: [
        { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'red', textColor: 'white', content: [{ text: { value: 'A', size: 'sm' } }] },
        { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'orange', textColor: 'white', content: [{ text: { value: 'B', size: 'sm' } }] },
        { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'yellow', textColor: 'black', content: [{ text: { value: 'C', size: 'sm' } }] },
      ],
    },
    {
      flex: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8 },
      cells: [
        { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'lime', textColor: 'black', content: [{ text: { value: 'A', size: 'sm' } }] },
        { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'green', textColor: 'white', content: [{ text: { value: 'B', size: 'sm' } }] },
        { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'teal', textColor: 'white', content: [{ text: { value: 'C', size: 'sm' } }] },
      ],
    },
    {
      flex: { flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 8 },
      cells: [
        { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'blue', textColor: 'white', content: [{ text: { value: 'A', size: 'sm' } }] },
        { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'indigo', textColor: 'white', content: [{ text: { value: 'B', size: 'sm' } }] },
        { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'violet', textColor: 'white', content: [{ text: { value: 'C', size: 'sm' } }] },
      ],
    },
    ...SEP,

    // ═══ 5. HOW TO USE CELL-LEVEL FLEX ═══
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, content: [{ text: { value: '5. How to use cell-level flex', size: 'md', bold: true } }] }],
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, content: [{ text: { value: 'Add flex to each cell. Cell as container: flexDirection, gap lay out content. Cell as item: flex, alignSelf control size/alignment within row.', size: 'xs' } }] }],
    ...SEP,
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, showBorder: true, content: [{ text: { value: 'Cell as container: flexDirection row + gap lay out label and value', size: 'xs' } }] }],
    [
      { flex: { flexDirection: 'row', gap: 8, justifyContent: 'space-between', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'slate', textColor: 'white', content: [{ text: { value: 'Label:', size: 'xs' } }, { text: { value: 'Value', size: 'sm' } }] },
      { flex: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'teal', textColor: 'white', content: [{ text: { value: 'Amount:', size: 'xs' } }, { text: { value: '$100', size: 'sm' } }] },
    ],
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 4, showBorder: true, content: [{ text: { value: 'Cell as item: flex: 1, flex: 2, flex: 1 ratio within row', size: 'xs' } }] }],
    [
      { flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'slate', textColor: 'white', content: [{ text: { value: '1/4', size: 'xs' } }] },
      { flex: { flex: 2, justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'teal', textColor: 'white', content: [{ text: { value: '1/2', size: 'xs' } }] },
      { flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, padding: 8, showBorder: true, backgroundColor: 'indigo', textColor: 'white', content: [{ text: { value: '1/4', size: 'xs' } }] },
    ],
    ...SEP,

    // --- Padding ---
    [{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, content: [{ text: { value: 'Padding', size: 'md', bold: true } }] }],
    ...SEP,
    [
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: 16, showBorder: true, backgroundColor: 'teal', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'padding: 16', size: 'xs', padding: { bottom: 2 } } }, { text: { value: '16px all sides', size: 'sm' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: { top: 4, right: 32, bottom: 4, left: 32 }, showBorder: true, backgroundColor: 'indigo', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'padding: { top:4, right:32, bottom:4, left:32 }', size: 'xs', padding: { bottom: 2 } } }, { text: { value: '4 top/bottom, 32 L/R', size: 'sm' } }] },
      { flex: { justifyContent: 'center', alignItems: 'center' }, padding: { top: 32, right: 4, bottom: 32, left: 4 }, showBorder: true, backgroundColor: 'emerald', textColor: 'rgb(255,255,255)', content: [{ text: { value: 'padding: { top:32, right:4, bottom:32, left:4 }', size: 'xs', padding: { bottom: 2 } } }, { text: { value: '32 T/B, 4 L/R', size: 'sm' } }] },
    ],
  ],
  python_code: '',
  functions: [],
};
