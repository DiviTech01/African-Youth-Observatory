import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache.service';
import { CompareCountriesDto, CompareRegionsDto, CompareThemesDto } from './compare.dto';
import { formatRegion } from '../../common/utils/format';
import { DEFAULT_AGE_GROUP } from '../../shared/constants';

@Injectable()
export class CompareService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  /**
   * Compare multiple countries across selected indicators.
   * Returns per-indicator rank, percentile, regional and continental averages.
   */
  async compareCountries(dto: CompareCountriesDto) {
    const { countryIds, indicatorIds, year = 2023, includeRegionalAverage = true } = dto;

    // Get countries
    const countries = await this.prisma.country.findMany({
      where: { id: { in: countryIds } },
      select: { id: true, name: true, isoCode3: true, flagEmoji: true, region: true },
    });

    if (!countries.length) throw new NotFoundException('No countries found for given IDs');

    // Determine which indicators to query
    let indicatorWhere: Record<string, unknown> = {};
    if (indicatorIds?.length) {
      indicatorWhere = { id: { in: indicatorIds } };
    }

    const indicators = await this.prisma.indicator.findMany({
      where: indicatorWhere,
      select: { id: true, name: true, slug: true, unit: true },
      ...(indicatorIds?.length ? {} : { take: 20 }),
    });

    const indIds = indicators.map((i) => i.id);

    // Get values for the requested countries (15-35 only, to keep ranking fair).
    const values = await this.prisma.indicatorValue.findMany({
      where: {
        countryId: { in: countryIds },
        indicatorId: { in: indIds },
        year,
        gender: 'TOTAL',
        ageGroup: DEFAULT_AGE_GROUP,
      },
      select: { countryId: true, indicatorId: true, value: true },
    });

    // Get ALL values per indicator for ranking + averages — 15-35 only.
    const allValues = await this.prisma.indicatorValue.findMany({
      where: {
        indicatorId: { in: indIds },
        year,
        gender: 'TOTAL',
        ageGroup: DEFAULT_AGE_GROUP,
      },
      include: {
        country: { select: { region: true } },
      },
    });

    // Build ranking + average maps per indicator
    const indicatorStats = new Map<string, {
      ranked: { countryId: string; value: number }[];
      regionalSums: Map<string, { sum: number; count: number }>;
      continentalSum: number;
      continentalCount: number;
    }>();

    for (const ind of indicators) {
      const indValues = allValues.filter((v) => v.indicatorId === ind.id);
      const ranked = indValues
        .map((v) => ({ countryId: v.countryId, value: v.value }))
        .sort((a, b) => b.value - a.value); // descending by default

      const regionalSums = new Map<string, { sum: number; count: number }>();
      let continentalSum = 0;
      let continentalCount = 0;

      for (const v of indValues) {
        const region = v.country.region;
        if (!regionalSums.has(region)) {
          regionalSums.set(region, { sum: 0, count: 0 });
        }
        const rs = regionalSums.get(region)!;
        rs.sum += v.value;
        rs.count += 1;
        continentalSum += v.value;
        continentalCount += 1;
      }

      indicatorStats.set(ind.id, { ranked, regionalSums, continentalSum, continentalCount });
    }

    // Get youth index scores for these countries
    const youthScores = await this.prisma.youthIndexScore.findMany({
      where: { countryId: { in: countryIds }, year },
      select: { countryId: true, rank: true, overallScore: true },
    });
    const youthScoreMap = new Map(youthScores.map((s) => [s.countryId, s]));

    // Build value lookup
    const valueLookup = new Map<string, number>();
    for (const v of values) {
      valueLookup.set(`${v.countryId}:${v.indicatorId}`, v.value);
    }

    // Build response
    const indicatorMap = new Map(indicators.map((i) => [i.id, i]));

    let indicatorsWithData = 0;
    const countryResults = countries.map((country) => {
      const ys = youthScoreMap.get(country.id);

      const countryIndicators = indicators.map((ind) => {
        const value = valueLookup.get(`${country.id}:${ind.id}`);
        const stats = indicatorStats.get(ind.id);

        if (value === undefined || !stats) {
          return {
            indicatorId: ind.id,
            indicatorName: ind.name,
            slug: ind.slug,
            unit: ind.unit,
            value: null,
            regionalAverage: null,
            continentalAverage: null,
            rank: null,
            percentile: null,
          };
        }

        // Compute rank for this country on this indicator
        const rankIndex = stats.ranked.findIndex((r) => r.countryId === country.id);
        const rank = rankIndex >= 0 ? rankIndex + 1 : null;
        const totalRanked = stats.ranked.length;
        const percentile = rank !== null
          ? Math.round(((totalRanked - rank) / totalRanked) * 10000) / 100
          : null;

        // Regional average
        const regionStats = includeRegionalAverage
          ? stats.regionalSums.get(country.region)
          : null;
        const regionalAverage = regionStats
          ? Math.round((regionStats.sum / regionStats.count) * 100) / 100
          : null;

        // Continental average
        const continentalAverage = stats.continentalCount > 0
          ? Math.round((stats.continentalSum / stats.continentalCount) * 100) / 100
          : null;

        return {
          indicatorId: ind.id,
          indicatorName: ind.name,
          slug: ind.slug,
          unit: ind.unit,
          value,
          regionalAverage,
          continentalAverage,
          rank,
          percentile,
        };
      });

      const hasData = countryIndicators.some((i) => i.value !== null);
      if (hasData) indicatorsWithData = Math.max(indicatorsWithData, countryIndicators.filter((i) => i.value !== null).length);

      return {
        countryId: country.id,
        countryName: country.name,
        isoCode3: country.isoCode3,
        isoCode: country.isoCode3,
        iso3Code: country.isoCode3,
        flagEmoji: country.flagEmoji,
        region: formatRegion(country.region),
        youthIndexRank: ys?.rank ?? null,
        youthIndexScore: ys?.overallScore ?? null,
        indicators: countryIndicators,
      };
    });

    return {
      year,
      countries: countryResults,
      meta: {
        indicatorsRequested: indicators.length,
        indicatorsWithData,
        dataCompleteness: indicators.length > 0
          ? Math.round((indicatorsWithData / indicators.length) * 100) / 100
          : 0,
      },
    };
  }

  /**
   * Compare all 5 regions on a given indicator.
   * Returns average, median, min, max, and data availability per region.
   */
  async compareRegions(dto: CompareRegionsDto) {
    const { indicatorId, year = 2023 } = dto;

    const cacheKey = this.cache.buildKey('compare:regions', { indicatorId, year });
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const indicator = await this.prisma.indicator.findUnique({
      where: { id: indicatorId },
      select: { id: true, name: true, unit: true },
    });
    if (!indicator) throw new NotFoundException(`Indicator ${indicatorId} not found`);

    const values = await this.prisma.indicatorValue.findMany({
      where: { indicatorId, year, gender: 'TOTAL', ageGroup: DEFAULT_AGE_GROUP },
      include: {
        country: { select: { name: true, region: true } },
      },
    });

    // Group by region
    const regionGroups = new Map<string, { country: string; value: number }[]>();
    for (const v of values) {
      const region = v.country.region;
      if (!regionGroups.has(region)) regionGroups.set(region, []);
      regionGroups.get(region)!.push({ country: v.country.name, value: v.value });
    }

    // Get total countries per region for data availability
    const allCountries = await this.prisma.country.findMany({
      select: { region: true },
    });
    const regionCountryCounts = new Map<string, number>();
    for (const c of allCountries) {
      regionCountryCounts.set(c.region, (regionCountryCounts.get(c.region) || 0) + 1);
    }

    // Continental average
    const allVals = values.map((v) => v.value);
    const continentalAverage = allVals.length > 0
      ? Math.round((allVals.reduce((a, b) => a + b, 0) / allVals.length) * 100) / 100
      : null;

    const regions = ['NORTH_AFRICA', 'WEST_AFRICA', 'CENTRAL_AFRICA', 'EAST_AFRICA', 'SOUTHERN_AFRICA']
      .map((region) => {
        const entries = regionGroups.get(region) || [];
        if (entries.length === 0) {
          return {
            region: formatRegion(region),
            average: null,
            median: null,
            min: null,
            max: null,
            countryCount: regionCountryCounts.get(region) || 0,
            dataAvailability: 0,
          };
        }

        const sorted = entries.slice().sort((a, b) => a.value - b.value);
        const vals = sorted.map((e) => e.value);

        const average = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
        const median = vals.length % 2 === 0
          ? Math.round(((vals[vals.length / 2 - 1] + vals[vals.length / 2]) / 2) * 100) / 100
          : vals[Math.floor(vals.length / 2)];

        return {
          region: formatRegion(region),
          average,
          median,
          min: { country: sorted[0].country, value: sorted[0].value },
          max: { country: sorted[sorted.length - 1].country, value: sorted[sorted.length - 1].value },
          countryCount: regionCountryCounts.get(region) || 0,
          dataAvailability: entries.length,
        };
      });

    const result = {
      indicator: { name: indicator.name, unit: indicator.unit },
      year,
      regions,
      continentalAverage,
    };

    this.cache.set(cacheKey, result, 300);
    return result;
  }

  /**
   * Show how a single country performs across all themes.
   * Normalizes indicators to 0-100 per theme and finds best/worst.
   */
  async compareThemes(dto: CompareThemesDto) {
    const { countryId, year = 2023 } = dto;

    const country = await this.prisma.country.findUnique({
      where: { id: countryId },
      select: { id: true, name: true, isoCode3: true, region: true, flagEmoji: true },
    });
    if (!country) throw new NotFoundException(`Country ${countryId} not found`);

    const themes = await this.prisma.theme.findMany({
      include: {
        indicators: {
          select: { id: true, name: true, slug: true, unit: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const themeResults = [];

    for (const theme of themes) {
      const indIds = theme.indicators.map((i) => i.id);
      if (indIds.length === 0) {
        themeResults.push({
          themeId: theme.id,
          themeName: theme.name,
          slug: theme.slug,
          averageScore: null,
          indicatorCount: 0,
          dataAvailability: 0,
          rank: null,
          bestIndicator: null,
          worstIndicator: null,
        });
        continue;
      }

      // Get this country's values (15-35 only — keeps theme rollups consistent).
      const countryValues = await this.prisma.indicatorValue.findMany({
        where: {
          countryId,
          indicatorId: { in: indIds },
          year,
          gender: 'TOTAL',
          ageGroup: DEFAULT_AGE_GROUP,
        },
        select: { indicatorId: true, value: true },
      });

      // Get all country values for normalization + ranking — 15-35 only.
      const allValues = await this.prisma.indicatorValue.findMany({
        where: {
          indicatorId: { in: indIds },
          year,
          gender: 'TOTAL',
          ageGroup: DEFAULT_AGE_GROUP,
        },
        select: { countryId: true, indicatorId: true, value: true },
      });

      // Compute min/max per indicator
      const indMinMax = new Map<string, { min: number; max: number }>();
      const indAllVals = new Map<string, Map<string, number>>();
      for (const v of allValues) {
        if (!indAllVals.has(v.indicatorId)) indAllVals.set(v.indicatorId, new Map());
        indAllVals.get(v.indicatorId)!.set(v.countryId, v.value);
      }

      for (const [indId, vals] of indAllVals) {
        const arr = Array.from(vals.values());
        if (arr.length > 0) {
          indMinMax.set(indId, { min: Math.min(...arr), max: Math.max(...arr) });
        }
      }

      const indMap = new Map(theme.indicators.map((i) => [i.id, i]));
      const countryValMap = new Map(countryValues.map((v) => [v.indicatorId, v.value]));

      // Normalize each indicator and find best/worst
      const normalized: { name: string; value: number; normalizedScore: number; rank: number }[] = [];

      for (const ind of theme.indicators) {
        const rawValue = countryValMap.get(ind.id);
        if (rawValue === undefined) continue;

        const mm = indMinMax.get(ind.id);
        if (!mm) continue;

        const range = mm.max - mm.min;
        const normScore = range === 0 ? 50 : ((rawValue - mm.min) / range) * 100;

        // Compute rank for this indicator
        const allValsForInd = indAllVals.get(ind.id);
        let rank = 1;
        if (allValsForInd) {
          for (const [, v] of allValsForInd) {
            if (v > rawValue) rank++;
          }
        }

        normalized.push({
          name: ind.name,
          value: rawValue,
          normalizedScore: Math.round(normScore * 100) / 100,
          rank,
        });
      }

      const averageScore = normalized.length > 0
        ? Math.round((normalized.reduce((a, b) => a + b.normalizedScore, 0) / normalized.length) * 100) / 100
        : null;

      // Theme rank: compute average normalized score for each country, then rank
      let themeRank: number | null = null;
      if (normalized.length > 0) {
        // Compute average score per country across this theme's indicators
        const countryThemeScores = new Map<string, { sum: number; count: number }>();
        for (const ind of theme.indicators) {
          const allValsForInd = indAllVals.get(ind.id);
          const mm = indMinMax.get(ind.id);
          if (!allValsForInd || !mm) continue;
          const range = mm.max - mm.min;

          for (const [cId, val] of allValsForInd) {
            if (!countryThemeScores.has(cId)) countryThemeScores.set(cId, { sum: 0, count: 0 });
            const entry = countryThemeScores.get(cId)!;
            entry.sum += range === 0 ? 50 : ((val - mm.min) / range) * 100;
            entry.count += 1;
          }
        }

        const rankedCountries = Array.from(countryThemeScores.entries())
          .map(([cId, { sum, count }]) => ({ cId, avg: sum / count }))
          .sort((a, b) => b.avg - a.avg);

        const myIndex = rankedCountries.findIndex((r) => r.cId === countryId);
        themeRank = myIndex >= 0 ? myIndex + 1 : null;
      }

      // Best and worst
      const sortedByScore = normalized.slice().sort((a, b) => b.normalizedScore - a.normalizedScore);
      const best = sortedByScore.length > 0 ? sortedByScore[0] : null;
      const worst = sortedByScore.length > 0 ? sortedByScore[sortedByScore.length - 1] : null;

      themeResults.push({
        themeId: theme.id,
        themeName: theme.name,
        slug: theme.slug,
        averageScore,
        indicatorCount: theme.indicators.length,
        dataAvailability: countryValues.length,
        rank: themeRank,
        bestIndicator: best ? { name: best.name, value: best.value, rank: best.rank } : null,
        worstIndicator: worst ? { name: worst.name, value: worst.value, rank: worst.rank } : null,
      });
    }

    return {
      country: { name: country.name, isoCode3: country.isoCode3, isoCode: country.isoCode3, iso3Code: country.isoCode3, flagEmoji: country.flagEmoji, region: formatRegion(country.region) },
      year,
      themes: themeResults,
    };
  }
}
