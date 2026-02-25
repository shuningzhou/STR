import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ _id: false })
export class HoldingSnapshot {
  @Prop({ required: true }) symbol!: string;
  @Prop({ required: true }) quantity!: number;
  @Prop({ default: 0 }) averagePrice!: number;
  @Prop({ default: '' }) currency!: string;
}

@Schema({ _id: false })
export class AdjustedOptionData {
  @Prop({ required: true }) expiration!: string;
  @Prop({ required: true }) strike!: number;
  @Prop({ required: true }) callPut!: string;
  @Prop() multiplier?: number;
  @Prop() underlyingSymbol?: string;
}

@Schema()
export class AdjustedTransaction {
  _id!: Types.ObjectId;
  @Prop({ required: true }) side!: string;
  @Prop({ default: 0 }) quantity!: number;
  @Prop({ default: 0 }) price!: number;
  @Prop({ default: 0 }) cashDelta!: number;
  @Prop({ default: '' }) currency!: string;
  @Prop({ required: true }) timestamp!: string;
  @Prop({ default: '' }) instrumentSymbol!: string;
  @Prop({ type: AdjustedOptionData, default: null }) option!: AdjustedOptionData | null;
  @Prop() snaptradeActivityId?: string;
  @Prop({ default: false }) synthetic!: boolean;
  /** Asset type: 'stock' | 'etf' | 'option' — derived from SnapTrade symbol.type or option_symbol */
  @Prop({ default: 'stock' }) assetType!: string;
  /** True for synthetic buy/sell from resolveMultilegChains (roll legs). Excluded from Assigned Rate. Real closes (option_assign, option_expire, buy_to_cover, manual buy) are NOT marked. */
  @Prop({ default: false }) chainResolved?: boolean;
}

export const AdjustedTransactionSchema = SchemaFactory.createForClass(AdjustedTransaction);

@Schema({ timestamps: true, collection: 'synced_accounts' })
export class SyncedAccount {
  @Prop({ required: true, index: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop({ required: true }) accountId!: string;
  @Prop() authorizationId?: string;
  @Prop() institutionName?: string;
  @Prop({ default: '' }) currency!: string;
  @Prop({ type: Date, default: null }) rebuiltAt!: Date | null;
  @Prop({ type: Date, default: null }) lastSyncedAt!: Date | null;
  @Prop({ type: [HoldingSnapshot], default: [] }) currentHoldings!: HoldingSnapshot[];
  @Prop({ default: 0 }) currentCash!: number;
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} }) currentCashByCurrency!: Record<string, number>;
  @Prop({ type: [AdjustedTransactionSchema], default: [] }) rawTransactions!: AdjustedTransaction[];
  @Prop({ type: [AdjustedTransactionSchema], default: [] }) adjustedTransactions!: AdjustedTransaction[];
}

export type SyncedAccountDocument = HydratedDocument<SyncedAccount>;
export const SyncedAccountSchema = SchemaFactory.createForClass(SyncedAccount);
SyncedAccountSchema.index({ userId: 1, accountId: 1 }, { unique: true });
