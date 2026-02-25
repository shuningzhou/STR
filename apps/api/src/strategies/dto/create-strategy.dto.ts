import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

class SnaptradeConfigDto {
  @IsArray() @IsString({ each: true }) accountIds!: string[];
  @IsArray() @IsString({ each: true }) transactionTypes!: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) currencies?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) assetTypes?: string[];
}

export class CreateStrategyDto {
  @IsString() name!: string;
  @IsOptional() @IsString() baseCurrency?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsNumber() initialBalance?: number;
  @IsOptional() @IsBoolean() marginAccountEnabled?: boolean;
  @IsOptional() @IsBoolean() collateralEnabled?: boolean;
  @IsOptional() @IsIn(['manual', 'synced']) mode?: string;
  @IsOptional() @ValidateNested() @Type(() => SnaptradeConfigDto) snaptradeConfig?: SnaptradeConfigDto;
}
