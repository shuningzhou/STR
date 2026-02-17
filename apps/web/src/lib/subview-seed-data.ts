/**
 * Seed data for Subview Editor testing (from subviews.md).
 * Injected when "Test Functions" runs or Live Preview executes Python.
 */
export const SEED_CONTEXT = {
  transactions: [
    {
      id: 1,
      side: 'sell',
      cashDelta: 120.5,
      timestamp: '2025-12-01T10:00:00Z',
      instrumentId: 'inst-1',
      instrumentSymbol: 'AAPL',
      instrumentName: 'Apple Inc.',
      option: { expiration: '2026-03-20', strike: 150, callPut: 'call' },
      customData: {},
      quantity: 1,
      price: 120.5,
    },
    {
      id: 2,
      side: 'buy',
      cashDelta: -95.0,
      timestamp: '2025-11-15T14:30:00Z',
      instrumentId: 'inst-2',
      instrumentSymbol: 'MSFT',
      instrumentName: 'Microsoft Corporation',
      option: null,
      customData: {},
      quantity: 1,
      price: 95,
    },
    {
      id: 3,
      side: 'sell',
      cashDelta: -25.0,
      timestamp: '2025-12-10T09:00:00Z',
      instrumentId: 'inst-1',
      instrumentSymbol: 'AAPL',
      instrumentName: 'Apple Inc.',
      option: null,
      customData: {},
      quantity: 1,
      price: 95,
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
