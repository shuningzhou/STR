export interface SeedContext {
  transactions: Array<{
    id: number;
    side: string;
    cashDelta: number;
    timestamp: string;
    instrumentId: string;
    instrumentSymbol: string;
    instrumentName: string;
    option: { expiration: string; strike: number; callPut: string } | null;
    optionRoll?: { option: { expiration: string; strike: number; callPut: string }; optionRolledTo: { expiration: string; strike: number; callPut: string } };
    customData: Record<string, unknown>;
    quantity: number;
    price: number;
  }>;
  wallet: { baseCurrency: string; initialBalance: number };
}

/**
 * Seed data for Subview Editor testing (from subviews.md).
 * Injected when "Test Functions" runs or Live Preview executes Python.
 */
export const SEED_CONTEXT: SeedContext = {
  transactions: [
    {
      id: 1,
      side: 'buy',
      cashDelta: -350,
      timestamp: '2025-11-01T10:00:00Z',
      instrumentId: 'inst-AAPL-2026-01-17-175-call',
      instrumentSymbol: 'AAPL',
      instrumentName: 'Apple Inc.',
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
      instrumentId: 'inst-AAPL-2026-01-17-175-call',
      instrumentSymbol: 'AAPL',
      instrumentName: 'Apple Inc.',
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
      instrumentId: 'inst-MSFT-roll-2026-02-20-2026-03-20',
      instrumentSymbol: 'MSFT',
      instrumentName: 'Microsoft Corporation',
      option: { expiration: '2026-02-20', strike: 400, callPut: 'put' },
      optionRoll: {
        option: { expiration: '2026-02-20', strike: 400, callPut: 'put' },
        optionRolledTo: { expiration: '2026-03-20', strike: 405, callPut: 'put' },
      },
      customData: {},
      quantity: 1,
      price: 0.85,
    },
  ],
  wallet: {
    baseCurrency: 'CAD',
    initialBalance: 25000.0,
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
 * Subview editor preview uses SEED_CONTEXT; strategy canvas uses this.
 */
export function buildStrategyContext(strategy: {
  transactions?: ResolvedTransaction[];
  baseCurrency?: string;
} | null): SeedContext {
  return {
    transactions: strategy?.transactions ?? [],
    wallet: { baseCurrency: strategy?.baseCurrency ?? 'USD', initialBalance: 0 },
  };
}
