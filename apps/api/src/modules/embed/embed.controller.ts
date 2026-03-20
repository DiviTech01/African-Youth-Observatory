import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { EmbedService } from './embed.service';
import { EmbedChartDto, EmbedStatDto, EmbedMapDto } from './embed.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('embed')
@Controller('embed')
export class EmbedController {
  constructor(private readonly embedService: EmbedService) {}

  @Get('chart')
  @Public()
  @ApiOperation({
    summary: 'Get embeddable chart (HTML)',
    description:
      'Returns a self-contained HTML page with a Chart.js chart, designed for iframe embedding. Supports bar and line chart types.',
  })
  async getChart(@Query() dto: EmbedChartDto, @Res() res: Response) {
    const html = await this.embedService.generateChart(dto.type, dto.indicator, {
      year: dto.year,
      country: dto.country,
      limit: dto.limit,
      sort: dto.sort,
      theme: dto.theme,
      yearStart: dto.yearStart,
      yearEnd: dto.yearEnd,
    });

    this.setEmbedHeaders(res);
    res.send(html);
  }

  @Get('stat')
  @Public()
  @ApiOperation({
    summary: 'Get embeddable stat card (HTML)',
    description:
      'Returns a styled HTML stat card showing a single indicator value for a country, with trend arrow.',
  })
  async getStat(@Query() dto: EmbedStatDto, @Res() res: Response) {
    const html = await this.embedService.generateStatCard(
      dto.indicator,
      dto.country,
      dto.year,
      dto.theme,
    );

    this.setEmbedHeaders(res);
    res.send(html);
  }

  @Get('map')
  @Public()
  @ApiOperation({
    summary: 'Get embeddable map (HTML + SVG)',
    description:
      'Returns an SVG-based regional map showing indicator values with color coding.',
  })
  async getMap(@Query() dto: EmbedMapDto, @Res() res: Response) {
    const html = await this.embedService.generateMap(dto.indicator, dto.year, dto.theme);

    this.setEmbedHeaders(res);
    res.send(html);
  }

  @Get('config')
  @Public()
  @ApiOperation({
    summary: 'Get embed configuration and examples',
    description: 'Returns embed instructions, example iframe codes, and available parameters.',
  })
  getConfig() {
    return this.embedService.getEmbedConfig();
  }

  private setEmbedHeaders(res: Response) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Content-Security-Policy', 'frame-ancestors *');
    res.setHeader('Cache-Control', 'public, max-age=1800');
  }
}
