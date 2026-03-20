import { IsOptional, IsInt, IsString, Min, Max } from 'class-validator';
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
