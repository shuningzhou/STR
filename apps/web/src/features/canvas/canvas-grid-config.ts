/**
 * Grid config shared by strategy canvas and mini canvas preview.
 * defaultSize and preferredSize in subview spec are in PIXELS.
 * Position (x,y,w,h) for react-grid-layout is in grid units.
 */
export const CANVAS_GRID_CONFIG = {
  cols: 48,
  rowHeight: 5,
  margin: [12, 12] as [number, number],
  containerPadding: [0, 0] as [number, number],
} as const;

/** Subview min size in grid units (100px width, 35px height at REFERENCE_WIDTH) */
export const CANVAS_LAYOUT_CONSTRAINTS = {
  minW: 4,   // 100px
  minH: 7,   // 35px
  maxW: 48,
  maxH: 80,  // 400px
} as const;

/** Reference width for pixel→grid. Use consistently so preview and canvas match. */
export const REFERENCE_WIDTH = 1200;

/** Convert pixel size to grid units */
export function pixelsToGrid(
  pixelW: number,
  pixelH: number,
  containerWidth: number = REFERENCE_WIDTH
): { w: number; h: number } {
  const colWidth = containerWidth / CANVAS_GRID_CONFIG.cols;
  const w = Math.round(pixelW / colWidth);
  const h = Math.round(pixelH / CANVAS_GRID_CONFIG.rowHeight);
  return {
    w: Math.min(CANVAS_LAYOUT_CONSTRAINTS.maxW, Math.max(CANVAS_LAYOUT_CONSTRAINTS.minW, w)),
    h: Math.min(CANVAS_LAYOUT_CONSTRAINTS.maxH, Math.max(CANVAS_LAYOUT_CONSTRAINTS.minH, h)),
  };
}

/** Convert grid units to pixel size */
export function gridToPixels(
  gridW: number,
  gridH: number,
  containerWidth: number
): { w: number; h: number } {
  const colWidth = containerWidth / CANVAS_GRID_CONFIG.cols;
  return {
    w: Math.round(gridW * colWidth),
    h: Math.round(gridH * CANVAS_GRID_CONFIG.rowHeight),
  };
}
