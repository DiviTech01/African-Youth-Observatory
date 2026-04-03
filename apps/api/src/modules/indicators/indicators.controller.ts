import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { IndicatorsService } from './indicators.service';
import { ListIndicatorsDto, IndicatorValuesQueryDto } from './indicators.dto';

@ApiTags('indicators')
@Controller('indicators')
export class IndicatorsController {
  constructor(private readonly indicatorsService: IndicatorsService) {}

  @Get()
  @ApiOperation({ summary: 'List all indicators with optional theme filter and search' })
  findAll(@Query() query: ListIndicatorsDto) {
    return this.indicatorsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single indicator with metadata' })
  @ApiParam({ name: 'id', description: 'Indicator ID (cuid)' })
  findById(@Param('id') id: string) {
    return this.indicatorsService.findById(id);
  }

  @Get(':id/values')
  @ApiOperation({ summary: 'Get values for this indicator with filters' })
  @ApiParam({ name: 'id', description: 'Indicator ID (cuid)' })
  getValues(@Param('id') id: string, @Query() query: IndicatorValuesQueryDto) {
    return this.indicatorsService.getValues(id, query);
  }
}
