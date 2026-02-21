import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateWalletDto {
  @IsOptional() @IsString() baseCurrency?: string;
  @IsOptional() @IsNumber() initialBalance?: number;
  @IsOptional() @IsBoolean() marginAccountEnabled?: boolean;
  @IsOptional() @IsBoolean() collateralEnabled?: boolean;
  @IsOptional() @IsNumber() loanInterest?: number;
  @IsOptional() @IsNumber() marginRequirement?: number;
  @IsOptional() @IsNumber() collateralAmount?: number;
  @IsOptional() @IsNumber() collateralRequirement?: number;
}
