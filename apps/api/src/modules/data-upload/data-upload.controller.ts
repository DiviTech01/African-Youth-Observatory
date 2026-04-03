import {
  Controller, Post, Get, Delete, Param, Body, Req, Res,
  UseInterceptors, UploadedFile, UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { DataUploadService } from './data-upload.service';
import { UploadConfigDto } from './data-upload.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('data-upload')
@ApiBearerAuth()
@Controller('data-upload')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DataUploadController {
  constructor(private readonly uploadService: DataUploadService) {}

  @Post('file')
  @Roles('CONTRIBUTOR', 'ADMIN')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a CSV or XLSX file for import preview' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('config') configJson: string,
    @Req() req: Request,
  ) {
    const config: UploadConfigDto = JSON.parse(configJson);
    const userId = (req as any).user?.id || 'anonymous';
    const job = await this.uploadService.uploadFile(file, userId, config);
    // Return without parsedValues (too large for response)
    const { parsedValues, ...rest } = job as any;
    return rest;
  }

  @Get('preview/:jobId')
  @Roles('CONTRIBUTOR', 'ADMIN')
  @ApiOperation({ summary: 'Preview parsed data before committing' })
  getPreview(@Param('jobId') jobId: string, @Req() req: Request) {
    const userId = (req as any).user?.id || '';
    return this.uploadService.getPreview(jobId, userId);
  }

  @Post('commit/:jobId')
  @Roles('CONTRIBUTOR', 'ADMIN')
  @ApiOperation({ summary: 'Commit previewed data to the database' })
  async commitJob(@Param('jobId') jobId: string, @Req() req: Request) {
    const userId = (req as any).user?.id || '';
    return this.uploadService.commitJob(jobId, userId);
  }

  @Get('history')
  @Roles('CONTRIBUTOR', 'ADMIN')
  @ApiOperation({ summary: 'List past uploads by this user (admin sees all)' })
  getHistory(@Req() req: Request) {
    const user = (req as any).user;
    return this.uploadService.getHistory(user?.id || '', user?.role === 'ADMIN');
  }

  @Get('history/:id')
  @Roles('CONTRIBUTOR', 'ADMIN')
  @ApiOperation({ summary: 'Details of a specific upload' })
  getHistoryDetail(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.uploadService.getHistoryDetail(id, user?.id || '', user?.role === 'ADMIN');
  }

  @Delete('history/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete an upload record (admin only)' })
  deleteUpload(@Param('id') id: string) {
    return this.uploadService.deleteUpload(id);
  }

  @Get('needed')
  @Roles('CONTRIBUTOR', 'ADMIN')
  @ApiOperation({ summary: 'List data gaps — what data is missing and needed' })
  getNeeded() {
    return this.uploadService.getDataNeeds();
  }

  @Get('indicators')
  @Roles('CONTRIBUTOR', 'ADMIN')
  @ApiOperation({ summary: 'List all indicators with expected format for column mapping' })
  getIndicators() {
    return this.uploadService.getIndicatorsForMapping();
  }

  @Get('templates')
  @Roles('CONTRIBUTOR', 'ADMIN')
  @ApiOperation({ summary: 'List available upload template formats' })
  getTemplates() {
    return this.uploadService.getTemplates();
  }

  @Get('templates/:slug')
  @Roles('CONTRIBUTOR', 'ADMIN')
  @ApiOperation({ summary: 'Download a CSV template with pre-filled country names' })
  async downloadTemplate(@Param('slug') slug: string, @Res() res: Response) {
    const csv = await this.uploadService.downloadTemplate(slug);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${slug}-template.csv"`);
    res.send(csv);
  }
}
