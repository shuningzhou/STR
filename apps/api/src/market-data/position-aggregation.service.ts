import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from '../transactions/transaction.schema';
import { toOccTicker } from './providers/market-data-provider.interface';

/** Open positions aggregated from transactions. Only symbols/options with net qty > 0. */
@Injectable()
export class PositionAggregationService {
  constructor(
    @InjectModel(Transaction.name) private readonly txModel: Model<TransactionDocument>,
  ) {}

  /** Stock/ETF symbols with open positions (excludes options). Includes underlying symbols of open options. */
  async getOpenSymbols(): Promise<string[]> {
    const positions: Record<string, number> = {};
    const [stockTxs, optionTxs] = await Promise.all([
      this.txModel.find({ option: null }).lean().exec(),
      this.txModel.find({ option: { $ne: null } }).lean().exec(),
    ]);

    for (const t of stockTxs) {
      const sym = (t.instrumentSymbol || '').trim();
      if (!sym) continue;
      const qty = t.quantity || 0;
      const side = (t.side || '').toLowerCase();
      if (side === 'sell' || side === 'short') {
        positions[sym] = (positions[sym] ?? 0) - qty;
      } else {
        positions[sym] = (positions[sym] ?? 0) + qty;
      }
    }

    const stockSymbols = Object.entries(positions)
      .filter(([, qty]) => qty > 0)
      .map(([sym]) => sym);

    const underlyingSymbols = new Set<string>();
    const today = new Date().toISOString().slice(0, 10);
    const shortPos: Record<string, number> = {};
    const longPos: Record<string, number> = {};
    for (const t of optionTxs) {
      const opt = t.option as { expiration?: string; strike?: number; callPut?: string } | null;
      if (!opt?.expiration) continue;
      const sym = (t.instrumentSymbol || '').trim();
      if (!sym) continue;
      const ticker = toOccTicker(sym, opt.expiration.slice(0, 10), opt.strike ?? 0, opt.callPut ?? 'call');
      const qty = t.quantity || 0;
      const side = (t.side || '').toLowerCase();
      if (side === 'sell') shortPos[ticker] = (shortPos[ticker] ?? 0) + qty;
      else if (side === 'buy_to_cover' || side === 'option_assign' || side === 'option_expire')
        shortPos[ticker] = (shortPos[ticker] ?? 0) - qty;
      else if (side === 'buy') longPos[ticker] = (longPos[ticker] ?? 0) + qty;
      else if (side === 'sell_to_cover') longPos[ticker] = (longPos[ticker] ?? 0) - qty;
    }
    const openOptionTickers = new Set([
      ...Object.entries(shortPos).filter(([, q]) => q > 0).map(([t]) => t),
      ...Object.entries(longPos).filter(([, q]) => q > 0).map(([t]) => t),
    ]);
    for (const ticker of openOptionTickers) {
      const datePart = ticker.replace(/^O:\w+?(\d{6})[CP].*/, '$1');
      if (datePart.length === 6) {
        const exp = `20${datePart.slice(0, 2)}-${datePart.slice(2, 4)}-${datePart.slice(4, 6)}`;
        if (exp >= today) {
          const m = ticker.match(/^O:([A-Z]+)\d{6}[CP]/);
          if (m) underlyingSymbols.add(m[1]);
        }
      }
    }

    return [...new Set([...stockSymbols, ...underlyingSymbols])].filter((s) => s.length > 0);
  }

  /** OCC tickers for options with open positions. Filters expired. */
  async getOpenOptionContracts(): Promise<string[]> {
    const today = new Date().toISOString().slice(0, 10);
    const shortPositions: Record<string, number> = {};
    const longPositions: Record<string, number> = {};
    const txs = await this.txModel.find({ option: { $ne: null } }).lean().exec();

    for (const t of txs) {
      const opt = t.option as { expiration?: string; strike?: number; callPut?: string } | null;
      if (!opt?.expiration) continue;
      const sym = (t.instrumentSymbol || '').trim();
      if (!sym) continue;
      const ticker = toOccTicker(sym, opt.expiration.slice(0, 10), opt.strike ?? 0, opt.callPut ?? 'call');
      const qty = t.quantity || 0;
      const side = (t.side || '').toLowerCase();

      if (side === 'sell') {
        shortPositions[ticker] = (shortPositions[ticker] ?? 0) + qty;
      } else if (side === 'buy_to_cover' || side === 'option_assign' || side === 'option_expire') {
        shortPositions[ticker] = (shortPositions[ticker] ?? 0) - qty;
      } else if (side === 'buy') {
        longPositions[ticker] = (longPositions[ticker] ?? 0) + qty;
      } else if (side === 'sell_to_cover') {
        longPositions[ticker] = (longPositions[ticker] ?? 0) - qty;
      }
    }

    const shortTickers = Object.entries(shortPositions)
      .filter(([, qty]) => qty > 0)
      .map(([ticker]) => ticker);
    const longTickers = Object.entries(longPositions)
      .filter(([, qty]) => qty > 0)
      .map(([ticker]) => ticker);
    const allTickers = [...new Set([...shortTickers, ...longTickers])];

    return allTickers.filter((ticker) => {
      const datePart = ticker.replace(/^O:\w+?(\d{6})[CP]/, '$1');
      if (datePart.length !== 6) return true;
      const exp = `20${datePart.slice(0, 2)}-${datePart.slice(2, 4)}-${datePart.slice(4, 6)}`;
      return exp >= today;
    });
  }
}
