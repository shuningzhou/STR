import type { SubviewSpec } from '@str/shared';
import { WIN_RATE_EXAMPLE } from './subview-editor/WIN_RATE_EXAMPLE';
import { STOCK_ETF_TRANSACTIONS_TABLE } from './subview-editor/STOCK_ETF_TRANSACTIONS_TABLE';
import { HOLDINGS_TABLE } from './subview-editor/HOLDINGS_TABLE';
import { PORTFOLIO_PIE_CHART } from './subview-editor/PORTFOLIO_PIE_CHART';
import { WALLET_TABLE } from './subview-editor/WALLET_TABLE';

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
  { id: 'equity-curve', name: 'Equity Curve', description: 'Cumulative P&L over time (line chart)', defaultSize: { w: 600, h: 120 } },
  { id: 'win-rate', name: 'Win Rate', description: '% of profitable trades', defaultSize: { w: 400, h: 70 }, spec: WIN_RATE_EXAMPLE as unknown as SubviewSpec },
  { id: 'stock-etf-transactions', name: 'Stock & ETF Transactions', description: 'Table of stock and ETF transactions (no options)', defaultSize: { w: 700, h: 180 }, spec: STOCK_ETF_TRANSACTIONS_TABLE as unknown as SubviewSpec },
  { id: 'holdings', name: 'Holdings', description: 'Current stock and ETF holdings with cost basis and gain', defaultSize: { w: 700, h: 180 }, spec: HOLDINGS_TABLE as unknown as SubviewSpec },
  { id: 'portfolio-pie', name: 'Portfolio %', description: 'Pie chart showing % of portfolio by holding', defaultSize: { w: 400, h: 220 }, spec: PORTFOLIO_PIE_CHART as unknown as SubviewSpec },
  { id: 'wallet', name: 'Wallet', description: 'Strategy wallet; deposit and withdraw', defaultSize: { w: 320, h: 100 }, spec: WALLET_TABLE as unknown as SubviewSpec },
  { id: 'monthly-returns', name: 'Monthly Returns', description: 'Bar chart grouped by month', defaultSize: { w: 600, h: 120 } },
  { id: 'exposure-breakdown', name: 'Exposure Breakdown', description: 'Pie chart by asset type or sector', defaultSize: { w: 300, h: 80 } },
  { id: 'realized-pnl-table', name: 'Realized P&L Table', description: 'Sortable table of closed trades', defaultSize: { w: 600, h: 120 } },
  { id: 'open-positions', name: 'Open Positions', description: 'Current holdings from transactions', defaultSize: { w: 600, h: 120 } },
  { id: 'drawdown-chart', name: 'Drawdown Chart', description: 'Max drawdown over time (area chart)', defaultSize: { w: 600, h: 80 } },
  { id: 'risk-reward', name: 'Risk/Reward Ratio', description: 'Average win vs average loss', defaultSize: { w: 300, h: 80 } },
  { id: 'trade-frequency', name: 'Trade Frequency', description: 'Histogram of trades per day/week/month', defaultSize: { w: 400, h: 80 } },
  { id: 'custom', name: 'Custom', description: 'Build your own subview in the editor', defaultSize: { w: 400, h: 80 } },
];
