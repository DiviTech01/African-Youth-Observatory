import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ThemesService } from './themes.service';
import { ThemeStatsQueryDto } from './themes.dto';

@ApiTags('themes')
@Controller('themes')
export class ThemesController {
  constructor(private readonly themesService: ThemesService) {}

  @Get()
  @ApiOperation({ summary: 'List all 9 themes with indicator counts' })
  findAll() {
    return this.themesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single theme with its indicators' })
  @ApiParam({ name: 'id', description: 'Theme ID (cuid)' })
  findById(@Param('id') id: string) {
    return this.themesService.findById(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get theme statistics' })
  @ApiParam({ name: 'id', description: 'Theme ID (cuid)' })
  getStats(@Param('id') id: string, @Query() query: ThemeStatsQueryDto) {
    return this.themesService.getStats(id, query.year ?? 2024);
  }
}
