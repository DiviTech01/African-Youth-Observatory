import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LiveFeedService } from './live-feed.service';
import { Public } from '../auth/decorators/public.decorator';

/**
 * REST fallback endpoints for the WebSocket live feed.
 * Use these if WebSocket is not available or for polling.
 */
@ApiTags('live-feed')
@Controller('live-feed')
export class LiveFeedController {
  constructor(private readonly liveFeedService: LiveFeedService) {}

  @Get('pulse')
  @Public()
  @ApiOperation({
    summary: 'Get platform pulse (REST fallback)',
    description:
      'Returns the same platform stats snapshot as the WebSocket platform_pulse event. Use for polling when WebSocket is unavailable.',
  })
  getPulse() {
    return this.liveFeedService.getPlatformPulse();
  }

  @Get('ticker')
  @Public()
  @ApiOperation({
    summary: 'Get data ticker (REST fallback)',
    description:
      'Returns the current rotating indicator highlight. Same data as the WebSocket data_ticker event.',
  })
  getTicker() {
    return this.liveFeedService.getDataTicker();
  }

  @Get('spotlight')
  @Public()
  @ApiOperation({
    summary: 'Get country spotlight (REST fallback)',
    description:
      'Returns the current featured country spotlight. Same data as the WebSocket spotlight event.',
  })
  getSpotlight() {
    return this.liveFeedService.getSpotlight();
  }
}
