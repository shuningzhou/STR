import type { SubviewSpec } from '@str/shared';
import { WIN_RATE_EXAMPLE } from './subview-editor/WIN_RATE_EXAMPLE';

/** Subview template definition (Phase 4); spec-based (Phase 5) */
export interface SubviewTemplate {
  id: string;
  name: string;
  description: string;
  defaultSize: { w: number; h: number };
  /** JSON+Python spec; when present, subview is rendered from spec */
  spec?: SubviewSpec;
}

export const SUBVIEW_TEMPLATES: SubviewTemplate[] = [
  { id: 'equity-curve', name: 'Equity Curve', description: 'Cumulative P&L over time (line chart)', defaultSize: { w: 12, h: 3 } },
  { id: 'win-rate', name: 'Win Rate', description: '% of profitable trades', defaultSize: { w: 6, h: 2 }, spec: WIN_RATE_EXAMPLE as unknown as SubviewSpec },
  { id: 'monthly-returns', name: 'Monthly Returns', description: 'Bar chart grouped by month', defaultSize: { w: 12, h: 3 } },
  { id: 'exposure-breakdown', name: 'Exposure Breakdown', description: 'Pie chart by asset type or sector', defaultSize: { w: 6, h: 2 } },
  { id: 'realized-pnl-table', name: 'Realized P&L Table', description: 'Sortable table of closed trades', defaultSize: { w: 12, h: 3 } },
  { id: 'open-positions', name: 'Open Positions', description: 'Current holdings from transactions', defaultSize: { w: 12, h: 3 } },
  { id: 'drawdown-chart', name: 'Drawdown Chart', description: 'Max drawdown over time (area chart)', defaultSize: { w: 12, h: 2 } },
  { id: 'risk-reward', name: 'Risk/Reward Ratio', description: 'Average win vs average loss', defaultSize: { w: 6, h: 2 } },
  { id: 'trade-frequency', name: 'Trade Frequency', description: 'Histogram of trades per day/week/month', defaultSize: { w: 8, h: 2 } },
  { id: 'custom', name: 'Custom', description: 'Build your own subview in the editor', defaultSize: { w: 8, h: 2 } },
];
