import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true, collection: 'instruments' })
export class Instrument {
  @Prop({ required: true, index: true }) symbol!: string;
  @Prop({ default: 'stock' }) assetType!: string;
  @Prop({ default: 'USD' }) currency!: string;
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} }) contractMetadata!: Record<string, unknown>;
  @Prop({ default: 0 }) marginRequirement!: number;
}

export type InstrumentDocument = HydratedDocument<Instrument>;
export const InstrumentSchema = SchemaFactory.createForClass(Instrument);
InstrumentSchema.index({ symbol: 1, assetType: 1 }, { unique: true });
