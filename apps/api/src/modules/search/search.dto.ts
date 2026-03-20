import { IsOptional, IsString, IsInt, MinLength, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SearchDto {
  @ApiProperty({ description: 'Search query (min 2 characters)' })
  @IsString()
  @MinLength(2)
  q: string;

  @ApiPropertyOptional({
    description: 'Comma-separated entity types to search (countries,indicators,themes,experts,dashboards)',
  })
  @IsOptional()
  @IsString()
  types?: string;

  @ApiPropertyOptional({ default: 5, description: 'Max results per type (1-20)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 5;
}
