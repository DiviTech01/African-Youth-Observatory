import { Body, Controller, Delete, HttpCode, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { NotificationsService } from './notifications.service';
import { RegisterPushTokenDto, UnregisterPushTokenDto } from './notifications.dto';
import { verifiedSubject } from '../../common/guards/user-throttler.guard';

/**
 * Push-token registry for the mobile app. Public on purpose — the app registers
 * its device token before (and whether or not) anyone signs in. A valid bearer
 * token, when present, links the device to that user; an invalid one is
 * ignored rather than rejected, so a stale session never blocks registration.
 */
@ApiTags('notifications')
@Controller('notifications')
// A device registers once per app start; 20/min per caller is ample and keeps
// the public write path from being used to fill the table.
@Throttle({ medium: { ttl: 60000, limit: 20 } })
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('register')
  @HttpCode(200)
  @ApiOperation({ summary: 'Register (or refresh) an Expo push token for this device' })
  async register(@Body() dto: RegisterPushTokenDto, @Req() req: any) {
    const userId = await verifiedSubject(req.headers?.authorization);
    return this.notifications.register({ ...dto, userId });
  }

  @Delete('register')
  @ApiOperation({ summary: 'Forget an Expo push token (user turned notifications off)' })
  unregister(@Body() dto: UnregisterPushTokenDto) {
    return this.notifications.unregister(dto.token);
  }
}
