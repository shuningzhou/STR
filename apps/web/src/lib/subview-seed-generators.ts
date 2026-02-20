/**
 * Generators for seed transactions in the Subview Editor.
 * Produces realistic stock and option transactions for testing.
 */

const STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', basePrice: 180 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', basePrice: 400 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', basePrice: 140 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', basePrice: 180 },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', basePrice: 120 },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toISO(d: Date): string {
  return d.toISOString();
}

/** Lehmer-like simple prng for deterministic-ish results when seeded */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export interface ResolvedTransaction {
  id: number;
  side: 'buy' | 'sell' | 'buy_to_cover' | 'sell_short';
  cashDelta: number;
  timestamp: string;
  instrumentSymbol: string;
  option: { expiration: string; strike: number; callPut: 'call' | 'put' } | null;
  customData: Record<string, unknown>;
  quantity: number;
  price: number;
}

/**
 * Generate stock transactions over 5 stocks, spanning 1 year.
 * Mix of buy and sell; prices drift realistically.
 */
export function generateStockTransactions(count: number = 16): ResolvedTransaction[] {
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);
  const end = new Date();
  const txs: ResolvedTransaction[] = [];
  const rand = seededRandom(Date.now());

  // Simulate rough price paths per stock (simplified random walk)
  const prices: Record<string, number> = {};
  STOCKS.forEach((s) => {
    prices[s.symbol] = s.basePrice * (0.9 + rand() * 0.2);
  });

  const n = Math.max(4, Math.min(128, count));
  for (let i = 0; i < n; i++) {
    const stock = randomChoice(STOCKS);
    const daysOffset = Math.floor(rand() * 365);
    const d = addDays(start, daysOffset);
    const hour = randomInt(9, 15);
    const min = randomInt(0, 59);
    d.setHours(hour, min, 0, 0);

    let price = prices[stock.symbol];
    price *= 0.98 + rand() * 0.04;
    price = Math.max(1, Math.round(price * 100) / 100);
    prices[stock.symbol] = price;

    const quantity = randomInt(1, 50);
    const side = rand() < 0.5 ? 'buy' : 'sell';
    const notional = quantity * price;
    const cashDelta = side === 'buy' ? -notional : notional;

    txs.push({
      id: i + 1,
      side,
      cashDelta: Math.round(cashDelta * 100) / 100,
      timestamp: toISO(d),
      instrumentSymbol: stock.symbol,
      option: null,
      customData: {},
      quantity,
      price,
    });
  }

  txs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  txs.forEach((t, i) => {
    t.id = i + 1;
  });
  return txs;
}

/**
 * Generate option transactions over 5 stocks, spanning 1 year.
 * Mix of call/put, buy/sell, buy_to_cover; expirations and strikes are realistic.
 */
export function generateOptionTransactions(count: number = 16): ResolvedTransaction[] {
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);
  const txs: ResolvedTransaction[] = [];
  const rand = seededRandom(Date.now() + 1);

  const prices: Record<string, number> = {};
  STOCKS.forEach((s) => {
    prices[s.symbol] = s.basePrice * (0.92 + rand() * 0.16);
  });

  const n = Math.max(4, Math.min(128, count));
  const rollPairCount = Math.max(1, Math.floor(n * 0.125)); // each "roll" = 2 txs (buy_to_cover + sell)
  const regularCount = n - rollPairCount * 2;

  for (let i = 0; i < regularCount; i++) {
    const stock = randomChoice(STOCKS);
    const daysOffset = Math.floor(rand() * 365);
    const d = addDays(start, daysOffset);
    const hour = randomInt(9, 15);
    const min = randomInt(0, 59);
    d.setHours(hour, min, 0, 0);

    const underlyingPrice = prices[stock.symbol];
    const strikeStep = underlyingPrice > 200 ? 10 : underlyingPrice > 50 ? 5 : 2.5;
    const atmStrike = Math.round(underlyingPrice / strikeStep) * strikeStep;
    const strike = rand() < 0.7 ? atmStrike : atmStrike + (rand() < 0.5 ? 1 : -1) * strikeStep;

    const dte = randomInt(7, 90);
    const expDate = addDays(d, dte);
    const expiration = expDate.toISOString().slice(0, 10);

    const callPut = rand() < 0.5 ? 'call' : 'put';
    const quantity = randomInt(1, 10);
    const sharesPerContract = 100;
    const premiumPerShare = (1 + rand() * 15) * (strike / 100);
    const price = Math.round(premiumPerShare * 100) / 100;
    const notional = quantity * sharesPerContract * price;
    const side = rand() < 0.5 ? 'buy' : 'sell';
    const cashDelta = side === 'buy' ? -notional : notional;

    txs.push({
      id: i + 1,
      side,
      cashDelta: Math.round(cashDelta * 100) / 100,
      timestamp: toISO(d),
      instrumentSymbol: stock.symbol,
      option: { expiration, strike, callPut },
      customData: {},
      quantity,
      price,
    });
  }

  for (let i = 0; i < rollPairCount; i++) {
    const stock = randomChoice(STOCKS);
    const daysOffset = Math.floor(rand() * 320);
    const d = addDays(start, daysOffset);
    const hour = randomInt(9, 15);
    const min = randomInt(0, 59);
    d.setHours(hour, min, 0, 0);

    const underlyingPrice = prices[stock.symbol];
    const strikeStep = underlyingPrice > 200 ? 10 : underlyingPrice > 50 ? 5 : 2.5;
    const atmStrike = Math.round(underlyingPrice / strikeStep) * strikeStep;

    const exp1 = addDays(d, randomInt(14, 45));
    const exp2 = addDays(exp1, randomInt(7, 30));
    const expiration1 = exp1.toISOString().slice(0, 10);
    const expiration2 = exp2.toISOString().slice(0, 10);

    const strike1 = atmStrike;
    const strike2 = atmStrike + (rand() < 0.5 ? 1 : -1) * strikeStep;

    const callPut = rand() < 0.5 ? 'call' : 'put';
    const quantity = randomInt(1, 5);
    const closePrice = (2 + rand() * 8) * (strike1 / 100);
    const openPrice = (2 + rand() * 10) * (strike2 / 100);
    const closeProceeds = Math.round(closePrice * quantity * 100) / 100;
    const openProceeds = Math.round(openPrice * quantity * 100) / 100;

    txs.push({
      id: regularCount + i * 2 + 1,
      side: 'buy_to_cover',
      cashDelta: -closeProceeds,
      timestamp: toISO(d),
      instrumentSymbol: stock.symbol,
      option: { expiration: expiration1, strike: strike1, callPut },
      customData: {},
      quantity,
      price: Math.round(closePrice * 100) / 100,
    });
    txs.push({
      id: regularCount + i * 2 + 2,
      side: 'sell',
      cashDelta: openProceeds,
      timestamp: toISO(d),
      instrumentSymbol: stock.symbol,
      option: { expiration: expiration2, strike: strike2, callPut },
      customData: {},
      quantity,
      price: Math.round(openPrice * 100) / 100,
    });
  }

  txs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  txs.forEach((t, i) => {
    t.id = i + 1;
  });
  return txs;
}
