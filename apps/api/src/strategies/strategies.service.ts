import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Strategy, StrategyDocument } from './strategy.schema';
import { CreateStrategyDto } from './dto/create-strategy.dto';
import { UpdateStrategyDto } from './dto/update-strategy.dto';
import { AddSubviewDto, UpdateSubviewDto, BatchUpdateSubviewPositionsDto, SaveCacheDto } from './dto/subview.dto';
import { Wallet, WalletDocument } from '../wallets/wallet.schema';
import { Transaction, TransactionDocument } from '../transactions/transaction.schema';

@Injectable()
export class StrategiesService {
  constructor(
    @InjectModel(Strategy.name) private strategyModel: Model<StrategyDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  ) {}

  async findAll(userId: string) {
    return this.strategyModel.find({ userId }).lean().exec();
  }

  async findOne(id: string, userId: string) {
    const doc = await this.strategyModel.findOne({ _id: id, userId }).lean().exec();
    if (!doc) throw new NotFoundException('Strategy not found');
    return doc;
  }

  async create(userId: string, dto: CreateStrategyDto) {
    const strategy = await this.strategyModel.create({
      userId,
      name: dto.name,
      baseCurrency: dto.baseCurrency ?? 'USD',
      icon: dto.icon,
      initialBalance: dto.initialBalance ?? 0,
      marginAccountEnabled: dto.marginAccountEnabled ?? false,
      collateralEnabled: dto.collateralEnabled ?? false,
    });
    await this.walletModel.create({
      strategyId: strategy._id.toString(),
      baseCurrency: dto.baseCurrency ?? 'USD',
      initialBalance: dto.initialBalance ?? 0,
      marginAccountEnabled: dto.marginAccountEnabled ?? false,
      collateralEnabled: dto.collateralEnabled ?? false,
    });
    return strategy.toObject();
  }

  async update(id: string, userId: string, dto: UpdateStrategyDto) {
    const doc = await this.strategyModel
      .findOneAndUpdate({ _id: id, userId }, { $set: dto }, { new: true })
      .lean()
      .exec();
    if (!doc) throw new NotFoundException('Strategy not found');
    return doc;
  }

  async remove(id: string, userId: string) {
    const doc = await this.strategyModel.findOneAndDelete({ _id: id, userId }).lean().exec();
    if (!doc) throw new NotFoundException('Strategy not found');
    await this.walletModel.deleteMany({ strategyId: id });
    await this.transactionModel.deleteMany({ strategyId: id });
    return { deleted: true };
  }

  /* ── Subview operations ───────────────────────────── */

  async addSubview(strategyId: string, userId: string, dto: AddSubviewDto) {
    const doc = await this.strategyModel.findOneAndUpdate(
      { _id: strategyId, userId },
      { $push: { subviews: dto } },
      { new: true },
    ).lean().exec();
    if (!doc) throw new NotFoundException('Strategy not found');
    return doc.subviews.find((s) => s.id === dto.id);
  }

  async batchUpdateSubviewPositions(strategyId: string, userId: string, dto: BatchUpdateSubviewPositionsDto) {
    const strategy = await this.strategyModel.findOne({ _id: strategyId, userId });
    if (!strategy) throw new NotFoundException('Strategy not found');
    for (const update of dto.subviews) {
      const sv = strategy.subviews.find((s) => s.id === update.id);
      if (sv) sv.position = update.position;
    }
    await strategy.save();
    return strategy.toObject().subviews;
  }

  async updateSubview(strategyId: string, subviewId: string, userId: string, dto: UpdateSubviewDto) {
    const setFields: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(dto)) {
      if (val !== undefined) setFields[`subviews.$.${key}`] = val;
    }
    const doc = await this.strategyModel.findOneAndUpdate(
      { _id: strategyId, userId, 'subviews.id': subviewId },
      { $set: setFields },
      { new: true },
    ).lean().exec();
    if (!doc) throw new NotFoundException('Strategy or subview not found');
    return doc.subviews.find((s) => s.id === subviewId);
  }

  async removeSubview(strategyId: string, subviewId: string, userId: string) {
    const doc = await this.strategyModel.findOneAndUpdate(
      { _id: strategyId, userId },
      { $pull: { subviews: { id: subviewId } } },
      { new: true },
    ).lean().exec();
    if (!doc) throw new NotFoundException('Strategy not found');
    return { deleted: true };
  }

  async saveCache(strategyId: string, subviewId: string, userId: string, dto: SaveCacheDto) {
    const doc = await this.strategyModel.findOneAndUpdate(
      { _id: strategyId, userId, 'subviews.id': subviewId },
      {
        $set: {
          'subviews.$.cacheData': dto.cacheData,
          'subviews.$.cacheVersion': dto.cacheVersion,
          'subviews.$.cachedAt': new Date(),
          'subviews.$.cacheStatus': 'valid',
        },
      },
      { new: true },
    ).lean().exec();
    if (!doc) throw new NotFoundException('Strategy or subview not found');
    return { saved: true };
  }
}
