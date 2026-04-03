import { IsOptional, IsString, IsInt, IsArray, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ImportWorldBankDto {
  @ApiPropertyOptional({ description: 'Specific indicator slugs to import', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  indicators?: string[];
}

export class ImportCsvDto {
  @ApiProperty({ description: 'Indicator slug to map data to' })
  @IsString()
  indicatorSlug: string;

  @ApiPropertyOptional({ description: 'CSV column name for country', default: 'country' })
  @IsOptional()
  @IsString()
  countryColumn?: string = 'country';

  @ApiPropertyOptional({ description: 'CSV column name for year', default: 'year' })
  @IsOptional()
  @IsString()
  yearColumn?: string = 'year';

  @ApiPropertyOptional({ description: 'CSV column name for value', default: 'value' })
  @IsOptional()
  @IsString()
  valueColumn?: string = 'value';

  @ApiPropertyOptional({ description: 'Data source attribution' })
  @IsOptional()
  @IsString()
  source?: string = 'CSV Import';
}

export class DeleteDataDto {
  @ApiPropertyOptional({ description: 'Country ID' })
  @IsOptional()
  @IsString()
  countryId?: string;

  @ApiPropertyOptional({ description: 'Indicator ID' })
  @IsOptional()
  @IsString()
  indicatorId?: string;

  @ApiPropertyOptional({ description: 'Year' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;
}

export class RecomputeIndexDto {
  @ApiProperty({ description: 'Year to recompute' })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2030)
  year: number;
}

export class UpdateRoleDto {
  @ApiProperty({ description: 'New role', enum: ['PUBLIC', 'REGISTERED', 'RESEARCHER', 'CONTRIBUTOR', 'INSTITUTIONAL', 'ADMIN'] })
  @IsString()
  role: string;
}

export class ListUsersDto {
  @ApiPropertyOptional({ description: 'Search by name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by role' })
  @IsOptional()
  @IsString()
  role?: string;

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
  @Max(100)
  pageSize?: number = 20;
}
