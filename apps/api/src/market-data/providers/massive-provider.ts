import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IOptionsDataProvider, QuoteResult, HistoryBar, SymbolMatch } from './market-data-provider.interface';
import { toOccTicker, fromOccTicker } from './market-data-provider.interface';

const BASE_URL = 'https://api.polygon.io';

@Injectable()
export class MassiveProvider implements IOptionsDataProvider {
  readonly providerId = 'massive';
  private readonly apiKey: string;
  private readonly logger = new Logger(MassiveProvider.name);

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.getOrThrow<string>('MASSIVE_API_KEY');
  }

  async getOptionQuote(option: {
    symbol: string;
    expiration: string;
    strike: number;
    callPut: string;
  }): Promise<QuoteResult> {
    const ticker = toOccTicker(option.symbol, option.expiration, option.strike, option.callPut);
    return this.getOptionQuoteByTicker(ticker, option.symbol);
  }

  async getOptionQuoteByTicker(ticker: string, underlyingSymbol?: string): Promise<QuoteResult> {
    const symbol = underlyingSymbol ?? fromOccTicker(ticker).symbol;
    try {
      const url = `${BASE_URL}/v3/snapshot/options/${symbol}/${ticker}?apiKey=${this.apiKey}`;
      this.logger.log(`→ GET option snapshot ${ticker}`);
      const start = Date.now();
      const res = await fetch(url);
      const ms = Date.now() - start;
      if (res.ok) {
        const body = await res.json();
        const results = body?.results;
        const price =
          results?.last_trade?.price ??
          results?.day?.close ??
          0;
        this.logger.log(`← ${res.status} option snapshot ${ticker}: $${Number(price) || 0} ${ms}ms`);
        return { symbol: ticker, price: Number(price) || 0 };
      }
      this.logger.warn(`← ${res.status} option snapshot ${ticker} ${ms}ms, trying fallback`);
    } catch (err) {
      this.logger.warn(`Option snapshot failed for ${ticker}, trying last trade fallback`);
    }

    try {
      const url = `${BASE_URL}/v2/last/trade/${ticker}?apiKey=${this.apiKey}`;
      this.logger.log(`→ GET option last-trade ${ticker}`);
      const start = Date.now();
      const res = await fetch(url);
      const ms = Date.now() - start;
      if (res.ok) {
        const body = await res.json();
        const price = body?.results?.p ?? 0;
        this.logger.log(`← ${res.status} option last-trade ${ticker}: $${Number(price) || 0} ${ms}ms`);
        return { symbol: ticker, price: Number(price) || 0 };
      }
      this.logger.error(`← ${res.status} option last-trade ${ticker} ${ms}ms`);
    } catch (err) {
      this.logger.error(`Option last-trade failed for ${ticker}`);
    }

    return { symbol: ticker, price: 0 };
  }

  async getQuote(symbol: string): Promise<QuoteResult> {
    return this.getOptionQuoteByTicker(symbol);
  }

  async getQuotes(symbols: string[]): Promise<QuoteResult[]> {
    return Promise.all(symbols.map((s) => this.getQuote(s)));
  }

  async getHistory(_symbol: string, _from: string, _to: string): Promise<HistoryBar[]> {
    return [];
  }

  async searchSymbols(_query: string): Promise<SymbolMatch[]> {
    return [];
  }
}
