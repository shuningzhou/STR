import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppSettings, AppSettingsDocument } from './schemas/app-settings.schema';

export interface AppSettingsDto {
  allowRegistration: boolean;
}

@Injectable()
export class AppSettingsService {
  constructor(
    @InjectModel(AppSettings.name) private model: Model<AppSettingsDocument>,
  ) {}

  async getSettings(): Promise<AppSettingsDto> {
    const doc = await this.model.findOne().lean().exec();
    return {
      allowRegistration: doc?.allowRegistration ?? true,
    };
  }

  async updateSettings(dto: Partial<AppSettingsDto>): Promise<AppSettingsDto> {
    const updated = await this.model
      .findOneAndUpdate({}, { $set: dto }, { new: true, upsert: true })
      .lean()
      .exec();
    return {
      allowRegistration: updated?.allowRegistration ?? true,
    };
  }

  async isRegistrationAllowed(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.allowRegistration;
  }
}
