import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache.service';
import { DEFAULT_AGE_GROUP } from '../../shared/constants';

@Injectable()
export class PlatformService {
  private startTime = Date.now();

  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async getStats() {
    const cacheKey = 'platform:stats';
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    // The landing-page Key Statistics MUST filter to the platform's canonical
    // youth band (15-35 AU). Without this, totals mix old 15-24 UN seed data
    // with current contributor uploads and inflate every count.
    const ageGroupFilter = { ageGroup: DEFAULT_AGE_GROUP };

    const [
      totalCountries,
      totalIndicators,
      totalDataPoints,
      totalThemes,
      yearRange,
      countriesWithData,
      topDataCountries,
      lastDataSource,
    ] = await Promise.all([
      this.prisma.country.count(),
      this.prisma.indicator.count(),
      this.prisma.indicatorValue.count({ where: ageGroupFilter }),
      this.prisma.theme.count(),
      this.prisma.indicatorValue.aggregate({
        where: ageGroupFilter,
        _min: { year: true },
        _max: { year: true },
      }),
      this.prisma.indicatorValue.groupBy({
        by: ['countryId'],
        where: ageGroupFilter,
      }),
      this.prisma.indicatorValue.groupBy({
        by: ['countryId'],
        where: ageGroupFilter,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      this.prisma.dataSource.findFirst({
        where: { lastSync: { not: null } },
        orderBy: { lastSync: 'desc' },
      }),
    ]);

    // Resolve country names for top data countries
    const topCountryIds = topDataCountries.map((c) => c.countryId);
    const topCountryNames = await this.prisma.country.findMany({
      where: { id: { in: topCountryIds } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(topCountryNames.map((c) => [c.id, c.name]));

    // Compute data completeness: (country-indicator pairs with data) / (total countries * total indicators)
    const possiblePairs = totalCountries * totalIndicators;
    const actualPairs = await this.prisma.indicatorValue.groupBy({
      by: ['countryId', 'indicatorId'],
      where: ageGroupFilter,
    });

    const result = {
      totalCountries,
      totalIndicators,
      totalDataPoints,
      totalThemes,
      dataYearRange: {
        earliest: yearRange._min.year,
        latest: yearRange._max.year,
      },
      countriesWithData: countriesWithData.length,
      lastUpdated: lastDataSource?.lastSync?.toISOString() || new Date().toISOString(),
      dataCompleteness: possiblePairs > 0
        ? Math.round((actualPairs.length / possiblePairs) * 100) / 100
        : 0,
      topDataCountries: topDataCountries.map((c) => ({
        name: nameMap.get(c.countryId) || 'Unknown',
        dataPoints: c._count.id,
      })),
    };

    this.cache.set(cacheKey, result, 300); // 5 min
    return result;
  }

  async getHealth() {
    let dbStatus = 'disconnected';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'error';
    }

    return {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      database: dbStatus,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      cache: this.cache.stats(),
    };
  }

  async clearCache() {
    const cleared = this.cache.clear();
    return { cleared, message: `Cleared ${cleared} cache entries` };
  }
}
