import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { YouthIndexService } from './youth-index.service';
import { YouthIndexCalculatorService } from './youth-index-calculator.service';
import { YouthIndexQueryDto, TopPerformersDto, ComputeYearDto } from './youth-index.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('youth-index')
@Controller('youth-index')
export class YouthIndexController {
  constructor(
    private readonly youthIndexService: YouthIndexService,
    private readonly calculator: YouthIndexCalculatorService,
  ) {}

  @Public()
  @Get('rankings')
  @ApiOperation({ summary: 'Get all countries ranked by youth index' })
  async getRankings(@Query() query: YouthIndexQueryDto) {
    return this.youthIndexService.getRankings(query.year ?? (await this.youthIndexService.latestYear()));
  }

  @Public()
  @Get('top/:n')
  @ApiOperation({ summary: 'Get top N performing countries' })
  @ApiParam({ name: 'n', description: 'Number of top countries to return' })
  async getTopPerformers(
    @Param('n') n: number,
    @Query() query: YouthIndexQueryDto,
  ) {
    return this.youthIndexService.getTopPerformers(+n, query.year ?? (await this.youthIndexService.latestYear()));
  }

  @Public()
  @Get('most-improved/:n')
  @ApiOperation({ summary: 'Get N most improved countries by rank change' })
  @ApiParam({ name: 'n', description: 'Number of countries to return' })
  async getMostImproved(
    @Param('n') n: number,
    @Query() query: YouthIndexQueryDto,
  ) {
    return this.youthIndexService.getMostImproved(+n, query.year ?? (await this.youthIndexService.latestYear()));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('compute')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Compute Youth Index for a specific year (admin only)' })
  computeForYear(@Body() body: ComputeYearDto) {
    return this.calculator.computeForYear(body.year);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('compute-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Compute Youth Index for every year that has data (admin only)' })
  computeAll() {
    return this.calculator.computeAll();
  }

  @Public()
  @Get(':countryId')
  @ApiOperation({ summary: 'Get youth index detail for a single country' })
  @ApiParam({ name: 'countryId', description: 'Country ID (cuid)' })
  getByCountry(@Param('countryId') countryId: string) {
    return this.youthIndexService.getByCountry(countryId);
  }
}
