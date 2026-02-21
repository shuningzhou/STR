import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Strategy, StrategySchema } from './strategy.schema';
import { Wallet, WalletSchema } from '../wallets/wallet.schema';
import { Transaction, TransactionSchema } from '../transactions/transaction.schema';
import { StrategiesController } from './strategies.controller';
import { StrategiesService } from './strategies.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Strategy.name, schema: StrategySchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [StrategiesController],
  providers: [StrategiesService],
})
export class StrategiesModule {}
