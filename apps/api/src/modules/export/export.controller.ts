import { Controller, Get, Query, Res, Param, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { ExportService } from './export.service';
import { ExportQueryDto } from './export.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('export')
@Controller('export')
@Throttle({ medium: { ttl: 60000, limit: 10 } })
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Public()
  @Get('csv')
  @ApiOperation({ summary: 'Export filtered data as CSV' })
  async exportCsv(
    @Query() query: ExportQueryDto,
    @Res() res: Response,
    @Request() req: { user?: { role: string } },
  ) {
    const role = req.user?.role || null;
    const maxRows = !role ? 100 : role === 'REGISTERED' ? 10000 : 50000;

    const rows = await this.exportService.fetchData(query, maxRows);
    this.exportService.checkLimits(role, rows.length);

    const csv = this.exportService.generateCsv(rows, query);
    const filename = query.filename || `ayd-export-${Date.now()}`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    res.send(csv);
  }

  @Public()
  @Get('json')
  @ApiOperation({ summary: 'Export filtered data as JSON' })
  async exportJson(
    @Query() query: ExportQueryDto,
    @Res() res: Response,
    @Request() req: { user?: { role: string } },
  ) {
    const role = req.user?.role || null;
    const maxRows = !role ? 100 : role === 'REGISTERED' ? 10000 : 50000;

    const rows = await this.exportService.fetchData(query, maxRows);
    this.exportService.checkLimits(role, rows.length);

    const json = this.exportService.generateJson(rows, query);
    const filename = query.filename || `ayd-export-${Date.now()}`;

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
    res.send(json);
  }

  @Public()
  @Get('excel')
  @ApiOperation({ summary: 'Export filtered data as Excel (SpreadsheetML XML)' })
  async exportExcel(
    @Query() query: ExportQueryDto,
    @Res() res: Response,
    @Request() req: { user?: { role: string } },
  ) {
    const role = req.user?.role || null;
    const maxRows = !role ? 100 : role === 'REGISTERED' ? 10000 : 50000;

    const rows = await this.exportService.fetchData(query, maxRows);
    this.exportService.checkLimits(role, rows.length);

    const xml = this.exportService.generateExcel(rows, query);
    const filename = query.filename || `ayd-export-${Date.now()}`;

    res.setHeader(
      'Content-Type',
      'application/vnd.ms-excel',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xls"`);
    res.send(xml);
  }

  @Public()
  @Get('pdf/:countryId')
  @ApiParam({ name: 'countryId', description: 'Country ID for the report' })
  @ApiOperation({ summary: 'Export a country profile report (HTML, print to PDF)' })
  async exportCountryReport(
    @Param('countryId') countryId: string,
    @Res() res: Response,
  ) {
    const html = await this.exportService.generateCountryReport(countryId);
    const filename = `ayd-country-report-${Date.now()}`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.html"`);
    res.send(html);
  }
}
