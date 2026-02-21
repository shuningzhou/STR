import { Controller, Get, Param, Query } from '@nestjs/common';
import { MarketDataService } from './market-data.service';

@Controller('market-data')
export class MarketDataController {
  constructor(private readonly service: MarketDataService) {}

  @Get('quotes')
  async getQuotes(@Query('symbols') symbols: string) {
    const list = (symbols ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    return this.service.getQuotes(list);
  }

  @Get('options/quote')
  async getOptionQuotes(@Query('contracts') contracts: string) {
    const list = (contracts ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    return this.service.getOptionQuotes(list);
  }

  @Get('history/:symbol')
  async getHistory(
    @Param('symbol') symbol: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('exchange') exchange?: string,
  ) {
    return this.service.getHistory(symbol, from, to, exchange);
  }

  @Get('search')
  async search(@Query('q') q: string) {
    return this.service.searchSymbols(q ?? '');
  }
}
