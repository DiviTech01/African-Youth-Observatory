import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  MaxLength,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateDashboardDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  title!: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ type: 'array', description: 'Initial widgets (JSON array)' })
  @IsOptional()
  @IsArray()
  widgets?: Record<string, unknown>[];
}

export class UpdateDashboardDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Grid layout config (JSON)' })
  @IsOptional()
  layout?: Record<string, unknown>;

  @ApiPropertyOptional({ type: 'array', description: 'Widgets (JSON array)' })
  @IsOptional()
  @IsArray()
  widgets?: Record<string, unknown>[];
}

export class ListPublicDashboardsDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20;

  @ApiPropertyOptional({ description: 'Search by title or description' })
  @IsOptional()
  @IsString()
  search?: string;
}
