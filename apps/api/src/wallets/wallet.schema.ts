import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true, collection: 'wallets' })
export class Wallet {
  @Prop({ required: true, unique: true, index: true }) strategyId!: string;
  @Prop({ default: 'USD' }) baseCurrency!: string;
  @Prop({ default: 0 }) initialBalance!: number;
  @Prop({ default: false }) marginAccountEnabled!: boolean;
  @Prop({ default: false }) collateralEnabled!: boolean;
  @Prop() loanInterest?: number;
  @Prop() marginRequirement?: number;
  @Prop() collateralSecurities?: number;
  @Prop() collateralCash?: number;
  @Prop() collateralRequirement?: number;
}

export type WalletDocument = HydratedDocument<Wallet>;
export const WalletSchema = SchemaFactory.createForClass(Wallet);
