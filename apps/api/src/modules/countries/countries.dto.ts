import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum RegionEnum {
  NORTH_AFRICA = 'NORTH_AFRICA',
  WEST_AFRICA = 'WEST_AFRICA',
  CENTRAL_AFRICA = 'CENTRAL_AFRICA',
  EAST_AFRICA = 'EAST_AFRICA',
  SOUTHERN_AFRICA = 'SOUTHERN_AFRICA',
}

export class ListCountriesDto {
  @ApiPropertyOptional({ enum: RegionEnum })
  @IsOptional()
  @IsEnum(RegionEnum)
  region?: RegionEnum;

  @ApiPropertyOptional({ description: 'Partial match on name, capital, or ISO code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 54 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 54;

  @ApiPropertyOptional({ default: 'name', description: 'Sort field' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'name';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsEnum({ asc: 'asc', desc: 'desc' })
  sortOrder?: 'asc' | 'desc' = 'asc';
}

export class CountryStatsQueryDto {
  @ApiPropertyOptional({ default: 2023, description: 'Year for statistics (1990-2030)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1990)
  @Max(2030)
  year?: number = 2023;
}
