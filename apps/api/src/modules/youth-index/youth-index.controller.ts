import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { YouthIndexService } from './youth-index.service';
import { YouthIndexQueryDto, TopPerformersDto } from './youth-index.dto';

@ApiTags('youth-index')
@Controller('youth-index')
export class YouthIndexController {
  constructor(private readonly youthIndexService: YouthIndexService) {}

  @Get('rankings')
  @ApiOperation({ summary: 'Get all countries ranked by youth index' })
  getRankings(@Query() query: YouthIndexQueryDto) {
    return this.youthIndexService.getRankings(query.year ?? 2024);
  }

  @Get('top/:n')
  @ApiOperation({ summary: 'Get top N performing countries' })
  @ApiParam({ name: 'n', description: 'Number of top countries to return' })
  getTopPerformers(
    @Param('n') n: number,
    @Query() query: YouthIndexQueryDto,
  ) {
    return this.youthIndexService.getTopPerformers(+n, query.year ?? 2024);
  }

  @Get('most-improved/:n')
  @ApiOperation({ summary: 'Get N most improved countries by rank change' })
  @ApiParam({ name: 'n', description: 'Number of countries to return' })
  getMostImproved(
    @Param('n') n: number,
    @Query() query: YouthIndexQueryDto,
  ) {
    return this.youthIndexService.getMostImproved(+n, query.year ?? 2024);
  }

  @Get(':countryId')
  @ApiOperation({ summary: 'Get youth index detail for a single country' })
  @ApiParam({ name: 'countryId', description: 'Country ID (cuid)' })
  getByCountry(@Param('countryId') countryId: string) {
    return this.youthIndexService.getByCountry(countryId);
  }
}
