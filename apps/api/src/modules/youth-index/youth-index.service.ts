import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache.service';

@Injectable()
export class YouthIndexService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async getRankings(year: number) {
    const cacheKey = `youth-index:rankings:${year}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const rankings = await this.prisma.youthIndexScore.findMany({
      where: { year },
      include: {
        country: {
          select: { name: true, isoCode3: true, region: true, flagEmoji: true },
        },
      },
      orderBy: { rank: 'asc' },
    });

    const result = rankings.map((r) => ({
      ...r,
      countryName: r.country.name,
      isoCode3: r.country.isoCode3,
      region: r.country.region,
      flagEmoji: r.country.flagEmoji,
      country: undefined,
    }));

    this.cache.set(cacheKey, result, 300);
    return result;
  }

  async getByCountry(countryId: string) {
    const scores = await this.prisma.youthIndexScore.findMany({
      where: { countryId },
      include: {
        country: { select: { name: true, isoCode3: true, region: true } },
      },
      orderBy: { year: 'desc' },
    });

    if (!scores.length)
      throw new NotFoundException(`No youth index data for country ${countryId}`);

    return {
      country: scores[0].country,
      scores: scores.map((s) => ({
        year: s.year,
        overallScore: s.overallScore,
        educationScore: s.educationScore,
        employmentScore: s.employmentScore,
        healthScore: s.healthScore,
        civicScore: s.civicScore,
        innovationScore: s.innovationScore,
        rank: s.rank,
        previousRank: s.previousRank,
        rankChange: s.rankChange,
        percentile: s.percentile,
        tier: s.tier,
      })),
    };
  }

  async getTopPerformers(limit: number, year: number) {
    return this.prisma.youthIndexScore.findMany({
      where: { year },
      include: {
        country: {
          select: { name: true, isoCode3: true, region: true, flagEmoji: true },
        },
      },
      orderBy: { rank: 'asc' },
      take: limit,
    });
  }

  async getMostImproved(limit: number, year: number) {
    const scores = await this.prisma.youthIndexScore.findMany({
      where: { year, rankChange: { not: null } },
      include: {
        country: {
          select: { name: true, isoCode3: true, region: true, flagEmoji: true },
        },
      },
      orderBy: { rankChange: 'desc' },
      take: limit,
    });

    return scores;
  }
}
