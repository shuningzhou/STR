import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true, collection: 'quote_cache' })
export class QuoteCache {
  @Prop({ required: true, index: true }) symbol!: string;
  @Prop({ default: 'US' }) exchange!: string;
  @Prop({ default: 'stock' }) assetType!: string;
  @Prop({ default: 0 }) price!: number;
  @Prop() open?: number;
  @Prop() high?: number;
  @Prop() low?: number;
  @Prop() previousClose?: number;
  @Prop() change?: number;
  @Prop() changePercent?: number;
  @Prop() volume?: number;
  @Prop() contractTicker?: string;
  @Prop({ default: 'eodhd' }) provider!: string;
  @Prop({ default: () => new Date() }) fetchedAt!: Date;
}

export type QuoteCacheDocument = HydratedDocument<QuoteCache>;
export const QuoteCacheSchema = SchemaFactory.createForClass(QuoteCache);
QuoteCacheSchema.index({ symbol: 1, exchange: 1, assetType: 1 }, { unique: true });
