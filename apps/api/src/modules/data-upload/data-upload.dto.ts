import { IsString, IsNotEmpty, IsOptional, IsInt, IsArray, IsEnum, ValidateNested, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ColumnMappingDto {
  @ApiProperty() @IsString() column: string;
  @ApiProperty() @IsString() indicatorSlug: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() year?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() gender?: 'MALE' | 'FEMALE' | 'TOTAL';
  @ApiPropertyOptional() @IsOptional() @IsString() ageGroup?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() transform?: 'none' | 'multiply_1000' | 'divide_100' | 'invert';
}

export class UploadConfigDto {
  @ApiPropertyOptional() @IsOptional() @IsString() sheetName?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() headerRow?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() skipRows?: number;

  @ApiProperty() @IsString() countryColumn: string;
  @ApiProperty() @IsString() countryFormat: 'name' | 'iso2' | 'iso3';

  @ApiProperty({ type: [ColumnMappingDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColumnMappingDto)
  mappings: ColumnMappingDto[];

  // Required and non-empty: provenance is never defaulted (audit C7).
  @ApiProperty() @IsString() @IsNotEmpty() source: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() year?: number;
}
