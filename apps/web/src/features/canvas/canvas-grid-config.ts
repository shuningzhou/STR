/**
 * Grid config shared by strategy canvas and mini canvas preview.
 * Keep in sync — both canvases use the same column/row settings.
 */
export const CANVAS_GRID_CONFIG = {
  cols: 24,
  rowHeight: 80,
  margin: [12, 12] as [number, number],
  containerPadding: [0, 0] as [number, number],
} as const;

export const CANVAS_LAYOUT_CONSTRAINTS = {
  minW: 3,
  minH: 1,
  maxW: 24,
  maxH: 10,
} as const;
