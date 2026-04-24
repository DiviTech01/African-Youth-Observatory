import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsObject,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ContentTypeDto {
  TEXT = 'TEXT',
  RICH_TEXT = 'RICH_TEXT',
  IMAGE = 'IMAGE',
}

export class ContentStylesDto {
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsString() backgroundColor?: string;
  @IsOptional() @IsString() fontSize?: string;
  @IsOptional() @IsString() fontWeight?: string;
  @IsOptional() @IsString() fontStyle?: string;
  @IsOptional() @IsString() textAlign?: string;
  @IsOptional() @IsString() letterSpacing?: string;
  @IsOptional() @IsString() lineHeight?: string;
  @IsOptional() @IsString() textDecoration?: string;
  @IsOptional() @IsString() textTransform?: string;
}

export class ListEntriesDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() page?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() section?: string;
  @ApiPropertyOptional({ enum: ContentTypeDto }) @IsOptional() @IsEnum(ContentTypeDto) contentType?: ContentTypeDto;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: 'published' | 'draft' | 'new' | 'all';
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) pageNum?: number = 1;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(500) pageSize?: number = 100;
}

export class UpsertDraftDto {
  @ApiProperty() @IsString() content!: string;
  @ApiPropertyOptional({ type: ContentStylesDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ContentStylesDto)
  styles?: ContentStylesDto;
  @ApiPropertyOptional() @IsOptional() @IsString() imageUrl?: string;
}

export class RevertDto {
  @ApiProperty() @IsString() revisionId!: string;
}

export class SyncRegistryEntryDto {
  @ApiProperty() @IsString() key!: string;
  @ApiProperty() @IsString() page!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() section?: string;
  @ApiPropertyOptional({ enum: ContentTypeDto }) @IsOptional() @IsEnum(ContentTypeDto) contentType?: ContentTypeDto;
  @ApiPropertyOptional() @IsOptional() @IsString() defaultContent?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() defaultStyles?: Record<string, string>;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class SyncRegistryDto {
  @ApiProperty({ type: [SyncRegistryEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncRegistryEntryDto)
  entries!: SyncRegistryEntryDto[];
}

export class PublishedQueryDto {
  @ApiPropertyOptional({ description: 'Include drafts (admin only)' })
  @IsOptional()
  @IsString()
  preview?: string;
}
