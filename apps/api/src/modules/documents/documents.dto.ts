import { IsString, IsOptional, IsInt, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const DOCUMENT_TYPES = ['PKPB_REPORT', 'COUNTRY_REPORT', 'POLICY_DOCUMENT', 'RESEARCH_PAPER', 'OTHER'] as const;
export type DocumentTypeName = (typeof DOCUMENT_TYPES)[number];

export class DocumentUploadDto {
  @ApiProperty({ enum: DOCUMENT_TYPES })
  @IsEnum(DOCUMENT_TYPES)
  type!: DocumentTypeName;

  @ApiProperty()
  @IsString()
  @MaxLength(300)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'Country ID. Required for PKPB_REPORT.' })
  @IsOptional()
  @IsString()
  countryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  edition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  year?: number;

  /**
   * Structured PKPB summary as JSON (string-encoded in multipart).
   * See PkpbExtractedSummary for the expected shape — every field is optional;
   * the contributor fills what they have.
   */
  @ApiPropertyOptional({ description: 'JSON-encoded PkpbExtractedSummary; see service.' })
  @IsOptional()
  @IsString()
  extractedSummary?: string;
}

export interface PromiseItem { title: string; desc: string; stat: string }
export interface PkpbLegislation { name: string; year: string; status: 'active' | 'partial' | 'weak' | 'new'; reality: string }
export interface PkpbRecommendation { num: string; title: string; desc: string }

export interface PkpbExtractedSummary {
  edition?: string;
  reviewedDate?: string;
  nextReview?: string;
  ayemiScore?: number;
  ayemiTier?: 'Critical' | 'Developing' | 'Fulfilling';
  executiveBrief?: string;
  pullQuote?: string;
  postQuote?: string;
  promiseKept?: PromiseItem[];
  promiseBroken?: PromiseItem[];
  recommendations?: PkpbRecommendation[];
  legislation?: PkpbLegislation[];
}
