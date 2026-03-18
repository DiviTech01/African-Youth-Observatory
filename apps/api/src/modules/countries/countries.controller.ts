import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { CountriesService } from './countries.service';
import { ListCountriesDto, CountryStatsQueryDto } from './countries.dto';

@ApiTags('countries')
@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  @ApiOperation({ summary: 'List all countries with optional filtering' })
  findAll(@Query() query: ListCountriesDto) {
    return this.countriesService.findAll(query);
  }

  @Get('regions')
  @ApiOperation({ summary: 'List all 5 regions with country counts' })
  getRegions() {
    return this.countriesService.getRegions();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single country by ID' })
  @ApiParam({ name: 'id', description: 'Country ID (cuid)' })
  findById(@Param('id') id: string) {
    return this.countriesService.findById(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get country statistics summary' })
  @ApiParam({ name: 'id', description: 'Country ID (cuid)' })
  getStats(@Param('id') id: string, @Query() query: CountryStatsQueryDto) {
    return this.countriesService.getStats(id, query);
  }
}
