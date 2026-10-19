import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache.service';
import { formatRegion, parseRegion } from '../../common/utils/format';
import { displayAgeBand } from '../../shared/indicator-meta';
import {
  DataValuesQueryDto,
  TimeSeriesQueryDto,
  MapDataQueryDto,
  ComparisonQueryDto,
  RegionalAveragesQueryDto,
  BarChartQueryDto,
  RegionalSummaryQueryDto,
} from './data.dto';

@Injectable()
export class DataService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async getValues(query: DataValuesQueryDto) {
    const {
      countryId,
      countryIds,
      indicatorId,
      themeId,
      yearStart,
      yearEnd,
      gender,
      region,
      ageGroup,
      page = 1,
      pageSize = 100,
    } = query;

    const where: Record<string, unknown> = {};

    if (countryId) where.countryId = countryId;
    if (countryIds?.length) where.countryId = { in: countryIds };
    if (indicatorId) where.indicatorId = indicatorId;
    if (gender) where.gender = gender;
    // Without an explicit ageGroup the Prisma middleware reads each indicator's
    // canonical band (one band per indicator, so bands never mix). A blanket
    // 15-35 here hid every 18-30 / 18-35 / national series (audit C5).
    if (ageGroup) where.ageGroup = ageGroup;
    if (themeId) where.indicator = { themeId };
    if (region) where.country = { region: parseRegion(region) };

    if (yearStart || yearEnd) {
      where.year = {};
      if (yearStart) (where.year as Record<string, number>).gte = yearStart;
      if (yearEnd) (where.year as Record<string, number>).lte = yearEnd;
    }

    const [data, total] = await Promise.all([
      this.prisma.indicatorValue.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          country: { select: { name: true, isoCode3: true, flagEmoji: true } },
          indicator: {
            select: {
              name: true,
              unit: true,
              theme: { select: { name: true, slug: true } },
            },
          },
        },
        orderBy: [{ year: 'desc' }, { country: { name: 'asc' } }],
      }),
      this.prisma.indicatorValue.count({ where }),
    ]);

    return {
      data: data.map((v) => ({
        id: v.id,
        value: v.value,
        year: v.year,
        gender: v.gender,
        ageGroup: v.ageGroup,
        source: v.source,
        confidence: v.confidence,
        isEstimate: v.isEstimate,
        countryId: v.countryId,
        countryName: v.country.name,
        isoCode3: v.country.isoCode3,
        flagEmoji: v.country.flagEmoji,
        indicatorId: v.indicatorId,
        indicatorName: v.indicator.name,
        unit: v.indicator.unit,
        themeName: v.indicator.theme.name,
        themeSlug: v.indicator.theme.slug,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getTimeSeries(query: TimeSeriesQueryDto) {
    const { countryId, indicatorId, gender, yearStart, yearEnd, ageGroup } = query as TimeSeriesQueryDto & { ageGroup?: string };

    // Year window — applied to both attempts.
    const yearWhere: Record<string, number> = {};
    if (yearStart) yearWhere.gte = yearStart;
    if (yearEnd) yearWhere.lte = yearEnd;

    // Strict pass first: the indicator's canonical age band (applied by the
    // Prisma middleware when no ageGroup is given -- 15-35 for most, 18-30 /
    // 18-35 / national for the rest), TOTAL gender, or whatever the caller
    // asked for. One band per indicator keeps cross-country comparability.
    const strictWhere: Record<string, unknown> = {
      countryId,
      indicatorId,
      gender: gender || 'TOTAL',
    };
    if (ageGroup) strictWhere.ageGroup = ageGroup;
    if (Object.keys(yearWhere).length) strictWhere.year = yearWhere;

    let values = await this.prisma.indicatorValue.findMany({
      where: strictWhere,
      orderBy: { year: 'asc' },
      select: { year: true, value: true, gender: true, ageGroup: true },
    });

    // Fallback: the canonical band now covers indicators stored without a
    // youth band (AYC policy markers, national figures), so this pass only
    // matters if one indicator ever ends up with rows in two bands and this
    // country's rows are all in the non-canonical one. If we found nothing,
    // and the caller didn't explicitly pin an age group, re-query WITHOUT any
    // age filter (`_skipAgeGroupDefault: true` bypasses the middleware).
    let usedFallback = false;
    if (values.length === 0 && !ageGroup) {
      const lenientWhere: Record<string, unknown> = {
        countryId,
        indicatorId,
        gender: gender || 'TOTAL',
        _skipAgeGroupDefault: true,
      };
      if (Object.keys(yearWhere).length) lenientWhere.year = yearWhere;
      values = await this.prisma.indicatorValue.findMany({
        where: lenientWhere as any,
        orderBy: { year: 'asc' },
        select: { year: true, value: true, gender: true, ageGroup: true },
      });
      usedFallback = values.length > 0;
    }

    // Gender fallback. Six of the seven most-requested youth indicators DO have
    // TOTAL rows, but only ~21 of them, covering 3 countries — against ~1,000
    // rows across 54 countries per gender. So the strict TOTAL filter above does
    // not usually return nothing; for 51 of 54 countries it returns nothing, and
    // for the other 3 it returns a thin slice. Either way the platform looked
    // like it had almost no data on youth unemployment, literacy and voter
    // turnout while the real data sat unused under MALE/FEMALE.
    //
    // When TOTAL yields nothing for this country and the caller did not pin a
    // gender, return the male and female series side by side and say so via
    // genderUsed. We deliberately do NOT synthesise a combined figure: these are
    // rates, and the unweighted mean of two rates is not the population rate.
    // Each row already carries its own `gender`, so the UI can plot two series.
    let usedGenderFallback = false;
    if (values.length === 0 && !gender) {
      const splitWhere: Record<string, unknown> = {
        countryId,
        indicatorId,
        gender: { in: ['MALE', 'FEMALE'] },
      };
      if (ageGroup) splitWhere.ageGroup = ageGroup;
      if (Object.keys(yearWhere).length) splitWhere.year = yearWhere;

      values = await this.prisma.indicatorValue.findMany({
        where: splitWhere,
        orderBy: [{ year: 'asc' }, { gender: 'asc' }],
        select: { year: true, value: true, gender: true, ageGroup: true },
      });

      // Retry without the age band too, mirroring the lenient pass above, so an
      // indicator that is both gender-split and not age-banded still resolves.
      if (values.length === 0 && !ageGroup) {
        const lenientSplit: Record<string, unknown> = {
          countryId,
          indicatorId,
          gender: { in: ['MALE', 'FEMALE'] },
          _skipAgeGroupDefault: true,
        };
        if (Object.keys(yearWhere).length) lenientSplit.year = yearWhere;
        values = await this.prisma.indicatorValue.findMany({
          where: lenientSplit as any,
          orderBy: [{ year: 'asc' }, { gender: 'asc' }],
          select: { year: true, value: true, gender: true, ageGroup: true },
        });
        if (values.length > 0) usedFallback = true;
      }
      usedGenderFallback = values.length > 0;
    }

    const indicator = await this.prisma.indicator.findUnique({
      where: { id: indicatorId },
      select: { id: true, name: true, slug: true, unit: true, source: true },
    });

    // The band the returned rows were actually stored under (one band per
    // indicator), or 'all' when the lenient pass mixed bands. National-level
    // indicators (budgets, ranks, physician density...) report 'all' whatever
    // band the upload stamped on them: they have no age dimension (audit H10).
    const storedBands = [...new Set(values.map((v) => v.ageGroup))];
    const storedBand = storedBands.length === 1 ? storedBands[0] : values.length ? 'all' : (ageGroup ?? null);

    return {
      indicator,
      // Surface the age-band that was actually used so the UI can label
      // country-level indicators differently (e.g., "national value" rather
      // than "youth 15-35").
      ageGroupUsed: usedFallback ? 'all' : displayAgeBand(indicator?.slug, storedBand),
      // 'split' means no combined figure exists for this country/indicator and
      // the payload carries separate male and female series. The UI MUST label
      // them; presenting one gender as the headline rate would misstate it.
      genderUsed: usedGenderFallback ? 'split' : (gender || 'TOTAL'),
      data: values.map((v) => ({
        year: v.year,
        value: v.value,
        gender: v.gender,
        ageGroup: v.ageGroup,
      })),
    };
  }

  async getMapData(query: MapDataQueryDto) {
    const { indicatorId } = query;
    const cacheKey = this.cache.buildKey('data:map', { indicatorId, year: query.year });
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    // Resolve "latest" year
    let year: number;
    if (!query.year || query.year === 'latest') {
      const latest = await this.prisma.indicatorValue.aggregate({
        where: { indicatorId, gender: 'TOTAL' },
        _max: { year: true },
      });
      year = latest._max.year || 2023;
    } else {
      year = parseInt(query.year, 10);
    }

    // Get all countries
    const allCountries = await this.prisma.country.findMany({
      select: { id: true, name: true, isoCode3: true, flagEmoji: true, region: true },
      orderBy: { name: 'asc' },
    });

    // Values for the indicator + year in its canonical band (middleware) — one
    // band per indicator keeps map values consistent across countries.
    const values = await this.prisma.indicatorValue.findMany({
      where: { indicatorId, year, gender: 'TOTAL' },
      select: { countryId: true, value: true },
    });

    const valueMap = new Map(values.map((v) => [v.countryId, v.value]));

    const result = {
      indicatorId,
      year,
      data: allCountries.map((c) => ({
        countryId: c.id,
        countryName: c.name,
        isoCode3: c.isoCode3,
        isoCode: c.isoCode3,
        iso3Code: c.isoCode3,
        flagEmoji: c.flagEmoji,
        region: formatRegion(c.region),
        value: valueMap.get(c.id) ?? null,
        year,
      })),
    };

    this.cache.set(cacheKey, result, 300); // 5 min
    return result;
  }

  async getComparison(query: ComparisonQueryDto) {
    const { countryIds, indicatorId, indicatorIds, year = 2023 } = query;

    if (!countryIds?.length) return [];

    const where: Record<string, unknown> = {
      countryId: { in: countryIds },
      year,
      gender: 'TOTAL',
    };

    // Support single or multiple indicators
    if (indicatorIds?.length) {
      where.indicatorId = { in: indicatorIds };
    } else if (indicatorId) {
      where.indicatorId = indicatorId;
    }

    const values = await this.prisma.indicatorValue.findMany({
      where,
      include: {
        country: {
          select: { id: true, name: true, isoCode3: true, flagEmoji: true, region: true },
        },
        indicator: { select: { id: true, name: true, unit: true } },
      },
    });

    // Group by country
    const grouped = new Map<string, {
      countryId: string;
      countryName: string;
      isoCode3: string;
      flagEmoji: string | null;
      region: string;
      values: { indicatorId: string; indicatorName: string; unit: string; value: number; year: number }[];
    }>();

    for (const v of values) {
      const key = v.countryId;
      if (!grouped.has(key)) {
        grouped.set(key, {
          countryId: v.country.id,
          countryName: v.country.name,
          isoCode3: v.country.isoCode3,
          flagEmoji: v.country.flagEmoji,
          region: formatRegion(v.country.region),
          values: [],
        });
      }
      grouped.get(key)!.values.push({
        indicatorId: v.indicator.id,
        indicatorName: v.indicator.name,
        unit: v.indicator.unit,
        value: v.value,
        year: v.year,
      });
    }

    // Add regional averages for context
    const uniqueIndicatorIds = [...new Set(values.map((v) => v.indicatorId))];
    const regionalAvgs = await this.getRegionalAverages({
      indicatorId: uniqueIndicatorIds.length === 1 ? uniqueIndicatorIds[0] : undefined,
      year,
    });

    return {
      countries: Array.from(grouped.values()),
      regionalAverages: regionalAvgs,
    };
  }

  async getRegionalAverages(query: RegionalAveragesQueryDto) {
    const { indicatorId, year = 2023 } = query;

    const cacheKey = this.cache.buildKey('data:regional', { indicatorId, year });
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const where: Record<string, unknown> = { year, gender: 'TOTAL' };
    if (indicatorId) where.indicatorId = indicatorId;

    const values = await this.prisma.indicatorValue.findMany({
      where,
      include: {
        country: { select: { region: true } },
        indicator: { select: { id: true, name: true, unit: true } },
      },
    });

    const grouped = new Map<string, { sum: number; count: number; region: string; indicatorId: string; indicatorName: string; unit: string }>();

    for (const v of values) {
      const key = `${v.country.region}:${v.indicatorId}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          sum: 0,
          count: 0,
          region: v.country.region,
          indicatorId: v.indicator.id,
          indicatorName: v.indicator.name,
          unit: v.indicator.unit,
        });
      }
      const g = grouped.get(key)!;
      g.sum += v.value;
      g.count += 1;
    }

    const result = Array.from(grouped.values()).map((g) => ({
      region: formatRegion(g.region),
      indicatorId: g.indicatorId,
      indicatorName: g.indicatorName,
      unit: g.unit,
      averageValue: Math.round((g.sum / g.count) * 100) / 100,
      countryCount: g.count,
      year,
    }));

    this.cache.set(cacheKey, result, 300);
    return result;
  }

  async getBarChart(query: BarChartQueryDto) {
    const { indicatorId, year = 2023, limit = 10, sort = 'desc' } = query;

    const values = await this.prisma.indicatorValue.findMany({
      where: { indicatorId, year, gender: 'TOTAL' },
      include: {
        country: { select: { name: true, isoCode3: true, flagEmoji: true } },
        indicator: { select: { name: true, unit: true } },
      },
      orderBy: { value: sort },
      take: limit,
    });

    return {
      indicatorId,
      indicatorName: values[0]?.indicator.name,
      unit: values[0]?.indicator.unit,
      year,
      sort,
      // `position`, not `rank`: the row's place in a value-sorted top-N list
      // (reversed when sort=asc), not a ranking. Under the bare key `rank` it
      // read as a second, contradictory country rank next to the Youth Index
      // rank (audit C3).
      data: values.map((v, i) => ({
        position: i + 1,
        countryName: v.country.name,
        isoCode3: v.country.isoCode3,
        flagEmoji: v.country.flagEmoji,
        value: v.value,
      })),
    };
  }

  async getRegionalSummary(query: RegionalSummaryQueryDto) {
    const { themeId, year = 2023 } = query;

    const where: Record<string, unknown> = { year, gender: 'TOTAL' };
    if (themeId) where.indicator = { themeId };

    const values = await this.prisma.indicatorValue.findMany({
      where,
      include: {
        country: { select: { id: true, name: true, region: true, isoCode3: true } },
        indicator: { select: { id: true, name: true, unit: true } },
      },
    });

    // Group by region
    const regionData = new Map<string, {
      values: number[];
      countries: Set<string>;
      bestCountry: { name: string; value: number } | null;
      worstCountry: { name: string; value: number } | null;
      indicators: Map<string, { name: string; sum: number; count: number }>;
    }>();

    for (const v of values) {
      const region = v.country.region;
      if (!regionData.has(region)) {
        regionData.set(region, {
          values: [],
          countries: new Set(),
          bestCountry: null,
          worstCountry: null,
          indicators: new Map(),
        });
      }
      const rd = regionData.get(region)!;
      rd.values.push(v.value);
      rd.countries.add(v.country.id);

      if (!rd.bestCountry || v.value > rd.bestCountry.value) {
        rd.bestCountry = { name: v.country.name, value: v.value };
      }
      if (!rd.worstCountry || v.value < rd.worstCountry.value) {
        rd.worstCountry = { name: v.country.name, value: v.value };
      }

      const indKey = v.indicator.id;
      if (!rd.indicators.has(indKey)) {
        rd.indicators.set(indKey, { name: v.indicator.name, sum: 0, count: 0 });
      }
      const ind = rd.indicators.get(indKey)!;
      ind.sum += v.value;
      ind.count += 1;
    }

    return Array.from(regionData.entries()).map(([region, rd]) => ({
      region: formatRegion(region),
      countryCount: rd.countries.size,
      overallAverage: rd.values.length > 0
        ? Math.round((rd.values.reduce((a, b) => a + b, 0) / rd.values.length) * 100) / 100
        : null,
      bestPerformer: rd.bestCountry,
      worstPerformer: rd.worstCountry,
      indicators: Array.from(rd.indicators.values()).map((ind) => ({
        name: ind.name,
        averageValue: Math.round((ind.sum / ind.count) * 100) / 100,
        countryCount: ind.count,
      })),
      year,
    }));
  }
}
