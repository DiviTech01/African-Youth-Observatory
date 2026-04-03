import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ExportQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  countryId?: string;

  @ApiPropertyOptional({ description: 'Comma-separated country IDs' })
  @IsOptional()
  @IsString()
  countryIds?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  indicatorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  themeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1990)
  @Max(2030)
  yearStart?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1990)
  @Max(2030)
  yearEnd?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ageGroup?: string;

  @ApiPropertyOptional({ description: 'Comma-separated column names to include' })
  @IsOptional()
  @IsString()
  columns?: string;

  @ApiPropertyOptional({ description: 'Custom filename (without extension)' })
  @IsOptional()
  @IsString()
  filename?: string;
}

export class CountryReportDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  countryId?: string;
}
