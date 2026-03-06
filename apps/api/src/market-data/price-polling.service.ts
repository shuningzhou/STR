import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QuoteCache, QuoteCacheDocument } from './schemas/quote-cache.schema';
import { PositionAggregationService } from './position-aggregation.service';
import { EodhdProvider } from './providers/eodhd-provider';
import { ProviderRegistry } from './providers/provider-registry';
import { fromOccTicker } from './providers/market-data-provider.interface';

const US_HOLIDAYS_2026 = [
  '2026-01-01', '2026-01-19', '2026-02-16', '2026-04-03',
  '2026-05-25', '2026-07-03', '2026-09-07', '2026-11-26', '2026-12-25',
];

/** Throttle: 5 requests per minute = 1 every 12 seconds */
const MASSIVE_THROTTLE_MS = 12_000;

@Injectable()
export class PricePollingService implements OnModuleInit {
  private readonly logger = new Logger(PricePollingService.name);

  constructor(
    private readonly positionAgg: PositionAggregationService,
    private readonly eodhd: EodhdProvider,
    private readonly registry: ProviderRegistry,
    @InjectModel(QuoteCache.name) private readonly quoteCacheModel: Model<QuoteCacheDocument>,
  ) {}

  private isWeekendOrHoliday(): boolean {
    const now = new Date();
    const et = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const parts: Record<string, string> = {};
    for (const p of et) parts[p.type] = p.value;
    if (parts.weekday === 'Sat' || parts.weekday === 'Sun') return true;
    const dateStr = `${parts.year}-${parts.month}-${parts.day}`;
    return US_HOLIDAYS_2026.includes(dateStr);
  }

  /** Current date in ET (YYYY-MM-DD). */
  private getTodayET(): string {
    const now = new Date();
    const et = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const parts: Record<string, string> = {};
    for (const p of et) parts[p.type] = p.value;
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  /**
   * Returns the previous US trading day (YYYY-MM-DD).
   * Skips weekends and US_HOLIDAYS_2026.
   */
  private getPreviousTradingDay(): string {
    const now = new Date();
    for (let i = 1; i <= 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(d);
      const pm: Record<string, string> = {};
      for (const p of parts) pm[p.type] = p.value;
      const dateStr = `${pm.year}-${pm.month}-${pm.day}`;
      const weekday = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        weekday: 'short',
      }).format(d);
      if (weekday !== 'Sat' && weekday !== 'Sun' && !US_HOLIDAYS_2026.includes(dateStr)) {
        return dateStr;
      }
    }
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  }

  /**
   * Returns the date for which EOD data is likely available.
   * EOD data is typically available 1-2 hrs after 4 PM ET. We use 6 PM ET as cutoff.
   * - Before 6 PM ET on a trading day: previous trading day
   * - After 6 PM ET or next day: today (if trading day)
   * - Weekend/holiday: last trading day
   */
  private getEodDateForStocks(): string {
    if (this.isWeekendOrHoliday()) return this.getPreviousTradingDay();
    const now = new Date();
    const et = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).formatToParts(now);
    const parts: Record<string, string> = {};
    for (const p of et) parts[p.type] = p.value;
    const hour = parseInt(parts.hour ?? '0', 10);
    const minute = parseInt(parts.minute ?? '0', 10);
    const minutesSinceMidnight = hour * 60 + minute;
    if (minutesSinceMidnight >= 18 * 60) return this.getTodayET(); // 6 PM ET or later
    return this.getPreviousTradingDay();
  }

  /** Massive /prev returns previous trading day. Use that as eodDate for options. */
  private getEodDateForOptions(): string {
    return this.getPreviousTradingDay();
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('[PricePolling] Checking EOD cache on startup');
    await this.ensureEodPrices();
  }

  /** Fetch EOD prices if cache is missing for open positions (cold start) */
  private async ensureEodPrices(): Promise<void> {
    const symbols = await this.positionAgg.getOpenSymbols();
    const contracts = await this.positionAgg.getOpenOptionContracts();

    if (symbols.length === 0 && contracts.length === 0) {
      this.logger.log('[PricePolling] No open positions, skip EOD fetch');
      return;
    }

    let needStocks = false;
    if (symbols.length > 0) {
      const cached = await this.quoteCacheModel.countDocuments({
        symbol: { $in: symbols },
        assetType: { $ne: 'option' },
      });
      needStocks = cached < symbols.length;
      if (needStocks) this.logger.log(`[PricePolling] Stocks: ${cached}/${symbols.length} cached, fetching missing from EODHD`);
      else this.logger.log(`[PricePolling] Stocks: all ${symbols.length} cached - [${symbols.join(', ')}]`);
    }

    let needOptions = false;
    if (contracts.length > 0) {
      const cached = await this.quoteCacheModel.countDocuments({
        contractTicker: { $in: contracts },
        assetType: 'option',
      });
      needOptions = cached < contracts.length;
      if (needOptions) this.logger.log(`[PricePolling] Options: ${cached}/${contracts.length} cached, fetching missing from Massive`);
      else this.logger.log(`[PricePolling] Options: all ${contracts.length} cached - [${contracts.join(', ')}]`);
    }

    if (needStocks) await this.fetchEodhdStocks();
    if (needOptions) await this.fetchMassiveOptions();
    if (!needStocks && !needOptions) this.logger.log('[PricePolling] EOD cache OK - no fetch needed');
  }

  private isAfterMarketCloseET(): boolean {
    const now = new Date();
    const et = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).formatToParts(now);
    const parts: Record<string, string> = {};
    for (const p of et) parts[p.type] = p.value;
    const hour = parseInt(parts.hour ?? '0', 10);
    const minute = parseInt(parts.minute ?? '0', 10);
    const minutesSinceMidnight = hour * 60 + minute;
    return minutesSinceMidnight >= 975;
  }

  /** EODHD: once after market close (6:05 PM ET), batch EOD for all open symbols. 6 PM allows EOD data to be published. */
  @Cron('5 18 * * 1-5', { timeZone: 'America/New_York' })
  async pollEodhdStocks(): Promise<void> {
    if (this.isWeekendOrHoliday()) return;
    if (!this.isAfterMarketCloseET()) return;
    await this.fetchEodhdStocks();
  }

  /** Massive: once after market close (6:05 PM ET), EOD (prev-day) for all open options, throttle 5/min */
  @Cron('5 18 * * 1-5', { timeZone: 'America/New_York' })
  async pollMassiveOptions(): Promise<void> {
    if (this.isWeekendOrHoliday()) return;
    if (!this.isAfterMarketCloseET()) return;
    await this.fetchMassiveOptions();
  }

  private async fetchEodhdStocks(): Promise<void> {
    const symbols = await this.positionAgg.getOpenSymbols();
    if (symbols.length === 0) {
      this.logger.log('[EODHD] No open symbols, skip');
      return;
    }

    const eodDate = this.getEodDateForStocks();
    this.logger.log(`[EODHD] EOD fetch STARTED - tickers: [${symbols.join(', ')}] eodDate=${eodDate}`);

    try {
      const quotes = await this.eodhd.getEodBatch(symbols, eodDate);
      const now = new Date();
      const succeeded: { symbol: string; price: number }[] = [];
      for (const q of quotes) {
        await this.quoteCacheModel.updateOne(
          { symbol: q.symbol, assetType: { $ne: 'option' } },
          {
            $set: {
              symbol: q.symbol,
              price: q.price,
              open: q.open,
              high: q.high,
              low: q.low,
              volume: q.volume,
              provider: 'eodhd',
              fetchedAt: now,
              assetType: 'stock',
              eodDate,
            },
          },
          { upsert: true },
        );
        succeeded.push({ symbol: q.symbol, price: q.price });
      }

      const failed = symbols.filter((s) => !quotes.some((q) => q.symbol === s));
      const report = succeeded.map((r) => `${r.symbol}=$${r.price.toFixed(2)}`).join(', ');
      const errReport = failed.length > 0 ? ` | failed: [${failed.join(', ')}]` : '';
      this.logger.log(
        `[EODHD] EOD fetch FINISHED - report: ${succeeded.length}/${symbols.length} ok | ${report}${errReport}`,
      );
    } catch (err) {
      this.logger.error(`[EODHD] EOD fetch FAILED - error: ${err instanceof Error ? err.message : String(err)}`, err);
    }
  }

  private async fetchMassiveOptions(): Promise<void> {
    const contracts = await this.positionAgg.getOpenOptionContracts();
    if (contracts.length === 0) {
      this.logger.log('[Massive] No open options, skip');
      return;
    }

    const eodDate = this.getEodDateForOptions();
    this.logger.log(`[Massive] EOD fetch STARTED - tickers: [${contracts.join(', ')}] eodDate=${eodDate} (prev-day, throttle 5/min)`);

    const provider = this.registry.resolveOptions();
    const now = new Date();
    const succeeded: { ticker: string; price: number }[] = [];
    const failed: { ticker: string; error: string }[] = [];

    for (let i = 0; i < contracts.length; i++) {
      const ticker = contracts[i];
      if (i > 0) {
        await new Promise((r) => setTimeout(r, MASSIVE_THROTTLE_MS));
      }
      try {
        const q = provider.getOptionQuoteEod
          ? await provider.getOptionQuoteEod(ticker)
          : await provider.getOptionQuote(fromOccTicker(ticker));
        q.symbol = ticker;
        await this.quoteCacheModel.updateOne(
          { contractTicker: ticker, assetType: 'option' },
          {
            $set: {
              symbol: ticker,
              contractTicker: ticker,
              price: q.price,
              provider: provider.providerId,
              fetchedAt: now,
              assetType: 'option',
              eodDate,
            },
          },
          { upsert: true },
        );
        succeeded.push({ ticker, price: q.price });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        failed.push({ ticker, error: errMsg });
        this.logger.warn(`[Massive] ${ticker} failed: ${errMsg}`);
      }
    }

    const report = succeeded.map((r) => `${r.ticker}=$${r.price.toFixed(2)}`).join(', ');
    const errReport = failed.length > 0 ? ` | failed: [${failed.map((f) => `${f.ticker}: ${f.error}`).join('; ')}]` : '';
    this.logger.log(
      `[Massive] EOD fetch FINISHED - report: ${succeeded.length}/${contracts.length} ok | ${report}${errReport}`,
    );
  }
}
