/**
 * African Youth Index — Computation Engine (7-theme, coverage-floored)
 *
 * METHODOLOGY:
 *   Composite index over 7 user-mandated themes with weights from DB (Theme.weight):
 *     Youth Demography & Participation 20% | Education 15% | Employment 15% |
 *     Health 15% | Entrepreneurship 15% | Peace & Security 10% | Access to Justice 10%
 *   Sub-weights per theme live in ./youth-index-weights.ts.
 *
 * INPUT:
 *   TOTAL-gender values for the year, read from each indicator's canonical age
 *   band (PrismaService middleware). Headcount indicators flagged `perCapita`
 *   are converted to a rate per 100,000 youth first.
 *
 * NORMALIZATION:
 *   Min-max per indicator across countries for the same year, onto [5, 100].
 *     higher-is-better: 5 + ((val - min) / (max - min)) * 95
 *     lower-is-better:  5 + ((max - val) / (max - min)) * 95
 *   Per-capita indicators are winsorised at the 5th/95th percentile first.
 *   An indicator whose values are all identical that year carries no
 *   information and is skipped (it used to score everyone 50).
 *
 * MISSING DATA (coverage floor, see youth-index-weights.ts):
 *   Within a theme, weight is redistributed over the indicators that have data
 *   -- but only if they cover MIN_DIMENSION_COVERAGE of the theme's weight and
 *   number at least MIN_DIMENSION_INDICATORS. Otherwise the theme is null.
 *   A missing theme is NOT filled (no regional average, no 50). The overall
 *   score is the weighted mean over scored themes, and a country whose scored
 *   themes carry less than MIN_INDEX_COVERAGE of the total weight is not scored
 *   or ranked at all.
 *
 * STORAGE:
 *   Per-theme scores (number | null) in YouthIndexScore.dimensionScores, keyed
 *   by theme slug, with provenance under '_meta'. Countries that fall below the
 *   floor get no row for that year; any stale row from an earlier method is
 *   deleted so readers never show it.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache.service';
import {
  SUB_WEIGHTS,
  ALL_INDEX_INDICATOR_SLUGS,
  YOUTH_POPULATION_SLUG,
  MIN_DIMENSION_COVERAGE,
  MIN_DIMENSION_INDICATORS,
  MIN_INDEX_COVERAGE,
} from './youth-index-weights';

/** Version tag written into _meta so readers can tell which method made a row. */
export const INDEX_METHOD = 'coverage-floor-2026-10';

/**
 * How a dimension score came to exist.
 *
 * 'measured'     - computed from indicators that actually have values, above the floor
 * 'insufficient' - too little data to score; the dimension is null
 *
 * Rows written before 2026-10 may also carry 'regional-average' or 'default'
 * (imputed); readers treat those as insufficient.
 */
export type DimensionSource = 'measured' | 'insufficient';

export interface DimensionCoverage {
  source: DimensionSource;
  /** Indicators that contributed a value. */
  indicators: number;
  /** Indicators the methodology defines for this dimension. */
  of: number;
  /** Share of the dimension's weight carried by the contributing indicators (0-1). */
  weightShare: number;
}

export interface CountryYearScore {
  countryId: string;
  countryName: string;
  region: string;
  dimensions: Record<string, number | null>;
  coverage: Record<string, DimensionCoverage>;
  /** Share of total theme weight carried by scored dimensions (0-1). */
  indexCoverage: number;
  /** Null when the country is below MIN_INDEX_COVERAGE. */
  overallScore: number | null;
}

export interface ScoreYearInput {
  countries: { id: string; name: string; region: string }[];
  themeWeight: Map<string, number>;
  slugToId: Map<string, string>;
  values: { countryId: string; indicatorId: string; value: number }[];
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Pure scoring for one year. No I/O, so the recompute dry-run can call it with
 * the same inputs the service uses and get exactly what would be written.
 */
export function scoreYear(input: ScoreYearInput): { scored: CountryYearScore[]; unscored: CountryYearScore[] } {
  const { countries, themeWeight, slugToId, values } = input;

  // indicatorId -> countryId -> raw value
  const raw = new Map<string, Map<string, number>>();
  for (const v of values) {
    let m = raw.get(v.indicatorId);
    if (!m) raw.set(v.indicatorId, (m = new Map()));
    m.set(v.countryId, v.value);
  }

  const popId = slugToId.get(YOUTH_POPULATION_SLUG);
  const youthPopThousands = popId ? raw.get(popId) ?? new Map<string, number>() : new Map<string, number>();

  // indicatorId -> countryId -> value as scored (per-capita where flagged)
  const scoredValues = new Map<string, Map<string, number>>();
  for (const subs of Object.values(SUB_WEIGHTS)) {
    for (const sub of subs) {
      const indId = slugToId.get(sub.slug);
      const m = indId ? raw.get(indId) : undefined;
      if (!indId || !m) continue;
      const out = new Map<string, number>();
      for (const [countryId, val] of m) {
        if (!Number.isFinite(val)) continue;
        if (sub.perCapita) {
          const pop = youthPopThousands.get(countryId);
          // No denominator, no rate: the indicator is missing for this country.
          if (pop === undefined || !(pop > 0)) continue;
          out.set(countryId, (val * 100) / pop); // per 100,000 youth (pop in thousands)
        } else {
          out.set(countryId, val);
        }
      }
      scoredValues.set(indId, out);
    }
  }

  // Per-capita rates are heavy-tailed: one micro-state (Seychelles, ~24k
  // youth) lands 10-30x above the next country and min-max then squeezes every
  // other country to ~100. Winsorise those indicators at the 5th / 95th
  // percentile before normalising (values outside are clamped, not dropped).
  const perCapitaIds = new Set(
    Object.values(SUB_WEIGHTS).flat().filter((s) => s.perCapita).map((s) => slugToId.get(s.slug)).filter(Boolean) as string[],
  );
  const minMax = new Map<string, { min: number; max: number }>();
  for (const [indId, m] of scoredValues) {
    const vals = Array.from(m.values()).sort((a, b) => a - b);
    if (vals.length === 0) continue;
    let min = vals[0];
    let max = vals[vals.length - 1];
    if (perCapitaIds.has(indId) && vals.length >= 10) {
      min = vals[Math.floor((vals.length - 1) * 0.05)];
      max = vals[Math.ceil((vals.length - 1) * 0.95)];
    }
    if (max - min > 0) minMax.set(indId, { min, max });
  }

  const FLOOR = 5;
  const SCALE = 100 - FLOOR;
  const totalThemeWeight = Object.keys(SUB_WEIGHTS).reduce((a, t) => a + (themeWeight.get(t) ?? 0), 0);

  const all: CountryYearScore[] = countries.map((country) => {
    const dimensions: Record<string, number | null> = {};
    const coverage: Record<string, DimensionCoverage> = {};
    let weightedOverall = 0;
    let scoredThemeWeight = 0;

    for (const [themeSlug, subs] of Object.entries(SUB_WEIGHTS)) {
      const definedWeight = subs.reduce((a, s) => a + s.weight, 0);
      let weightedSum = 0;
      let usedWeight = 0;
      let contributing = 0;
      for (const sub of subs) {
        const indId = slugToId.get(sub.slug);
        const mm = indId ? minMax.get(indId) : undefined;
        const raw0 = indId ? scoredValues.get(indId)?.get(country.id) : undefined;
        if (!mm || raw0 === undefined) continue;
        const val = Math.min(mm.max, Math.max(mm.min, raw0)); // no-op unless winsorised
        const range = mm.max - mm.min;
        const normalized = sub.direction === 'higher-is-better'
          ? FLOOR + ((val - mm.min) / range) * SCALE
          : FLOOR + ((mm.max - val) / range) * SCALE;
        weightedSum += normalized * sub.weight;
        usedWeight += sub.weight;
        contributing += 1;
      }
      const weightShare = definedWeight > 0 ? usedWeight / definedWeight : 0;
      const enough = contributing >= MIN_DIMENSION_INDICATORS && weightShare >= MIN_DIMENSION_COVERAGE - 1e-9;
      dimensions[themeSlug] = enough ? round2(weightedSum / usedWeight) : null;
      coverage[themeSlug] = {
        source: enough ? 'measured' : 'insufficient',
        indicators: contributing,
        of: subs.length,
        weightShare: round2(weightShare),
      };
      if (enough) {
        const w = themeWeight.get(themeSlug) ?? 0;
        weightedOverall += (dimensions[themeSlug] as number) * w;
        scoredThemeWeight += w;
      }
    }

    const indexCoverage = totalThemeWeight > 0 ? scoredThemeWeight / totalThemeWeight : 0;
    const overallScore = indexCoverage >= MIN_INDEX_COVERAGE - 1e-9 && scoredThemeWeight > 0
      ? round2(weightedOverall / scoredThemeWeight)
      : null;

    return {
      countryId: country.id,
      countryName: country.name,
      region: country.region,
      dimensions,
      coverage,
      indexCoverage: round2(indexCoverage),
      overallScore,
    };
  });

  const scored = all
    .filter((c) => c.overallScore !== null)
    .sort((a, b) => (b.overallScore as number) - (a.overallScore as number) || a.countryName.localeCompare(b.countryName));
  const unscored = all.filter((c) => c.overallScore === null).sort((a, b) => a.countryName.localeCompare(b.countryName));
  return { scored, unscored };
}

export interface ComputeYearResult {
  year: number;
  countriesComputed: number;
  /** Countries below the coverage floor: not scored, not ranked. */
  countriesInsufficient: number;
  averageScore: number | null;
  topPerformer: { name: string; score: number } | null;
  bottomPerformer: { name: string; score: number } | null;
  /** Stale rows removed (or, on a dry run, that would be removed). */
  staleRowsDeleted: number;
  dryRun: boolean;
  /** Only on a dry run: the full ranked list plus the unscored countries. */
  ranking?: { rank: number; countryId: string; countryName: string; overallScore: number; dimensions: Record<string, number | null>; indexCoverage: number }[];
  insufficient?: { countryId: string; countryName: string; indexCoverage: number }[];
}

@Injectable()
export class YouthIndexCalculatorService {
  private readonly logger = new Logger(YouthIndexCalculatorService.name);

  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  /** Load everything scoreYear needs for one year. Read-only. */
  async loadYearInput(year: number): Promise<ScoreYearInput> {
    const countries = await this.prisma.country.findMany({
      select: { id: true, name: true, region: true },
    });

    // Theme weights from DB (source of truth)
    const themes = await this.prisma.theme.findMany({
      where: { weight: { not: null } },
      select: { slug: true, weight: true },
    });
    const themeWeight = new Map<string, number>(themes.map((t) => [t.slug, t.weight!]));

    // Resolve indicator slugs -> IDs (index indicators plus the per-capita denominator)
    const indicators = await this.prisma.indicator.findMany({
      where: { slug: { in: [...ALL_INDEX_INDICATOR_SLUGS, YOUTH_POPULATION_SLUG] } },
      select: { id: true, slug: true },
    });
    const slugToId = new Map(indicators.map((i) => [i.slug, i.id]));

    // No ageGroup: the Prisma middleware reads each indicator's canonical band,
    // so the 18-30 / 18-35 series (Peace & Security, Justice) are included.
    const values = await this.prisma.indicatorValue.findMany({
      where: {
        year,
        gender: 'TOTAL',
        indicatorId: { in: indicators.map((i) => i.id) },
      },
      select: { countryId: true, indicatorId: true, value: true },
    });

    return { countries, themeWeight, slugToId, values };
  }

  async computeForYear(year: number, opts: { dryRun?: boolean } = {}): Promise<ComputeYearResult> {
    const dryRun = !!opts.dryRun;
    this.logger.log(`Computing Youth Index for year ${year}${dryRun ? ' (dry run, no writes)' : ''}...`);

    const input = await this.loadYearInput(year);
    const { scored, unscored } = scoreYear(input);
    const total = scored.length;

    // Previous-year ranks (for rank change)
    const prev = await this.prisma.youthIndexScore.findMany({
      where: { year: year - 1 },
      select: { countryId: true, rank: true },
    });
    const previousRanks = new Map(prev.map((p) => [p.countryId, p.rank]));

    const tierOf = (pct: number) =>
      pct >= 80 ? 'HIGH' : pct >= 60 ? 'MEDIUM_HIGH' : pct >= 40 ? 'MEDIUM' : pct >= 20 ? 'MEDIUM_LOW' : 'LOW';

    const scoredIds = scored.map((c) => c.countryId);
    const staleWhere = { year, countryId: { notIn: scoredIds } };
    let staleRowsDeleted = await this.prisma.youthIndexScore.count({ where: staleWhere });

    if (!dryRun) {
      for (let i = 0; i < scored.length; i++) {
        const cs = scored[i];
        const rank = i + 1;
        const percentile = Math.round(((total - rank) / total) * 10000) / 100;
        const prevRank = previousRanks.get(cs.countryId) ?? null;
        const data = {
          countryId: cs.countryId,
          year,
          overallScore: cs.overallScore as number,
          // _meta rides inside the existing JSON column so provenance ships without
          // a schema migration. Readers must skip keys starting with '_'.
          dimensionScores: {
            ...cs.dimensions,
            _meta: { coverage: cs.coverage, indexCoverage: cs.indexCoverage, method: INDEX_METHOD },
          } as any,
          rank,
          previousRank: prevRank,
          rankChange: prevRank !== null ? prevRank - rank : null,
          percentile,
          tier: tierOf(percentile) as 'HIGH' | 'MEDIUM_HIGH' | 'MEDIUM' | 'MEDIUM_LOW' | 'LOW',
        };
        await this.prisma.youthIndexScore.upsert({
          where: { countryId_year: { countryId: cs.countryId, year } },
          create: data,
          update: {
            overallScore: data.overallScore,
            dimensionScores: data.dimensionScores,
            rank: data.rank,
            previousRank: data.previousRank,
            rankChange: data.rankChange,
            percentile: data.percentile,
            tier: data.tier,
          },
        });
      }
      // A country that fell below the floor must not keep a score from an
      // earlier, imputing method.
      const del = await this.prisma.youthIndexScore.deleteMany({ where: staleWhere });
      staleRowsDeleted = del.count;
      this.cache.clearPrefix('youth-index');
    }

    const scores = scored.map((c) => c.overallScore as number);
    const result: ComputeYearResult = {
      year,
      countriesComputed: total,
      countriesInsufficient: unscored.length,
      averageScore: scores.length ? round2(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      topPerformer: total ? { name: scored[0].countryName, score: scored[0].overallScore as number } : null,
      bottomPerformer: total ? { name: scored[total - 1].countryName, score: scored[total - 1].overallScore as number } : null,
      staleRowsDeleted,
      dryRun,
    };
    if (dryRun) {
      result.ranking = scored.map((c, i) => ({
        rank: i + 1,
        countryId: c.countryId,
        countryName: c.countryName,
        overallScore: c.overallScore as number,
        dimensions: c.dimensions,
        indexCoverage: c.indexCoverage,
      }));
      result.insufficient = unscored.map((c) => ({ countryId: c.countryId, countryName: c.countryName, indexCoverage: c.indexCoverage }));
    }
    this.logger.log(
      `Year ${year}: ${total} scored, ${unscored.length} insufficient, avg=${result.averageScore}, ` +
      `top=${result.topPerformer?.name ?? '-'} (${result.topPerformer?.score ?? '-'}), ` +
      `bottom=${result.bottomPerformer?.name ?? '-'} (${result.bottomPerformer?.score ?? '-'}), ` +
      `stale rows ${dryRun ? 'to delete' : 'deleted'}=${staleRowsDeleted}`,
    );
    return result;
  }

  /**
   * Years that have TOTAL data for at least one index indicator (in its
   * canonical band). Restricted to index indicators so the AYC policy markers'
   * adoption years (1995 ... 2050) are not mistaken for index years.
   */
  async yearsWithData(): Promise<number[]> {
    const rows = await this.prisma.indicatorValue.groupBy({
      by: ['year'],
      where: { gender: 'TOTAL', indicator: { slug: { in: ALL_INDEX_INDICATOR_SLUGS } } },
      _count: { _all: true },
      orderBy: { year: 'asc' },
    });
    return rows.map((r) => r.year);
  }

  async computeAll(opts: { dryRun?: boolean } = {}): Promise<{
    yearsComputed: number;
    results: ComputeYearResult[];
  }> {
    this.logger.log('Computing Youth Index for all years with data...');
    const results: ComputeYearResult[] = [];
    // Ascending, so each year's previousRank comes from the freshly computed year before it.
    for (const year of await this.yearsWithData()) {
      results.push(await this.computeForYear(year, opts));
    }
    this.logger.log(`Computation complete: ${results.length} years processed`);
    return { yearsComputed: results.length, results };
  }
}
