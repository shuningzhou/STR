import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class StrategyInputConfigDto {
  @IsString() id!: string;
  @IsString() title!: string;
  @IsString() type!: string;
}

export class UpdateStrategyDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() baseCurrency?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsNumber() initialBalance?: number;
  @IsOptional() @IsBoolean() marginAccountEnabled?: boolean;
  @IsOptional() @IsBoolean() collateralEnabled?: boolean;
  @IsOptional() @IsNumber() loanInterest?: number;
  @IsOptional() @IsNumber() marginRequirement?: number;
  @IsOptional() @IsNumber() collateralSecurities?: number;
  @IsOptional() @IsNumber() collateralCash?: number;
  @IsOptional() @IsNumber() collateralRequirement?: number;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => StrategyInputConfigDto) inputs?: StrategyInputConfigDto[];
  @IsOptional() inputValues?: Record<string, unknown>;
}
