import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Instrument, InstrumentDocument } from './instrument.schema';
import { CreateInstrumentDto } from './dto/create-instrument.dto';

@Injectable()
export class InstrumentsService {
  constructor(
    @InjectModel(Instrument.name) private instrumentModel: Model<InstrumentDocument>,
  ) {}

  async findBySymbols(symbols: string[]): Promise<Record<string, number>> {
    if (!symbols.length) return {};
    const docs = await this.instrumentModel
      .find({ symbol: { $in: symbols } })
      .lean()
      .exec();
    const result: Record<string, number> = {};
    for (const doc of docs) {
      if (doc.marginRequirement) result[doc.symbol] = doc.marginRequirement;
    }
    return result;
  }

  async search(query: string) {
    if (!query) return [];
    const regex = new RegExp(`^${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    return this.instrumentModel.find({ symbol: regex }).limit(20).lean().exec();
  }

  async findOne(id: string) {
    const doc = await this.instrumentModel.findById(id).lean().exec();
    if (!doc) throw new NotFoundException('Instrument not found');
    return doc;
  }

  async upsert(dto: CreateInstrumentDto) {
    const doc = await this.instrumentModel.findOneAndUpdate(
      { symbol: dto.symbol, assetType: dto.assetType ?? 'stock' },
      {
        $set: {
          symbol: dto.symbol,
          assetType: dto.assetType ?? 'stock',
          currency: dto.currency ?? 'USD',
          contractMetadata: dto.contractMetadata ?? {},
          marginRequirement: dto.marginRequirement ?? 0,
        },
      },
      { new: true, upsert: true },
    ).lean().exec();
    return doc;
  }
}
