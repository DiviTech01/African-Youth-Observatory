import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlatformService } from './platform.service';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('platform')
@Controller('')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Public()
  @Get('platform/stats')
  @ApiOperation({ summary: 'Get platform-wide statistics (real database query)' })
  getStats() {
    return this.platformService.getStats();
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check — database connectivity and uptime' })
  getHealth() {
    return this.platformService.getHealth();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin/clear-cache')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear all in-memory cache entries (admin only)' })
  clearCache() {
    return this.platformService.clearCache();
  }
}
