import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NlqQueryDto {
  @ApiProperty({
    example: 'What is the youth unemployment rate in Nigeria?',
    description: 'Natural language question about African youth data',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  question!: string;

  @ApiPropertyOptional({ default: 'en' })
  @IsOptional()
  @IsString()
  language?: string = 'en';
}
