import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

/* ── Subview Position ─────────────────────────────── */
@Schema({ _id: false })
export class SubviewPosition {
  @Prop({ required: true }) x!: number;
  @Prop({ required: true }) y!: number;
  @Prop({ required: true }) w!: number;
  @Prop({ required: true }) h!: number;
}

/* ── Subview (embedded in Strategy) ───────────────── */
@Schema({ _id: false })
export class SubviewDoc {
  @Prop({ required: true }) id!: string;
  @Prop({ required: true }) name!: string;
  @Prop({ type: SubviewPosition, required: true }) position!: SubviewPosition;
  @Prop() templateId?: string;
  @Prop({ type: MongooseSchema.Types.Mixed }) spec?: Record<string, unknown>;
  @Prop() icon?: string;
  @Prop() iconColor?: string;
  @Prop({ type: MongooseSchema.Types.Mixed }) inputValues?: Record<string, unknown>;
  @Prop({ type: MongooseSchema.Types.Mixed }) cacheData?: unknown;
  @Prop() cachedAt?: Date;
  @Prop({ default: 0 }) cacheVersion?: number;
  @Prop({ default: 'invalid' }) cacheStatus?: string;
}
export const SubviewSchema = SchemaFactory.createForClass(SubviewDoc);

/* ── Strategy Input Config (embedded) ─────────────── */
@Schema({ _id: false })
export class StrategyInputConfig {
  @Prop({ required: true }) id!: string;
  @Prop({ required: true }) title!: string;
  @Prop({ required: true }) type!: string;
  @Prop({ type: MongooseSchema.Types.Mixed }) default?: unknown;
  @Prop({ type: [{ value: String, label: String }] }) options?: { value: string; label: string }[];
  @Prop() min?: number;
  @Prop() max?: number;
}

/* ── Strategy ─────────────────────────────────────── */
@Schema({ timestamps: true, collection: 'strategies' })
export class Strategy {
  @Prop({ required: true, index: true }) userId!: string;
  @Prop({ required: true }) name!: string;
  @Prop({ default: 'USD' }) baseCurrency!: string;
  @Prop() icon?: string;
  @Prop({ default: 0 }) initialBalance!: number;
  @Prop({ default: false }) marginAccountEnabled!: boolean;
  @Prop({ default: false }) collateralEnabled!: boolean;
  @Prop() loanInterest?: number;
  @Prop() marginRequirement?: number;
  @Prop() collateralSecurities?: number;
  @Prop() collateralCash?: number;
  @Prop() collateralRequirement?: number;
  @Prop({ type: [StrategyInputConfig], default: [] }) inputs!: StrategyInputConfig[];
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} }) inputValues!: Record<string, unknown>;
  @Prop({ default: 0 }) transactionsVersion!: number;
  @Prop({ type: [SubviewSchema], default: [] }) subviews!: SubviewDoc[];
}

export type StrategyDocument = HydratedDocument<Strategy>;
export const StrategySchema = SchemaFactory.createForClass(Strategy);
