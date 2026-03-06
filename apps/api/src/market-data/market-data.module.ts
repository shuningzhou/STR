import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { PositionAggregationService } from './position-aggregation.service';
import { PricePollingService } from './price-polling.service';
import { ProviderRegistry } from './providers/provider-registry';
import { EodhdProvider } from './providers/eodhd-provider';
import { MassiveProvider } from './providers/massive-provider';
import { QuoteCache, QuoteCacheSchema } from './schemas/quote-cache.schema';
import { PriceHistory, PriceHistorySchema } from './schemas/price-history.schema';
import { Transaction, TransactionSchema } from '../transactions/transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QuoteCache.name, schema: QuoteCacheSchema },
      { name: PriceHistory.name, schema: PriceHistorySchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [MarketDataController],
  providers: [
    MarketDataService,
    PositionAggregationService,
    PricePollingService,
    ProviderRegistry,
    EodhdProvider,
    MassiveProvider,
  ],
  exports: [MarketDataService],
})
export class MarketDataModule {}
