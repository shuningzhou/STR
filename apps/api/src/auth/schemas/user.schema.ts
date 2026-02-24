import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true, index: true }) email!: string;
  @Prop({ required: true }) passwordHash!: string;
  @Prop({ default: false }) emailVerified!: boolean;
  @Prop() otpCode?: string;
  @Prop() otpExpiresAt?: Date;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
