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

  /* ── Account-level sync ──────────────────────── */

  async getAccountTransactions(accountId: string, userId: string) {
    const doc = await this.syncedAccountModel
      .findOne({ userId: new Types.ObjectId(userId), accountId })
      .lean()
      .exec();
    if (!doc) {
      return {
        transactions: [] as any[],
        rawHoldings: null,
      };
    }

    const cashByCurrency =
      doc.currentCashByCurrency && Object.keys(doc.currentCashByCurrency).length > 0
        ? doc.currentCashByCurrency
        : doc.currentCash != null
          ? { [doc.currency || 'USD']: doc.currentCash }
          : {};

    const rawHoldings = {
      positions: (doc.currentHoldings ?? []).map((h: any) => ({
        symbol: h.symbol,
        quantity: h.quantity ?? 0,
        averagePrice: h.averagePrice ?? 0,
        currency: h.currency ?? '',
        category: h.category ?? 'stock_etf',
        isOption: !['stock', 'etf', 'stock_etf'].includes(h.category ?? 'stock_etf'),
      })),
      cashByCurrency,
    };

    return {
      transactions: doc.transactions ?? [],
      rawHoldings,
    };
  }

  /** Aggregated holdings from all accounts in a synced strategy. For canvas/subview views. */
  async getStrategyHoldings(strategyId: string, userId: string) {
    const strategy = await this.strategyModel
      .findOne({ _id: strategyId, userId })
      .lean()
      .exec();
    if (!strategy) throw new NotFoundException('Strategy not found');
    if (strategy.mode !== 'synced' || !strategy.snaptradeConfig?.accountIds?.length) {
      return { holdings: [] };
    }

    const accounts = await this.syncedAccountModel
      .find({
        userId: new Types.ObjectId(userId),
        accountId: { $in: strategy.snaptradeConfig.accountIds },
      })
      .lean()
      .exec();

    const currencyFilter = (strategy.snaptradeConfig?.currencies ?? []).map((c: string) => c.toUpperCase());
    const passesCurrency = (ccy: string) => {
      const up = (ccy || 'USD').toUpperCase();
      return currencyFilter.length === 0 || currencyFilter.includes(up);
    };

    const bySymbol = new Map<string, { symbol: string; quantity: number; costTotal: number; currency: string; category: string }>();
    for (const acct of accounts) {
      for (const h of acct.currentHoldings ?? []) {
        const sym = (h as any).symbol;
        if (!sym) continue;
        const ccy = (h as any).currency ?? '';
        if (!passesCurrency(ccy)) continue;
        const qty = (h as any).quantity ?? 0;
        const avgPrice = (h as any).averagePrice ?? 0;
        const cat = (h as any).category ?? 'stock_etf';
        const isOption = !['stock', 'etf', 'stock_etf'].includes(cat);
        const mult = isOption ? 100 : 1;
        const costTotal = qty * avgPrice * mult;

        const existing = bySymbol.get(sym);
        if (existing) {
          existing.quantity += qty;
          existing.costTotal += costTotal;
        } else {
          bySymbol.set(sym, { symbol: sym, quantity: qty, costTotal, currency: ccy, category: cat });
        }
      }
    }

    const holdings = Array.from(bySymbol.values()).map((h) => {
      const isOpt = !['stock', 'etf', 'stock_etf'].includes(h.category);
      const mult = isOpt ? 100 : 1;
      const avgPrice = h.quantity !== 0 ? h.costTotal / (h.quantity * mult) : 0;
      return { symbol: h.symbol, quantity: h.quantity, averagePrice: avgPrice, currency: h.currency, category: h.category };
    });
    holdings.sort((a, b) => a.symbol.localeCompare(b.symbol));
    return { holdings };
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

  private async fetchOrders(
    accountId: string,
    creds: { userId: string; userSecret: string },
    days = 365,
  ): Promise<any[]> {
    try {
      const resp = await this.snaptrade.accountInformation.getUserAccountOrders({
        accountId,
        userId: creds.userId,
        userSecret: creds.userSecret,
        state: 'all',
        days,
      });
      return resp.data ?? [];
    } catch (e) {
      this.logger.warn(`Failed to fetch orders for ${accountId}: ${e}`);
      return [];
    }
  }

  private async fetchActivities(
    accountId: string,
    creds: { userId: string; userSecret: string },
    options?: { startDate?: string; endDate?: string },
  ): Promise<any[]> {
    const all: any[] = [];
    const limit = 1000;
    let offset = 0;

    while (true) {
      const resp = await this.snaptrade.accountInformation.getAccountActivities({
        accountId,
        userId: creds.userId,
        userSecret: creds.userSecret,
        limit,
        offset,
        ...(options?.startDate && { startDate: options.startDate }),
        ...(options?.endDate && { endDate: options.endDate }),
      });
      const body = resp.data as { data?: any[]; pagination?: { total?: number } } | undefined;
      const page = body?.data ?? [];
      const total = body?.pagination?.total;

      all.push(...page);
      if (page.length < limit) break;
      if (total != null && offset + page.length >= total) break;
      offset += limit;
    }

    return all;
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

  private buildOptionLegFromOption(opt: any, underlyingSymbol: string): { expiration: string; strike: number; callPut: string; underlyingSymbol: string } | null {
    if (!opt || opt.strike == null || !opt.callPut) return null;
    return {
      expiration: (opt.expiration ?? '').slice(0, 10),
      strike: opt.strike ?? 0,
      callPut: (opt.callPut ?? '').toLowerCase(),
      underlyingSymbol,
    };
  }

  private matchRollsToOrders(
    txns: any[],
    orders: any[],
  ): void {
    for (const tx of txns) {
      if (tx.side !== 'options_multileg' || !tx.option) continue;
      const closeLeg = this.buildOptionLegFromOption(
        tx.option,
        tx.option?.underlyingSymbol ?? tx.instrumentSymbol ?? '',
      );
      if (!closeLeg) continue;

      const ts = (tx.timestamp ?? '').slice(0, 10);
      const underlying = closeLeg.underlyingSymbol;
      const callPut = closeLeg.callPut?.charAt(0)?.toUpperCase();

      for (const ord of orders) {
        const ordDate = ((ord as any).time_executed ?? (ord as any).time_placed ?? '').slice(0, 10);
        if (ordDate !== ts) continue;
        const optSym = (ord as any).option_symbol;
        if (!optSym) continue;
        const ordUnd = typeof optSym.underlying_symbol === 'string'
          ? optSym.underlying_symbol
          : optSym.underlying_symbol?.symbol ?? optSym.underlying_symbol?.raw_symbol ?? '';
        const ordCP = (optSym.option_type ?? '').charAt(0).toUpperCase();
        if (ordUnd !== underlying || ordCP !== callPut) continue;

        const ordExp = (optSym.expiration_date ?? '').slice(0, 10);
        const ordStrike = optSym.strike_price ?? 0;
        if (ordExp === closeLeg.expiration && ordStrike === closeLeg.strike) continue;

        const openLeg = this.buildOptionLegFromOption(
          {
            expiration: ordExp,
            strike: ordStrike,
            callPut: optSym.option_type ?? '',
            underlyingSymbol: ordUnd,
          },
          ordUnd,
        );
        if (openLeg) {
          tx.customData = tx.customData ?? {};
          tx.customData.closeLeg = closeLeg;
          tx.customData.openLeg = openLeg;
        }
        break;
      }
      if (!tx.customData?.closeLeg) {
        tx.customData = tx.customData ?? {};
        tx.customData.closeLeg = closeLeg;
      }
    }
  }

  private buildOptionChains(txns: any[]): void {
    const sorted = [...txns].sort((a, b) => (a.timestamp ?? '').localeCompare(b.timestamp ?? ''));
    const optionTxns = sorted.filter((t) => (t.assetType ?? '') === 'option' || t.option);
    const processed = new Set<any>();

    for (const tx of optionTxns) {
      if (processed.has(tx)) continue;
      const underlying = tx.option?.underlyingSymbol ?? tx.instrumentSymbol ?? '';
      const callPut = (tx.option?.callPut ?? '').charAt(0).toUpperCase();
      if (!underlying || !callPut) continue;

      const chain: any[] = [];
      let currentKey = this.txKey(tx);

      for (const t of optionTxns) {
        if (processed.has(t)) continue;
        const tUnd = t.option?.underlyingSymbol ?? t.instrumentSymbol ?? '';
        const tCP = (t.option?.callPut ?? '').charAt(0).toUpperCase();
        if (tUnd !== underlying || tCP !== callPut) continue;

        if (t.side === 'options_multileg') {
          if (this.txKey(t) === currentKey || chain.length === 0) {
            chain.push(t);
            processed.add(t);
            currentKey = (t.customData?.openLeg
              ? `${(t.customData.openLeg as any).underlyingSymbol} $${(t.customData.openLeg as any).strike} ${((t.customData.openLeg as any).callPut ?? '').charAt(0).toUpperCase()} ${(t.customData.openLeg as any).expiration}`
              : currentKey);
          }
        } else if (t.side === 'sell' || t.side === 'buy') {
          const k = this.txKey(t);
          if (chain.length === 0 || k === currentKey) {
            chain.push(t);
            processed.add(t);
            if (t.side === 'sell') currentKey = k;
            else if (t.side === 'buy') currentKey = '';
          }
        } else if (['option_assign', 'option_exercise', 'option_expire'].includes(t.side)) {
          const k = this.txKey(t);
          if (k === currentKey || chain.length > 0) {
            chain.push(t);
            processed.add(t);
            currentKey = '';
          }
        }
      }

      if (chain.length === 0) continue;

      chain.sort((a, b) => (a.timestamp ?? '').localeCompare(b.timestamp ?? ''));
      const origin = chain[0];
      const originSide = (origin.side ?? '').toLowerCase();
      const originCallPut = (origin.option?.callPut ?? '').toLowerCase();
      let chainType: 'call' | 'covered_call' | 'put' | 'secured_put' = 'call';
      if (originCallPut.startsWith('p')) {
        chainType = originSide === 'sell' ? 'secured_put' : 'put';
      } else {
        chainType = originSide === 'sell' ? 'covered_call' : 'call';
      }

      const chainId = new Types.ObjectId().toString();
      for (const t of chain) {
        t.customData = t.customData ?? {};
        t.customData.chainId = chainId;

        if ((t.assetType ?? '') !== 'option' && !t.option) {
          continue;
        } else if (t.side === 'options_multileg') {
          t.category = `${chainType}_roll`;
        } else if (t.side === 'sell' || t.side === 'buy') {
          const isOpen = (t.side === 'sell' && chainType.startsWith('covered')) || (t.side === 'sell' && chainType.startsWith('secured')) || (t.side === 'buy' && (chainType === 'call' || chainType === 'put'));
          t.category = isOpen ? `${chainType}_open` : `${chainType}_close`;
        } else if (['option_assign', 'option_exercise', 'option_expire'].includes(t.side)) {
          t.category = `${chainType}_close`;
        }
      }
    }

    const transferSides = [
      'deposit', 'withdrawal', 'interest', 'dividend', 'refund',
      'transfer', 'transfer_in', 'transfer_out', 'fee', 'tax', 'split', 'adjustment',
    ];
    const stockEtfSides = ['buy', 'sell', 'short', 'buy_to_cover'];

    for (const tx of txns) {
      const side = (tx.side ?? '').toLowerCase();
      const at = (tx.assetType ?? 'stock').toLowerCase();

      if (transferSides.includes(side)) {
        tx.category = 'transfer';
        continue;
      }
      if (!tx.category) {
        if (at === 'stock' || at === 'etf') {
          tx.category = stockEtfSides.includes(side) ? 'stock_etf' : 'transfer';
        } else if (at === 'option' || tx.option) {
          tx.category = 'unknown';
        } else {
          tx.category = 'transfer';
        }
      }
    }
  }

  private async buildCurrentHoldingsWithCategory(
    accountId: string,
    userId: string,
    currency: string,
  ): Promise<Array<{ symbol: string; quantity: number; averagePrice: number; currency: string; category: string }>> {
    const holdings: Array<{ symbol: string; quantity: number; averagePrice: number; currency: string; category: string }> = [];
    const creds = await this.getSnapCreds(userId);

    const positions: any[] = [];
    try {
      const posResp = await this.snaptrade.accountInformation.getUserAccountPositions({
        accountId,
        userId: creds.userId,
        userSecret: creds.userSecret,
      });
      positions.push(...(posResp.data ?? []));
    } catch (e) {
      this.logger.warn(`Failed to fetch positions for ${accountId}: ${e}`);
    }

    for (const pos of positions) {
      const symbol = this.extractSymbolStr(pos);
      if (!symbol) continue;
      const qty = ((pos as any).units ?? 0) + ((pos as any).fractional_units ?? 0);
      const avgPrice = (pos as any).average_purchase_price ?? 0;
      const posCurrency = this.extractCurrencyStr(pos, currency);
      const typeCode = ((pos as any).symbol?.type?.code ?? (pos as any).symbol?.type ?? '').toString().toLowerCase();
      const category = typeCode === 'et' || typeCode === 'etf' ? 'stock_etf' : 'stock_etf';
      holdings.push({ symbol, quantity: qty, averagePrice: avgPrice, currency: posCurrency, category });
    }

    const optionHoldings = await this.fetchOptionHoldings(accountId, userId);
    for (const oh of optionHoldings) {
      const callPut = (oh.symbol?.match(/\s([CP])\s/) ?? [])[1] ?? '';
      const isCall = callPut.toUpperCase() === 'C';
      const qty = oh.quantity ?? 0;
      const category = qty > 0
        ? (isCall ? 'call' : 'put')
        : (isCall ? 'covered_call' : 'secured_put');
      holdings.push({
        symbol: oh.symbol,
        quantity: oh.quantity,
        averagePrice: oh.averagePrice ?? 0,
        currency: oh.currency ?? 'USD',
        category,
      });
    }

    return holdings.sort((a, b) => a.symbol.localeCompare(b.symbol));
  }

  async syncAccount(
    accountId: string,
    userId: string,
    fullResync = false,
  ): Promise<{ synced: number; syncedTransactions?: boolean }> {
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
        lastSyncedAt: null,
        currentHoldings: [],
        currentCash: 0,
        currentCashByCurrency: {},
        transactions: [],
        transactionsSyncStartDate: null,
      });
    }

    if (doc.authorizationId) {
      try {
        await this.snaptrade.connections.refreshBrokerageAuthorization({
          authorizationId: doc.authorizationId,
          userId: creds.userId,
          userSecret: creds.userSecret,
        });
        await new Promise((r) => setTimeout(r, 3000));
      } catch (e) {
        this.logger.warn(`Failed to refresh brokerage before sync: ${e}`);
      }
    }

    /* ── 1. Always sync holdings and balance first ── */
    const holdings = await this.buildCurrentHoldingsWithCategory(accountId, userId, doc.currency);
    doc.currentHoldings = holdings as any;
    const cashByCurrency: Record<string, number> = {};
    try {
      const balResp = await this.snaptrade.accountInformation.getUserAccountBalance({
        accountId,
        userId: creds.userId,
        userSecret: creds.userSecret,
      });
      for (const b of balResp.data ?? []) {
        const ccy = (b as any).currency?.code ?? (b as any).currency ?? 'USD';
        cashByCurrency[ccy] = (b as any).cash ?? (b as any).amount ?? 0;
      }
    } catch (e) {
      this.logger.warn(`Failed to fetch balance for ${accountId}: ${e}`);
    }
    doc.currentCashByCurrency = cashByCurrency;

    /* ── 2. Sync transactions (initial or incremental) ── */
    if (fullResync) {
      const strategiesWithAccount = await this.strategyModel
        .find({
          userId: userObjId,
          mode: 'synced',
          'snaptradeConfig.accountIds': accountId,
        })
        .select('_id')
        .lean()
        .exec();
      for (const s of strategiesWithAccount) {
        await this.txModel.deleteMany({
          strategyId: String(s._id),
          source: 'snaptrade',
        });
        await this.strategyModel.updateOne(
          { _id: s._id },
          { $inc: { transactionsVersion: 1 } },
        );
      }
      doc.lastSyncedAt = null;
      doc.transactions = [];
      doc.transactionsSyncStartDate = null;
      await doc.save();
    }
    const hasPreviousSync = doc.lastSyncedAt != null;
    const boundaryDate = hasPreviousSync
      ? this.subtractOneDay(doc.lastSyncedAt!.toISOString().slice(0, 10))
      : null;
    const isInitialSync =
      fullResync ||
      !hasPreviousSync ||
      boundaryDate == null ||
      (doc.transactions?.length ?? 0) === 0;

    let syncedTransactions = false;

    if (isInitialSync) {
      const orders = await this.fetchOrders(accountId, creds, 365);
      const activities = await this.fetchActivities(accountId, creds);
      const transactions = this.activitiesToTransactions(activities);
      this.matchRollsToOrders(transactions, orders);
      this.buildOptionChains(transactions);

      doc.transactions = transactions as any;
      let earliestTs: string | null = null;
      for (const t of transactions) {
        const ts = (t as any).timestamp;
        if (ts && (!earliestTs || ts < earliestTs)) earliestTs = ts;
      }
      doc.transactionsSyncStartDate = earliestTs ? new Date(earliestTs.slice(0, 10)) : null;
      syncedTransactions = true;
      this.logger.log(`syncAccount ${accountId}: initial sync, ${transactions.length} activities`);
    } else {
      const startDate = boundaryDate;
      const endDate = new Date().toISOString().slice(0, 10);
      const days = Math.min(365, Math.ceil((Date.parse(endDate) - Date.parse(startDate)) / 86400000) + 1);
      const orders = await this.fetchOrders(accountId, creds, Math.max(30, days));
      const activities = await this.fetchActivities(accountId, creds, { startDate, endDate });

      const existingIds = new Set(
        (doc.transactions ?? []).map((t: any) => t.snaptradeActivityId).filter(Boolean),
      );
      const newActivities = activities.filter((a: any) => a.id && !existingIds.has(String(a.id)));

      if (newActivities.length === 0) {
        this.logger.log(`syncAccount ${accountId}: incremental, no new activities`);
        this.buildOptionChains(doc.transactions ?? []);
      } else {
        const newTransactions = this.activitiesToTransactions(newActivities);
        this.matchRollsToOrders(newTransactions, orders);

        const merged = [...(doc.transactions ?? []), ...newTransactions];
        merged.sort((a, b) => (a.timestamp ?? '').localeCompare(b.timestamp ?? ''));
        const bySnapId = new Map<string, any>();
        for (const t of merged) {
          const sid = (t as any).snaptradeActivityId;
          if (sid) bySnapId.set(String(sid), t);
        }
        const finalMerged = Array.from(bySnapId.values()).sort((a, b) =>
          (a.timestamp ?? '').localeCompare(b.timestamp ?? ''),
        );
        this.buildOptionChains(finalMerged);
        doc.transactions = finalMerged as any;

        const prevStart = doc.transactionsSyncStartDate?.toISOString().slice(0, 10);
        const newStart = prevStart && startDate < prevStart ? startDate : prevStart ?? startDate;
        doc.transactionsSyncStartDate = new Date(newStart);
        syncedTransactions = true;
        this.logger.log(`syncAccount ${accountId}: incremental, +${newTransactions.length} new (total ${doc.transactions.length})`);
      }
    }

    doc.lastSyncedAt = new Date();
    await doc.save();

    return { synced: doc.transactions?.length ?? 0, syncedTransactions };
  }

  private subtractOneDay(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  private activitiesToTransactions(activities: any[]): any[] {
    const transactions: any[] = [];
    const seen = new Set<string>();
    for (const activity of activities) {
      const activityId = (activity as any).id;
      if (!activityId || seen.has(String(activityId))) continue;
      seen.add(String(activityId));
      const mapped = this.mapActivity(activity);
      transactions.push({
        ...mapped,
        snaptradeActivityId: activityId,
        customData: {} as Record<string, unknown>,
      });
    }
    return transactions;
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

    let allTransactions: Array<{ _id: string; [k: string]: any }> = [];
    for (const acct of accounts) {
      for (const tx of acct.transactions ?? []) {
        allTransactions.push({ ...tx, _id: (tx as any)._id?.toString() ?? '' });
      }
    }

    const typeFilter = strategy.snaptradeConfig.transactionTypes;
    const assetTypeFilter = strategy.snaptradeConfig.assetTypes;
    const OPTION_SIDES = ['option_exercise', 'option_assign', 'option_expire', 'options_multileg'];
    const isOptionTx = (tx: any) => (tx.assetType ?? (tx.option ? 'option' : '')).toLowerCase() === 'option';
    const wantsOptions = assetTypeFilter?.some((a) => a.toLowerCase() === 'option');
    if (typeFilter && typeFilter.length > 0) {
      allTransactions = allTransactions.filter((tx) => {
        const side = (tx.side ?? '').toLowerCase();
        if (typeFilter.some((t) => t.toLowerCase() === side)) return true;
        if (typeFilter.some((t) => t.toLowerCase() === 'transfer') && (side === 'transfer_in' || side === 'transfer_out')) return true;
        if (OPTION_SIDES.includes(side) && isOptionTx(tx) && wantsOptions) return true;
        return false;
      });
    }

    const currencyFilter = strategy.snaptradeConfig.currencies;
    if (currencyFilter && currencyFilter.length > 0) {
      allTransactions = allTransactions.filter((tx) => {
        const ccy = (tx.currency ?? 'USD').toUpperCase();
        return currencyFilter.some((c) => c.toUpperCase() === ccy);
      });
    }

    if (assetTypeFilter && assetTypeFilter.length > 0) {
      allTransactions = allTransactions.filter((tx) => {
        const at = (tx.assetType ?? (tx.option ? 'option' : 'stock')).toLowerCase();
        return assetTypeFilter.some((a) => {
          const ai = a.toLowerCase();
          if (ai === 'stock_etf') return at === 'stock' || at === 'etf' || at === 'stock_etf';
          return at === ai;
        });
      });
    }

    const optionStrategy = (strategy.snaptradeConfig?.optionStrategy ?? 'all') as string;
    if (optionStrategy === 'income_only' || optionStrategy === 'calls_puts') {
      const optionTxs = allTransactions.filter((tx) => isOptionTx(tx));
      const incomeTxIds = this.filterToIncomeOptions(optionTxs);
      allTransactions = allTransactions.filter((tx) => {
        if (!isOptionTx(tx)) return true;
        const id = (tx as any)._id?.toString?.() ?? (tx as any)._id;
        const isIncome = id != null && incomeTxIds.has(String(id));
        return optionStrategy === 'income_only' ? isIncome : !isIncome;
      });
    }

    const existingRaw = await this.txModel
      .find({ strategyId, accountTransactionId: { $exists: true, $ne: null } })
      .select('accountTransactionId')
      .lean()
      .exec();
    const existingAcctTxIds = new Set(
      existingRaw.map((t) => (t.accountTransactionId != null ? String(t.accountTransactionId) : '')),
    );

    let synced = 0;
    for (const tx of allTransactions) {
      const txId = tx._id;
      if (!txId || existingAcctTxIds.has(txId)) continue;

      const customData: Record<string, unknown> = {};
      if (tx.customData?.chainId) customData.chainId = tx.customData.chainId;
      if (tx.customData?.closeLeg) customData.closeLeg = tx.customData.closeLeg;
      if (tx.customData?.openLeg) customData.openLeg = tx.customData.openLeg;

      await this.txModel.create({
        strategyId,
        side: tx.side,
        quantity: tx.quantity ?? 0,
        price: tx.price ?? 0,
        cashDelta: tx.cashDelta ?? 0,
        currency: tx.currency ?? '',
        timestamp: tx.timestamp ?? new Date().toISOString(),
        instrumentSymbol: tx.instrumentSymbol ?? '',
        customData,
        option: tx.option ?? null,
        source: 'snaptrade',
        accountTransactionId: txId,
        readonly: true,
      });
      synced++;
    }

    const updateSet: Record<string, unknown> = { lastSyncedAt: new Date() };

    /* ── 3. Update strategy balance from account when balanceAccountId set ── */
    const balanceAccountId = strategy.snaptradeConfig?.balanceAccountId;
    if (balanceAccountId) {
      const balAcct = accounts.find((a: any) => a.accountId === balanceAccountId);
      const cashByCurrency = (balAcct as any)?.currentCashByCurrency ?? {};
      const currencyFilter = strategy.snaptradeConfig?.currencies ?? [];
      const targetCcy =
        currencyFilter.length > 0
          ? currencyFilter[0].toUpperCase()
          : (strategy.baseCurrency ?? 'USD').toUpperCase();
      const rawBalance = cashByCurrency[targetCcy] ?? cashByCurrency[targetCcy.toLowerCase()] ?? 0;

      if (rawBalance >= 0) {
        updateSet.syncedAccountBalance = rawBalance;
        updateSet.syncedAccountLoanAmount = 0;
      } else {
        updateSet.syncedAccountBalance = 0;
        updateSet.syncedAccountLoanAmount = Math.abs(rawBalance);
      }
    }

    const updateOp: any = {
      $set: updateSet,
      ...(synced > 0 && { $inc: { transactionsVersion: 1 } }),
    };
    if (!balanceAccountId) {
      updateOp.$unset = { syncedAccountBalance: '', syncedAccountLoanAmount: '' };
    }
    await this.strategyModel.updateOne({ _id: strategyId }, updateOp);

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
