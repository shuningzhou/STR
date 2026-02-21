import { Controller, Get, Post, Patch, Delete, Put, Param, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { StrategiesService } from './strategies.service';
import { CreateStrategyDto } from './dto/create-strategy.dto';
import { UpdateStrategyDto } from './dto/update-strategy.dto';
import { AddSubviewDto, UpdateSubviewDto, BatchUpdateSubviewPositionsDto, SaveCacheDto } from './dto/subview.dto';

@Controller('strategies')
export class StrategiesController {
  constructor(private readonly service: StrategiesService) {}

  @Get()
  findAll(@Req() req: Request) {
    return this.service.findAll(req.userId);
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateStrategyDto) {
    return this.service.create(req.userId, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Req() req: Request, @Body() dto: UpdateStrategyDto) {
    return this.service.update(id, req.userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.service.remove(id, req.userId);
  }

  /* ── Subview endpoints ────────────────────────────── */

  @Post(':id/subviews')
  addSubview(@Param('id') id: string, @Req() req: Request, @Body() dto: AddSubviewDto) {
    return this.service.addSubview(id, req.userId, dto);
  }

  @Patch(':id/subviews')
  batchUpdatePositions(@Param('id') id: string, @Req() req: Request, @Body() dto: BatchUpdateSubviewPositionsDto) {
    return this.service.batchUpdateSubviewPositions(id, req.userId, dto);
  }

  @Patch(':id/subviews/:subviewId')
  updateSubview(
    @Param('id') id: string,
    @Param('subviewId') subviewId: string,
    @Req() req: Request,
    @Body() dto: UpdateSubviewDto,
  ) {
    return this.service.updateSubview(id, subviewId, req.userId, dto);
  }

  @Delete(':id/subviews/:subviewId')
  removeSubview(@Param('id') id: string, @Param('subviewId') subviewId: string, @Req() req: Request) {
    return this.service.removeSubview(id, subviewId, req.userId);
  }

  @Put(':id/subviews/:subviewId/cache')
  saveCache(
    @Param('id') id: string,
    @Param('subviewId') subviewId: string,
    @Req() req: Request,
    @Body() dto: SaveCacheDto,
  ) {
    return this.service.saveCache(id, subviewId, req.userId, dto);
  }
}
