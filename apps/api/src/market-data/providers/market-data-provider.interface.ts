export interface QuoteResult {
  symbol: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  timestamp?: number;
}

export interface HistoryBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClose?: number;
  volume: number;
}

export interface SymbolMatch {
  symbol: string;
  name: string;
  exchange: string;
  assetType: string;
  currency?: string;
}

export interface IMarketDataProvider {
  readonly providerId: string;
  getQuote(symbol: string): Promise<QuoteResult>;
  getQuotes(symbols: string[]): Promise<QuoteResult[]>;
  getHistory(symbol: string, from: string, to: string, interval?: 'daily' | 'weekly'): Promise<HistoryBar[]>;
  searchSymbols(query: string): Promise<SymbolMatch[]>;
}

export interface IOptionsDataProvider extends IMarketDataProvider {
  getOptionQuote(option: {
    symbol: string;
    expiration: string;
    strike: number;
    callPut: string;
  }): Promise<QuoteResult>;
}

/** Convert internal option representation to OCC ticker format */
export function toOccTicker(symbol: string, expiration: string, strike: number, callPut: string): string {
  const date = expiration.replace(/-/g, '').slice(2);
  const cp = callPut.toUpperCase().startsWith('C') ? 'C' : 'P';
  const strikeStr = Math.round(strike * 1000).toString().padStart(8, '0');
  return `O:${symbol.toUpperCase()}${date}${cp}${strikeStr}`;
}

/** Parse OCC ticker back to components */
export function fromOccTicker(occ: string): { symbol: string; expiration: string; strike: number; callPut: string } {
  const raw = occ.startsWith('O:') ? occ.slice(2) : occ;
  const dateStart = raw.search(/\d/);
  const symbol = raw.slice(0, dateStart);
  const yymmdd = raw.slice(dateStart, dateStart + 6);
  const cp = raw.slice(dateStart + 6, dateStart + 7);
  const strikeStr = raw.slice(dateStart + 7);
  return {
    symbol,
    expiration: `20${yymmdd.slice(0, 2)}-${yymmdd.slice(2, 4)}-${yymmdd.slice(4, 6)}`,
    strike: parseInt(strikeStr, 10) / 1000,
    callPut: cp === 'C' ? 'CALL' : 'PUT',
  };
}
