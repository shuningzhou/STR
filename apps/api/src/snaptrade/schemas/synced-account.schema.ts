import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

/** Option leg data for roll transactions */
export interface OptionLegData {
  expiration: string;
  strike: number;
  callPut: string;
  underlyingSymbol?: string;
}

@Schema({ _id: false })
export class HoldingSnapshot {
  @Prop({ required: true }) symbol!: string;
  @Prop({ required: true }) quantity!: number;
  @Prop({ default: 0 }) averagePrice!: number;
  @Prop({ default: '' }) currency!: string;
  /** stock | etf | secured_put | covered_call | call | put */
  @Prop({ default: 'stock' }) category!: string;
}

@Schema({ _id: false })
export class OptionData {
  @Prop({ required: true }) expiration!: string;
  @Prop({ required: true }) strike!: number;
  @Prop({ required: true }) callPut!: string;
  @Prop() multiplier?: number;
  @Prop() underlyingSymbol?: string;
}

@Schema()
export class SyncedTransaction {
  _id!: Types.ObjectId;
  @Prop({ required: true }) side!: string;
  @Prop({ default: 0 }) quantity!: number;
  @Prop({ default: 0 }) price!: number;
  @Prop({ default: 0 }) cashDelta!: number;
  @Prop({ default: '' }) currency!: string;
  @Prop({ required: true }) timestamp!: string;
  @Prop({ default: '' }) instrumentSymbol!: string;
  @Prop({ type: OptionData, default: null }) option!: OptionData | null;
  @Prop() snaptradeActivityId?: string;
  /** Asset type: stock | etf | option */
  @Prop({ default: 'stock' }) assetType!: string;
  /** stock, etf, secured_put_open, secured_put_roll, secured_put_close, etc. */
  @Prop({ default: 'stock' }) category!: string;
  /** chainId, closeLeg, openLeg (for rolls) */
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} }) customData!: Record<string, unknown>;
}

export const SyncedTransactionSchema = SchemaFactory.createForClass(SyncedTransaction);

@Schema({ timestamps: true, collection: 'synced_accounts' })
export class SyncedAccount {
  @Prop({ required: true, index: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop({ required: true }) accountId!: string;
  @Prop() authorizationId?: string;
  @Prop() institutionName?: string;
  @Prop({ default: '' }) currency!: string;
  @Prop({ type: Date, default: null }) lastSyncedAt!: Date | null;
  @Prop({ type: [HoldingSnapshot], default: [] }) currentHoldings!: HoldingSnapshot[];
  @Prop({ default: 0 }) currentCash!: number;
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} }) currentCashByCurrency!: Record<string, number>;
  @Prop({ type: [SyncedTransactionSchema], default: [] }) transactions!: SyncedTransaction[];
  /** Earliest date we synced transactions from (orders boundary); null if no orders */
  @Prop({ type: Date, default: null }) transactionsSyncStartDate!: Date | null;
}

export type SyncedAccountDocument = HydratedDocument<SyncedAccount>;
export const SyncedAccountSchema = SchemaFactory.createForClass(SyncedAccount);
SyncedAccountSchema.index({ userId: 1, accountId: 1 }, { unique: true });
