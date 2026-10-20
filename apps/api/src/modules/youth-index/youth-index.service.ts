import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache.service';
import { formatRegion, formatTier } from '../../common/utils/format';

// Theme-slug-keyed dimension scores stored in YouthIndexScore.dimensionScores (Json).
// A null dimension means "insufficient data" -- it is never a score.
type DimensionMap = Record<string, number | null>;

const THEME_KEYS = [
  'youth-demography-participation',
  'education',
  'employment',
  'health',
  'entrepreneurship',
  'peace-security',
  'access-to-justice',
] as const;

const METHODOLOGY =
  'Min-max normalization with weighted dimensional scoring (7 themes). ' +
  'Dimensions below the coverage floor are null (insufficient data), never imputed; ' +
  'countries below the floor are not ranked. Where an indicator has no combined (TOTAL) value but has both ' +
  'a value for women and one for men, their average is used and listed in mfAveraged.';

function asDims(json: unknown): Record<string, unknown> {
  if (!json || typeof json !== 'object') return {};
  return json as Record<string, unknown>;
}

/**
 * Provenance for each dimension, written by the calculator into the same JSON
 * column under '_meta'.
 *
 * Callers need this to tell a measured score from an imputed one. Without it a
 * dimension built from a single indicator, one filled with a regional average,
 * and the flat 50 used when a region has no data at all are indistinguishable
 * -- which is how Peace & Security came to read 50.0 for all 54 countries with
 * nothing anywhere saying so.
 *
 * Returns null for scores computed before provenance was recorded; treat null
 * as "unknown provenance", never as "measured".
 */
function coverageOf(json: unknown): Record<string, unknown> | null {
  if (!json || typeof json !== 'object') return null;
  const meta = (json as Record<string, unknown>)._meta;
  if (!meta || typeof meta !== 'object') return null;
  const cov = (meta as Record<string, unknown>).coverage;
  return cov && typeof cov === 'object' ? (cov as Record<string, unknown>) : null;
}

/**
 * The seven dimensions as clients should show them: a number only when it was
 * measured, otherwise null ("insufficient data").
 *
 * This replaces ensureAll(), which re-imputed 50 for any missing dimension on
 * read -- so even after the calculator recorded provenance, clients received a
 * plain 50 they could not tell from a measurement (audit C2). Rows written by
 * the pre-2026-10 calculator also carry 'regional-average' / 'default'
 * dimensions: those were imputed too and are returned as null as well.
 */
function dimensionsOf(json: unknown): DimensionMap {
  const dims = asDims(json);
  const cov = coverageOf(json);
  const out: DimensionMap = {};
  // Only the seven known theme keys are emitted, so the '_meta' provenance key
  // stored alongside them never leaks into a dimensions payload.
  for (const k of THEME_KEYS) {
    const v = dims[k];
    const source = (cov?.[k] as { source?: string } | undefined)?.source;
    const imputed = source === 'regional-average' || source === 'default' || source === 'insufficient';
    out[k] = typeof v === 'number' && Number.isFinite(v) && !imputed ? v : null;
  }
  return out;
}

/** Dimension keys with no measured score -- the explicit "insufficient data" flag. */
function insufficientOf(dims: DimensionMap): string[] {
  return THEME_KEYS.filter((k) => dims[k] === null);
}

/** Index indicators scored from the women/men mean because no TOTAL value exists. */
function mfAveragedOf(json: unknown): string[] {
  const meta = asDims(json)._meta as Record<string, unknown> | undefined;
  return Array.isArray(meta?.mfAveraged) ? (meta.mfAveraged as string[]) : [];
}

/** Share of index weight that was measured (0-1), when the calculator recorded it. */
function indexCoverageOf(json: unknown): number | null {
  const meta = asDims(json)._meta as Record<string, unknown> | undefined;
  return typeof meta?.indexCoverage === 'number' ? meta.indexCoverage : null;
}

@Injectable()
export class YouthIndexService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  /**
   * The most recent year that has computed index scores. Used when a caller
   * does not name a year, so the default follows the data instead of a
   * hard-coded year that silently goes stale (it sat at 2024 while 2025 scores
   * existed, and web and mobile disagreed about which year was "current").
   */
  async latestYear(): Promise<number> {
    const cacheKey = 'youth-index:latest-year';
    const cached = this.cache.get<number>(cacheKey);
    if (cached) return cached;

    const agg = await this.prisma.youthIndexScore.aggregate({ _max: { year: true } });
    const year = agg._max.year ?? new Date().getFullYear() - 1;
    this.cache.set(cacheKey, year, 300);
    return year;
  }

  /**
   * Countries that have no score for the year. Since the coverage floor, a
   * country with too little data gets no row at all; listing them keeps them
   * visible as "insufficient data" instead of silently missing from a 54-row
   * table.
   */
  private async unscoredCountries(year: number) {
    const countries = await this.prisma.country.findMany({
      where: { youthIndexScores: { none: { year } } },
      select: { id: true, name: true, isoCode3: true, region: true, flagEmoji: true },
      orderBy: { name: 'asc' },
    });
    return countries.map((c) => ({
      countryId: c.id,
      countryName: c.name,
      isoCode3: c.isoCode3,
      flagEmoji: c.flagEmoji,
      region: formatRegion(c.region),
    }));
  }

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
    const insufficientData = await this.unscoredCountries(year);

    if (!rankings.length) {
      return {
        data: [],
        meta: {
          year,
          totalCountries: 0,
          averageScore: null,
          insufficientData,
          methodology: METHODOLOGY,
        },
      };
    }

    const data = rankings.map((r) => {
      const dims = dimensionsOf(r.dimensionScores);
      return {
        dimensionCoverage: coverageOf(r.dimensionScores),
        insufficientDimensions: insufficientOf(dims),
        mfAveraged: mfAveragedOf(r.dimensionScores),
        indexCoverage: indexCoverageOf(r.dimensionScores),
        rank: r.rank,
        countryId: r.countryId,
        countryName: r.country.name,
        isoCode3: r.country.isoCode3,
        isoCode: r.country.isoCode3,
        iso3Code: r.country.isoCode3,
        flagEmoji: r.country.flagEmoji,
        region: formatRegion(r.country.region),
        overallScore: r.overallScore,
        dimensions: dims,
        previousRank: r.previousRank,
        rankChange: r.rankChange,
        percentile: r.percentile,
        tier: formatTier(r.tier),
      };
    });

    const scores = data.map((d) => d.overallScore);
    const averageScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100;

    const result = {
      data,
      meta: {
        year,
        totalCountries: data.length,
        averageScore,
        insufficientData,
        methodology: METHODOLOGY,
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
      throw new NotFoundException(`Insufficient data: no youth index score for country ${countryId}`);

    return {
      country: {
        id: countryId,
        name: scores[0].country.name,
        isoCode3: scores[0].country.isoCode3,
        isoCode: scores[0].country.isoCode3,
        iso3Code: scores[0].country.isoCode3,
        region: formatRegion(scores[0].country.region),
        flagEmoji: scores[0].country.flagEmoji,
      },
      scores: scores.map((s) => {
        const dims = dimensionsOf(s.dimensionScores);
        return {
          year: s.year,
          overallScore: s.overallScore,
          dimensions: dims,
          dimensionCoverage: coverageOf(s.dimensionScores),
          insufficientDimensions: insufficientOf(dims),
          mfAveraged: mfAveragedOf(s.dimensionScores),
          indexCoverage: indexCoverageOf(s.dimensionScores),
          rank: s.rank,
          previousRank: s.previousRank,
          rankChange: s.rankChange,
          percentile: s.percentile,
          tier: formatTier(s.tier),
        };
      }),
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

    return rankings.map((r) => {
      const dims = dimensionsOf(r.dimensionScores);
      return {
        rank: r.rank,
        countryId: r.countryId,
        countryName: r.country.name,
        isoCode3: r.country.isoCode3,
        isoCode: r.country.isoCode3,
        iso3Code: r.country.isoCode3,
        flagEmoji: r.country.flagEmoji,
        region: formatRegion(r.country.region),
        overallScore: r.overallScore,
        dimensions: dims,
        dimensionCoverage: coverageOf(r.dimensionScores),
        insufficientDimensions: insufficientOf(dims),
        mfAveraged: mfAveragedOf(r.dimensionScores),
        tier: formatTier(r.tier),
      };
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

    return scores.map((s) => ({
      rank: s.rank,
      countryId: s.countryId,
      countryName: s.country.name,
      isoCode3: s.country.isoCode3,
      isoCode: s.country.isoCode3,
      iso3Code: s.country.isoCode3,
      flagEmoji: s.country.flagEmoji,
      region: formatRegion(s.country.region),
      overallScore: s.overallScore,
      previousRank: s.previousRank,
      rankChange: s.rankChange,
      tier: formatTier(s.tier),
    }));
  }
}
