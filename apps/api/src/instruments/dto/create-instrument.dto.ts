import { IsString, IsOptional, IsNumber, IsObject } from 'class-validator';

export class CreateInstrumentDto {
  @IsString() symbol!: string;
  @IsOptional() @IsString() assetType?: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsObject() contractMetadata?: Record<string, unknown>;
  @IsOptional() @IsNumber() marginRequirement?: number;
}
