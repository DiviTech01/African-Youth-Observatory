import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ContentService } from './content.service';
import { R2Service } from './r2.service';
import {
  ListEntriesDto,
  UpsertDraftDto,
  RevertDto,
  SyncRegistryDto,
  PublishedQueryDto,
} from './content.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

const ALLOWED_IMAGE_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
]);

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(
    private readonly contentService: ContentService,
    private readonly r2: R2Service,
  ) {}

  @Get('published')
  @ApiOperation({ summary: 'Get the full published content map for the site' })
  async getPublished(@Query() query: PublishedQueryDto, @Req() req: Request) {
    const wantsPreview = query.preview === '1' || query.preview === 'true';
    const user = (req as any).user;
    const isAdmin = user?.role === 'ADMIN';
    const includeDrafts = wantsPreview && isAdmin;
    return this.contentService.getPublishedMap(includeDrafts);
  }

  @Get('entries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all content entries (admin)' })
  list(@Query() query: ListEntriesDto) {
    return this.contentService.listEntries(query);
  }

  @Get('pages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List pages and section counts (admin sidebar)' })
  listPages() {
    return this.contentService.listPages();
  }

  @Get('entries/:key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single entry with draft + published + revisions' })
  @ApiParam({ name: 'key' })
  getOne(@Param('key') key: string) {
    return this.contentService.getEntry(key);
  }

  @Put('entries/:key/draft')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save or update a draft for an entry' })
  saveDraft(@Param('key') key: string, @Body() dto: UpsertDraftDto, @Req() req: Request) {
    const userId = (req as any).user?.id ?? null;
    return this.contentService.upsertDraft(key, dto, userId);
  }

  @Post('entries/:key/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish the current draft of an entry' })
  publish(@Param('key') key: string, @Req() req: Request) {
    const userId = (req as any).user?.id ?? null;
    return this.contentService.publishDraft(key, userId);
  }

  @Post('entries/:key/revert')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Load a historical revision back into the draft' })
  revert(@Param('key') key: string, @Body() dto: RevertDto, @Req() req: Request) {
    const userId = (req as any).user?.id ?? null;
    return this.contentService.revertToRevision(key, dto, userId);
  }

  @Delete('entries/:key/draft')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Discard the pending draft for an entry' })
  discardDraft(@Param('key') key: string, @Req() req: Request) {
    const userId = (req as any).user?.id ?? null;
    return this.contentService.discardDraft(key, userId);
  }

  @Post('sync-registry')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register keys discovered in the frontend bundle' })
  sync(@Body() dto: SyncRegistryDto) {
    return this.contentService.syncRegistry(dto);
  }

  @Post('images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an image to R2 for use in CMS entries' })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('file field is required');
    if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      throw new BadRequestException(`Unsupported mime type: ${file.mimetype}`);
    }
    return this.r2.uploadImage(file);
  }
}
