/**
 * Grid config shared by strategy canvas and mini canvas preview.
 * Keep in sync — both canvases use the same column/row settings.
 * Resolution 2x: 48 cols, 40px row height for finer positioning.
 */
export const CANVAS_GRID_CONFIG = {
  cols: 48,
  rowHeight: 20,
  margin: [12, 12] as [number, number],
  containerPadding: [0, 0] as [number, number],
} as const;

export const CANVAS_LAYOUT_CONSTRAINTS = {
  minW: 10,
  minH: 5,
  maxW: 48,
  maxH: 40,
} as const;
