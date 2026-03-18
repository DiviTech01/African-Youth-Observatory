import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache.service';
import { ListCountriesDto, CountryStatsQueryDto } from './countries.dto';

@Injectable()
export class CountriesService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async findAll(query: ListCountriesDto) {
    const { region, search, page = 1, pageSize = 54, sortBy = 'name', sortOrder = 'asc' } = query;

    const cacheKey = this.cache.buildKey('countries:list', { region, search, page, pageSize, sortBy, sortOrder });
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const where: Record<string, unknown> = {};
    if (region) where.region = region;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { capital: { contains: search, mode: 'insensitive' } },
        { isoCode3: { contains: search, mode: 'insensitive' } },
        { isoCode2: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Record<string, string> = {};
    const allowedSorts = ['name', 'population', 'youthPopulation', 'region', 'capital'];
    orderBy[allowedSorts.includes(sortBy) ? sortBy : 'name'] = sortOrder;

    const [data, total] = await Promise.all([
      this.prisma.country.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
      }),
      this.prisma.country.count({ where }),
    ]);

    // Serialize BigInt to number for JSON
    const serialized = data.map((c) => ({
      ...c,
      population: Number(c.population),
      youthPopulation: Number(c.youthPopulation),
    }));

    const result = {
      data: serialized,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };

    this.cache.set(cacheKey, result, 3600); // 1 hour
    return result;
  }

  async findById(id: string) {
    const cacheKey = `countries:detail:${id}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const country = await this.prisma.country.findUnique({
      where: { id },
      include: {
        youthIndexScores: {
          orderBy: { year: 'desc' },
          take: 1,
        },
      },
    });
    if (!country) throw new NotFoundException(`Country with ID "${id}" not found`);

    // Get additional stats
    const [indicatorCount, latestDataYear, availableThemes] = await Promise.all([
      this.prisma.indicatorValue.count({ where: { countryId: id } }),
      this.prisma.indicatorValue.aggregate({
        where: { countryId: id },
        _max: { year: true },
      }),
      this.prisma.indicatorValue.findMany({
        where: { countryId: id },
        select: {
          indicator: {
            select: { theme: { select: { id: true, name: true, slug: true, color: true, icon: true } } },
          },
        },
        distinct: ['indicatorId'],
      }),
    ]);

    // Deduplicate themes
    const themesMap = new Map<string, { id: string; name: string; slug: string; color: string; icon: string }>();
    for (const v of availableThemes) {
      const t = v.indicator.theme;
      themesMap.set(t.id, t);
    }

    const result = {
      ...country,
      population: Number(country.population),
      youthPopulation: Number(country.youthPopulation),
      latestYouthIndex: country.youthIndexScores[0] || null,
      youthIndexScores: undefined,
      dataStats: {
        indicatorCount,
        latestDataYear: latestDataYear._max.year,
        availableThemes: Array.from(themesMap.values()),
      },
    };

    this.cache.set(cacheKey, result, 3600);
    return result;
  }

  async getStats(id: string, query: CountryStatsQueryDto) {
    const country = await this.prisma.country.findUnique({ where: { id } });
    if (!country) throw new NotFoundException(`Country with ID "${id}" not found`);

    const { year = 2023 } = query;

    const [totalIndicators, youthIndex, themeBreakdown] = await Promise.all([
      this.prisma.indicator.count(),
      this.prisma.youthIndexScore.findFirst({
        where: { countryId: id, year },
      }),
      // Get per-theme stats
      this.prisma.indicatorValue.findMany({
        where: { countryId: id, year, gender: 'TOTAL' },
        include: {
          indicator: {
            include: { theme: { select: { id: true, name: true, slug: true } } },
          },
        },
      }),
    ]);

    // Group by theme
    const themeStats = new Map<string, { name: string; slug: string; values: number[]; count: number }>();
    for (const v of themeBreakdown) {
      const theme = v.indicator.theme;
      if (!themeStats.has(theme.id)) {
        themeStats.set(theme.id, { name: theme.name, slug: theme.slug, values: [], count: 0 });
      }
      const ts = themeStats.get(theme.id)!;
      ts.values.push(v.value);
      ts.count++;
    }

    const indicatorsWithData = themeBreakdown.length;

    return {
      country: {
        id: country.id,
        name: country.name,
        isoCode3: country.isoCode3,
        region: country.region,
      },
      year,
      dataCompleteness: totalIndicators > 0
        ? Math.round((indicatorsWithData / totalIndicators) * 100) / 100
        : 0,
      indicatorsWithData,
      totalIndicators,
      youthIndexScore: youthIndex,
      themeBreakdown: Array.from(themeStats.entries()).map(([, ts]) => ({
        theme: ts.name,
        slug: ts.slug,
        indicatorCount: ts.count,
        averageValue: ts.values.length > 0
          ? Math.round((ts.values.reduce((a, b) => a + b, 0) / ts.values.length) * 100) / 100
          : null,
      })),
    };
  }

  async getRegions() {
    const cacheKey = 'countries:regions';
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const regions = await this.prisma.country.groupBy({
      by: ['region'],
      _count: { id: true },
      _sum: { population: true, youthPopulation: true },
    });

    const result = [];
    for (const r of regions) {
      const countries = await this.prisma.country.findMany({
        where: { region: r.region },
        select: { id: true, name: true, isoCode3: true, flagEmoji: true },
        orderBy: { name: 'asc' },
      });
      result.push({
        region: r.region,
        countryCount: r._count.id,
        totalPopulation: Number(r._sum.population || 0),
        totalYouthPopulation: Number(r._sum.youthPopulation || 0),
        countries,
      });
    }

    this.cache.set(cacheKey, result, 3600);
    return result;
  }
}
