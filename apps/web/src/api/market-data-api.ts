import { apiFetch } from './api-client';

export interface QuoteResult {
  symbol: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  timestamp?: string;
}

export interface HistoryBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SymbolMatch {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
  currency: string;
}

export async function getQuotes(symbols: string[]): Promise<QuoteResult[]> {
  if (symbols.length === 0) return [];
  const qs = symbols.join(',');
  const record = await apiFetch<Record<string, QuoteResult>>(`/market-data/quotes?symbols=${encodeURIComponent(qs)}`);
  return Object.values(record);
}

export async function getOptionQuotes(contracts: string[]): Promise<QuoteResult[]> {
  if (contracts.length === 0) return [];
  const qs = contracts.join(',');
  const record = await apiFetch<Record<string, QuoteResult>>(`/market-data/options/quote?contracts=${encodeURIComponent(qs)}`);
  return Object.values(record);
}

export async function getHistory(
  symbol: string,
  from?: string,
  to?: string,
): Promise<HistoryBar[]> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return apiFetch<HistoryBar[]>(`/market-data/history/${encodeURIComponent(symbol)}${qs ? '?' + qs : ''}`);
}

export async function searchSymbols(query: string): Promise<SymbolMatch[]> {
  if (!query) return [];
  return apiFetch<SymbolMatch[]>(`/market-data/search?q=${encodeURIComponent(query)}`);
}
