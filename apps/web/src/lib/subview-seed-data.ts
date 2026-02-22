import { computeEquity } from './compute-equity';

export interface SeedContext {
  /** Current price per symbol; backend provides when ready */
  currentPrices?: Record<string, number>;
  /** Per-instrument margin requirement %; falls back to wallet.marginRequirement */
  instrumentMarginRequirements?: Record<string, number>;
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
    collateralSecurities?: number;
    collateralCash?: number;
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
    // Roll represented as buy_to_cover + sell
    {
      id: 3,
      side: 'buy_to_cover',
      cashDelta: 320,
      timestamp: '2025-12-05T09:15:00Z',
      instrumentSymbol: 'MSFT',
      option: { expiration: '2026-02-20', strike: 400, callPut: 'put' },
      customData: {},
      quantity: 1,
      price: 3.2,
    },
    {
      id: 4,
      side: 'sell',
      cashDelta: 405,
      timestamp: '2025-12-05T09:15:00Z',
      instrumentSymbol: 'MSFT',
      option: { expiration: '2026-03-20', strike: 405, callPut: 'put' },
      customData: {},
      quantity: 1,
      price: 4.05,
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
    // Option premium income (for Premium Income chart)
    { id: 20, side: 'sell', cashDelta: 450, timestamp: '2026-02-04T10:00:00Z', instrumentSymbol: 'AAPL', option: { expiration: '2026-03-20', strike: 190, callPut: 'call' }, customData: {}, quantity: 1, price: 4.5 },
    { id: 21, side: 'sell', cashDelta: 80, timestamp: '2026-02-05T11:00:00Z', instrumentSymbol: 'MSFT', option: { expiration: '2026-04-18', strike: 420, callPut: 'put' }, customData: {}, quantity: 1, price: 0.8 },
    { id: 22, side: 'sell', cashDelta: 544, timestamp: '2026-02-06T09:30:00Z', instrumentSymbol: 'AAPL', option: { expiration: '2026-03-20', strike: 192, callPut: 'call' }, customData: {}, quantity: 1, price: 5.44 },
    { id: 23, side: 'sell', cashDelta: 1062, timestamp: '2026-02-09T14:00:00Z', instrumentSymbol: 'MSFT', option: { expiration: '2026-04-18', strike: 415, callPut: 'put' }, customData: {}, quantity: 1, price: 10.62 },
    { id: 24, side: 'sell', cashDelta: 1083, timestamp: '2026-02-10T10:30:00Z', instrumentSymbol: 'AAPL', option: { expiration: '2026-04-17', strike: 188, callPut: 'put' }, customData: {}, quantity: 1, price: 10.83 },
    { id: 25, side: 'sell', cashDelta: 12640, timestamp: '2026-02-11T09:00:00Z', instrumentSymbol: 'AAPL', option: { expiration: '2026-03-20', strike: 195, callPut: 'call' }, customData: {}, quantity: 10, price: 12.64 },
    { id: 26, side: 'sell', cashDelta: 2115, timestamp: '2026-02-11T11:00:00Z', instrumentSymbol: 'MSFT', option: { expiration: '2026-04-18', strike: 410, callPut: 'put' }, customData: {}, quantity: 2, price: 10.575 },
    { id: 27, side: 'sell', cashDelta: 3077, timestamp: '2026-02-12T10:00:00Z', instrumentSymbol: 'AAPL', option: { expiration: '2026-03-20', strike: 196, callPut: 'call' }, customData: {}, quantity: 3, price: 10.26 },
    { id: 28, side: 'sell', cashDelta: 1404, timestamp: '2026-02-13T09:30:00Z', instrumentSymbol: 'VOO', option: { expiration: '2026-03-20', strike: 410, callPut: 'call' }, customData: {}, quantity: 2, price: 7.02 },
    { id: 29, side: 'sell', cashDelta: 630, timestamp: '2026-02-13T14:00:00Z', instrumentSymbol: 'MSFT', option: { expiration: '2026-04-18', strike: 408, callPut: 'put' }, customData: {}, quantity: 1, price: 6.3 },
    { id: 30, side: 'sell', cashDelta: 1680, timestamp: '2026-02-17T10:00:00Z', instrumentSymbol: 'AAPL', option: { expiration: '2026-04-17', strike: 185, callPut: 'put' }, customData: {}, quantity: 2, price: 8.4 },
    { id: 31, side: 'sell', cashDelta: 995, timestamp: '2026-02-19T11:00:00Z', instrumentSymbol: 'MSFT', option: { expiration: '2026-05-15', strike: 400, callPut: 'put' }, customData: {}, quantity: 1, price: 9.95 },
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
    collateralSecurities: 0,
    collateralCash: 0,
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
    collateralSecurities?: number;
    collateralCash?: number;
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
  const loanAmount = marginAccountEnabled ? Math.max(0, -computedBalance) : (strategy?.loanAmount ?? 0);
  const balance = marginAccountEnabled ? Math.max(0, computedBalance) : computedBalance;

  const marginReq = strategy?.marginRequirement ?? 0;
  const collateralSecurities = strategy?.collateralSecurities ?? 0;
  const collateralCash = strategy?.collateralCash ?? 0;
  const collateralReq = strategy?.collateralRequirement ?? 0;
  const collateralLimit = collateralSecurities * (collateralReq / 100);
  const collateralAvailable = (collateralSecurities - collateralLimit) + collateralCash;

  const equity = computeEquity(txs, currentPrices ?? {});
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
      loanAmount,
      loanInterest: strategy?.loanInterest,
      marginRequirement: strategy?.marginRequirement,
      buyingPower,
      marginLimit,
      marginAvailable,
      collateralSecurities: strategy?.collateralSecurities,
      collateralCash: strategy?.collateralCash,
      collateralRequirement: strategy?.collateralRequirement,
      collateralLimit,
      collateralAvailable,
      equity,
    },
  };
}
