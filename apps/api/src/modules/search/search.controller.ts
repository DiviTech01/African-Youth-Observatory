import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SearchService } from './search.service';
import { SearchDto } from './search.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('search')
@Controller('search')
@Throttle({ medium: { ttl: 60000, limit: 30 } })
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Global search across all entity types',
    description:
      'Searches countries, indicators, themes, experts, and dashboards with relevance scoring. Powers the navbar search bar.',
  })
  search(@Query() dto: SearchDto) {
    return this.searchService.search(dto.q, dto.types, dto.limit);
  }
}
