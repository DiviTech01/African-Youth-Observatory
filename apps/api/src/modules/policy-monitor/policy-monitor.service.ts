import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache.service';
import { ComplianceScorerService, ComplianceInput } from './compliance-scorer.service';
import { PolicyRankingsDto } from './policy-monitor.dto';
import { formatRegion, parseRegion } from '../../common/utils/format';

@Injectable()
export class PolicyMonitorService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
    private scorer: ComplianceScorerService,
  ) {}

  /**
   * Get compliance rankings for all countries, optionally filtered by region.
   */
  async getRankings(dto: PolicyRankingsDto) {
    const { year = 2023, region, sortOrder = 'desc' } = dto;

    const cacheKey = this.cache.buildKey('policy:rankings', { year, region, sortOrder });
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    // Get all policies with country info
    const countryWhere: Record<string, unknown> = {};
    if (region) countryWhere.region = parseRegion(region);

    const policies = await this.prisma.countryPolicy.findMany({
      include: {
        country: {
          select: {
            id: true,
            name: true,
            isoCode3: true,
            region: true,
            flagEmoji: true,
          },
        },
      },
      where: {
        country: countryWhere,
      },
    });

    // Get youth index scores for context
    const youthScores = await this.prisma.youthIndexScore.findMany({
      where: { year },
      select: { countryId: true, overallScore: true },
    });
    const youthScoreMap = new Map(youthScores.map((s) => [s.countryId, s.overallScore]));

    // Get data availability per country
    const dataAvailability = await this.getDataAvailabilityMap(year);

    // Score each country
    const scored = policies.map((policy) => {
      const input: ComplianceInput = {
        aycRatified: policy.aycRatified,
        aycRatifiedYear: policy.aycRatifiedYear,
        hasNationalPolicy: policy.yearAdopted !== null,
        yearAdopted: policy.yearAdopted,
        yearRevised: policy.yearRevised,
        wpayCompliant: policy.wpayCompliant,
        policyStatus: policy.status,
        youthIndexScore: youthScoreMap.get(policy.countryId) ?? null,
        dataAvailability: dataAvailability.get(policy.countryId) ?? 0,
      };

      const result = this.scorer.score(input, year);

      return {
        countryId: policy.country.id,
        countryName: policy.country.name,
        isoCode3: policy.country.isoCode3,
        isoCode: policy.country.isoCode3,
        iso3Code: policy.country.isoCode3,
        region: formatRegion(policy.country.region),
        flagEmoji: policy.country.flagEmoji,
        policyName: policy.policyName,
        aycRatified: policy.aycRatified,
        aycRatifiedYear: policy.aycRatifiedYear,
        wpayCompliant: policy.wpayCompliant,
        yearAdopted: policy.yearAdopted,
        yearRevised: policy.yearRevised,
        status: policy.status,
        complianceScore: result.overallScore,
        tier: result.tier,
        components: result.components,
      };
    });

    // Sort by compliance score
    scored.sort((a, b) =>
      sortOrder === 'desc'
        ? b.complianceScore - a.complianceScore
        : a.complianceScore - b.complianceScore,
    );

    // Assign ranks
    const ranked = scored.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

    const result = {
      data: ranked,
      meta: {
        year,
        totalCountries: ranked.length,
        averageScore: ranked.length > 0
          ? Math.round((ranked.reduce((sum, r) => sum + r.complianceScore, 0) / ranked.length) * 100) / 100
          : 0,
        aycRatificationRate: ranked.length > 0
          ? Math.round((ranked.filter((r) => r.aycRatified).length / ranked.length) * 10000) / 100
          : 0,
        wpayComplianceRate: ranked.length > 0
          ? Math.round((ranked.filter((r) => r.wpayCompliant).length / ranked.length) * 10000) / 100
          : 0,
        tierDistribution: {
          EXEMPLARY: ranked.filter((r) => r.tier === 'EXEMPLARY').length,
          STRONG: ranked.filter((r) => r.tier === 'STRONG').length,
          MODERATE: ranked.filter((r) => r.tier === 'MODERATE').length,
          DEVELOPING: ranked.filter((r) => r.tier === 'DEVELOPING').length,
          MINIMAL: ranked.filter((r) => r.tier === 'MINIMAL').length,
        },
        region: region || 'ALL',
      },
    };

    this.cache.set(cacheKey, result, 300);
    return result;
  }

  /**
   * Get detailed compliance info for a single country.
   */
  async getCountryDetail(countryId: string) {
    const cacheKey = this.cache.buildKey('policy:detail', { countryId });
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const policy = await this.prisma.countryPolicy.findFirst({
      where: { countryId },
      include: {
        country: {
          select: {
            id: true,
            name: true,
            isoCode3: true,
            region: true,
            flagEmoji: true,
          },
        },
      },
    });

    if (!policy) {
      throw new NotFoundException(`No policy data found for country ${countryId}`);
    }

    // Get youth index score
    const youthScore = await this.prisma.youthIndexScore.findFirst({
      where: { countryId },
      orderBy: { year: 'desc' },
      select: { overallScore: true, year: true, rank: true },
    });

    // Get data availability
    const totalIndicators = await this.prisma.indicator.count();
    const countryDataPoints = await this.prisma.indicatorValue.groupBy({
      by: ['indicatorId'],
      where: { countryId },
    });
    const dataAvailability = totalIndicators > 0
      ? countryDataPoints.length / totalIndicators
      : 0;

    const input: ComplianceInput = {
      aycRatified: policy.aycRatified,
      aycRatifiedYear: policy.aycRatifiedYear,
      hasNationalPolicy: policy.yearAdopted !== null,
      yearAdopted: policy.yearAdopted,
      yearRevised: policy.yearRevised,
      wpayCompliant: policy.wpayCompliant,
      policyStatus: policy.status,
      youthIndexScore: youthScore?.overallScore ?? null,
      dataAvailability,
    };

    const complianceResult = this.scorer.score(input, youthScore?.year ?? 2023);

    const result = {
      country: {
        id: policy.country.id,
        name: policy.country.name,
        isoCode3: policy.country.isoCode3,
        isoCode: policy.country.isoCode3,
        iso3Code: policy.country.isoCode3,
        region: formatRegion(policy.country.region),
        flagEmoji: policy.country.flagEmoji,
      },
      policy: {
        policyName: policy.policyName,
        policyType: policy.policyType,
        yearAdopted: policy.yearAdopted,
        yearRevised: policy.yearRevised,
        aycRatified: policy.aycRatified,
        aycRatifiedYear: policy.aycRatifiedYear,
        wpayCompliant: policy.wpayCompliant,
        status: policy.status,
      },
      compliance: {
        overallScore: complianceResult.overallScore,
        tier: complianceResult.tier,
        components: complianceResult.components,
        recommendations: complianceResult.recommendations,
      },
      context: {
        youthIndexScore: youthScore?.overallScore ?? null,
        youthIndexRank: youthScore?.rank ?? null,
        youthIndexYear: youthScore?.year ?? null,
        dataAvailability: Math.round(dataAvailability * 10000) / 100,
      },
    };

    this.cache.set(cacheKey, result, 300);
    return result;
  }

  /**
   * Compute and persist compliance scores for one or all countries.
   */
  async computeCompliance(countryId?: string) {
    const where: Record<string, unknown> = {};
    if (countryId) where.countryId = countryId;

    const policies = await this.prisma.countryPolicy.findMany({ where });

    if (policies.length === 0) {
      throw new NotFoundException('No policies found to compute');
    }

    const youthScores = await this.prisma.youthIndexScore.findMany({
      where: { year: 2023 },
      select: { countryId: true, overallScore: true },
    });
    const youthScoreMap = new Map(youthScores.map((s) => [s.countryId, s.overallScore]));
    const dataAvailability = await this.getDataAvailabilityMap(2023);

    let updated = 0;

    for (const policy of policies) {
      const input: ComplianceInput = {
        aycRatified: policy.aycRatified,
        aycRatifiedYear: policy.aycRatifiedYear,
        hasNationalPolicy: policy.yearAdopted !== null,
        yearAdopted: policy.yearAdopted,
        yearRevised: policy.yearRevised,
        wpayCompliant: policy.wpayCompliant,
        policyStatus: policy.status,
        youthIndexScore: youthScoreMap.get(policy.countryId) ?? null,
        dataAvailability: dataAvailability.get(policy.countryId) ?? 0,
      };

      const result = this.scorer.score(input, 2023);

      await this.prisma.countryPolicy.update({
        where: { id: policy.id },
        data: { complianceScore: result.overallScore },
      });

      updated++;
    }

    // Clear cache
    this.cache.clearPrefix('policy:');

    return {
      message: `Compliance scores computed for ${updated} countries`,
      count: updated,
    };
  }

  /**
   * Get a continental summary of policy compliance.
   */
  async getSummary() {
    const cacheKey = 'policy:summary';
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const policies = await this.prisma.countryPolicy.findMany({
      include: {
        country: {
          select: { region: true, name: true },
        },
      },
    });

    const totalCountries = policies.length;
    const aycRatified = policies.filter((p) => p.aycRatified).length;
    const wpayCompliant = policies.filter((p) => p.wpayCompliant).length;
    const hasPolicy = policies.filter((p) => p.yearAdopted !== null).length;
    const activePolicy = policies.filter((p) => p.status === 'active').length;

    // Regional breakdown
    const regionStats = new Map<string, {
      total: number;
      ratified: number;
      wpay: number;
      hasPolicy: number;
      avgScore: number;
      scoreCount: number;
    }>();

    for (const policy of policies) {
      const region = policy.country.region;
      if (!regionStats.has(region)) {
        regionStats.set(region, { total: 0, ratified: 0, wpay: 0, hasPolicy: 0, avgScore: 0, scoreCount: 0 });
      }
      const stats = regionStats.get(region)!;
      stats.total++;
      if (policy.aycRatified) stats.ratified++;
      if (policy.wpayCompliant) stats.wpay++;
      if (policy.yearAdopted) stats.hasPolicy++;
      if (policy.complianceScore !== null) {
        stats.avgScore += policy.complianceScore;
        stats.scoreCount++;
      }
    }

    const regions = Array.from(regionStats.entries()).map(([region, stats]) => ({
      region: formatRegion(region),
      totalCountries: stats.total,
      aycRatified: stats.ratified,
      aycRatificationRate: stats.total > 0
        ? Math.round((stats.ratified / stats.total) * 10000) / 100
        : 0,
      wpayCompliant: stats.wpay,
      wpayComplianceRate: stats.total > 0
        ? Math.round((stats.wpay / stats.total) * 10000) / 100
        : 0,
      hasNationalPolicy: stats.hasPolicy,
      averageComplianceScore: stats.scoreCount > 0
        ? Math.round((stats.avgScore / stats.scoreCount) * 100) / 100
        : null,
    }));

    // Recent ratifications (last 5 years)
    const recentRatifications = policies
      .filter((p) => p.aycRatifiedYear && p.aycRatifiedYear >= 2019)
      .map((p) => ({
        country: p.country.name,
        year: p.aycRatifiedYear,
      }))
      .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

    const result = {
      continental: {
        totalCountries,
        aycRatified,
        aycRatificationRate: totalCountries > 0
          ? Math.round((aycRatified / totalCountries) * 10000) / 100
          : 0,
        wpayCompliant,
        wpayComplianceRate: totalCountries > 0
          ? Math.round((wpayCompliant / totalCountries) * 10000) / 100
          : 0,
        hasNationalPolicy: hasPolicy,
        activePolicies: activePolicy,
      },
      regions,
      recentRatifications,
    };

    this.cache.set(cacheKey, result, 600);
    return result;
  }

  /**
   * Helper: Get data availability ratio per country for a given year.
   */
  private async getDataAvailabilityMap(year: number): Promise<Map<string, number>> {
    const totalIndicators = await this.prisma.indicator.count();
    if (totalIndicators === 0) return new Map();

    const countryCounts = await this.prisma.indicatorValue.groupBy({
      by: ['countryId'],
      where: { year },
      _count: { indicatorId: true },
    });

    const map = new Map<string, number>();
    for (const entry of countryCounts) {
      map.set(entry.countryId, entry._count.indicatorId / totalIndicators);
    }
    return map;
  }
}
