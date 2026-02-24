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
  TRANSFER: 'transfer',
  EXTERNAL_ASSET_TRANSFER_IN: 'transfer',
  EXTERNAL_ASSET_TRANSFER_OUT: 'transfer',
  SPLIT: 'split',
  ADJUSTMENT: 'adjustment',
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
    if (!doc) return [];
    return doc.adjustedTransactions;
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
        adjustedTransactions: [],
      });
    }

    const oldTxIds = doc.adjustedTransactions.map((t) => (t as any)._id?.toString()).filter(Boolean);

    doc.adjustedTransactions = [] as any;
    doc.rebuiltAt = null;
    doc.currentHoldings = [] as any;
    doc.currentCash = 0;

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
      await this.rebuildAccount(doc, creds, accountId);
    }

    doc.lastSyncedAt = new Date();
    await doc.save();

    this.logger.log(`syncAccount ${accountId}: ${added} new activities, rebuilt=${!!doc.rebuiltAt}`);
    return { added };
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

    let cashBalance = 0;
    try {
      const balResp = await this.snaptrade.accountInformation.getUserAccountBalance({
        accountId,
        userId: creds.userId,
        userSecret: creds.userSecret,
      });
      const balances = balResp.data ?? [];
      for (const b of balances) {
        cashBalance += (b as any).cash ?? (b as any).amount ?? 0;
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

      let totalBought = 0;
      let totalSold = 0;
      let knownBuyCost = 0;

      for (const tx of realTxns) {
        if (tx.instrumentSymbol !== symbol) continue;
        if (tx.side === 'buy') {
          totalBought += tx.quantity;
          knownBuyCost += tx.quantity * tx.price;
        } else if (tx.side === 'sell') {
          totalSold += tx.quantity;
        }
      }

      const netFromTxns = totalBought - totalSold;
      const impliedInitial = currentQty - netFromTxns;

      if (Math.abs(impliedInitial) < 0.0001) continue;

      let syntheticPrice = avgPrice;
      if (impliedInitial > 0 && currentQty > 0) {
        const totalCost = avgPrice * currentQty;
        const computed = (totalCost - knownBuyCost) / impliedInitial;
        syntheticPrice = Math.max(computed, 0);
      }

      const syntheticSide = impliedInitial > 0 ? 'buy' : 'sell';

      doc.adjustedTransactions.push({
        side: syntheticSide,
        quantity: Math.abs(impliedInitial),
        price: syntheticPrice,
        cashDelta: 0,
        currency: posCurrency,
        timestamp: earliestTransferDate,
        instrumentSymbol: symbol,
        option: null,
        synthetic: true,
      } as any);
    }

    const impliedCash = doc.adjustedTransactions.reduce((sum, t) => sum + (t.cashDelta ?? 0), 0);
    const cashGap = cashBalance - impliedCash;

    if (Math.abs(cashGap) > 0.01) {
      const cashSide = cashGap > 0 ? 'deposit' : 'withdrawal';
      doc.adjustedTransactions.push({
        side: cashSide,
        quantity: 0,
        price: 0,
        cashDelta: cashGap,
        currency: doc.currency,
        timestamp: earliestTransferDate,
        instrumentSymbol: '',
        option: null,
        synthetic: true,
      } as any);
    }

    doc.currentHoldings = holdingsSnapshot as any;
    doc.currentCash = cashBalance;
    doc.rebuiltAt = new Date();

    this.logger.log(
      `Rebuild complete for ${accountId}: ${positions.length} positions, cash=${cashBalance}, ` +
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
    if (typeFilter && typeFilter.length > 0) {
      allAdjusted = allAdjusted.filter((tx) => typeFilter.includes(tx.side));
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
        customData: {},
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

  private mapActivity(activity: any): {
    side: string;
    quantity: number;
    price: number;
    cashDelta: number;
    currency: string;
    timestamp: string;
    instrumentSymbol: string;
    option: any;
  } {
    const rawType = ((activity as any).type ?? '').toUpperCase();
    const side = ACTIVITY_TYPE_MAP[rawType] ?? rawType.toLowerCase();

    const optionObj = (activity as any).option_symbol;
    const symbolObj = (activity as any).symbol;
    const instrumentSymbol =
      symbolObj?.symbol ??
      symbolObj?.raw_symbol ??
      optionObj?.underlying_symbol?.symbol ??
      optionObj?.underlying_symbol?.raw_symbol ??
      '';

    const currency = (activity as any).currency?.code ?? '';

    let option = null;
    if (optionObj) {
      option = {
        expiration: optionObj.expiration_date ?? '',
        strike: optionObj.strike_price ?? 0,
        callPut: (optionObj.option_type ?? '').toLowerCase(),
        underlyingSymbol: optionObj.underlying_symbol?.symbol,
      };
    }

    return {
      side,
      quantity: Math.abs((activity as any).units ?? 0),
      price: (activity as any).price ?? 0,
      cashDelta: (activity as any).amount ?? 0,
      currency,
      timestamp: (activity as any).trade_date ?? new Date().toISOString(),
      instrumentSymbol,
      option,
    };
  }

  private findEarliestTransferDate(txns: Array<{ side: string; timestamp: string }>): string {
    let earliest = '';
    for (const tx of txns) {
      if (tx.side === 'deposit' || tx.side === 'transfer') {
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
    const symField = pos?.symbol;
    if (typeof symField === 'string') return symField;
    if (symField && typeof symField === 'object') {
      const s = symField.symbol ?? symField.raw_symbol;
      return typeof s === 'string' ? s : String(s ?? '');
    }
    return '';
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
