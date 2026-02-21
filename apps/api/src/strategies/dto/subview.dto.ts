import { IsString, IsOptional, IsObject, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class PositionDto {
  @IsNumber() x!: number;
  @IsNumber() y!: number;
  @IsNumber() w!: number;
  @IsNumber() h!: number;
}

export class AddSubviewDto {
  @IsString() id!: string;
  @IsString() name!: string;
  @ValidateNested() @Type(() => PositionDto) position!: PositionDto;
  @IsOptional() @IsString() templateId?: string;
  @IsOptional() @IsObject() spec?: Record<string, unknown>;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsString() iconColor?: string;
}

export class UpdateSubviewDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @ValidateNested() @Type(() => PositionDto) position?: PositionDto;
  @IsOptional() @IsObject() spec?: Record<string, unknown>;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsString() iconColor?: string;
  @IsOptional() @IsObject() inputValues?: Record<string, unknown>;
}

class SubviewPositionUpdate {
  @IsString() id!: string;
  @ValidateNested() @Type(() => PositionDto) position!: PositionDto;
}

export class BatchUpdateSubviewPositionsDto {
  @ValidateNested({ each: true }) @Type(() => SubviewPositionUpdate) subviews!: SubviewPositionUpdate[];
}

export class SaveCacheDto {
  @IsOptional() cacheData?: unknown;
  @IsOptional() @IsNumber() cacheVersion?: number;
}
