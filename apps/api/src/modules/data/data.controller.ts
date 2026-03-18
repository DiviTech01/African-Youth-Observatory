import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DataService } from './data.service';
import {
  DataValuesQueryDto,
  TimeSeriesQueryDto,
  MapDataQueryDto,
  ComparisonQueryDto,
  RegionalAveragesQueryDto,
  BarChartQueryDto,
  RegionalSummaryQueryDto,
} from './data.dto';

@ApiTags('data')
@Controller('data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Get('values')
  @ApiOperation({ summary: 'Get filtered indicator values with pagination' })
  getValues(@Query() query: DataValuesQueryDto) {
    return this.dataService.getValues(query);
  }

  @Get('timeseries')
  @ApiOperation({ summary: 'Get time series for a specific indicator + country' })
  getTimeSeries(@Query() query: TimeSeriesQueryDto) {
    return this.dataService.getTimeSeries(query);
  }

  @Get('map')
  @ApiOperation({ summary: 'Get choropleth map data — all 54 countries (null if no data)' })
  getMapData(@Query() query: MapDataQueryDto) {
    return this.dataService.getMapData(query);
  }

  @Get('comparison')
  @ApiOperation({ summary: 'Compare multiple countries on indicators with regional averages' })
  getComparison(@Query() query: ComparisonQueryDto) {
    return this.dataService.getComparison(query);
  }

  @Get('regional-averages')
  @ApiOperation({ summary: 'Get average indicator values by region' })
  getRegionalAverages(@Query() query: RegionalAveragesQueryDto) {
    return this.dataService.getRegionalAverages(query);
  }

  @Get('bar-chart')
  @ApiOperation({ summary: 'Get top/bottom N countries for a given indicator' })
  getBarChart(@Query() query: BarChartQueryDto) {
    return this.dataService.getBarChart(query);
  }

  @Get('regional-summary')
  @ApiOperation({ summary: 'Get per-region summary with best/worst performers' })
  getRegionalSummary(@Query() query: RegionalSummaryQueryDto) {
    return this.dataService.getRegionalSummary(query);
  }
}
