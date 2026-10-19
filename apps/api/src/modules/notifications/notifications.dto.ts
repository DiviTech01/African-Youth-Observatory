import { IsIn, IsObject, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Expo push tokens look like `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]` (older
 * SDKs: `ExpoPushToken[...]`). Anything else is rejected so the table cannot be
 * used as a free-text dump.
 */
export const EXPO_TOKEN_PATTERN = /^Expo(nent)?PushToken\[[A-Za-z0-9_-]{8,128}\]$/;

export class RegisterPushTokenDto {
  @ApiProperty({ example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' })
  @IsString()
  @MaxLength(200)
  @Matches(EXPO_TOKEN_PATTERN, { message: 'token must be an Expo push token' })
  token!: string;

  @ApiProperty({ enum: ['android', 'ios', 'web'], example: 'android' })
  @IsIn(['android', 'ios', 'web'])
  platform!: string;

  @ApiProperty({
    required: false,
    description: 'Per-category opt-ins, e.g. { "myCountry": true, "reports": false }',
  })
  @IsOptional()
  @IsObject()
  categories?: Record<string, unknown>;
}

export class UnregisterPushTokenDto {
  @ApiProperty({ example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' })
  @IsString()
  @MaxLength(200)
  @Matches(EXPO_TOKEN_PATTERN, { message: 'token must be an Expo push token' })
  token!: string;
}
