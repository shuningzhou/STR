import { IsString, IsOptional, IsNumber, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class OptionDto {
  @IsString() expiration!: string;
  @IsNumber() strike!: number;
  @IsString() callPut!: string;
  @IsOptional() @IsNumber() multiplier?: number;
  @IsOptional() @IsString() underlyingSymbol?: string;
}

export class UpdateTransactionDto {
  @IsOptional() @IsString() side?: string;
  @IsOptional() @IsNumber() quantity?: number;
  @IsOptional() @IsNumber() price?: number;
  @IsOptional() @IsNumber() cashDelta?: number;
  @IsOptional() @IsString() timestamp?: string;
  @IsOptional() @IsString() instrumentSymbol?: string;
  @IsOptional() @IsObject() customData?: Record<string, unknown>;
  @IsOptional() @ValidateNested() @Type(() => OptionDto) option?: OptionDto | null;
}
