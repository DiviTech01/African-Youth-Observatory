import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache.service';

/**
 * Live Feed Service — generates real-time data snapshots for the WebSocket gateway
 * and REST fallback endpoints.
 *
 * Three feed types:
 *   1. Platform Pulse  (every 30s) — live platform stats
 *   2. Data Ticker     (every 60s) — rotating indicator highlights
 *   3. Spotlight        (every 5m)  — featured country or insight
 */

@Injectable()
export class LiveFeedService {
  private tickerIndex = 0;

  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  /**
   * Platform Pulse — real-time platform statistics snapshot.
   */
  async getPlatformPulse() {
    const cacheKey = 'livefeed:pulse';
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const [
      totalCountries,
      totalIndicators,
      totalDataPoints,
      totalThemes,
      totalExperts,
      totalPolicies,
    ] = await Promise.all([
      this.prisma.country.count(),
      this.prisma.indicator.count(),
      this.prisma.indicatorValue.count(),
      this.prisma.theme.count(),
      this.prisma.expert.count(),
      this.prisma.countryPolicy.count(),
    ]);

    // Latest data year
    const latestValue = await this.prisma.indicatorValue.findFirst({
      orderBy: { year: 'desc' },
      select: { year: true },
    });

    // Countries with youth index scores
    const countriesWithIndex = await this.prisma.youthIndexScore.groupBy({
      by: ['countryId'],
    });

    const result = {
      event: 'platform_pulse',
      timestamp: new Date().toISOString(),
      data: {
        totalCountries,
        totalIndicators,
        totalDataPoints,
        totalThemes,
        totalExperts,
        totalPolicies,
        countriesWithIndex: countriesWithIndex.length,
        latestDataYear: latestValue?.year ?? null,
        uptime: process.uptime(),
      },
    };

    this.cache.set(cacheKey, result, 25); // Cache for 25s (pulse is every 30s)
    return result;
  }

  /**
   * Data Ticker — rotating indicator highlights, one per tick.
   */
  async getDataTicker() {
    const cacheKey = 'livefeed:ticker';
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    // Get a rotating indicator highlight
    const indicators = await this.prisma.indicator.findMany({
      select: { id: true, name: true, unit: true },
      orderBy: { name: 'asc' },
    });

    if (indicators.length === 0) {
      return {
        event: 'data_ticker',
        timestamp: new Date().toISOString(),
        data: null,
      };
    }

    const indicator = indicators[this.tickerIndex % indicators.length];
    this.tickerIndex++;

    // Get the latest year's stats for this indicator
    const latestValue = await this.prisma.indicatorValue.findFirst({
      where: { indicatorId: indicator.id, gender: 'TOTAL' },
      orderBy: { year: 'desc' },
      select: { year: true },
    });

    if (!latestValue) {
      return {
        event: 'data_ticker',
        timestamp: new Date().toISOString(),
        data: { indicator: indicator.name, unit: indicator.unit, message: 'No data available' },
      };
    }

    const values = await this.prisma.indicatorValue.findMany({
      where: {
        indicatorId: indicator.id,
        year: latestValue.year,
        gender: 'TOTAL',
      },
      include: {
        country: { select: { name: true, isoCode3: true, flagEmoji: true } },
      },
      orderBy: { value: 'desc' },
    });

    const vals = values.map((v) => v.value);
    const avg = vals.length > 0
      ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100
      : 0;

    const top = values[0];
    const bottom = values[values.length - 1];

    const result = {
      event: 'data_ticker',
      timestamp: new Date().toISOString(),
      data: {
        indicator: indicator.name,
        unit: indicator.unit,
        year: latestValue.year,
        countriesReporting: values.length,
        continentalAverage: avg,
        highest: top
          ? {
              country: top.country.name,
              isoCode3: top.country.isoCode3,
              flagEmoji: top.country.flagEmoji,
              value: top.value,
            }
          : null,
        lowest: bottom
          ? {
              country: bottom.country.name,
              isoCode3: bottom.country.isoCode3,
              flagEmoji: bottom.country.flagEmoji,
              value: bottom.value,
            }
          : null,
      },
    };

    this.cache.set(cacheKey, result, 50); // Cache for 50s (ticker is every 60s)
    return result;
  }

  /**
   * Spotlight — featured country profile snapshot, rotating through countries.
   */
  async getSpotlight() {
    const cacheKey = 'livefeed:spotlight';
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    // Pick a random country
    const countries = await this.prisma.country.findMany({
      select: { id: true, name: true, isoCode3: true, region: true, flagEmoji: true, youthPopulation: true },
    });

    if (countries.length === 0) {
      return {
        event: 'spotlight',
        timestamp: new Date().toISOString(),
        data: null,
      };
    }

    // Rotate deterministically based on time
    const minuteOfDay = Math.floor(Date.now() / (5 * 60 * 1000)); // 5-minute blocks
    const country = countries[minuteOfDay % countries.length];

    // Get youth index score
    const youthScore = await this.prisma.youthIndexScore.findFirst({
      where: { countryId: country.id },
      orderBy: { year: 'desc' },
      select: { overallScore: true, rank: true, tier: true, year: true },
    });

    // Get policy info
    const policy = await this.prisma.countryPolicy.findFirst({
      where: { countryId: country.id },
      select: { aycRatified: true, complianceScore: true, status: true },
    });

    // Count data points
    const dataPointCount = await this.prisma.indicatorValue.count({
      where: { countryId: country.id },
    });

    // Get a notable indicator value
    const notableValue = await this.prisma.indicatorValue.findFirst({
      where: { countryId: country.id, gender: 'TOTAL' },
      orderBy: { year: 'desc' },
      include: {
        indicator: { select: { name: true, unit: true } },
      },
    });

    const result = {
      event: 'spotlight',
      timestamp: new Date().toISOString(),
      data: {
        country: {
          name: country.name,
          isoCode3: country.isoCode3,
          region: country.region,
          flagEmoji: country.flagEmoji,
          youthPopulation: Number(country.youthPopulation),
        },
        youthIndex: youthScore
          ? {
              score: youthScore.overallScore,
              rank: youthScore.rank,
              tier: youthScore.tier,
              year: youthScore.year,
            }
          : null,
        policy: policy
          ? {
              aycRatified: policy.aycRatified,
              complianceScore: policy.complianceScore,
              status: policy.status,
            }
          : null,
        dataPoints: dataPointCount,
        highlight: notableValue
          ? {
              indicator: notableValue.indicator.name,
              value: notableValue.value,
              unit: notableValue.indicator.unit,
              year: notableValue.year,
            }
          : null,
      },
    };

    this.cache.set(cacheKey, result, 280); // Cache for ~4.5m (spotlight is every 5m)
    return result;
  }
}
