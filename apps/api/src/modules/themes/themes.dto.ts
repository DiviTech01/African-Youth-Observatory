import { IsOptional, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ThemeStatsQueryDto {
  @ApiPropertyOptional({ default: 2024 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number = 2024;
}
