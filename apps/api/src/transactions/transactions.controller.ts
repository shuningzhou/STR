import { Controller, Get, Post, Patch, Delete, Param, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import type { AuthUser } from '../common/auth-user';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Controller()
export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  @Get('strategies/:strategyId/transactions')
  findAll(@Param('strategyId') strategyId: string, @Req() req: Request) {
    return this.service.findAll(strategyId, (req.user as AuthUser).id);
  }

  @Post('strategies/:strategyId/transactions')
  create(
    @Param('strategyId') strategyId: string,
    @Req() req: Request,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.service.create(strategyId, (req.user as AuthUser).id, dto);
  }

  @Patch('transactions/:id')
  update(@Param('id') id: string, @Req() req: Request, @Body() dto: UpdateTransactionDto) {
    return this.service.update(id, (req.user as AuthUser).id, dto);
  }

  @Delete('transactions/:id')
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.service.remove(id, (req.user as AuthUser).id);
  }
}
