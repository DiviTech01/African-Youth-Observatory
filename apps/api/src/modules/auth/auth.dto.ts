import { IsEmail, IsString, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organization?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;
}

export class ContactFormDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organization?: string;

  @ApiProperty({ example: 'General Inquiry' })
  @IsString()
  inquiryType!: string;

  @ApiProperty({ example: 'Data partnership request' })
  @IsString()
  @MaxLength(200)
  subject!: string;

  @ApiProperty({ example: 'I would like to discuss...' })
  @IsString()
  @MaxLength(5000)
  message!: string;
}
