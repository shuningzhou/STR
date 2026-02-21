import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true, collection: 'price_history' })
export class PriceHistory {
  @Prop({ required: true, index: true }) symbol!: string;
  @Prop({ default: 'US' }) exchange!: string;
  @Prop({ default: 'daily' }) interval!: string;
  @Prop({ required: true }) date!: Date;
  @Prop({ default: 0 }) open!: number;
  @Prop({ default: 0 }) high!: number;
  @Prop({ default: 0 }) low!: number;
  @Prop({ default: 0 }) close!: number;
  @Prop() adjustedClose?: number;
  @Prop({ default: 0 }) volume!: number;
  @Prop({ default: 'eodhd' }) provider!: string;
  @Prop({ default: () => new Date() }) fetchedAt!: Date;
}

export type PriceHistoryDocument = HydratedDocument<PriceHistory>;
export const PriceHistorySchema = SchemaFactory.createForClass(PriceHistory);
PriceHistorySchema.index({ symbol: 1, exchange: 1, interval: 1, date: 1 }, { unique: true });
