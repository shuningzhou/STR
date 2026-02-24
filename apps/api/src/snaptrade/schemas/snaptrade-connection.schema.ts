import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ _id: false })
export class SnaptradeAccount {
  @Prop({ required: true }) accountId!: string;
  @Prop() name?: string;
  @Prop() number?: string;
  @Prop() institutionName?: string;
  @Prop() currency?: string;
  @Prop() type?: string;
  @Prop() rawType?: string;
  @Prop() status?: string;
  @Prop() metaStatus?: string;
  @Prop() balanceAmount?: number;
  @Prop() isPaper?: boolean;
  @Prop() createdDate?: string;
}

@Schema({ timestamps: true, collection: 'snaptrade_connections' })
export class SnaptradeConnection {
  @Prop({ required: true, index: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop({ required: true }) authorizationId!: string;
  @Prop() institutionName?: string;
  @Prop({ type: [SnaptradeAccount], default: [] }) accounts!: SnaptradeAccount[];
  @Prop({ default: 'active', enum: ['active', 'disabled'] }) status!: string;
}

export type SnaptradeConnectionDocument = HydratedDocument<SnaptradeConnection>;
export const SnaptradeConnectionSchema = SchemaFactory.createForClass(SnaptradeConnection);
SnaptradeConnectionSchema.index({ userId: 1, authorizationId: 1 }, { unique: true });
