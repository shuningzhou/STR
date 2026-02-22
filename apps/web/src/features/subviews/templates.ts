import type { SubviewSpec, SubviewCategory } from '@str/shared';
import { WIN_RATE_EXAMPLE } from './subview-editor/WIN_RATE_EXAMPLE';
import { STOCK_ETF_TRANSACTIONS_TABLE } from './subview-editor/STOCK_ETF_TRANSACTIONS_TABLE';
import { OPTION_INCOME_TABLE } from './subview-editor/OPTION_INCOME_TABLE';
import { HOLDINGS_TABLE } from './subview-editor/HOLDINGS_TABLE';
import { PORTFOLIO_PIE_CHART } from './subview-editor/PORTFOLIO_PIE_CHART';
import { PORTFOLIO_GROWTH_LINE_CHART } from './subview-editor/PORTFOLIO_GROWTH_LINE_CHART';
import { PORTFOLIO_VALUE } from './subview-editor/PORTFOLIO_VALUE';
import { UNREALIZED_GAIN } from './subview-editor/UNREALIZED_GAIN';
import { WALLET_TABLE } from './subview-editor/WALLET_TABLE';
import { CHART_TABLE_EXAMPLE } from './subview-editor/CHART_TABLE_EXAMPLE';
import { TEXT_INPUT_COLOR_EXAMPLE } from './subview-editor/TEXT_INPUT_COLOR_EXAMPLE';
import { FLEX_PADDING_EXAMPLE } from './subview-editor/FLEX_PADDING_EXAMPLE';
import { ICONS_EXAMPLE } from './subview-editor/ICONS_EXAMPLE';
import { COLORS_EXAMPLE } from './subview-editor/COLORS_EXAMPLE';
import { LOAN_INTEREST_SUBVIEW } from './subview-editor/LOAN_INTEREST_SUBVIEW';
import { LOAN_SUBVIEW } from './subview-editor/LOAN_SUBVIEW';
import { OPTIMIZED_LOAN } from './subview-editor/OPTIMIZED_LOAN';
import { SECURED_PUTS_CAPITAL } from './subview-editor/SECURED_PUTS_CAPITAL';
import { PREMIUM_INCOME_CHART } from './subview-editor/PREMIUM_INCOME_CHART';
import { OPTIONS_TIMELINE } from './subview-editor/OPTIONS_TIMELINE';
import { DIVIDEND_TABLE } from './subview-editor/DIVIDEND_TABLE';
import { DIVIDEND_SUMMARY } from './subview-editor/DIVIDEND_SUMMARY';

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
  { id: 'win-rate', name: 'Win Rate', description: '% of profitable trades', defaultSize: { w: 175, h: 40 }, categories: ['option'], spec: WIN_RATE_EXAMPLE as unknown as SubviewSpec },
  { id: 'stock-etf-transactions', name: 'Stock & ETF Transactions', description: 'Table of stock and ETF transactions (no options)', defaultSize: { w: 700, h: 180 }, categories: ['essential', 'stock-etf'], spec: STOCK_ETF_TRANSACTIONS_TABLE as unknown as SubviewSpec },
  { id: 'option-income', name: 'Open Options', description: 'Covered calls and secured puts. Add, edit, delete, roll, or close (partial close supported)', defaultSize: { w: 700, h: 180 }, categories: ['essential', 'option'], spec: OPTION_INCOME_TABLE as unknown as SubviewSpec },
  { id: 'secured-puts-capital', name: 'Secured Puts Capital', description: 'Total money occupied by secured puts (strike × 100 × contracts)', defaultSize: { w: 175, h: 40 }, categories: ['option'], spec: SECURED_PUTS_CAPITAL as unknown as SubviewSpec },
  { id: 'premium-income', name: 'Premium Income', description: 'Stacked bar chart of option premium income by Covered Call and Secured Put', defaultSize: { w: 700, h: 220 }, categories: ['option', 'income'], spec: PREMIUM_INCOME_CHART as unknown as SubviewSpec },
  { id: 'options-timeline', name: 'Options Timeline', description: 'Timeline of option expirations from open positions', defaultSize: { w: 700, h: 80 }, categories: ['option'], spec: OPTIONS_TIMELINE as unknown as SubviewSpec },
  { id: 'holdings', name: 'Stock & ETF Holdings', description: 'Current stock and ETF holdings with cost basis and gain', defaultSize: { w: 700, h: 180 }, categories: ['stock-etf'], spec: HOLDINGS_TABLE as unknown as SubviewSpec },
  { id: 'dividend', name: 'Dividends', description: 'Track dividend income from stocks and ETFs', defaultSize: { w: 500, h: 120 }, categories: ['essential', 'stock-etf', 'income'], spec: DIVIDEND_TABLE as unknown as SubviewSpec },
  { id: 'dividend-summary', name: 'Dividend Summary', description: 'Dividend summary per symbol: cumulative, monthly avg, yield, yearly estimate', defaultSize: { w: 650, h: 120 }, categories: ['stock-etf', 'income'], spec: DIVIDEND_SUMMARY as unknown as SubviewSpec },
  { id: 'portfolio-pie', name: 'Allocation', description: 'Donut chart showing % of portfolio by holding', defaultSize: { w: 375, h: 125 }, categories: ['stock-etf'], spec: PORTFOLIO_PIE_CHART as unknown as SubviewSpec },
  { id: 'portfolio-growth', name: 'Portfolio Growth', description: 'Line chart of portfolio value over time', defaultSize: { w: 600, h: 100 }, categories: ['stock-etf'], spec: PORTFOLIO_GROWTH_LINE_CHART as unknown as SubviewSpec },
  { id: 'portfolio-value', name: 'Holdings Value', description: 'Total market value of current stock and ETF holdings', defaultSize: { w: 175, h: 40 }, categories: ['stock-etf'], spec: PORTFOLIO_VALUE as unknown as SubviewSpec },
  { id: 'unrealized-gain', name: 'Unrealized Gain', description: 'Unrealized gain: current holdings value minus book value', defaultSize: { w: 175, h: 40 }, categories: ['stock-etf'], spec: UNREALIZED_GAIN as unknown as SubviewSpec },
  { id: 'wallet', name: 'Wallet', description: 'Strategy wallet; deposit and withdraw', defaultSize: { w: 250, h: 40 }, categories: ['essential'], spec: WALLET_TABLE as unknown as SubviewSpec },
  { id: 'loan-interest', name: 'Loan Interest', description: 'APR and daily interest cost for margin loans', defaultSize: { w: 175, h: 40 }, categories: ['margin'], spec: LOAN_INTEREST_SUBVIEW as unknown as SubviewSpec },
  { id: 'loan', name: 'Loan', description: 'Current loan amount and loan as % of holdings value', defaultSize: { w: 175, h: 40 }, categories: ['margin'], spec: LOAN_SUBVIEW as unknown as SubviewSpec },
  { id: 'optimized-loan', name: 'Optimized Loan', description: 'Optimal loan based on target amplification with margin health gauge', defaultSize: { w: 380, h: 420 }, categories: ['margin'], spec: OPTIMIZED_LOAN as unknown as SubviewSpec },
  { id: 'chart-table', name: 'Chart & Table', description: 'Table and Chart (pie, line, bar) examples', defaultSize: { w: 800, h: 420 }, categories: ['example'], spec: CHART_TABLE_EXAMPLE as unknown as SubviewSpec },
  { id: 'text-input-color', name: 'Text, Input & Color', description: 'Text sizes/styles, inputs, number formats, and colors', defaultSize: { w: 700, h: 480 }, categories: ['example'], spec: TEXT_INPUT_COLOR_EXAMPLE as unknown as SubviewSpec },
  { id: 'flex-padding', name: 'Flex & Padding', description: 'Every flex property and padding examples', defaultSize: { w: 900, h: 680 }, categories: ['example'], spec: FLEX_PADDING_EXAMPLE as unknown as SubviewSpec },
  { id: 'icons-example', name: 'Icon Gallery', description: 'All available icons with names and JSON layout usage', defaultSize: { w: 900, h: 420 }, categories: ['example'], spec: ICONS_EXAMPLE as unknown as SubviewSpec },
  { id: 'colors-example', name: 'Color System', description: '12 main colors with variants, plus black and white', defaultSize: { w: 900, h: 680 }, categories: ['example'], spec: COLORS_EXAMPLE as unknown as SubviewSpec },
  { id: 'custom', name: 'Custom', description: 'Build your own subview in the editor', defaultSize: { w: 400, h: 80 }, categories: ['example'] },
];
