import { Controller, Get, Post, Delete, Param, Req } from '@nestjs/common';
import { Request } from 'express';
import type { AuthUser } from '../common/auth-user';
import { SnaptradeService } from './snaptrade.service';

@Controller('snaptrade')
export class SnaptradeController {
  constructor(private readonly service: SnaptradeService) {}

  @Post('register')
  register(@Req() req: Request) {
    return this.service.registerUser((req.user as AuthUser).id);
  }

  @Post('connect')
  connect(@Req() req: Request) {
    return this.service.getConnectionPortalUrl((req.user as AuthUser).id);
  }

  @Get('connections')
  listConnections(@Req() req: Request) {
    return this.service.listConnections((req.user as AuthUser).id);
  }

  @Post('connections/refresh')
  refreshConnections(@Req() req: Request) {
    return this.service.refreshConnections((req.user as AuthUser).id);
  }

  @Delete('connections/:authorizationId')
  deleteConnection(@Param('authorizationId') authId: string, @Req() req: Request) {
    return this.service.deleteConnection((req.user as AuthUser).id, authId);
  }

  @Get('accounts')
  listAccounts(@Req() req: Request) {
    return this.service.listAccounts((req.user as AuthUser).id);
  }

  @Post('sync/:strategyId')
  syncStrategy(@Param('strategyId') strategyId: string, @Req() req: Request) {
    return this.service.syncStrategy(strategyId, (req.user as AuthUser).id);
  }
}
