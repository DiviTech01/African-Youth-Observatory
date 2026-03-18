import { IsOptional, IsString, IsInt, IsEnum, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum GenderEnum {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  TOTAL = 'TOTAL',
}

export class ListIndicatorsDto {
  @ApiPropertyOptional({ description: 'Filter by theme ID' })
  @IsOptional()
  @IsString()
  themeId?: string;

  @ApiPropertyOptional({ description: 'Search by name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 50;
}

export class IndicatorValuesQueryDto {
  @ApiPropertyOptional({ description: 'Filter by country ID' })
  @IsOptional()
  @IsString()
  countryId?: string;

  @ApiPropertyOptional({ description: 'Start year' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  yearStart?: number;

  @ApiPropertyOptional({ description: 'End year' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  yearEnd?: number;

  @ApiPropertyOptional({ enum: GenderEnum })
  @IsOptional()
  @IsEnum(GenderEnum)
  gender?: GenderEnum;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 100;
}
