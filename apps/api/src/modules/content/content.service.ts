import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ListEntriesDto,
  UpsertDraftDto,
  RevertDto,
  SyncRegistryDto,
  ContentTypeDto,
} from './content.dto';

type PublishedMap = Record<
  string,
  {
    content: string;
    styles: Record<string, string>;
    imageUrl: string | null;
    contentType: string;
    version: number;
  }
>;

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  async getPublishedMap(includeDrafts = false): Promise<PublishedMap> {
    const entries = await this.prisma.contentEntry.findMany({
      include: {
        published: true,
        draft: includeDrafts,
      },
    });

    const map: PublishedMap = {};
    for (const e of entries) {
      const source =
        includeDrafts && e.draft
          ? {
              content: e.draft.content,
              styles: e.draft.styles,
              imageUrl: e.draft.imageUrl,
              version: e.published?.version ?? 0,
            }
          : e.published
            ? {
                content: e.published.content,
                styles: e.published.styles,
                imageUrl: e.published.imageUrl,
                version: e.published.version,
              }
            : {
                content: e.defaultContent,
                styles: e.defaultStyles,
                imageUrl: null,
                version: 0,
              };

      map[e.key] = {
        content: source.content ?? '',
        styles: (source.styles as Record<string, string>) ?? {},
        imageUrl: source.imageUrl ?? null,
        contentType: e.contentType,
        version: source.version ?? 0,
      };
    }
    return map;
  }

  async listEntries(query: ListEntriesDto) {
    const { search, page, section, contentType, status = 'all', pageNum = 1, pageSize = 100 } = query;

    const where: Record<string, unknown> = {};
    if (page) where.page = page;
    if (section) where.section = section;
    if (contentType) where.contentType = contentType;
    if (search) {
      where.OR = [
        { key: { contains: search, mode: 'insensitive' } },
        { defaultContent: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.contentEntry.findMany({
        where,
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        orderBy: [{ page: 'asc' }, { section: 'asc' }, { key: 'asc' }],
        include: { draft: true, published: true },
      }),
      this.prisma.contentEntry.count({ where }),
    ]);

    const rows = data
      .map((e) => {
        const entryStatus = !e.published
          ? 'new'
          : e.draft && e.draft.updatedAt > e.published.publishedAt
            ? 'draft'
            : 'published';

        if (status !== 'all' && entryStatus !== status) return null;

        return {
          id: e.id,
          key: e.key,
          page: e.page,
          section: e.section,
          contentType: e.contentType,
          description: e.description,
          status: entryStatus,
          currentContent: e.published?.content ?? e.defaultContent ?? '',
          draftContent: e.draft?.content ?? null,
          imageUrl: e.published?.imageUrl ?? null,
          updatedAt: e.updatedAt,
        };
      })
      .filter(Boolean);

    return {
      data: rows,
      total: status === 'all' ? total : rows.length,
      page: pageNum,
      pageSize,
    };
  }

  async getEntry(key: string) {
    const entry = await this.prisma.contentEntry.findUnique({
      where: { key },
      include: {
        draft: true,
        published: true,
        revisions: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
    if (!entry) throw new NotFoundException(`Content entry "${key}" not found`);
    return entry;
  }

  async upsertDraft(key: string, dto: UpsertDraftDto, userId: string | null) {
    const entry = await this.prisma.contentEntry.findUnique({ where: { key } });
    if (!entry) throw new NotFoundException(`Content entry "${key}" not found`);

    const draft = await this.prisma.contentDraft.upsert({
      where: { entryId: entry.id },
      update: {
        content: dto.content ?? '',
        styles: (dto.styles ?? {}) as any,
        imageUrl: dto.imageUrl ?? null,
        updatedById: userId,
      },
      create: {
        entryId: entry.id,
        content: dto.content ?? '',
        styles: (dto.styles ?? {}) as any,
        imageUrl: dto.imageUrl ?? null,
        updatedById: userId,
      },
    });

    await this.prisma.contentRevision.create({
      data: {
        entryId: entry.id,
        content: draft.content,
        styles: draft.styles as any,
        imageUrl: draft.imageUrl,
        version: 0,
        action: 'SAVE_DRAFT',
        actorId: userId,
      },
    });

    return draft;
  }

  async publishDraft(key: string, userId: string | null) {
    const entry = await this.prisma.contentEntry.findUnique({
      where: { key },
      include: { draft: true, published: true },
    });
    if (!entry) throw new NotFoundException(`Content entry "${key}" not found`);
    if (!entry.draft) throw new BadRequestException('No draft to publish');

    const nextVersion = (entry.published?.version ?? 0) + 1;

    const published = await this.prisma.contentPublished.upsert({
      where: { entryId: entry.id },
      update: {
        content: entry.draft.content,
        styles: entry.draft.styles as any,
        imageUrl: entry.draft.imageUrl,
        version: nextVersion,
        publishedById: userId,
        publishedAt: new Date(),
      },
      create: {
        entryId: entry.id,
        content: entry.draft.content,
        styles: entry.draft.styles as any,
        imageUrl: entry.draft.imageUrl,
        version: nextVersion,
        publishedById: userId,
      },
    });

    await this.prisma.contentRevision.create({
      data: {
        entryId: entry.id,
        content: published.content,
        styles: published.styles as any,
        imageUrl: published.imageUrl,
        version: nextVersion,
        action: 'PUBLISH',
        actorId: userId,
      },
    });

    await this.prisma.contentDraft.delete({ where: { entryId: entry.id } });

    return published;
  }

  async revertToRevision(key: string, dto: RevertDto, userId: string | null) {
    const entry = await this.prisma.contentEntry.findUnique({ where: { key } });
    if (!entry) throw new NotFoundException(`Content entry "${key}" not found`);

    const revision = await this.prisma.contentRevision.findUnique({
      where: { id: dto.revisionId },
    });
    if (!revision || revision.entryId !== entry.id) {
      throw new NotFoundException('Revision not found for this entry');
    }

    const draft = await this.prisma.contentDraft.upsert({
      where: { entryId: entry.id },
      update: {
        content: revision.content,
        styles: revision.styles as any,
        imageUrl: revision.imageUrl,
        updatedById: userId,
      },
      create: {
        entryId: entry.id,
        content: revision.content,
        styles: revision.styles as any,
        imageUrl: revision.imageUrl,
        updatedById: userId,
      },
    });

    await this.prisma.contentRevision.create({
      data: {
        entryId: entry.id,
        content: draft.content,
        styles: draft.styles as any,
        imageUrl: draft.imageUrl,
        version: 0,
        action: 'REVERT',
        actorId: userId,
      },
    });

    return draft;
  }

  async discardDraft(key: string, userId: string | null) {
    const entry = await this.prisma.contentEntry.findUnique({
      where: { key },
      include: { draft: true },
    });
    if (!entry) throw new NotFoundException(`Content entry "${key}" not found`);
    if (!entry.draft) return { deleted: false };

    await this.prisma.contentRevision.create({
      data: {
        entryId: entry.id,
        content: entry.draft.content,
        styles: entry.draft.styles as any,
        imageUrl: entry.draft.imageUrl,
        version: 0,
        action: 'DISCARD_DRAFT',
        actorId: userId,
      },
    });

    await this.prisma.contentDraft.delete({ where: { entryId: entry.id } });
    return { deleted: true };
  }

  async syncRegistry(dto: SyncRegistryDto) {
    let created = 0;
    let updated = 0;
    for (const e of dto.entries) {
      const existing = await this.prisma.contentEntry.findUnique({ where: { key: e.key } });
      if (!existing) {
        await this.prisma.contentEntry.create({
          data: {
            key: e.key,
            page: e.page,
            section: e.section ?? null,
            contentType: (e.contentType ?? ContentTypeDto.TEXT) as any,
            defaultContent: e.defaultContent ?? '',
            defaultStyles: (e.defaultStyles ?? {}) as any,
            description: e.description ?? null,
          },
        });
        created++;
      } else {
        // Only update metadata, never clobber content choices made by admins.
        await this.prisma.contentEntry.update({
          where: { key: e.key },
          data: {
            page: e.page,
            section: e.section ?? existing.section,
            description: e.description ?? existing.description,
            defaultContent: e.defaultContent ?? existing.defaultContent,
          },
        });
        updated++;
      }
    }
    return { created, updated, total: dto.entries.length };
  }

  async checkDrift(localKeys: string[]) {
    const localSet = new Set(localKeys);
    const allEntries = await this.prisma.contentEntry.findMany({ select: { key: true } });
    const dbSet = new Set(allEntries.map((e) => e.key));

    const missing: string[] = [];
    for (const key of localSet) if (!dbSet.has(key)) missing.push(key);

    const orphaned: string[] = [];
    for (const key of dbSet) if (!localSet.has(key)) orphaned.push(key);

    return {
      missing: missing.sort(),
      orphaned: orphaned.sort(),
      localCount: localSet.size,
      backendCount: dbSet.size,
    };
  }

  async listPages() {
    const rows = await this.prisma.contentEntry.groupBy({
      by: ['page', 'section'],
      _count: { _all: true },
    });
    const pages: Record<string, { page: string; sections: Record<string, number>; total: number }> = {};
    for (const r of rows) {
      const p = (pages[r.page] ??= { page: r.page, sections: {}, total: 0 });
      const sec = r.section ?? '_default';
      p.sections[sec] = (p.sections[sec] ?? 0) + r._count._all;
      p.total += r._count._all;
    }
    return Object.values(pages).sort((a, b) => a.page.localeCompare(b.page));
  }
}
