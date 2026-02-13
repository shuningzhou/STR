/** Subview template definition (Phase 4); pipeline will be used in Phase 6 */
export interface SubviewTemplate {
  id: string;
  name: string;
  description: string;
  defaultSize: { w: number; h: number };
  /** Placeholder for Phase 6 - pipeline { nodes, edges } */
  pipeline?: unknown;
}

export const SUBVIEW_TEMPLATES: SubviewTemplate[] = [
  { id: 'equity-curve', name: 'Equity Curve', description: 'Cumulative P&L over time (line chart)', defaultSize: { w: 12, h: 3 }, pipeline: null },
  { id: 'win-rate', name: 'Win Rate', description: '% of profitable trades (donut chart)', defaultSize: { w: 6, h: 2 }, pipeline: null },
  { id: 'monthly-returns', name: 'Monthly Returns', description: 'Bar chart grouped by month', defaultSize: { w: 12, h: 3 }, pipeline: null },
  { id: 'exposure-breakdown', name: 'Exposure Breakdown', description: 'Pie chart by asset type or sector', defaultSize: { w: 6, h: 2 }, pipeline: null },
  { id: 'realized-pnl-table', name: 'Realized P&L Table', description: 'Sortable table of closed trades', defaultSize: { w: 12, h: 3 }, pipeline: null },
  { id: 'open-positions', name: 'Open Positions', description: 'Current holdings from transactions', defaultSize: { w: 12, h: 3 }, pipeline: null },
  { id: 'drawdown-chart', name: 'Drawdown Chart', description: 'Max drawdown over time (area chart)', defaultSize: { w: 12, h: 2 }, pipeline: null },
  { id: 'risk-reward', name: 'Risk/Reward Ratio', description: 'Average win vs average loss', defaultSize: { w: 6, h: 2 }, pipeline: null },
  { id: 'trade-frequency', name: 'Trade Frequency', description: 'Histogram of trades per day/week/month', defaultSize: { w: 8, h: 2 }, pipeline: null },
  { id: 'custom', name: 'Custom', description: 'Build your own pipeline (Phase 5)', defaultSize: { w: 8, h: 2 }, pipeline: null },
];
