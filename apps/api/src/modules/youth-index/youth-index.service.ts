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

    if (!rankings.length) {
      return {
        data: [],
        meta: {
          year,
          totalCountries: 0,
          averageScore: 0,
          methodology: 'Min-max normalization with weighted dimensional scoring',
        },
      };
    }

    const data = rankings.map((r) => ({
      rank: r.rank,
      countryId: r.countryId,
      countryName: r.country.name,
      isoCode3: r.country.isoCode3,
      flagEmoji: r.country.flagEmoji,
      region: r.country.region,
      overallScore: r.overallScore,
      educationScore: r.educationScore,
      employmentScore: r.employmentScore,
      healthScore: r.healthScore,
      civicScore: r.civicScore,
      innovationScore: r.innovationScore,
      previousRank: r.previousRank,
      rankChange: r.rankChange,
      percentile: r.percentile,
      tier: r.tier,
    }));

    const scores = data.map((d) => d.overallScore);
    const averageScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100;

    const result = {
      data,
      meta: {
        year,
        totalCountries: data.length,
        averageScore,
        methodology: 'Min-max normalization with weighted dimensional scoring',
      },
    };

    this.cache.set(cacheKey, result, 300);
    return result;
  }

  async getByCountry(countryId: string) {
    const scores = await this.prisma.youthIndexScore.findMany({
      where: { countryId },
      include: {
        country: { select: { name: true, isoCode3: true, region: true, flagEmoji: true } },
      },
      orderBy: { year: 'desc' },
    });

    if (!scores.length)
      throw new NotFoundException(`No youth index data for country ${countryId}`);

    return {
      country: {
        id: countryId,
        name: scores[0].country.name,
        isoCode3: scores[0].country.isoCode3,
        region: scores[0].country.region,
        flagEmoji: scores[0].country.flagEmoji,
      },
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
      rankHistory: scores.map((s) => ({
        year: s.year,
        rank: s.rank,
        overallScore: s.overallScore,
      })),
    };
  }

  async getTopPerformers(limit: number, year: number) {
    const rankings = await this.prisma.youthIndexScore.findMany({
      where: { year },
      include: {
        country: {
          select: { name: true, isoCode3: true, region: true, flagEmoji: true },
        },
      },
      orderBy: { rank: 'asc' },
      take: limit,
    });

    return rankings.map((r) => ({
      rank: r.rank,
      countryId: r.countryId,
      countryName: r.country.name,
      isoCode3: r.country.isoCode3,
      flagEmoji: r.country.flagEmoji,
      region: r.country.region,
      overallScore: r.overallScore,
      educationScore: r.educationScore,
      employmentScore: r.employmentScore,
      healthScore: r.healthScore,
      civicScore: r.civicScore,
      innovationScore: r.innovationScore,
      tier: r.tier,
    }));
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

    return scores.map((s) => ({
      rank: s.rank,
      countryId: s.countryId,
      countryName: s.country.name,
      isoCode3: s.country.isoCode3,
      flagEmoji: s.country.flagEmoji,
      region: s.country.region,
      overallScore: s.overallScore,
      previousRank: s.previousRank,
      rankChange: s.rankChange,
      tier: s.tier,
    }));
  }
}
