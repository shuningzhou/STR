import type { SubviewSpec, SubviewCategory } from '@str/shared';
import { WIN_RATE_EXAMPLE } from './subview-editor/WIN_RATE_EXAMPLE';
import { STOCK_ETF_TRANSACTIONS_TABLE } from './subview-editor/STOCK_ETF_TRANSACTIONS_TABLE';
import { HOLDINGS_TABLE } from './subview-editor/HOLDINGS_TABLE';
import { PORTFOLIO_PIE_CHART } from './subview-editor/PORTFOLIO_PIE_CHART';
import { WALLET_TABLE } from './subview-editor/WALLET_TABLE';
import { CHART_TABLE_EXAMPLE } from './subview-editor/CHART_TABLE_EXAMPLE';
import { TEXT_INPUT_COLOR_EXAMPLE } from './subview-editor/TEXT_INPUT_COLOR_EXAMPLE';
import { FLEX_PADDING_EXAMPLE } from './subview-editor/FLEX_PADDING_EXAMPLE';
import { ICONS_EXAMPLE } from './subview-editor/ICONS_EXAMPLE';
import { LOAN_INTEREST_SUBVIEW } from './subview-editor/LOAN_INTEREST_SUBVIEW';

/** Subview template definition (Phase 4); spec-based (Phase 5) */
export interface SubviewTemplate {
  id: string;
  name: string;
  description: string;
  defaultSize: { w: number; h: number };
  /** Categories for gallery; can override spec.categories */
  categories?: SubviewCategory[];
  /** JSON+Python spec; when present, subview is rendered from spec */
  spec?: SubviewSpec;
}

export const SUBVIEW_TEMPLATES: SubviewTemplate[] = [
  { id: 'equity-curve', name: 'Equity Curve', description: 'Cumulative P&L over time (line chart)', defaultSize: { w: 600, h: 120 }, categories: ['stock-etf'] },
  { id: 'win-rate', name: 'Win Rate', description: '% of profitable trades', defaultSize: { w: 400, h: 70 }, categories: ['essential', 'stock-etf'], spec: WIN_RATE_EXAMPLE as unknown as SubviewSpec },
  { id: 'stock-etf-transactions', name: 'Stock & ETF Transactions', description: 'Table of stock and ETF transactions (no options)', defaultSize: { w: 700, h: 180 }, categories: ['essential', 'stock-etf'], spec: STOCK_ETF_TRANSACTIONS_TABLE as unknown as SubviewSpec },
  { id: 'holdings', name: 'Holdings', description: 'Current stock and ETF holdings with cost basis and gain', defaultSize: { w: 700, h: 180 }, categories: ['essential', 'stock-etf'], spec: HOLDINGS_TABLE as unknown as SubviewSpec },
  { id: 'portfolio-pie', name: 'Portfolio %', description: 'Pie chart showing % of portfolio by holding', defaultSize: { w: 400, h: 220 }, categories: ['essential', 'stock-etf'], spec: PORTFOLIO_PIE_CHART as unknown as SubviewSpec },
  { id: 'wallet', name: 'Wallet', description: 'Strategy wallet; deposit and withdraw', defaultSize: { w: 175, h: 40 }, categories: ['essential'], spec: WALLET_TABLE as unknown as SubviewSpec },
  { id: 'loan-interest', name: 'Loan Interest', description: 'APR and daily interest cost for margin loans', defaultSize: { w: 280, h: 100 }, categories: ['essential'], spec: LOAN_INTEREST_SUBVIEW as unknown as SubviewSpec },
  { id: 'chart-table', name: 'Chart & Table', description: 'Table and Chart (pie, line, bar) examples', defaultSize: { w: 800, h: 420 }, categories: ['example'], spec: CHART_TABLE_EXAMPLE as unknown as SubviewSpec },
  { id: 'text-input-color', name: 'Text, Input & Color', description: 'Text sizes/styles, inputs, number formats, and colors', defaultSize: { w: 700, h: 480 }, categories: ['example'], spec: TEXT_INPUT_COLOR_EXAMPLE as unknown as SubviewSpec },
  { id: 'flex-padding', name: 'Flex & Padding', description: 'Every flex property and padding examples', defaultSize: { w: 900, h: 680 }, categories: ['example'], spec: FLEX_PADDING_EXAMPLE as unknown as SubviewSpec },
  { id: 'icons-example', name: 'Icon Gallery', description: 'All available icons with names and JSON layout usage', defaultSize: { w: 900, h: 420 }, categories: ['example'], spec: ICONS_EXAMPLE as unknown as SubviewSpec },
  { id: 'monthly-returns', name: 'Monthly Returns', description: 'Bar chart grouped by month', defaultSize: { w: 600, h: 120 }, categories: ['stock-etf'] },
  { id: 'exposure-breakdown', name: 'Exposure Breakdown', description: 'Pie chart by asset type or sector', defaultSize: { w: 300, h: 80 }, categories: ['stock-etf'] },
  { id: 'realized-pnl-table', name: 'Realized P&L Table', description: 'Sortable table of closed trades', defaultSize: { w: 600, h: 120 }, categories: ['stock-etf'] },
  { id: 'open-positions', name: 'Open Positions', description: 'Current holdings from transactions', defaultSize: { w: 600, h: 120 }, categories: ['stock-etf'] },
  { id: 'drawdown-chart', name: 'Drawdown Chart', description: 'Max drawdown over time (area chart)', defaultSize: { w: 600, h: 80 }, categories: ['stock-etf'] },
  { id: 'risk-reward', name: 'Risk/Reward Ratio', description: 'Average win vs average loss', defaultSize: { w: 300, h: 80 }, categories: ['stock-etf'] },
  { id: 'trade-frequency', name: 'Trade Frequency', description: 'Histogram of trades per day/week/month', defaultSize: { w: 400, h: 80 }, categories: ['stock-etf'] },
  { id: 'custom', name: 'Custom', description: 'Build your own subview in the editor', defaultSize: { w: 400, h: 80 }, categories: ['example'] },
];
