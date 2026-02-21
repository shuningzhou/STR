import { IsString, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';

export class CreateStrategyDto {
  @IsString() name!: string;
  @IsOptional() @IsString() baseCurrency?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsNumber() initialBalance?: number;
  @IsOptional() @IsBoolean() marginAccountEnabled?: boolean;
  @IsOptional() @IsBoolean() collateralEnabled?: boolean;
}
