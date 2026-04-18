import { IsOptional, IsInt, IsString, IsBoolean, IsEmail, IsArray, Min, Max, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ExpertSearchDto {
  @ApiPropertyOptional({ description: 'Search by name, title, organization, or bio' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by country ID' })
  @IsOptional()
  @IsString()
  countryId?: string;

  @ApiPropertyOptional({ description: 'Filter by region (e.g. WEST_AFRICA)' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'Filter by specialization keyword' })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional({ description: 'Filter by language' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Filter by verification status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  verified?: boolean;

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

export class CreateExpertDto {
  @ApiProperty({ description: 'Full name' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Professional title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Organization name' })
  @IsOptional()
  @IsString()
  organization?: string;

  @ApiProperty({ description: 'Country ID' })
  @IsString()
  countryId: string;

  @ApiProperty({ description: 'List of specializations', type: [String] })
  @IsArray()
  @IsString({ each: true })
  specializations: string[];

  @ApiProperty({ description: 'Languages spoken', type: [String] })
  @IsArray()
  @IsString({ each: true })
  languages: string[];

  @ApiPropertyOptional({ description: 'Short biography' })
  @IsOptional()
  @IsString()
  bio?: string;
}

export class UpdateExpertDto {
  @ApiPropertyOptional({ description: 'Full name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Professional title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Organization name' })
  @IsOptional()
  @IsString()
  organization?: string;

  @ApiPropertyOptional({ description: 'Country ID' })
  @IsOptional()
  @IsString()
  countryId?: string;

  @ApiPropertyOptional({ description: 'List of specializations', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializations?: string[];

  @ApiPropertyOptional({ description: 'Languages spoken', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({ description: 'Short biography' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'Verification status (admin only)' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional({ description: 'Approval status: PENDING, APPROVED, REJECTED (admin only)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Reason for rejection (admin only)' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
