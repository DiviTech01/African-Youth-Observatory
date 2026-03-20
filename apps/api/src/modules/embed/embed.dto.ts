import { IsOptional, IsString, IsInt, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class EmbedChartDto {
  @ApiProperty({ description: 'Chart type: bar or line' })
  @IsString()
  type: 'bar' | 'line';

  @ApiProperty({ description: 'Indicator slug' })
  @IsString()
  indicator: string;

  @ApiPropertyOptional({ description: 'Data year (default: latest)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @ApiPropertyOptional({ description: 'ISO3 country code (required for line chart)' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ default: 10, description: 'Number of countries (bar chart)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(54)
  limit?: number = 10;

  @ApiPropertyOptional({ default: 'desc', description: 'Sort order (bar chart)' })
  @IsOptional()
  @IsString()
  sort?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ default: 'light', description: 'Color theme: light or dark' })
  @IsOptional()
  @IsString()
  theme?: 'light' | 'dark' = 'light';

  @ApiPropertyOptional({ description: 'Start year (line chart)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  yearStart?: number;

  @ApiPropertyOptional({ description: 'End year (line chart)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  yearEnd?: number;
}

export class EmbedStatDto {
  @ApiProperty({ description: 'Indicator slug' })
  @IsString()
  indicator: string;

  @ApiProperty({ description: 'ISO3 country code' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ description: 'Data year (default: latest)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @ApiPropertyOptional({ default: 'light' })
  @IsOptional()
  @IsString()
  theme?: 'light' | 'dark' = 'light';
}

export class EmbedMapDto {
  @ApiProperty({ description: 'Indicator slug' })
  @IsString()
  indicator: string;

  @ApiPropertyOptional({ description: 'Data year (default: latest)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @ApiPropertyOptional({ default: 'light' })
  @IsOptional()
  @IsString()
  theme?: 'light' | 'dark' = 'light';
}
