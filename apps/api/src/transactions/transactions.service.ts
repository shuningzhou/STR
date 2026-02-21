import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from './transaction.schema';
import { Strategy, StrategyDocument } from '../strategies/strategy.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private txModel: Model<TransactionDocument>,
    @InjectModel(Strategy.name) private strategyModel: Model<StrategyDocument>,
  ) {}

  async findAll(strategyId: string, userId: string) {
    await this.verifyStrategyOwnership(strategyId, userId);
    return this.txModel.find({ strategyId }).sort({ timestamp: -1 }).lean().exec();
  }

  async create(strategyId: string, userId: string, dto: CreateTransactionDto) {
    await this.verifyStrategyOwnership(strategyId, userId);
    const tx = await this.txModel.create({
      strategyId,
      side: dto.side,
      quantity: dto.quantity ?? 0,
      price: dto.price ?? 0,
      cashDelta: dto.cashDelta,
      timestamp: dto.timestamp,
      instrumentSymbol: dto.instrumentSymbol ?? '',
      customData: dto.customData ?? {},
      option: dto.option ?? null,
    });
    await this.strategyModel.updateOne(
      { _id: strategyId },
      { $inc: { transactionsVersion: 1 } },
    );
    return tx.toObject();
  }

  async update(txId: string, userId: string, dto: UpdateTransactionDto) {
    const tx = await this.txModel.findById(txId).lean().exec();
    if (!tx) throw new NotFoundException('Transaction not found');
    await this.verifyStrategyOwnership(tx.strategyId, userId);
    const updated = await this.txModel.findByIdAndUpdate(txId, { $set: dto }, { new: true }).lean().exec();
    await this.strategyModel.updateOne(
      { _id: tx.strategyId },
      { $inc: { transactionsVersion: 1 } },
    );
    return updated;
  }

  async remove(txId: string, userId: string) {
    const tx = await this.txModel.findById(txId).lean().exec();
    if (!tx) throw new NotFoundException('Transaction not found');
    await this.verifyStrategyOwnership(tx.strategyId, userId);
    await this.txModel.findByIdAndDelete(txId);
    await this.strategyModel.updateOne(
      { _id: tx.strategyId },
      { $inc: { transactionsVersion: 1 } },
    );
    return { deleted: true };
  }

  private async verifyStrategyOwnership(strategyId: string, userId: string) {
    const strategy = await this.strategyModel.findOne({ _id: strategyId, userId }).lean().exec();
    if (!strategy) throw new NotFoundException('Strategy not found');
  }
}
