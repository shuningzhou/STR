import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true, collection: 'appsettings' })
export class AppSettings {
  @Prop({ default: true })
  allowRegistration!: boolean;
}

export const AppSettingsSchema = SchemaFactory.createForClass(AppSettings);
export type AppSettingsDocument = HydratedDocument<AppSettings>;
