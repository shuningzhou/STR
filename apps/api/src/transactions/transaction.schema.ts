import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

@Schema({ _id: false })
export class OptionData {
  @Prop({ required: true }) expiration!: string;
  @Prop({ required: true }) strike!: number;
  @Prop({ required: true }) callPut!: string;
  @Prop() multiplier?: number;
  @Prop() underlyingSymbol?: string;
}

@Schema({ timestamps: true, collection: 'transactions' })
export class Transaction {
  @Prop({ required: true, index: true }) strategyId!: string;
  @Prop({ required: true }) side!: string;
  @Prop({ default: 0 }) quantity!: number;
  @Prop({ default: 0 }) price!: number;
  @Prop({ default: 0 }) cashDelta!: number;
  @Prop({ default: '' }) currency!: string;
  @Prop({ required: true }) timestamp!: string;
  @Prop({ default: '' }) instrumentSymbol!: string;
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} }) customData!: Record<string, unknown>;
  @Prop({ type: OptionData, default: null }) option!: OptionData | null;
  @Prop({ default: 'manual', enum: ['manual', 'snaptrade'] }) source!: string;
  @Prop() snaptradeActivityId?: string;
  @Prop() accountTransactionId?: string;
  @Prop({ default: false }) readonly!: boolean;
}

export type TransactionDocument = HydratedDocument<Transaction>;
export const TransactionSchema = SchemaFactory.createForClass(Transaction);
TransactionSchema.index({ strategyId: 1, timestamp: -1 });
TransactionSchema.index({ strategyId: 1, snaptradeActivityId: 1 }, { sparse: true });
TransactionSchema.index({ strategyId: 1, accountTransactionId: 1 }, { sparse: true });
