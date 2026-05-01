import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CountryReportsService } from './country-reports.service';

@ApiTags('country-reports')
@Controller('country-reports')
export class CountryReportsController {
  constructor(private readonly service: CountryReportsService) {}

  @Get(':countryRef')
  @ApiOperation({
    summary:
      'Real-data overlay for the Promise Kept · Promise Broken country report card. Returns only the fields we can derive from IndicatorValue rows; the frontend merges these on top of the parametric defaults.',
  })
  get(@Param('countryRef') countryRef: string) {
    return this.service.getCountryReport(countryRef);
  }
}
