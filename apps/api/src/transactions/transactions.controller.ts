import { Controller, Get, Post, Patch, Delete, Param, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Controller()
export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  @Get('strategies/:strategyId/transactions')
  findAll(@Param('strategyId') strategyId: string, @Req() req: Request) {
    return this.service.findAll(strategyId, req.userId);
  }

  @Post('strategies/:strategyId/transactions')
  create(
    @Param('strategyId') strategyId: string,
    @Req() req: Request,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.service.create(strategyId, req.userId, dto);
  }

  @Patch('transactions/:id')
  update(@Param('id') id: string, @Req() req: Request, @Body() dto: UpdateTransactionDto) {
    return this.service.update(id, req.userId, dto);
  }

  @Delete('transactions/:id')
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.service.remove(id, req.userId);
  }
}
