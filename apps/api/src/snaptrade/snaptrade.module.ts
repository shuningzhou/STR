import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Strategy, StrategySchema } from '../strategies/strategy.schema';
import { Transaction, TransactionSchema } from '../transactions/transaction.schema';
import { SnaptradeConnection, SnaptradeConnectionSchema } from './schemas/snaptrade-connection.schema';
import { SyncedAccount, SyncedAccountSchema } from './schemas/synced-account.schema';
import { SnaptradeController } from './snaptrade.controller';
import { SnaptradeService } from './snaptrade.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Strategy.name, schema: StrategySchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: SnaptradeConnection.name, schema: SnaptradeConnectionSchema },
      { name: SyncedAccount.name, schema: SyncedAccountSchema },
    ]),
  ],
  controllers: [SnaptradeController],
  providers: [SnaptradeService],
  exports: [SnaptradeService],
})
export class SnaptradeModule {}
