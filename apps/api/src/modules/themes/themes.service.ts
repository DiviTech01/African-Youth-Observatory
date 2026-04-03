import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache.service';

@Injectable()
export class ThemesService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async findAll() {
    const cacheKey = 'themes:all';
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const themes = await this.prisma.theme.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { indicators: true } } },
    });

    const result = themes.map((t) => ({
      ...t,
      indicatorCount: t._count.indicators,
      _count: undefined,
    }));

    this.cache.set(cacheKey, result, 3600);
    return result;
  }

  async findById(id: string) {
    const theme = await this.prisma.theme.findUnique({
      where: { id },
      include: {
        indicators: {
          orderBy: { name: 'asc' },
        },
      },
    });
    if (!theme) throw new NotFoundException(`Theme with ID "${id}" not found`);
    return theme;
  }

  async getStats(id: string, year: number) {
    const theme = await this.findById(id);

    const indicatorIds = theme.indicators.map((i) => i.id);

    const [dataPointCount, countryCount] = await Promise.all([
      this.prisma.indicatorValue.count({
        where: { indicatorId: { in: indicatorIds }, year },
      }),
      this.prisma.indicatorValue.groupBy({
        by: ['countryId'],
        where: { indicatorId: { in: indicatorIds }, year },
      }),
    ]);

    return {
      theme: { id: theme.id, name: theme.name, slug: theme.slug },
      indicatorCount: theme.indicators.length,
      dataPointCount,
      countryCount: countryCount.length,
      year,
    };
  }
}
