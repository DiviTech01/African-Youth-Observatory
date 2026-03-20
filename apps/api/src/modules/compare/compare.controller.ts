import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CompareService } from './compare.service';
import { CompareCountriesDto, CompareRegionsDto, CompareThemesDto } from './compare.dto';

@ApiTags('compare')
@Controller('compare')
export class CompareController {
  constructor(private readonly compareService: CompareService) {}

  @Post('countries')
  @ApiOperation({
    summary: 'Compare multiple countries across indicators',
    description: 'Returns per-indicator rank, percentile, regional and continental averages for selected countries.',
  })
  compareCountries(@Body() dto: CompareCountriesDto) {
    return this.compareService.compareCountries(dto);
  }

  @Get('regions')
  @ApiOperation({
    summary: 'Compare all 5 regions on a given indicator',
    description: 'Returns average, median, min/max country, and data availability per region.',
  })
  compareRegions(@Query() dto: CompareRegionsDto) {
    return this.compareService.compareRegions(dto);
  }

  @Get('themes')
  @ApiOperation({
    summary: 'Compare a single country across all themes',
    description: 'Shows normalized score, rank, best/worst indicator per theme for one country.',
  })
  compareThemes(@Query() dto: CompareThemesDto) {
    return this.compareService.compareThemes(dto);
  }
}
