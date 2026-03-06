import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProviderRegistry } from './providers/provider-registry';
import { QuoteCache, QuoteCacheDocument } from './schemas/quote-cache.schema';
import { PriceHistory, PriceHistoryDocument } from './schemas/price-history.schema';
import type { QuoteResult, HistoryBar, SymbolMatch } from './providers/market-data-provider.interface';

const HISTORY_FRESHNESS_MS = 60 * 60 * 1000;

const US_HOLIDAYS_2026 = [
  '2026-01-01', '2026-01-19', '2026-02-16', '2026-04-03',
  '2026-05-25', '2026-07-03', '2026-09-07', '2026-11-26', '2026-12-25',
];
const CA_HOLIDAYS_2026 = [
  '2026-01-01', '2026-02-16', '2026-04-03', '2026-05-18',
  '2026-07-01', '2026-08-03', '2026-09-07', '2026-10-12', '2026-12-25', '2026-12-28',
];

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);

  constructor(
    private readonly registry: ProviderRegistry,
    @InjectModel(QuoteCache.name) private readonly quoteCacheModel: Model<QuoteCacheDocument>,
    @InjectModel(PriceHistory.name) private readonly priceHistoryModel: Model<PriceHistoryDocument>,
  ) {}

  /* ── Quotes (stocks/ETFs) ─────────────────────── */

  async getQuotes(symbols: string[]): Promise<Record<string, QuoteResult>> {
    if (symbols.length === 0) return {};

    const result: Record<string, QuoteResult> = {};
    const cached = await this.quoteCacheModel.find({
      symbol: { $in: symbols },
      assetType: { $ne: 'option' },
    }).lean().exec();

    for (const doc of cached) {
      const sym = doc.symbol;
      if (sym) result[sym] = this.cacheToQuote(doc as QuoteCacheDocument);
    }

    return result;
  }

  /* ── Quotes (options) ─────────────────────────── */

  async getOptionQuotes(contracts: string[]): Promise<Record<string, QuoteResult>> {
    if (contracts.length === 0) return {};

    const result: Record<string, QuoteResult> = {};
    const cached = await this.quoteCacheModel.find({
      contractTicker: { $in: contracts },
      assetType: 'option',
    }).lean().exec();

    for (const doc of cached) {
      const ticker = doc.contractTicker ?? doc.symbol;
      if (ticker) result[ticker] = this.cacheToQuote(doc as QuoteCacheDocument);
    }

    return result;
  }

  /* ── Historical ───────────────────────────────── */

  async getHistory(symbol: string, from?: string, to?: string, exchange = 'US'): Promise<HistoryBar[]> {
    const toDate = to ?? new Date().toISOString().slice(0, 10);
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const fromDate = from ?? twoYearsAgo.toISOString().slice(0, 10);

    const existing = await this.priceHistoryModel
      .find({
        symbol,
        exchange,
        interval: 'daily',
        date: { $gte: new Date(fromDate), $lte: new Date(toDate) },
      })
      .sort({ date: 1 })
      .lean();

    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const needsFresh =
      existing.length === 0 ||
      existing.some((bar) => {
        const barDate = bar.date.toISOString().slice(0, 10);
        return barDate === today && now.getTime() - bar.fetchedAt.getTime() > HISTORY_FRESHNESS_MS;
      });

    if (existing.length === 0 || needsFresh) {
      try {
        const provider = this.registry.resolve(symbol, 'stock');
        const bars = await provider.getHistory(symbol, fromDate, toDate);
        if (bars.length > 0) {
          const ops = bars.map((bar) => ({
            updateOne: {
              filter: { symbol, exchange, interval: 'daily', date: new Date(bar.date) },
              update: { $set: { ...bar, date: new Date(bar.date), symbol, exchange, interval: 'daily', provider: provider.providerId, fetchedAt: now } },
              upsert: true,
            },
          }));
          await this.priceHistoryModel.bulkWrite(ops);
          return bars;
        }
      } catch (err) {
        this.logger.error(`Failed to fetch history for ${symbol}`, err);
      }
    }

    return existing.map((bar) => ({
      date: bar.date.toISOString().slice(0, 10),
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
      adjustedClose: bar.adjustedClose,
      volume: bar.volume,
    }));
  }

  /** Batch: one DB query for all symbols. Returns Record<symbol, HistoryBar[]>. */
  async getHistoryBatch(
    symbols: string[],
    from?: string,
    to?: string,
    exchange = 'US',
  ): Promise<Record<string, HistoryBar[]>> {
    if (symbols.length === 0) return {};
    const toDate = to ?? new Date().toISOString().slice(0, 10);
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const fromDate = from ?? twoYearsAgo.toISOString().slice(0, 10);

    const existing = await this.priceHistoryModel
      .find({
        symbol: { $in: symbols },
        exchange,
        interval: 'daily',
        date: { $gte: new Date(fromDate), $lte: new Date(toDate) },
      })
      .sort({ symbol: 1, date: 1 })
      .lean();

    const bySymbol: Record<string, (typeof existing)[0][]> = {};
    for (const sym of symbols) bySymbol[sym] = [];
    for (const bar of existing) {
      const s = bar.symbol;
      if (bySymbol[s]) bySymbol[s].push(bar);
    }

    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const toFetch: string[] = [];
    for (const sym of symbols) {
      const bars = bySymbol[sym] || [];
      const needsFresh =
        bars.length === 0 ||
        bars.some((b) => {
          const d = b.date.toISOString().slice(0, 10);
          return d === today && now.getTime() - b.fetchedAt.getTime() > HISTORY_FRESHNESS_MS;
        });
      if (needsFresh) toFetch.push(sym);
    }

    if (toFetch.length > 0) {
      const provider = this.registry.resolve(toFetch[0], 'stock');
      const fetchResults = await Promise.all(
        toFetch.map(async (sym) => {
          try {
            const bars = await provider.getHistory(sym, fromDate, toDate);
            return { sym, bars };
          } catch (err) {
            this.logger.error(`Failed to fetch history for ${sym}`, err);
            return { sym, bars: [] };
          }
        }),
      );
      const allOps: Parameters<typeof this.priceHistoryModel.bulkWrite>[0] = [];
      for (const { sym, bars } of fetchResults) {
        if (bars.length > 0) {
          for (const bar of bars) {
            allOps.push({
              updateOne: {
                filter: { symbol: sym, exchange, interval: 'daily', date: new Date(bar.date) },
                update: {
                  $set: {
                    ...bar,
                    date: new Date(bar.date),
                    symbol: sym,
                    exchange,
                    interval: 'daily',
                    provider: provider.providerId,
                    fetchedAt: now,
                  },
                },
                upsert: true,
              },
            });
          }
          bySymbol[sym] = bars.map((b) => ({
            date: new Date(b.date),
            open: b.open,
            high: b.high,
            low: b.low,
            close: b.close,
            volume: b.volume,
            symbol: sym,
            exchange,
            interval: 'daily',
            provider: provider.providerId,
            fetchedAt: now,
          })) as (typeof existing)[0][];
        }
      }
      if (allOps.length > 0) await this.priceHistoryModel.bulkWrite(allOps);
    }

    const result: Record<string, HistoryBar[]> = {};
    const toBar = (b: { date: Date; open: number; high: number; low: number; close: number; volume?: number }) => ({
      date: b.date.toISOString().slice(0, 10),
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
      volume: b.volume ?? 0,
    });
    for (const sym of symbols) {
      const bars = bySymbol[sym] || [];
      result[sym] = bars.map(toBar);
    }
    return result;
  }

  /* ── Search ───────────────────────────────────── */

  async searchSymbols(query: string): Promise<SymbolMatch[]> {
    const provider = this.registry.resolve(undefined, 'stock');
    return provider.searchSymbols(query);
  }

  /* ── Helpers ──────────────────────────────────── */

  isMarketOpen(exchange = 'US'): boolean {
    const now = new Date();
    const et = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric', minute: 'numeric', hour12: false,
      weekday: 'short',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(now);

    const parts: Record<string, string> = {};
    for (const p of et) parts[p.type] = p.value;

    const weekday = parts.weekday;
    if (weekday === 'Sat' || weekday === 'Sun') return false;

    const dateStr = `${parts.year}-${parts.month}-${parts.day}`;
    const holidays = exchange === 'CA' ? CA_HOLIDAYS_2026 : US_HOLIDAYS_2026;
    if (holidays.includes(dateStr)) return false;

    const hour = parseInt(parts.hour, 10);
    const minute = parseInt(parts.minute, 10);
    const minutesSinceMidnight = hour * 60 + minute;
    return minutesSinceMidnight >= 570 && minutesSinceMidnight < 960;
  }

  private cacheToQuote(doc: QuoteCacheDocument): QuoteResult {
    return {
      symbol: doc.contractTicker ?? doc.symbol,
      price: doc.price,
      open: doc.open,
      high: doc.high,
      low: doc.low,
      previousClose: doc.previousClose,
      change: doc.change,
      changePercent: doc.changePercent,
      volume: doc.volume,
    };
  }
}
