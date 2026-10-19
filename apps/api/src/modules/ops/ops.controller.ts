import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { OpsService } from './ops.service';
import { ServiceTokenGuard } from '../auth/guards/service-token.guard';

/**
 * Operator status and headline numbers, for headless consumers.
 *
 * Guarded by ServiceTokenGuard (static bearer token, read-only) rather than the
 * Supabase JWT + @Roles('ADMIN') pair used by AdminController. Same numbers, but
 * reaching them must not require a credential that can also delete users or
 * wipe indicator values.
 *
 * `GET /api/health` is intentionally NOT here — it stays public and unauthed so
 * a consumer can tell "the platform is down" apart from "my token is broken".
 */
@ApiTags('ops')
@Controller('ops')
@UseGuards(ServiceTokenGuard)
@ApiBearerAuth()
// One voice query can trigger a status check; 30/min is generous for a single
// assistant and still caps a leaked token's usefulness.
@Throttle({ medium: { ttl: 60000, limit: 30 } })
export class OpsController {
  constructor(private readonly ops: OpsService) {}

  @Get('status')
  @ApiOperation({
    summary: 'Is the platform up, and what is broken',
    description:
      'Rolls up the API, database, public website, Supabase Auth, R2 storage, Resend email and the AI layer into one status plus a plain-language problems list. All checks are free by default: AI health comes from the last real call or a cached probe. Pass deep=1 to force a real (paid, 1-token, cached) round trip to Anthropic.',
  })
  @ApiQuery({ name: 'deep', required: false, description: '1 = run the paid Anthropic probe' })
  getStatus(@Query('deep') deep?: string) {
    return this.ops.getStatus({ deep: deep === '1' || deep === 'true' });
  }

  @Get('users')
  @ApiOperation({
    summary: 'Signup and engagement counts',
    description:
      'Total registered users, new signups this week and month, active users, role breakdown, and newsletter subscribers. Counts only — no names, emails or per-user records.',
  })
  getUsers() {
    return this.ops.getUsers();
  }

  @Get('numbers')
  @ApiOperation({
    summary: 'Headline platform numbers',
    description:
      'Countries, indicators, themes, data points, year coverage, indexed countries, experts, policies, documents, users and subscribers in a single call.',
  })
  getNumbers() {
    return this.ops.getNumbers();
  }
}
