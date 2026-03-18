import { IsOptional, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class YouthIndexQueryDto {
  @ApiPropertyOptional({ default: 2024 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number = 2024;
}

export class TopPerformersDto {
  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ default: 2024 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number = 2024;
}
