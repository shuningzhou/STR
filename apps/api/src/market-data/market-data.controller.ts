import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { MarketDataService } from './market-data.service';

@Controller('market-data')
export class MarketDataController {
  constructor(private readonly service: MarketDataService) {}

  @Get('quotes')
  @Header('Cache-Control', 'public, max-age=60')
  async getQuotes(@Query('symbols') symbols: string) {
    const list = (symbols ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    return this.service.getQuotes(list);
  }

  @Get('options/quote')
  async getOptionQuotes(@Query('contracts') contracts: string) {
    const list = (contracts ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    return this.service.getOptionQuotes(list);
  }

  @Get('history')
  @Header('Cache-Control', 'public, max-age=3600')
  async getHistoryBatch(
    @Query('symbols') symbols: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('exchange') exchange?: string,
  ) {
    const list = (symbols ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    if (list.length === 0) return {};
    return this.service.getHistoryBatch(list, from, to, exchange);
  }

  @Get('history/:symbol')
  @Header('Cache-Control', 'public, max-age=3600')
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
