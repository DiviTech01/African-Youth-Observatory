import {
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export enum GenderEnum {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  TOTAL = 'TOTAL',
}

export enum RegionEnum {
  NORTH_AFRICA = 'NORTH_AFRICA',
  WEST_AFRICA = 'WEST_AFRICA',
  CENTRAL_AFRICA = 'CENTRAL_AFRICA',
  EAST_AFRICA = 'EAST_AFRICA',
  SOUTHERN_AFRICA = 'SOUTHERN_AFRICA',
}

export class DataValuesQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  countryId?: string;

  @ApiPropertyOptional({ description: 'Comma-separated country IDs' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  @IsArray()
  countryIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  indicatorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  themeId?: string;

  @ApiPropertyOptional({ minimum: 1990, maximum: 2030 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1990)
  @Max(2030)
  yearStart?: number;

  @ApiPropertyOptional({ minimum: 1990, maximum: 2030 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1990)
  @Max(2030)
  yearEnd?: number;

  @ApiPropertyOptional({ enum: GenderEnum })
  @IsOptional()
  @IsEnum(GenderEnum)
  gender?: GenderEnum;

  @ApiPropertyOptional({ enum: RegionEnum })
  @IsOptional()
  @IsEnum(RegionEnum)
  region?: RegionEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ageGroup?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 100, maximum: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  pageSize?: number = 100;
}

export class TimeSeriesQueryDto {
  @ApiProperty({ description: 'Country ID (required)' })
  @IsString()
  countryId!: string;

  @ApiProperty({ description: 'Indicator ID (required)' })
  @IsString()
  indicatorId!: string;

  @ApiPropertyOptional({ enum: GenderEnum })
  @IsOptional()
  @IsEnum(GenderEnum)
  gender?: GenderEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  yearStart?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  yearEnd?: number;
}

export class MapDataQueryDto {
  @ApiProperty({ description: 'Indicator ID (required)' })
  @IsString()
  indicatorId!: string;

  @ApiPropertyOptional({ description: 'Year or "latest"', default: 'latest' })
  @IsOptional()
  @IsString()
  year?: string = 'latest';
}

export class ComparisonQueryDto {
  @ApiProperty({ description: 'Comma-separated country IDs (required)' })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  @IsArray()
  countryIds!: string[];

  @ApiPropertyOptional({ description: 'Comma-separated indicator IDs' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  @IsArray()
  indicatorIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  indicatorId?: string;

  @ApiPropertyOptional({ default: 2023 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number = 2023;
}

export class RegionalAveragesQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  indicatorId?: string;

  @ApiPropertyOptional({ default: 2023 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number = 2023;
}

export class BarChartQueryDto {
  @ApiProperty({ description: 'Indicator ID (required)' })
  @IsString()
  indicatorId!: string;

  @ApiPropertyOptional({ default: 2023 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number = 2023;

  @ApiPropertyOptional({ default: 10, description: 'Number of countries to return' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(54)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sort?: 'asc' | 'desc' = 'desc';
}

export class RegionalSummaryQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  themeId?: string;

  @ApiPropertyOptional({ default: 2023 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number = 2023;
}
