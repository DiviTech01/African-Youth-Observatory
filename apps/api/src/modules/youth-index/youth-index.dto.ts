import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class YouthIndexQueryDto {
  // No initializer on purpose: the global ValidationPipe runs with
  // transform:true, so a default here would always win and the controller
  // could never tell "omitted" from an explicit year. Omitted means "latest
  // computed year" (YouthIndexService.latestYear).
  @ApiPropertyOptional({ description: 'Defaults to the latest year with computed scores' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;
}

export class TopPerformersDto {
  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Defaults to the latest year with computed scores' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;
}

export class ComputeYearDto {
  @ApiProperty({ description: 'Year to compute the Youth Index for', example: 2023 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2030)
  year: number;
}
