import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PlatformService } from './platform.service';

@ApiTags('platform')
@Controller('')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('platform/stats')
  @ApiOperation({ summary: 'Get platform-wide statistics (real database query)' })
  getStats() {
    return this.platformService.getStats();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check — database connectivity and uptime' })
  getHealth() {
    return this.platformService.getHealth();
  }

  @Post('admin/clear-cache')
  @ApiOperation({ summary: 'Clear all in-memory cache entries' })
  clearCache() {
    return this.platformService.clearCache();
  }
}
