import {
  IsOptional,
  IsInt,
  IsString,
  IsBoolean,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CompareCountriesDto {
  @ApiProperty({ description: 'Country IDs to compare (2-10)', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(2)
  @ArrayMaxSize(10)
  countryIds: string[];

  @ApiPropertyOptional({ description: 'Indicator IDs to compare', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  indicatorIds?: string[];

  @ApiPropertyOptional({ default: 2023 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2030)
  year?: number = 2023;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeRegionalAverage?: boolean = true;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeHistorical?: boolean = false;
}

export class CompareRegionsDto {
  @ApiProperty({ description: 'Indicator ID to compare across regions' })
  @IsString()
  indicatorId: string;

  @ApiPropertyOptional({ default: 2023 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2030)
  year?: number = 2023;
}

export class CompareThemesDto {
  @ApiProperty({ description: 'Country ID to analyze across themes' })
  @IsString()
  countryId: string;

  @ApiPropertyOptional({ default: 2023 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2030)
  year?: number = 2023;
}
