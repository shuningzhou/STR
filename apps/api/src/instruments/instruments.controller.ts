import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { InstrumentsService } from './instruments.service';
import { CreateInstrumentDto } from './dto/create-instrument.dto';

@Controller('instruments')
export class InstrumentsController {
  constructor(private readonly service: InstrumentsService) {}

  @Get('search')
  search(@Query('q') q: string) {
    return this.service.search(q ?? '');
  }

  @Get('margin-requirements')
  marginRequirements(@Query('symbols') symbols: string) {
    const list = symbols ? symbols.split(',').map((s) => s.trim()).filter(Boolean) : [];
    return this.service.findBySymbols(list);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  upsert(@Body() dto: CreateInstrumentDto) {
    return this.service.upsert(dto);
  }
}
