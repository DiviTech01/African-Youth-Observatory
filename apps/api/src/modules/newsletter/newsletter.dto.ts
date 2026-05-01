import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubscribeDto {
  @ApiProperty({ example: 'student@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ required: false, example: 'landing-hero' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  source?: string;
}
