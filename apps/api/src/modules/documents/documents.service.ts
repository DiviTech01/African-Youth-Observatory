import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { R2Service } from '../content/r2.service';
import { DocumentUploadDto, DocumentTypeName, PkpbExtractedSummary } from './documents.dto';

const ACCEPTED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'text/plain',
]);

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly r2: R2Service,
  ) {}

  async upload(file: Express.Multer.File, dto: DocumentUploadDto, uploadedById: string | null) {
    if (!file) throw new BadRequestException('No file received');
    if (!ACCEPTED_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Accepted: PDF, DOCX, DOC, PPTX, PPT, TXT.`,
      );
    }

    if (dto.type === 'PKPB_REPORT' && !dto.countryId) {
      throw new BadRequestException('countryId is required for PKPB_REPORT uploads');
    }

    if (dto.countryId) {
      const country = await this.prisma.country.findUnique({ where: { id: dto.countryId } });
      if (!country) throw new BadRequestException(`Unknown countryId: ${dto.countryId}`);
    }

    let extractedText: string | null = null;
    if (file.mimetype === 'application/pdf') {
      extractedText = await this.extractPdfText(file.buffer);
    } else if (file.mimetype === 'text/plain') {
      extractedText = file.buffer.toString('utf-8').slice(0, 200_000);
    }

    let extractedSummary: PkpbExtractedSummary | null = null;
    if (dto.extractedSummary) {
      try {
        const parsed = JSON.parse(dto.extractedSummary);
        if (parsed && typeof parsed === 'object') extractedSummary = parsed;
      } catch {
        throw new BadRequestException('extractedSummary is not valid JSON');
      }
    }

    const { key } = await this.r2.uploadFile(file, this.prefixFor(dto.type, dto.countryId));

    const created = await this.prisma.document.create({
      data: {
        type: dto.type as any,
        title: dto.title,
        description: dto.description ?? null,
        countryId: dto.countryId ?? null,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        storageKey: key,
        extractedText,
        extractedSummary: extractedSummary as any,
        source: dto.source ?? null,
        edition: dto.edition ?? null,
        year: dto.year ?? null,
        uploadedById,
      },
      include: { country: { select: { id: true, name: true, isoCode3: true } } },
    });

    return this.serialize(created);
  }

  async list(filter: { countryId?: string; type?: DocumentTypeName; limit?: number }) {
    const docs = await this.prisma.document.findMany({
      where: {
        countryId: filter.countryId,
        type: filter.type as any,
        status: 'PUBLISHED',
      },
      orderBy: { createdAt: 'desc' },
      take: filter.limit ?? 100,
      include: { country: { select: { id: true, name: true, isoCode3: true } } },
    });
    return docs.map((d) => this.serialize(d, { withText: false }));
  }

  async getById(id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: { country: { select: { id: true, name: true, isoCode3: true } } },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return this.serialize(doc);
  }

  /**
   * Latest published PKPB report for a country. Used by the PKPB country page.
   * Country lookup accepts either Prisma id, ISO3 code, or country name.
   */
  async getLatestPkpbForCountry(countryRef: string) {
    const country = await this.resolveCountry(countryRef);
    if (!country) throw new NotFoundException(`Country not found: ${countryRef}`);

    const doc = await this.prisma.document.findFirst({
      where: { countryId: country.id, type: 'PKPB_REPORT', status: 'PUBLISHED' },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      include: { country: { select: { id: true, name: true, isoCode3: true } } },
    });

    return { country, document: doc ? this.serialize(doc) : null };
  }

  async getDownloadStream(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    const obj = await this.r2.getObject(doc.storageKey);
    return { ...obj, document: doc };
  }

  async remove(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    try {
      await this.r2.deleteObject(doc.storageKey);
    } catch (err) {
      this.logger.warn(`Failed to delete R2 object ${doc.storageKey}: ${(err as Error).message}`);
    }
    await this.prisma.document.delete({ where: { id } });
    return { ok: true };
  }

  private prefixFor(type: DocumentTypeName, countryId?: string): string {
    const base = {
      PKPB_REPORT: 'documents/pkpb',
      COUNTRY_REPORT: 'documents/country-reports',
      POLICY_DOCUMENT: 'documents/policy',
      RESEARCH_PAPER: 'documents/research',
      OTHER: 'documents/other',
    }[type];
    return countryId ? `${base}/${countryId}` : base;
  }

  private async resolveCountry(ref: string) {
    // Accept id, ISO3, ISO2, exact name, or slug-style ("south-africa" → "South Africa").
    const decoded = decodeURIComponent(ref).trim();
    const slugAsName = decoded.replace(/-/g, ' ');
    const direct = await this.prisma.country.findFirst({
      where: {
        OR: [
          { id: decoded },
          { isoCode3: decoded.toUpperCase() },
          { isoCode2: decoded.toUpperCase() },
          { name: { equals: decoded, mode: 'insensitive' } },
          { name: { equals: slugAsName, mode: 'insensitive' } },
        ],
      },
    });
    return direct;
  }

  private serialize(doc: any, opts: { withText?: boolean } = {}) {
    const withText = opts.withText !== false;
    return {
      id: doc.id,
      type: doc.type,
      title: doc.title,
      description: doc.description,
      country: doc.country,
      countryId: doc.countryId,
      originalFilename: doc.originalFilename,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      source: doc.source,
      edition: doc.edition,
      year: doc.year,
      status: doc.status,
      uploadedById: doc.uploadedById,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      extractedSummary: doc.extractedSummary ?? null,
      extractedText: withText ? doc.extractedText : undefined,
      downloadUrl: `/api/documents/${doc.id}/download`,
    };
  }

  /**
   * Best-effort PDF text extraction. We dynamically import pdf-parse so the
   * server can boot without it (and so the CJS module's startup quirks don't
   * fire at module-load time).
   */
  private async extractPdfText(buffer: Buffer): Promise<string | null> {
    try {
      const mod = await import('pdf-parse');
      const pdfParse: any = (mod as any).default ?? mod;
      const data = await pdfParse(buffer);
      const text: string = data?.text ?? '';
      return text.slice(0, 200_000); // cap to ~200KB of text
    } catch (err) {
      this.logger.warn(`PDF text extraction failed: ${(err as Error).message}`);
      return null;
    }
  }
}
