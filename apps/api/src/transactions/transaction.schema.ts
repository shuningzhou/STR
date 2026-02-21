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
  @Prop({ required: true }) timestamp!: string;
  @Prop({ default: '' }) instrumentSymbol!: string;
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} }) customData!: Record<string, unknown>;
  @Prop({ type: OptionData, default: null }) option!: OptionData | null;
}

export type TransactionDocument = HydratedDocument<Transaction>;
export const TransactionSchema = SchemaFactory.createForClass(Transaction);
TransactionSchema.index({ strategyId: 1, timestamp: -1 });
