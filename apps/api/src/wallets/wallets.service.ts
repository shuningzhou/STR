import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallet, WalletDocument } from './wallet.schema';
import { Strategy, StrategyDocument } from '../strategies/strategy.schema';
import { UpdateWalletDto } from './dto/update-wallet.dto';

@Injectable()
export class WalletsService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(Strategy.name) private strategyModel: Model<StrategyDocument>,
  ) {}

  async findByStrategy(strategyId: string, userId: string) {
    await this.verifyStrategyOwnership(strategyId, userId);
    const wallet = await this.walletModel.findOne({ strategyId }).lean().exec();
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  async update(strategyId: string, userId: string, dto: UpdateWalletDto) {
    await this.verifyStrategyOwnership(strategyId, userId);
    const wallet = await this.walletModel
      .findOneAndUpdate({ strategyId }, { $set: dto }, { new: true, upsert: true })
      .lean()
      .exec();
    // Sync relevant fields back to strategy
    const strategySync: Record<string, unknown> = {};
    if (dto.baseCurrency !== undefined) strategySync.baseCurrency = dto.baseCurrency;
    if (dto.initialBalance !== undefined) strategySync.initialBalance = dto.initialBalance;
    if (dto.marginAccountEnabled !== undefined) strategySync.marginAccountEnabled = dto.marginAccountEnabled;
    if (dto.collateralEnabled !== undefined) strategySync.collateralEnabled = dto.collateralEnabled;
    if (dto.loanInterest !== undefined) strategySync.loanInterest = dto.loanInterest;
    if (dto.marginRequirement !== undefined) strategySync.marginRequirement = dto.marginRequirement;
    if (dto.collateralAmount !== undefined) strategySync.collateralAmount = dto.collateralAmount;
    if (dto.collateralRequirement !== undefined) strategySync.collateralRequirement = dto.collateralRequirement;
    if (Object.keys(strategySync).length > 0) {
      await this.strategyModel.updateOne({ _id: strategyId }, { $set: strategySync });
    }
    return wallet;
  }

  private async verifyStrategyOwnership(strategyId: string, userId: string) {
    const strategy = await this.strategyModel.findOne({ _id: strategyId, userId }).lean().exec();
    if (!strategy) throw new NotFoundException('Strategy not found');
  }
}
