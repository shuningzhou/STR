import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Snaptrade } from 'snaptrade-typescript-sdk';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Strategy, StrategyDocument } from '../strategies/strategy.schema';
import { Transaction, TransactionDocument } from '../transactions/transaction.schema';
import { SnaptradeConnection, SnaptradeConnectionDocument } from './schemas/snaptrade-connection.schema';
import { SyncedAccount, SyncedAccountDocument } from './schemas/synced-account.schema';

const ACTIVITY_TYPE_MAP: Record<string, string> = {
  BUY: 'buy',
  SELL: 'sell',
  DIVIDEND: 'dividend',
  REI: 'dividend',
  STOCK_DIVIDEND: 'dividend',
  CONTRIBUTION: 'deposit',
  WITHDRAWAL: 'withdrawal',
  FEE: 'fee',
  INTEREST: 'interest',
  TAX: 'tax',
  OPTIONEXERCISE: 'option_exercise',
  OPTIONASSIGNMENT: 'option_assign',
  OPTIONEXPIRATION: 'option_expire',
  OPTIONS_ASSIGN: 'option_assign',
  OPTIONS_SHORT_EXPIRY: 'option_expire',
  OPTIONS_EXERCISE: 'option_exercise',
  TRANSFER: 'transfer',
  EXTERNAL_ASSET_TRANSFER_IN: 'transfer_in',
  EXTERNAL_ASSET_TRANSFER_OUT: 'transfer_out',
  OPTIONS_MULTILEG: 'options_multileg',
  SPLIT: 'split',
  ADJUSTMENT: 'adjustment',
  REFUND: 'refund',
};

@Injectable()
export class SnaptradeService {
  private readonly logger = new Logger(SnaptradeService.name);
  private readonly snaptrade: Snaptrade;

  constructor(
    private config: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Strategy.name) private strategyModel: Model<StrategyDocument>,
    @InjectModel(Transaction.name) private txModel: Model<TransactionDocument>,
    @InjectModel(SnaptradeConnection.name) private connModel: Model<SnaptradeConnectionDocument>,
    @InjectModel(SyncedAccount.name) private syncedAccountModel: Model<SyncedAccountDocument>,
  ) {
    this.snaptrade = new Snaptrade({
      clientId: this.config.getOrThrow<string>('SNAPTRADE_CLIENT_ID'),
      consumerKey: this.config.getOrThrow<string>('SNAPTRADE_CLIENT_SECRET'),
    });
  }

  /* ── Registration & Connection ────────────────── */

  async registerUser(userId: string): Promise<{ snaptradeUserId: string; snaptradeUserSecret: string }> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (user.snaptradeUserId && user.snaptradeUserSecret) {
      return { snaptradeUserId: user.snaptradeUserId, snaptradeUserSecret: user.snaptradeUserSecret };
    }

    const snapUserId = userId;
    const resp = await this.snaptrade.authentication.registerSnapTradeUser({ userId: snapUserId });
    const userSecret = resp.data.userSecret!;

    user.snaptradeUserId = snapUserId;
    user.snaptradeUserSecret = userSecret;
    await user.save();

    return { snaptradeUserId: snapUserId, snaptradeUserSecret: userSecret };
  }

  private async getSnapCreds(userId: string) {
    const user = await this.userModel.findById(userId).lean().exec();
    if (!user?.snaptradeUserId || !user?.snaptradeUserSecret) {
      throw new BadRequestException('User not registered with SnapTrade');
    }
    return { userId: user.snaptradeUserId, userSecret: user.snaptradeUserSecret };
  }

  async getConnectionPortalUrl(userId: string): Promise<{ redirectURI: string; sessionId: string }> {
    const creds = await this.getSnapCreds(userId);
    const resp = await this.snaptrade.authentication.loginSnapTradeUser({
      ...creds,
      darkMode: true,
    });
    const data = resp.data as any;
    return {
      redirectURI: data.redirectURI ?? '',
      sessionId: data.sessionId ?? '',
    };
  }

  /* ── Connections & Accounts ───────────────────── */

  async listConnections(userId: string) {
    return this.connModel.find({ userId: new Types.ObjectId(userId) }).lean().exec();
  }

  async refreshConnections(userId: string) {
    const creds = await this.getSnapCreds(userId);
    const resp = await this.snaptrade.accountInformation.listUserAccounts(creds);
    const accounts = resp.data;

    const groupedByAuth: Record<string, typeof accounts> = {};
    for (const acct of accounts) {
      const authId = (acct as any).brokerage_authorization ?? 'unknown';
      if (!groupedByAuth[authId]) groupedByAuth[authId] = [];
      groupedByAuth[authId].push(acct);
    }

    for (const [authId, accts] of Object.entries(groupedByAuth)) {
      const institutionName = (accts[0] as any)?.institution_name ?? (accts[0] as any)?.meta?.institution_name ?? '';
      const rawType = (v: any) => ((v ?? '').toString().toLowerCase());
      const openAccts = accts.filter((a: any) => {
        if (rawType((a as any).status) === 'closed') return false;
        const rt = rawType((a as any).raw_type ?? (a as any).meta?.type ?? (a as any).type);
        if (rt === 'card' || rt === 'msb') return false;
        return true;
      });
      await this.connModel.findOneAndUpdate(
        { userId: new Types.ObjectId(userId), authorizationId: authId },
        {
          $set: {
            institutionName,
            status: 'active',
            accounts: openAccts.map((a: any) => ({
              accountId: a.id,
              name: a.name ?? '',
              number: a.number ?? '',
              institutionName: a.institution_name ?? institutionName,
              currency: (a as any).balance?.total?.currency ?? (a as any).meta?.currency ?? (a as any).currency,
              type: (a as any).meta?.type ?? (a as any).raw_type ?? (a as any).type,
              rawType: (a as any).raw_type,
              status: (a as any).status,
              metaStatus: (a as any).meta?.status,
              balanceAmount: (a as any).balance?.total?.amount,
              isPaper: (a as any).is_paper,
              createdDate: (a as any).created_date,
            })),
          },
          $setOnInsert: { userId: new Types.ObjectId(userId), authorizationId: authId },
        },
        { upsert: true, new: true },
      );
    }

    return this.connModel.find({ userId: new Types.ObjectId(userId) }).lean().exec();
  }

  async listAccounts(userId: string) {
    const connections = await this.connModel.find({ userId: new Types.ObjectId(userId) }).lean().exec();
    const allAccounts: Array<{
      accountId: string;
      name: string;
      number: string;
      institutionName: string;
      authorizationId: string;
      currency?: string;
      type?: string;
      rawType?: string;
      status?: string;
      metaStatus?: string;
      balanceAmount?: number;
      isPaper?: boolean;
      createdDate?: string;
      displayLabel?: string;
    }> = [];
    for (const conn of connections) {
      for (const acct of conn.accounts) {
        const status = (acct.status ?? '').toLowerCase();
        if (status === 'closed') continue;
        const rt = (acct.rawType ?? acct.type ?? '').toLowerCase();
        if (rt === 'card' || rt === 'msb') continue;
        allAccounts.push({
          accountId: acct.accountId,
          name: acct.name ?? '',
          number: acct.number ?? '',
          institutionName: acct.institutionName ?? conn.institutionName ?? '',
          authorizationId: conn.authorizationId,
          currency: acct.currency,
          type: acct.type,
          rawType: acct.rawType,
          status: acct.status,
          metaStatus: acct.metaStatus,
          balanceAmount: acct.balanceAmount,
          isPaper: acct.isPaper,
          createdDate: acct.createdDate,
        });
      }
    }
    const nameCount = new Map<string, number>();
    for (const a of allAccounts) {
      const key = `${a.institutionName} - ${a.name}`;
      nameCount.set(key, (nameCount.get(key) ?? 0) + 1);
    }
    const nameIndex = new Map<string, number>();
    for (const a of allAccounts) {
      const key = `${a.institutionName} - ${a.name}`;
      const count = nameCount.get(key)!;
      const idx = nameIndex.get(key) ?? 0;
      const extra: string[] = [];
      if (a.currency) extra.push(a.currency);
      if (a.type) extra.push(a.type);
      const suffix = extra.length > 0 ? ` (${extra.join(' • ')})` : count > 1 ? ` (${idx + 1})` : '';
      a.displayLabel = key + suffix;
      nameIndex.set(key, idx + 1);
    }
    return allAccounts;
  }

  async deleteConnection(userId: string, authorizationId: string) {
    const creds = await this.getSnapCreds(userId);
    try {
      await this.snaptrade.connections.removeBrokerageAuthorization({
        ...creds,
        authorizationId,
      });
    } catch (e) {
      this.logger.warn(`Failed to delete connection at SnapTrade: ${e}`);
    }
    await this.connModel.deleteOne({ userId: new Types.ObjectId(userId), authorizationId });
    return { deleted: true };
  }

  /* ── Account-level sync & rebuild ─────────────── */

  async getAccountTransactions(accountId: string, userId: string) {
    const doc = await this.syncedAccountModel
      .findOne({ userId: new Types.ObjectId(userId), accountId })
      .lean()
      .exec();
    if (!doc) {
      return {
        rawTransactions: [] as any[],
        adjustedTransactions: [] as any[],
        rawHoldings: null,
        derivedHoldings: { positions: [], cashByCurrency: {} },
      };
    }

    const equityPositions = (doc.currentHoldings ?? []).map((h: any) => ({
      symbol: h.symbol,
      quantity: h.quantity ?? 0,
      averagePrice: h.averagePrice ?? 0,
      currency: h.currency ?? '',
      isOption: false,
    }));

    const optionPositions = await this.fetchOptionHoldings(accountId, userId);
    const rawPositions = [...equityPositions, ...optionPositions].sort((a, b) =>
      a.symbol.localeCompare(b.symbol),
    );

    const cashByCurrency = doc.currentCashByCurrency && Object.keys(doc.currentCashByCurrency).length > 0
      ? doc.currentCashByCurrency
      : (doc.currentCash != null ? { [doc.currency || 'USD']: doc.currentCash } : {});

    const rawHoldings = {
      positions: rawPositions,
      cashByCurrency,
    };

    const derived = this.deriveHoldingsFromTransactions(doc.adjustedTransactions ?? []);

    return {
      rawTransactions: doc.rawTransactions ?? [],
      adjustedTransactions: doc.adjustedTransactions ?? [],
      rawHoldings,
      derivedHoldings: {
        positions: derived.positions,
        cashByCurrency,
      },
    };
  }

  private async fetchOptionHoldings(
    accountId: string,
    userId: string,
  ): Promise<Array<{ symbol: string; quantity: number; averagePrice?: number; currency?: string; isOption: boolean }>> {
    try {
      const creds = await this.getSnapCreds(userId);
      const resp = await this.snaptrade.options.listOptionHoldings({
        accountId,
        userId: creds.userId,
        userSecret: creds.userSecret,
      });
      const data = resp?.data ?? [];
      return data.map((opt: any) => {
        const sym = opt?.symbol;
        const optSym = sym?.option_symbol;
        const underlying = optSym?.underlying_symbol;
        const und = typeof underlying === 'string' ? underlying : underlying?.symbol ?? underlying?.raw_symbol ?? '';
        const strike = optSym?.strike_price ?? 0;
        const callPut = (optSym?.option_type ?? 'CALL').charAt(0);
        const exp = (optSym?.expiration_date ?? '').slice(0, 10);
        const symbol = und ? `${und} $${strike} ${callPut} ${exp}` : (optSym?.ticker ?? sym?.description ?? 'option');
        const undCurrency = underlying?.currency?.code;
        const topCurrency = typeof opt?.currency === 'string' ? opt.currency : opt?.currency?.code;
        const currency = topCurrency || undCurrency || '';
        return {
          symbol,
          quantity: opt?.units ?? 0,
          averagePrice: ((opt?.average_purchase_price ?? 0) / 100),
          currency,
          isOption: true,
        };
      });
    } catch (e) {
      this.logger.warn(`Failed to fetch option holdings for ${accountId}: ${e}`);
      return [];
    }
  }

  private txKey(t: any): string {
    const opt = t.option;
    if (opt && opt.strike != null && opt.callPut) {
      const und = opt.underlyingSymbol ?? t.instrumentSymbol ?? '';
      return `${und} $${opt.strike} ${(opt.callPut ?? '').toUpperCase().charAt(0)} ${(opt.expiration ?? '').slice(0, 10)}`;
    }
    return typeof t.instrumentSymbol === 'string' ? t.instrumentSymbol : '';
  }

  private parseOptionKey(key: string): { underlying: string; option: any } {
    const m = key.match(/^(.+?)\s+\$([.\d]+)\s+([CP])\s+(\S+)$/);
    if (!m) return { underlying: key, option: null };
    return {
      underlying: m[1],
      option: {
        strike: parseFloat(m[2]),
        callPut: m[3] === 'C' ? 'call' : 'put',
        expiration: m[4],
        underlyingSymbol: m[1],
      },
    };
  }

  private deriveHoldingsFromTransactions(txns: any[]): {
    positions: Array<{ symbol: string; quantity: number; currency?: string }>;
    cashByCurrency: Record<string, number>;
  } {
    const byKey: Record<string, number> = {};
    const currencyByKey: Record<string, string> = {};
    const cashByCurrency: Record<string, number> = {};
    const OPTION_CONTRACT_MULTIPLIER = 100;
    const addSides = ['buy', 'option_exercise', 'transfer_in'];
    const subSides = ['sell', 'option_assign', 'option_expire', 'transfer_out'];
    const setKey = (k: string, delta: number, ccy: string) => {
      if (k) {
        byKey[k] = (byKey[k] ?? 0) + delta;
        if (!currencyByKey[k]) currencyByKey[k] = ccy;
      }
    };
    for (const t of txns) {
      const key = this.txKey(t);
      const q = t.quantity ?? 0;
      const ccy = t.currency || 'USD';
      const opt = t.option;
      const underlying = opt?.underlyingSymbol ?? t.instrumentSymbol ?? '';
      const callPut = (opt?.callPut ?? '').toLowerCase();
      const isPut = callPut.startsWith('p');
      const isCall = callPut.startsWith('c');

      if (t.side === 'option_assign') {
        if (key && q) setKey(key, q, ccy);
        if (underlying && q) {
          const shareDelta = q * OPTION_CONTRACT_MULTIPLIER;
          setKey(underlying, isPut ? shareDelta : -shareDelta, ccy);
        }
      } else if (t.side === 'option_exercise') {
        if (key && q) setKey(key, -q, ccy);
        if (underlying && q) {
          const shareDelta = q * OPTION_CONTRACT_MULTIPLIER;
          setKey(underlying, isCall ? shareDelta : -shareDelta, ccy);
        }
      } else if (t.side === 'option_expire') {
        if (key && q) setKey(key, q, ccy);
      } else if (key && q) {
        if (addSides.includes(t.side)) setKey(key, q, ccy);
        else if (subSides.includes(t.side)) setKey(key, -q, ccy);
      }
      cashByCurrency[ccy] = (cashByCurrency[ccy] ?? 0) + (t.cashDelta ?? 0);
    }
    const positions = Object.entries(byKey)
      .filter(([, q]) => Math.abs(q) >= 0.0001)
      .map(([symbol, quantity]) => ({ symbol, quantity, currency: currencyByKey[symbol] || 'USD' }))
      .sort((a, b) => a.symbol.localeCompare(b.symbol));
    return { positions, cashByCurrency };
  }

  async rebuildAccountFull(accountId: string, userId: string): Promise<{ rebuilt: boolean; activities: number }> {
    const creds = await this.getSnapCreds(userId);
    const userObjId = new Types.ObjectId(userId);

    let doc = await this.syncedAccountModel.findOne({ userId: userObjId, accountId }).exec();
    if (!doc) {
      const acctInfo = await this.findAccountInfo(userId, accountId);
      doc = new this.syncedAccountModel({
        userId: userObjId,
        accountId,
        authorizationId: acctInfo?.authorizationId ?? '',
        institutionName: acctInfo?.institutionName ?? '',
        currency: acctInfo?.currency ?? '',
        rebuiltAt: null,
        lastSyncedAt: null,
        currentHoldings: [],
        currentCash: 0,
        currentCashByCurrency: {},
        rawTransactions: [],
        adjustedTransactions: [],
      });
    }

    const oldTxIds = doc.adjustedTransactions.map((t) => (t as any)._id?.toString()).filter(Boolean);

    doc.adjustedTransactions = [] as any;
    doc.rawTransactions = [] as any;
    doc.rebuiltAt = null;
    doc.currentHoldings = [] as any;
    doc.currentCash = 0;
    doc.currentCashByCurrency = {} as any;

    if (doc.authorizationId) {
      try {
        await this.snaptrade.connections.refreshBrokerageAuthorization({
          authorizationId: doc.authorizationId,
          userId: creds.userId,
          userSecret: creds.userSecret,
        });
        await new Promise((r) => setTimeout(r, 3000));
      } catch (e) {
        this.logger.warn(`Failed to refresh brokerage before rebuild: ${e}`);
      }
    }

    const activities = await this.fetchAllActivities(accountId, creds);
    const existingIds = new Set<string>();

    for (const activity of activities) {
      const activityId = (activity as any).id;
      if (!activityId || existingIds.has(activityId)) continue;
      const mapped = this.mapActivity(activity);
      doc.adjustedTransactions.push({
        ...mapped,
        snaptradeActivityId: activityId,
        synthetic: false,
      } as any);
      existingIds.add(activityId);
    }

    doc.rawTransactions = JSON.parse(JSON.stringify(doc.adjustedTransactions));
    await this.rebuildAccount(doc, creds, accountId);
    doc.lastSyncedAt = new Date();
    await doc.save();

    if (oldTxIds.length > 0) {
      const strategies = await this.strategyModel
        .find({ 'snaptradeConfig.accountIds': accountId, userId: userObjId })
        .lean()
        .exec();

      for (const strategy of strategies) {
        const deleted = await this.txModel.deleteMany({
          strategyId: strategy._id.toString(),
          accountTransactionId: { $in: oldTxIds },
        });
        if (deleted.deletedCount > 0) {
          await this.strategyModel.updateOne(
            { _id: strategy._id },
            { $inc: { transactionsVersion: 1 } },
          );
          this.logger.log(
            `Dropped ${deleted.deletedCount} strategy txns from strategy ${strategy._id} for account ${accountId}`,
          );
        }
      }
    }

    this.logger.log(`rebuildAccountFull ${accountId}: ${activities.length} activities, rebuild complete`);
    return { rebuilt: true, activities: activities.length };
  }

  async syncAccount(accountId: string, userId: string): Promise<{ added: number }> {
    const creds = await this.getSnapCreds(userId);
    const userObjId = new Types.ObjectId(userId);

    let doc = await this.syncedAccountModel.findOne({ userId: userObjId, accountId }).exec();
    if (!doc) {
      const acctInfo = await this.findAccountInfo(userId, accountId);
      doc = new this.syncedAccountModel({
        userId: userObjId,
        accountId,
        authorizationId: acctInfo?.authorizationId ?? '',
        institutionName: acctInfo?.institutionName ?? '',
        currency: acctInfo?.currency ?? '',
        rebuiltAt: null,
        lastSyncedAt: null,
        currentHoldings: [],
        currentCash: 0,
        currentCashByCurrency: {},
        rawTransactions: [],
        adjustedTransactions: [],
      });
    }

    const existingIds = new Set(
      doc.adjustedTransactions
        .filter((t) => t.snaptradeActivityId)
        .map((t) => t.snaptradeActivityId),
    );

    const activities = await this.fetchAllActivities(accountId, creds);
    let added = 0;

    for (const activity of activities) {
      const activityId = (activity as any).id;
      if (!activityId || existingIds.has(activityId)) continue;

      const mapped = this.mapActivity(activity);
      doc.adjustedTransactions.push({
        ...mapped,
        snaptradeActivityId: activityId,
        synthetic: false,
      } as any);
      existingIds.add(activityId);
      added++;
    }

    if (!doc.rebuiltAt) {
      doc.rawTransactions = JSON.parse(JSON.stringify(doc.adjustedTransactions));
      await this.rebuildAccount(doc, creds, accountId);
    } else {
      for (let i = doc.rawTransactions.length; i < doc.adjustedTransactions.length; i++) {
        doc.rawTransactions.push(JSON.parse(JSON.stringify(doc.adjustedTransactions[i])));
      }
    }

    doc.lastSyncedAt = new Date();
    await doc.save();

    this.logger.log(`syncAccount ${accountId}: ${added} new activities, rebuilt=${!!doc.rebuiltAt}`);
    return { added };
  }

  private resolveMultilegChains(
    doc: SyncedAccountDocument,
    realTxns: any[],
    optionHoldings: Array<{ symbol: string; quantity: number; averagePrice?: number; currency?: string }>,
  ): void {
    const optHoldingByUndCP = new Map<string, typeof optionHoldings[0]>();
    for (const oh of optionHoldings) {
      const p = this.parseOptionKey(oh.symbol);
      const cp = (p.option?.callPut ?? '').charAt(0).toUpperCase();
      if (p.underlying && cp) optHoldingByUndCP.set(`${p.underlying}|${cp}`, oh);
    }

    const sorted = [...realTxns].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const processed = new Set<any>();

    for (const entry of sorted) {
      if (entry.side !== 'options_multileg') continue;
      if (processed.has(entry)) continue;
      const optKey = this.txKey(entry);
      if (!optKey || !optKey.includes('$')) continue;

      const underlying = entry.option?.underlyingSymbol ?? entry.instrumentSymbol ?? '';
      const callPut = (entry.option?.callPut ?? '').charAt(0).toUpperCase();
      if (!underlying || !callPut) continue;

      const chain: any[] = [entry];
      processed.add(entry);
      let currentOldKey = optKey;

      for (let i = sorted.indexOf(entry) + 1; i < sorted.length; i++) {
        const tx = sorted[i];
        if (processed.has(tx)) continue;
        if (tx.side !== 'options_multileg') continue;
        const txUnd = tx.option?.underlyingSymbol ?? tx.instrumentSymbol ?? '';
        const txCP = (tx.option?.callPut ?? '').charAt(0).toUpperCase();
        if (txUnd !== underlying || txCP !== callPut) continue;

        chain.push(tx);
        processed.add(tx);
        currentOldKey = this.txKey(tx);
      }

      const originKey = currentOldKey;
      const originSell = realTxns.find(
        (t) => !processed.has(t) && t.side === 'sell' && this.txKey(t) === originKey,
      );
      const originBuy = realTxns.find(
        (t) => !processed.has(t) && t.side === 'buy' && this.txKey(t) === originKey,
      );

      const holdingKey = `${underlying}|${callPut}`;
      const finalHolding = optHoldingByUndCP.get(holdingKey);

      const isLongRoll = !!originBuy && !originSell;
      const originTx = originSell ?? originBuy;
      const qty = originTx?.quantity
        ?? (finalHolding ? Math.abs(finalHolding.quantity) : 1);

      if (originSell) processed.add(originSell);
      if (originBuy) processed.add(originBuy);

      chain.reverse();

      const newTxns: any[] = [];

      const toPlain = (t: any) => (typeof t?.toObject === 'function' ? t.toObject() : { ...t });

      if (originTx) {
        newTxns.push(toPlain(originTx));
      }

      let prevKey = originKey;
      for (const ml of chain) {
        const mlOldKey = this.txKey(ml);
        const nextIdx = chain.indexOf(ml) + 1;
        let newOptKey: string;
        if (nextIdx < chain.length) {
          newOptKey = this.txKey(chain[nextIdx]);
        } else if (finalHolding) {
          newOptKey = finalHolding.symbol;
        } else {
          newOptKey = mlOldKey;
        }

        const oldParsed = this.parseOptionKey(mlOldKey);
        const newParsed = this.parseOptionKey(newOptKey);

        if (isLongRoll) {
          newTxns.push({
            side: 'sell',
            quantity: qty,
            price: 0,
            cashDelta: ml.cashDelta ?? 0,
            currency: ml.currency || 'USD',
            timestamp: ml.timestamp,
            instrumentSymbol: oldParsed.underlying,
            option: oldParsed.option,
            synthetic: false,
            assetType: 'option',
            chainResolved: true,
          });
          newTxns.push({
            side: 'buy',
            quantity: qty,
            price: 0,
            cashDelta: 0,
            currency: ml.currency || 'USD',
            timestamp: ml.timestamp,
            instrumentSymbol: newParsed.underlying,
            option: newParsed.option,
            synthetic: false,
            assetType: 'option',
            chainResolved: true,
          });
        } else {
          newTxns.push({
            side: 'buy',
            quantity: qty,
            price: 0,
            cashDelta: 0,
            currency: ml.currency || 'USD',
            timestamp: ml.timestamp,
            instrumentSymbol: oldParsed.underlying,
            option: oldParsed.option,
            synthetic: false,
            assetType: 'option',
            chainResolved: true,
          });
          newTxns.push({
            side: 'sell',
            quantity: qty,
            price: 0,
            cashDelta: ml.cashDelta ?? 0,
            currency: ml.currency || 'USD',
            timestamp: ml.timestamp,
            instrumentSymbol: newParsed.underlying,
            option: newParsed.option,
            synthetic: false,
            assetType: 'option',
            chainResolved: true,
          });
        }

        prevKey = newOptKey;
      }

      const closeSides = isLongRoll
        ? ['sell', 'option_exercise', 'option_expire']
        : ['buy', 'option_assign', 'option_exercise', 'option_expire'];
      const finalKey = prevKey;
      const closeTx = realTxns.find(
        (t) => !processed.has(t) && closeSides.includes(t.side) && this.txKey(t) === finalKey,
      );
      if (closeTx) {
        newTxns.push(toPlain(closeTx));
        processed.add(closeTx);
      }

      const toRemove = new Set([originTx, ...chain, closeTx].filter(Boolean));
      for (let i = doc.adjustedTransactions.length - 1; i >= 0; i--) {
        if (toRemove.has(doc.adjustedTransactions[i])) {
          doc.adjustedTransactions.splice(i, 1);
        }
      }

      doc.adjustedTransactions.push(...(newTxns as any));
    }
  }

  private async rebuildAccount(
    doc: SyncedAccountDocument,
    creds: { userId: string; userSecret: string },
    accountId: string,
  ): Promise<void> {
    this.logger.log(`Rebuilding account ${accountId}...`);

    let positions: any[] = [];
    try {
      const posResp = await this.snaptrade.accountInformation.getUserAccountPositions({
        accountId,
        userId: creds.userId,
        userSecret: creds.userSecret,
      });
      positions = posResp.data ?? [];
    } catch (e) {
      this.logger.error(`Failed to fetch positions for ${accountId}: ${e}`);
    }

    const cashByCurrency: Record<string, number> = {};
    try {
      const balResp = await this.snaptrade.accountInformation.getUserAccountBalance({
        accountId,
        userId: creds.userId,
        userSecret: creds.userSecret,
      });
      const balances = balResp.data ?? [];
      for (const b of balances) {
        const ccy = (b as any).currency?.code ?? (b as any).currency ?? 'USD';
        const cash = (b as any).cash ?? (b as any).amount ?? 0;
        cashByCurrency[ccy] = (cashByCurrency[ccy] ?? 0) + cash;
      }
    } catch (e) {
      this.logger.error(`Failed to fetch balance for ${accountId}: ${e}`);
    }

    const realTxns = doc.adjustedTransactions.filter((t) => !t.synthetic);

    const earliestTransferDate = this.findEarliestTransferDate(realTxns);

    const holdingsSnapshot: Array<{ symbol: string; quantity: number; averagePrice: number; currency: string }> = [];
    for (const pos of positions) {
      const symbol = this.extractSymbolStr(pos);
      if (!symbol) continue;
      const currentQty = ((pos as any).units ?? 0) + ((pos as any).fractional_units ?? 0);
      const avgPrice = (pos as any).average_purchase_price ?? 0;
      const posCurrency = this.extractCurrencyStr(pos, doc.currency);
      holdingsSnapshot.push({ symbol, quantity: currentQty, averagePrice: avgPrice, currency: posCurrency });
    }

    const equityState: Record<string, number> = {};
    for (const h of holdingsSnapshot) {
      equityState[h.symbol] = (equityState[h.symbol] ?? 0) + h.quantity;
    }

    let optionHoldings: Array<{ symbol: string; quantity: number; averagePrice?: number; currency?: string }> = [];
    try {
      optionHoldings = await this.fetchOptionHoldings(accountId, doc.userId.toString());
    } catch (e) {
      this.logger.warn(`Failed to fetch option holdings during rebuild for ${accountId}: ${e}`);
    }
    const optionState: Record<string, number> = {};
    for (const oh of optionHoldings) {
      if (oh.symbol && oh.quantity) optionState[oh.symbol] = (optionState[oh.symbol] ?? 0) + oh.quantity;
    }

    this.resolveMultilegChains(doc, realTxns, optionHoldings);

    const resolvedTxns = doc.adjustedTransactions.filter((t) => !t.synthetic);

    const addSides = ['buy', 'option_exercise', 'transfer_in'];
    const subSides = ['sell', 'option_assign', 'option_expire', 'transfer_out'];

    const OPTION_CONTRACT_MULTIPLIER = 100;

    const sorted = [...resolvedTxns].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

    for (const tx of sorted) {
      const q = tx.quantity ?? 0;
      const isOption = tx.option && tx.option.strike != null;
      const opt = tx.option;
      const underlying = opt?.underlyingSymbol ?? tx.instrumentSymbol ?? '';
      const callPut = (opt?.callPut ?? '').toLowerCase();
      const isPut = callPut.startsWith('p');
      const isCall = callPut.startsWith('c');

      if (isOption) {
        const optKey = this.txKey(tx);
        if (tx.side === 'option_assign') {
          // Assign closes a SHORT option position. Forward: option += q. Reverse: option -= q.
          if (optKey && q) optionState[optKey] = (optionState[optKey] ?? 0) - q;
          // Equity: short call assigned → deliver shares; short put assigned → receive shares.
          if (underlying && q) {
            const shareDelta = q * OPTION_CONTRACT_MULTIPLIER;
            equityState[underlying] = (equityState[underlying] ?? 0) + (isPut ? -shareDelta : shareDelta);
          }
        } else if (tx.side === 'option_exercise') {
          // Exercise closes a LONG option position. Forward: option -= q. Reverse: option += q.
          if (optKey && q) optionState[optKey] = (optionState[optKey] ?? 0) + q;
          // Equity: long call exercised → receive shares; long put exercised → deliver shares.
          if (underlying && q) {
            const shareDelta = q * OPTION_CONTRACT_MULTIPLIER;
            equityState[underlying] = (equityState[underlying] ?? 0) + (isCall ? -shareDelta : shareDelta);
          }
        } else if (tx.side === 'option_expire') {
          // Expire closes a SHORT option position. Forward: option += q. Reverse: option -= q.
          if (optKey && q) optionState[optKey] = (optionState[optKey] ?? 0) - q;
        } else {
          if (optKey && q) {
            if (addSides.includes(tx.side)) optionState[optKey] = (optionState[optKey] ?? 0) - q;
            else if (subSides.includes(tx.side)) optionState[optKey] = (optionState[optKey] ?? 0) + q;
          }
        }
      } else {
        const sym = typeof tx.instrumentSymbol === 'string' ? tx.instrumentSymbol : '';
        if (sym && q) {
          if (addSides.includes(tx.side)) equityState[sym] = (equityState[sym] ?? 0) - q;
          else if (subSides.includes(tx.side)) equityState[sym] = (equityState[sym] ?? 0) + q;
        }
      }
    }

    for (const [sym, qty] of Object.entries(equityState)) {
      if (Math.abs(qty) < 0.0001) continue;
      const synSide = qty > 0 ? 'buy' : 'sell';
      const holding = holdingsSnapshot.find((h) => h.symbol === sym);
      doc.adjustedTransactions.push({
        side: synSide,
        quantity: Math.abs(qty),
        price: holding?.averagePrice ?? 0,
        cashDelta: 0,
        currency: holding?.currency ?? doc.currency,
        timestamp: earliestTransferDate,
        instrumentSymbol: sym,
        option: null,
        synthetic: true,
        assetType: 'stock',
      } as any);
    }

    for (const [optKey, qty] of Object.entries(optionState)) {
      if (Math.abs(qty) < 0.0001) continue;
      const synSide = qty > 0 ? 'buy' : 'sell';
      const optHolding = optionHoldings.find((h) => h.symbol === optKey);
      const parsed = this.parseOptionKey(optKey);
      const optPrice = optHolding?.averagePrice ?? 0;
      const optCashDelta = synSide === 'buy' ? -(optPrice * Math.abs(qty) * 100) : (optPrice * Math.abs(qty) * 100);
      doc.adjustedTransactions.push({
        side: synSide,
        quantity: Math.abs(qty),
        price: optPrice,
        cashDelta: optCashDelta,
        currency: optHolding?.currency || 'USD',
        timestamp: earliestTransferDate,
        instrumentSymbol: parsed.underlying,
        option: parsed.option,
        synthetic: true,
        assetType: 'option',
      } as any);
    }

    doc.currentHoldings = holdingsSnapshot as any;
    doc.currentCashByCurrency = cashByCurrency;
    doc.rebuiltAt = new Date();

    doc.adjustedTransactions.sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));

    this.logger.log(
      `Rebuild complete for ${accountId}: ${positions.length} positions, cashByCurrency=${JSON.stringify(cashByCurrency)}, ` +
      `${doc.adjustedTransactions.filter((t) => t.synthetic).length} synthetic txns`,
    );
  }

  /* ── Strategy-level sync (two-step) ───────────── */

  async syncStrategy(strategyId: string, userId: string): Promise<{ synced: number }> {
    const strategy = await this.strategyModel.findOne({ _id: strategyId, userId }).lean().exec();
    if (!strategy) throw new NotFoundException('Strategy not found');
    if (strategy.mode !== 'synced') throw new BadRequestException('Strategy is not a synced strategy');
    if (!strategy.snaptradeConfig?.accountIds?.length) {
      throw new BadRequestException('No SnapTrade accounts configured for this strategy');
    }

    for (const accountId of strategy.snaptradeConfig.accountIds) {
      await this.syncAccount(accountId, userId);
    }

    const accounts = await this.syncedAccountModel
      .find({
        userId: new Types.ObjectId(userId),
        accountId: { $in: strategy.snaptradeConfig.accountIds },
      })
      .lean()
      .exec();

    let allAdjusted: Array<{ _id: string; [k: string]: any }> = [];
    for (const acct of accounts) {
      for (const tx of acct.adjustedTransactions) {
        allAdjusted.push({ ...tx, _id: (tx as any)._id?.toString() ?? '' });
      }
    }

    const typeFilter = strategy.snaptradeConfig.transactionTypes;
    const assetTypeFilter = strategy.snaptradeConfig.assetTypes;
    const OPTION_SIDES = ['option_exercise', 'option_assign', 'option_expire', 'options_multileg'];
    const isOptionTx = (tx: any) => (tx.assetType ?? (tx.option ? 'option' : '')).toLowerCase() === 'option';
    const wantsOptions = assetTypeFilter?.some((a) => a.toLowerCase() === 'option');
    if (typeFilter && typeFilter.length > 0) {
      allAdjusted = allAdjusted.filter((tx) => {
        const side = (tx.side ?? '').toLowerCase();
        if (typeFilter.some((t) => t.toLowerCase() === side)) return true;
        if (typeFilter.some((t) => t.toLowerCase() === 'transfer') && (side === 'transfer_in' || side === 'transfer_out')) return true;
        if (OPTION_SIDES.includes(side) && isOptionTx(tx) && wantsOptions) return true;
        return false;
      });
    }

    const currencyFilter = strategy.snaptradeConfig.currencies;
    if (currencyFilter && currencyFilter.length > 0) {
      allAdjusted = allAdjusted.filter((tx) => {
        const ccy = (tx.currency ?? 'USD').toUpperCase();
        return currencyFilter.some((c) => c.toUpperCase() === ccy);
      });
    }

    if (assetTypeFilter && assetTypeFilter.length > 0) {
      allAdjusted = allAdjusted.filter((tx) => {
        const at = (tx.assetType ?? (tx.option ? 'option' : 'stock')).toLowerCase();
        return assetTypeFilter.some((a) => a.toLowerCase() === at);
      });
    }

    const optionStrategy = (strategy.snaptradeConfig?.optionStrategy ?? 'all') as string;
    if (optionStrategy === 'income_only' || optionStrategy === 'calls_puts') {
      const optionTxs = allAdjusted.filter((tx) => isOptionTx(tx));
      const incomeTxIds = this.filterToIncomeOptions(optionTxs);
      allAdjusted = allAdjusted.filter((tx) => {
        if (!isOptionTx(tx)) return true;
        const id = (tx as any)._id?.toString?.() ?? (tx as any)._id;
        const isIncome = id != null && incomeTxIds.has(String(id));
        return optionStrategy === 'income_only' ? isIncome : !isIncome;
      });
    }

    const existingAcctTxIds = new Set(
      (
        await this.txModel
          .find({ strategyId, accountTransactionId: { $exists: true, $ne: null } })
          .select('accountTransactionId')
          .lean()
          .exec()
      ).map((t) => t.accountTransactionId),
    );

    let synced = 0;
    for (const tx of allAdjusted) {
      const txId = tx._id;
      if (!txId || existingAcctTxIds.has(txId)) continue;

      await this.txModel.create({
        strategyId,
        side: tx.side,
        quantity: tx.quantity ?? 0,
        price: tx.price ?? 0,
        cashDelta: tx.cashDelta ?? 0,
        currency: tx.currency ?? '',
        timestamp: tx.timestamp ?? new Date().toISOString(),
        instrumentSymbol: tx.instrumentSymbol ?? '',
        customData: (tx as any).chainResolved ? { chainResolved: true } : {},
        option: tx.option ?? null,
        source: 'snaptrade',
        accountTransactionId: txId,
        readonly: true,
      });
      synced++;
    }

    if (synced > 0) {
      await this.strategyModel.updateOne(
        { _id: strategyId },
        { $inc: { transactionsVersion: 1 }, $set: { lastSyncedAt: new Date() } },
      );
    } else {
      await this.strategyModel.updateOne(
        { _id: strategyId },
        { $set: { lastSyncedAt: new Date() } },
      );
    }

    return { synced };
  }

  /* ── Helpers ──────────────────────────────────── */

  /** Returns Set of tx _id for option txs that are covered call or secured put (income strategies). */
  private filterToIncomeOptions(optionTxs: Array<{ _id?: string; side?: string; option?: any; instrumentSymbol?: string; quantity?: number; customData?: any }>): Set<string> {
    const optKey = (tx: any) => {
      const opt = tx.option;
      if (!opt?.expiration) return null;
      const sym = tx.instrumentSymbol ?? '';
      const exp = (opt.expiration ?? '').slice(0, 10);
      const strike = opt.strike ?? 0;
      const cp = ((opt.callPut ?? 'call') + '').toLowerCase();
      return cp === 'call' || cp === 'put' ? `${sym}|${exp}|${strike}|${cp}` : null;
    };
    const positions: Record<string, number> = {};
    const OPTION_CLOSE_SIDES = ['buy_to_cover', 'buy', 'option_assign', 'option_expire'];
    const keepIds = new Set<string>();
    const sorted = [...optionTxs].sort((a, b) => ((a as any).timestamp ?? '').localeCompare((b as any).timestamp ?? ''));
    for (const tx of sorted) {
      const id = (tx as any)._id?.toString();
      const side = (String((tx as any).side ?? '')).toLowerCase();
      const qty = Math.abs(Number(tx.quantity ?? 0));
      const k = optKey(tx);
      if (!k) continue;
      if (side === 'buy' && (tx.customData ?? (tx as any).customData)?.chainResolved) continue;
      if (side === 'sell') {
        positions[k] = (positions[k] ?? 0) + qty;
        if (id) keepIds.add(id);
      } else if (OPTION_CLOSE_SIDES.includes(side) && k in positions && positions[k] > 0) {
        positions[k] -= qty;
        if (positions[k] <= 0) delete positions[k];
        if (id) keepIds.add(id);
      } else if (side === 'options_multileg') {
        if (id) keepIds.add(id);
      }
    }
    return keepIds;
  }

  private async fetchAllActivities(
    accountId: string,
    creds: { userId: string; userSecret: string },
  ): Promise<any[]> {
    const activities: any[] = [];
    const limit = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const resp = await this.snaptrade.accountInformation.getAccountActivities({
        accountId,
        userId: creds.userId,
        userSecret: creds.userSecret,
        limit,
        offset,
      });
      const page = resp.data?.data ?? [];
      activities.push(...page);
      hasMore = page.length >= limit;
      offset += limit;
    }

    return activities;
  }

  private deriveAssetType(activity: any): string {
    const optionObj = (activity as any).option_symbol;
    if (optionObj) return 'option';
    const sym = (activity as any).symbol;
    const typeCode = (sym?.type?.code ?? sym?.type ?? '').toString().toLowerCase();
    if (typeCode === 'et' || typeCode === 'etf') return 'etf';
    return 'stock';
  }

  private mapActivity(activity: any): {
    side: string;
    quantity: number;
    price: number;
    cashDelta: number;
    currency: string;
    timestamp: string;
    instrumentSymbol: string;
    option: any;
    assetType: string;
  } {
    const rawType = ((activity as any).type ?? '').toUpperCase();
    const side = ACTIVITY_TYPE_MAP[rawType] ?? (rawType ? rawType.toLowerCase() : 'adjustment');

    const optionObj = (activity as any).option_symbol;

    let instrumentSymbol = this.extractSymbolStr(activity);
    if (!instrumentSymbol && optionObj?.underlying_symbol) {
      instrumentSymbol = this.extractSymbolStr({ symbol: optionObj.underlying_symbol });
    }

    const currency = this.extractCurrencyStr(activity, '');

    let option = null;
    if (optionObj) {
      option = {
        expiration: optionObj.expiration_date ?? '',
        strike: optionObj.strike_price ?? 0,
        callPut: (optionObj.option_type ?? '').toLowerCase(),
        underlyingSymbol: this.extractSymbolStr({ symbol: optionObj.underlying_symbol }),
      };
    }

    const assetType = this.deriveAssetType(activity);

    let cashDelta = (activity as any).amount ?? 0;
    if (side === 'interest') {
      cashDelta = -Math.abs(cashDelta);
    }

    return {
      side,
      quantity: Math.abs((activity as any).units ?? 0),
      price: (activity as any).price ?? 0,
      cashDelta,
      currency,
      timestamp: (activity as any).trade_date ?? new Date().toISOString(),
      instrumentSymbol,
      option,
      assetType,
    };
  }

  private findEarliestTransferDate(txns: Array<{ side: string; timestamp: string }>): string {
    let earliest = '';
    for (const tx of txns) {
      if (tx.side === 'deposit' || tx.side === 'transfer' || tx.side === 'transfer_in' || tx.side === 'transfer_out') {
        if (!earliest || tx.timestamp < earliest) {
          earliest = tx.timestamp;
        }
      }
    }
    if (!earliest) {
      for (const tx of txns) {
        if (!earliest || tx.timestamp < earliest) {
          earliest = tx.timestamp;
        }
      }
    }
    return earliest || new Date().toISOString();
  }

  private extractSymbolStr(pos: any): string {
    let val = pos?.symbol;
    for (let depth = 0; depth < 4 && val != null && typeof val === 'object'; depth++) {
      if (typeof val.symbol === 'string') return val.symbol;
      if (typeof val.raw_symbol === 'string') return val.raw_symbol;
      val = val.symbol;
    }
    return typeof val === 'string' ? val : '';
  }

  private extractCurrencyStr(pos: any, fallback: string): string {
    const cur = pos?.currency;
    if (typeof cur === 'string') return cur;
    if (cur && typeof cur === 'object' && cur.code) return String(cur.code);
    const symCur = pos?.symbol?.currency;
    if (symCur && typeof symCur === 'object' && symCur.code) return String(symCur.code);
    return fallback;
  }

  private async findAccountInfo(userId: string, accountId: string) {
    const connections = await this.connModel.find({ userId: new Types.ObjectId(userId) }).lean().exec();
    for (const conn of connections) {
      for (const acct of conn.accounts) {
        if (acct.accountId === accountId) {
          return {
            authorizationId: conn.authorizationId,
            institutionName: acct.institutionName ?? conn.institutionName ?? '',
            currency: acct.currency ?? '',
          };
        }
      }
    }
    return null;
  }
}
