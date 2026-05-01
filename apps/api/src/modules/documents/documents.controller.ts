import {
  Controller, Post, Get, Delete, Param, Query, Body, Req, Res,
  UseInterceptors, UploadedFile, UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { DocumentsService } from './documents.service';
import { DocumentUploadDto, DocumentTypeName, DOCUMENT_TYPES } from './documents.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CONTRIBUTOR', 'ADMIN')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a report or document. Routes to country PKPB page when type=PKPB_REPORT.' })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const dto: DocumentUploadDto = {
      type: body.type as DocumentTypeName,
      title: body.title,
      description: body.description,
      countryId: body.countryId,
      source: body.source,
      edition: body.edition,
      year: body.year ? parseInt(body.year, 10) : undefined,
      extractedSummary: body.extractedSummary,
    };
    const userId = (req as any).user?.id ?? null;
    return this.documents.upload(file, dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List published documents, filterable by country and type.' })
  @ApiQuery({ name: 'countryId', required: false })
  @ApiQuery({ name: 'type', required: false, enum: DOCUMENT_TYPES })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  list(
    @Query('countryId') countryId?: string,
    @Query('type') type?: DocumentTypeName,
    @Query('limit') limit?: string,
  ) {
    return this.documents.list({
      countryId,
      type,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('by-country/:countryRef/pkpb')
  @ApiOperation({ summary: 'Latest PKPB report for a country (id, ISO3, or name).' })
  pkpb(@Param('countryRef') countryRef: string) {
    return this.documents.getLatestPkpbForCountry(countryRef);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single document including extracted text.' })
  getOne(@Param('id') id: string) {
    return this.documents.getById(id);
  }

  @Get(':id/download')
  @ApiOperation({
    summary: 'Stream the original file from storage. Pass ?disposition=inline to embed (e.g. iframe preview).',
  })
  @ApiQuery({ name: 'disposition', required: false, enum: ['attachment', 'inline'] })
  async download(
    @Param('id') id: string,
    @Query('disposition') disposition: 'attachment' | 'inline' | undefined,
    @Res() res: Response,
  ) {
    const { body, contentType, contentLength, document } = await this.documents.getDownloadStream(id);
    res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    const safeName = document.originalFilename.replace(/[^\w.\- ]+/g, '_');
    const mode = disposition === 'inline' ? 'inline' : 'attachment';
    res.setHeader('Content-Disposition', `${mode}; filename="${safeName}"`);
    body.pipe(res);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a document (admin only). Removes the R2 object too.' })
  remove(@Param('id') id: string) {
    return this.documents.remove(id);
  }
}
