import { computeEquity } from './compute-equity';

export interface SeedContext {
  /** Current price per symbol; backend provides when ready */
  currentPrices?: Record<string, number>;
  /** Wallet metrics for Python context */
  wallet: {
    baseCurrency: string;
    initialBalance: number;
    balance: number;
    equity?: number;
    marginAccountEnabled?: boolean;
    collateralEnabled?: boolean;
    loanAmount?: number;
    loanInterest?: number;
    marginRequirement?: number;
    buyingPower?: number;
    marginLimit?: number;
    marginAvailable?: number;
    collateralAmount?: number;
    collateralRequirement?: number;
    collateralLimit?: number;
    collateralAvailable?: number;
  };
  transactions: Array<{
    id: number;
    side: string;
    cashDelta: number;
    timestamp: string;
    instrumentSymbol: string;
    option: { expiration: string; strike: number; callPut: string } | null;
    optionRoll?: { option: { expiration: string; strike: number; callPut: string }; optionRolledTo: { expiration: string; strike: number; callPut: string } };
    customData: Record<string, unknown>;
    quantity: number;
    price: number;
  }>;
}

/**
 * Seed data for Subview Editor testing (from subviews.md).
 * Injected when "Test Functions" runs or Live Preview executes Python.
 */
export const SEED_CONTEXT: SeedContext = {
  currentPrices: { AAPL: 185.5, VOO: 405.0 },
  transactions: [
    {
      id: 1,
      side: 'buy',
      cashDelta: -350,
      timestamp: '2025-11-01T10:00:00Z',
      instrumentSymbol: 'AAPL',
      option: { expiration: '2026-01-17', strike: 175, callPut: 'call' },
      customData: {},
      quantity: 1,
      price: 3.5,
    },
    {
      id: 2,
      side: 'sell',
      cashDelta: 420,
      timestamp: '2025-11-20T14:30:00Z',
      instrumentSymbol: 'AAPL',
      option: { expiration: '2026-01-17', strike: 175, callPut: 'call' },
      customData: {},
      quantity: 1,
      price: 4.2,
    },
    {
      id: 3,
      side: 'option_roll',
      cashDelta: 85,
      timestamp: '2025-12-05T09:15:00Z',
      instrumentSymbol: 'MSFT',
      option: { expiration: '2026-02-20', strike: 400, callPut: 'put' },
      optionRoll: {
        option: { expiration: '2026-02-20', strike: 400, callPut: 'put' },
        optionRolledTo: { expiration: '2026-03-20', strike: 405, callPut: 'put' },
      },
      customData: {},
      quantity: 1,
      price: 0.85,
    },
    // Stock/ETF transactions
    {
      id: 10,
      side: 'buy',
      cashDelta: -1800,
      timestamp: '2025-10-15T09:30:00Z',
      instrumentSymbol: 'AAPL',
      option: null,
      customData: {},
      quantity: 10,
      price: 180,
    },
    {
      id: 11,
      side: 'sell',
      cashDelta: 1950,
      timestamp: '2025-11-22T14:00:00Z',
      instrumentSymbol: 'AAPL',
      option: null,
      customData: {},
      quantity: 10,
      price: 195,
    },
    {
      id: 12,
      side: 'buy',
      cashDelta: -8000,
      timestamp: '2025-12-01T10:15:00Z',
      instrumentSymbol: 'VOO',
      option: null,
      customData: {},
      quantity: 20,
      price: 400,
    },
  ],
  wallet: {
    baseCurrency: 'CAD',
    initialBalance: 25000.0,
    balance: 25000.0,
    equity: 0,
    marginAccountEnabled: true,
    collateralEnabled: false,
    loanAmount: 50000,
    loanInterest: 8.5,
    marginRequirement: 0,
    buyingPower: 25000.0,
    marginLimit: 0,
    marginAvailable: 0,
    collateralAmount: 0,
    collateralRequirement: 0,
    collateralLimit: 0,
    collateralAvailable: 0,
  },
};

/** Default inputs for seed (time_range default: last 30 days) */
function getDefaultInputs() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    timeRange: {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    },
    ticker: 'all',
  };
}

export const SEED_INPUTS = getDefaultInputs();

/** Resolved transaction format for Python context (matches SeedContext) */
export type ResolvedTransaction = SeedContext['transactions'][number];

/**
 * Build context from strategy's real transactions for the canvas.
 * When currentPrices provided, computes equity, marginLimit, marginAvailable, buyingPower.
 */
export function buildStrategyContext(
  strategy: {
    transactions?: ResolvedTransaction[];
    baseCurrency?: string;
    initialBalance?: number;
    marginAccountEnabled?: boolean;
    collateralEnabled?: boolean;
    loanAmount?: number;
    loanInterest?: number;
    marginRequirement?: number;
    collateralAmount?: number;
    collateralRequirement?: number;
  } | null,
  currentPrices?: Record<string, number>
): SeedContext {
  const txs = strategy?.transactions ?? [];
  const initialBalance = strategy?.initialBalance ?? 0;
  const computedBalance =
    initialBalance +
    txs.reduce((sum, tx) => sum + ((tx as { cashDelta?: number }).cashDelta ?? 0), 0);

  const marginAccountEnabled =
    strategy && 'marginAccountEnabled' in strategy ? !!strategy.marginAccountEnabled : false;
  const loanAmount = strategy?.loanAmount ?? 0;
  const marginReq = strategy?.marginRequirement ?? 0;
  const collateralAmount = strategy?.collateralAmount ?? 0;
  const collateralReq = strategy?.collateralRequirement ?? 0;
  const collateralLimit = collateralAmount * (collateralReq / 100);
  const collateralAvailable = collateralAmount - collateralLimit;

  const equity = computeEquity(txs, currentPrices ?? {});
  const balance =
    marginAccountEnabled && loanAmount > 0 ? 0 : computedBalance;
  const marginLimit = equity * (marginReq / 100);
  const marginAvailable =
    collateralAvailable + equity + balance - loanAmount - marginLimit;
  const buyingPower =
    marginReq > 0 ? marginAvailable / (marginReq / 100) : computedBalance;

  return {
    transactions: txs,
    wallet: {
      baseCurrency: strategy?.baseCurrency ?? 'USD',
      initialBalance,
      balance,
      marginAccountEnabled,
      collateralEnabled: strategy && 'collateralEnabled' in strategy ? !!strategy.collateralEnabled : false,
      loanAmount: strategy?.loanAmount,
      loanInterest: strategy?.loanInterest,
      marginRequirement: strategy?.marginRequirement,
      buyingPower,
      marginLimit,
      marginAvailable,
      collateralAmount: strategy?.collateralAmount,
      collateralRequirement: strategy?.collateralRequirement,
      collateralLimit,
      collateralAvailable,
      equity,
    },
  };
}
