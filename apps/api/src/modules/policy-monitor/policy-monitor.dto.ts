import { IsOptional, IsInt, IsString, IsEnum, IsUrl, MaxLength, ValidateIf, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PolicyRankingsDto {
  @ApiPropertyOptional({ default: 2023, description: 'Year for compliance scoring context' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2030)
  year?: number = 2023;

  @ApiPropertyOptional({ description: 'Filter by region (e.g. WEST_AFRICA)' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ default: 'desc', description: 'Sort order for compliance score' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class PolicyComputeDto {
  @ApiPropertyOptional({ description: 'Country ID to compute for (omit for all)' })
  @IsOptional()
  @IsString()
  countryId?: string;
}

export const AFCFTA_PROTOCOL_STATUSES = ['UNKNOWN', 'NOT_SIGNED', 'SIGNED', 'RATIFIED'] as const;

export class UpdateCountryPolicyDto {
  @ApiPropertyOptional({
    enum: AFCFTA_PROTOCOL_STATUSES,
    description: 'Status of the AfCFTA Protocol on Women and Youth in Trade. UNKNOWN = not yet assessed.',
  })
  @IsOptional()
  @IsEnum(AFCFTA_PROTOCOL_STATUSES)
  afcftaProtocolStatus?: (typeof AFCFTA_PROTOCOL_STATUSES)[number];

  @ApiPropertyOptional({ description: 'Provenance note (e.g. date signed / deposited). Empty string clears it.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  afcftaProtocolNote?: string | null;

  @ApiPropertyOptional({ description: 'Source URL backing the status. Empty string clears it.' })
  @IsOptional()
  @ValidateIf((_, v) => v !== '' && v !== null)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @MaxLength(2000)
  afcftaProtocolSourceUrl?: string | null;
}
