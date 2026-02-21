import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IMarketDataProvider, QuoteResult, HistoryBar, SymbolMatch } from './market-data-provider.interface';

const BASE_URL = 'https://eodhd.com/api';

@Injectable()
export class EodhdProvider implements IMarketDataProvider {
  readonly providerId = 'eodhd';
  private readonly token: string;
  private readonly logger = new Logger(EodhdProvider.name);

  constructor(private readonly config: ConfigService) {
    this.token = this.config.getOrThrow<string>('EODHD_API_TOKEN');
  }

  private eodSymbol(symbol: string): string {
    if (symbol.includes('.')) return symbol;
    return `${symbol}.US`;
  }

  async getQuote(symbol: string): Promise<QuoteResult> {
    const quotes = await this.getQuotes([symbol]);
    if (quotes.length === 0) throw new Error(`No quote for ${symbol}`);
    return quotes[0];
  }

  async getQuotes(symbols: string[]): Promise<QuoteResult[]> {
    if (symbols.length === 0) return [];

    const primary = this.eodSymbol(symbols[0]);
    const others = symbols.slice(1).map((s) => this.eodSymbol(s));
    const params = new URLSearchParams({
      api_token: this.token,
      fmt: 'json',
    });
    if (others.length > 0) params.set('s', others.join(','));

    const url = `${BASE_URL}/real-time/${primary}?${params}`;
    this.logger.log(`→ GET real-time quotes [${symbols.join(', ')}]`);
    const start = Date.now();
    const res = await fetch(url);
    const ms = Date.now() - start;
    if (!res.ok) {
      this.logger.error(`← ${res.status} real-time quotes [${symbols.join(', ')}] ${ms}ms`);
      return [];
    }

    const body = await res.json();
    const items: unknown[] = Array.isArray(body) ? body : [body];

    const results = items
      .filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
      .map((item) => this.normalizeQuote(item));
    this.logger.log(`← ${res.status} real-time quotes: ${results.length} results ${ms}ms`);
    return results;
  }

  async getHistory(symbol: string, from: string, to: string, interval: 'daily' | 'weekly' = 'daily'): Promise<HistoryBar[]> {
    const period = interval === 'weekly' ? 'w' : 'd';
    const params = new URLSearchParams({
      from,
      to,
      period,
      api_token: this.token,
      fmt: 'json',
    });
    const url = `${BASE_URL}/eod/${this.eodSymbol(symbol)}?${params}`;
    this.logger.log(`→ GET history ${symbol} [${from} → ${to}]`);
    const start = Date.now();
    const res = await fetch(url);
    const ms = Date.now() - start;
    if (!res.ok) {
      this.logger.error(`← ${res.status} history ${symbol} ${ms}ms`);
      return [];
    }
    const body = (await res.json()) as Record<string, unknown>[];
    this.logger.log(`← ${res.status} history ${symbol}: ${body.length} bars ${ms}ms`);
    return body.map((item) => ({
      date: item.date as string,
      open: Number(item.open) || 0,
      high: Number(item.high) || 0,
      low: Number(item.low) || 0,
      close: Number(item.close) || 0,
      adjustedClose: item.adjusted_close != null ? Number(item.adjusted_close) : undefined,
      volume: Number(item.volume) || 0,
    }));
  }

  async searchSymbols(query: string): Promise<SymbolMatch[]> {
    const params = new URLSearchParams({
      api_token: this.token,
      limit: '20',
      fmt: 'json',
    });
    const url = `${BASE_URL}/search/${encodeURIComponent(query)}?${params}`;
    this.logger.log(`→ GET search "${query}"`);
    const start = Date.now();
    const res = await fetch(url);
    const ms = Date.now() - start;
    if (!res.ok) {
      this.logger.error(`← ${res.status} search "${query}" ${ms}ms`);
      return [];
    }
    const body = (await res.json()) as Record<string, unknown>[];
    this.logger.log(`← ${res.status} search "${query}": ${body.length} matches ${ms}ms`);
    return body.map((item) => ({
      symbol: item.Code as string,
      name: item.Name as string,
      exchange: item.Exchange as string,
      assetType: this.normalizeAssetType(item.Type as string),
      currency: item.Currency as string | undefined,
    }));
  }

  private normalizeQuote(item: Record<string, unknown>): QuoteResult {
    const code = String(item.code ?? '');
    const symbol = code.includes('.') ? code.split('.')[0] : code;
    return {
      symbol,
      price: Number(item.close) || 0,
      open: item.open != null ? Number(item.open) : undefined,
      high: item.high != null ? Number(item.high) : undefined,
      low: item.low != null ? Number(item.low) : undefined,
      previousClose: item.previousClose != null ? Number(item.previousClose) : undefined,
      change: item.change != null ? Number(item.change) : undefined,
      changePercent: item.change_p != null ? Number(item.change_p) : undefined,
      volume: item.volume != null ? Number(item.volume) : undefined,
      timestamp: item.timestamp != null ? Number(item.timestamp) : undefined,
    };
  }

  private normalizeAssetType(type: string): string {
    const lower = (type ?? '').toLowerCase();
    if (lower.includes('common stock') || lower === 'stock') return 'stock';
    if (lower === 'etf') return 'etf';
    if (lower.includes('fund')) return 'fund';
    if (lower === 'index') return 'index';
    if (lower === 'crypto') return 'crypto';
    return lower || 'stock';
  }
}
