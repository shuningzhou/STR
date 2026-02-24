import { Controller, Get, Patch, Param, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import type { AuthUser } from '../common/auth-user';
import { WalletsService } from './wallets.service';
import { UpdateWalletDto } from './dto/update-wallet.dto';

@Controller('strategies/:strategyId/wallet')
export class WalletsController {
  constructor(private readonly service: WalletsService) {}

  @Get()
  findByStrategy(@Param('strategyId') strategyId: string, @Req() req: Request) {
    return this.service.findByStrategy(strategyId, (req.user as AuthUser).id);
  }

  @Patch()
  update(@Param('strategyId') strategyId: string, @Req() req: Request, @Body() dto: UpdateWalletDto) {
    return this.service.update(strategyId, (req.user as AuthUser).id, dto);
  }
}
