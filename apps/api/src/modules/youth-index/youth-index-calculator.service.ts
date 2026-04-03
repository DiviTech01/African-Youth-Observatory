/**
 * ============================================================
 * African Youth Index — Computation Engine
 * ============================================================
 *
 * METHODOLOGY:
 * The Youth Empowerment & Development (YED) Score is a composite index
 * that ranks all 54 African Union member states across 5 dimensions:
 *
 *   1. Education       (25%) — literacy, enrollment, completion, spending
 *   2. Employment      (30%) — unemployment, participation, NEET, vulnerability
 *   3. Health          (25%) — life expectancy, mortality, fertility, spending
 *   4. Civic           (10%) — voice/accountability, corruption control, gov effectiveness
 *   5. Innovation      (10%) — internet, mobile, R&D spending
 *
 * NORMALIZATION:
 *   Min-max normalization to 0-100 scale using actual data bounds per year.
 *   - "higher-is-better" indicators:  norm = ((val - min) / (max - min)) * 100
 *   - "lower-is-better"  indicators:  norm = ((max - val) / (max - min)) * 100
 *
 * MISSING DATA:
 *   - Missing indicator → redistribute its weight among remaining indicators
 *     in the same dimension.
 *   - Missing entire dimension → use regional average for that dimension.
 *     If no regional data, default to 50 (neutral).
 *
 * RANKING:
 *   Countries ranked by descending overall score (rank 1 = highest score).
 *   Percentile = ((totalCountries - rank) / totalCountries) * 100.
 *   Tier assigned by percentile thresholds (HIGH ≥80, MEDIUM_HIGH ≥60, etc.).
 *   Rank change computed against the previous year's results.
 *
 * ============================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache.service';

type Direction = 'higher-is-better' | 'lower-is-better';

interface IndicatorDef {
  slug: string;
  direction: Direction;
  weight: number;
}

interface DimensionDef {
  weight: number;
  indicators: IndicatorDef[];
}

// Slugs must match the actual indicator slugs in the database.
// The World Bank import script mapped WB codes to these seed slugs.
const DIMENSIONS: Record<string, DimensionDef> = {
  education: {
    weight: 0.25,
    indicators: [
      { slug: 'youth-literacy-rate', direction: 'higher-is-better', weight: 0.3 },
      { slug: 'secondary-school-net-enrollment-rate', direction: 'higher-is-better', weight: 0.25 },
      { slug: 'tertiary-education-gross-enrollment-rate', direction: 'higher-is-better', weight: 0.2 },
      { slug: 'primary-completion-rate', direction: 'higher-is-better', weight: 0.15 },
      { slug: 'education-expenditure-gdp', direction: 'higher-is-better', weight: 0.1 },
    ],
  },
  employment: {
    weight: 0.30,
    indicators: [
      { slug: 'youth-unemployment-rate', direction: 'lower-is-better', weight: 0.35 },
      { slug: 'youth-labor-force-participation-rate', direction: 'higher-is-better', weight: 0.25 },
      { slug: 'youth-neet-rate', direction: 'lower-is-better', weight: 0.25 },
      { slug: 'informal-employment-rate', direction: 'lower-is-better', weight: 0.15 },
    ],
  },
  health: {
    weight: 0.25,
    indicators: [
      // WB imported life expectancy under slug 'stunting-prevalence-under-5'
      { slug: 'stunting-prevalence-under-5', direction: 'higher-is-better', weight: 0.25 },
      { slug: 'youth-mortality-rate', direction: 'lower-is-better', weight: 0.2 },
      { slug: 'adolescent-fertility-rate', direction: 'lower-is-better', weight: 0.2 },
      // WB imported health expenditure under slug 'youth-healthcare-access'
      { slug: 'youth-healthcare-access', direction: 'higher-is-better', weight: 0.15 },
      { slug: 'maternal-mortality-ratio', direction: 'lower-is-better', weight: 0.2 },
    ],
  },
  civic: {
    weight: 0.10,
    indicators: [
      // WB governance indicators mapped to these seed slugs
      { slug: 'freedom-of-association-score', direction: 'higher-is-better', weight: 0.35 },
      { slug: 'youth-trust-in-government-index', direction: 'higher-is-better', weight: 0.35 },
      { slug: 'youth-political-participation-index', direction: 'higher-is-better', weight: 0.3 },
    ],
  },
  innovation: {
    weight: 0.10,
    indicators: [
      { slug: 'internet-penetration-rate', direction: 'higher-is-better', weight: 0.4 },
      { slug: 'mobile-cellular-subscriptions', direction: 'higher-is-better', weight: 0.3 },
      // WB imported R&D expenditure under slug 'ict-development-index'
      { slug: 'ict-development-index', direction: 'higher-is-better', weight: 0.3 },
    ],
  },
};

// Map dimension key to YouthIndexScore column name
const DIMENSION_SCORE_FIELD: Record<string, string> = {
  education: 'educationScore',
  employment: 'employmentScore',
  health: 'healthScore',
  civic: 'civicScore',
  innovation: 'innovationScore',
};

interface CountryDimensionScores {
  countryId: string;
  region: string;
  dimensions: Record<string, number | null>;
  overallScore: number;
}

@Injectable()
export class YouthIndexCalculatorService {
  private readonly logger = new Logger(YouthIndexCalculatorService.name);

  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  /**
   * Compute the Youth Index for a single year.
   * Fetches all relevant indicator values, normalizes, scores, ranks, and upserts.
   */
  async computeForYear(year: number): Promise<{
    year: number;
    countriesComputed: number;
    averageScore: number;
    topPerformer: { name: string; score: number };
    bottomPerformer: { name: string; score: number };
  }> {
    this.logger.log(`Computing Youth Index for year ${year}...`);

    // 1. Get all countries with their regions
    const countries = await this.prisma.country.findMany({
      select: { id: true, name: true, region: true },
    });

    // 2. Resolve indicator slugs → IDs
    const allSlugs = Object.values(DIMENSIONS).flatMap((d) =>
      d.indicators.map((i) => i.slug),
    );
    const indicators = await this.prisma.indicator.findMany({
      where: { slug: { in: allSlugs } },
      select: { id: true, slug: true },
    });
    const slugToId = new Map(indicators.map((i) => [i.slug, i.id]));

    // 3. Fetch all indicator values for this year (TOTAL gender)
    const indicatorIds = indicators.map((i) => i.id);
    const allValues = await this.prisma.indicatorValue.findMany({
      where: {
        year,
        gender: 'TOTAL',
        indicatorId: { in: indicatorIds },
      },
      select: { countryId: true, indicatorId: true, value: true },
    });

    // Build lookup: indicatorId → countryId → value
    const valueMap = new Map<string, Map<string, number>>();
    for (const v of allValues) {
      if (!valueMap.has(v.indicatorId)) {
        valueMap.set(v.indicatorId, new Map());
      }
      valueMap.get(v.indicatorId)!.set(v.countryId, v.value);
    }

    // 4. Compute min/max per indicator (for normalization)
    const minMax = new Map<string, { min: number; max: number }>();
    for (const [indId, countryValues] of valueMap) {
      const vals = Array.from(countryValues.values());
      if (vals.length === 0) continue;
      minMax.set(indId, {
        min: Math.min(...vals),
        max: Math.max(...vals),
      });
    }

    // 5. Normalize and compute dimension scores per country
    const countryScores: CountryDimensionScores[] = [];

    for (const country of countries) {
      const dimensions: Record<string, number | null> = {};

      for (const [dimKey, dimDef] of Object.entries(DIMENSIONS)) {
        let weightedSum = 0;
        let totalWeight = 0;

        for (const indDef of dimDef.indicators) {
          const indId = slugToId.get(indDef.slug);
          if (!indId) continue;

          const mm = minMax.get(indId);
          if (!mm) continue;

          const countryValues = valueMap.get(indId);
          const rawValue = countryValues?.get(country.id);
          if (rawValue === undefined || rawValue === null) continue;

          // Normalize
          const range = mm.max - mm.min;
          let normalized: number;
          if (range === 0) {
            normalized = 50; // all countries have same value
          } else if (indDef.direction === 'higher-is-better') {
            normalized = ((rawValue - mm.min) / range) * 100;
          } else {
            normalized = ((mm.max - rawValue) / range) * 100;
          }

          weightedSum += normalized * indDef.weight;
          totalWeight += indDef.weight;
        }

        if (totalWeight > 0) {
          // Redistribute weight: scale by (1 / totalWeight) to account for missing indicators
          dimensions[dimKey] = Math.round((weightedSum / totalWeight) * 100) / 100;
        } else {
          dimensions[dimKey] = null; // entire dimension missing
        }
      }

      countryScores.push({
        countryId: country.id,
        region: country.region,
        dimensions,
        overallScore: 0, // computed below
      });
    }

    // 6. Fill null dimensions with regional averages
    // First compute regional averages per dimension
    const regionDimAvg = new Map<string, Map<string, { sum: number; count: number }>>();
    for (const cs of countryScores) {
      if (!regionDimAvg.has(cs.region)) {
        regionDimAvg.set(cs.region, new Map());
      }
      const regionMap = regionDimAvg.get(cs.region)!;
      for (const [dimKey, score] of Object.entries(cs.dimensions)) {
        if (score !== null) {
          if (!regionMap.has(dimKey)) {
            regionMap.set(dimKey, { sum: 0, count: 0 });
          }
          const entry = regionMap.get(dimKey)!;
          entry.sum += score;
          entry.count += 1;
        }
      }
    }

    // Fill nulls
    for (const cs of countryScores) {
      for (const dimKey of Object.keys(DIMENSIONS)) {
        if (cs.dimensions[dimKey] === null) {
          const regionMap = regionDimAvg.get(cs.region);
          const regionEntry = regionMap?.get(dimKey);
          if (regionEntry && regionEntry.count > 0) {
            cs.dimensions[dimKey] = Math.round((regionEntry.sum / regionEntry.count) * 100) / 100;
          } else {
            cs.dimensions[dimKey] = 50; // neutral fallback
          }
        }
      }
    }

    // 7. Compute overall scores
    for (const cs of countryScores) {
      let overallScore = 0;
      for (const [dimKey, dimDef] of Object.entries(DIMENSIONS)) {
        overallScore += (cs.dimensions[dimKey] ?? 50) * dimDef.weight;
      }
      cs.overallScore = Math.round(overallScore * 100) / 100;
    }

    // 8. Rank by overall score (descending)
    countryScores.sort((a, b) => b.overallScore - a.overallScore);
    const totalCountries = countryScores.length;

    // 9. Get previous year's ranks for rank change computation
    const previousRanks = new Map<string, number>();
    const prevScores = await this.prisma.youthIndexScore.findMany({
      where: { year: year - 1 },
      select: { countryId: true, rank: true },
    });
    for (const ps of prevScores) {
      previousRanks.set(ps.countryId, ps.rank);
    }

    // 10. Assign tier based on percentile
    const getTier = (percentile: number) => {
      if (percentile >= 80) return 'HIGH';
      if (percentile >= 60) return 'MEDIUM_HIGH';
      if (percentile >= 40) return 'MEDIUM';
      if (percentile >= 20) return 'MEDIUM_LOW';
      return 'LOW';
    };

    // 11. Build upsert data
    const countryNameMap = new Map(countries.map((c) => [c.id, c.name]));
    const upsertData = countryScores.map((cs, index) => {
      const rank = index + 1;
      const percentile = Math.round(((totalCountries - rank) / totalCountries) * 10000) / 100;
      const prevRank = previousRanks.get(cs.countryId) ?? null;
      const rankChange = prevRank !== null ? prevRank - rank : null;

      return {
        countryId: cs.countryId,
        year,
        overallScore: cs.overallScore,
        educationScore: cs.dimensions.education ?? 50,
        employmentScore: cs.dimensions.employment ?? 50,
        healthScore: cs.dimensions.health ?? 50,
        civicScore: cs.dimensions.civic ?? 50,
        innovationScore: cs.dimensions.innovation ?? 50,
        rank,
        previousRank: prevRank,
        rankChange,
        percentile,
        tier: getTier(percentile) as 'HIGH' | 'MEDIUM_HIGH' | 'MEDIUM' | 'MEDIUM_LOW' | 'LOW',
      };
    });

    // 12. Upsert all scores
    for (const data of upsertData) {
      await this.prisma.youthIndexScore.upsert({
        where: {
          countryId_year: { countryId: data.countryId, year: data.year },
        },
        update: {
          overallScore: data.overallScore,
          educationScore: data.educationScore,
          employmentScore: data.employmentScore,
          healthScore: data.healthScore,
          civicScore: data.civicScore,
          innovationScore: data.innovationScore,
          rank: data.rank,
          previousRank: data.previousRank,
          rankChange: data.rankChange,
          percentile: data.percentile,
          tier: data.tier,
        },
        create: data,
      });
    }

    // 13. Clear related caches
    this.cache.clearPrefix('youth-index');

    // 14. Summary
    const scores = upsertData.map((d) => d.overallScore);
    const avgScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100;
    const top = upsertData[0];
    const bottom = upsertData[upsertData.length - 1];

    const result = {
      year,
      countriesComputed: upsertData.length,
      averageScore: avgScore,
      topPerformer: {
        name: countryNameMap.get(top.countryId) || 'Unknown',
        score: top.overallScore,
      },
      bottomPerformer: {
        name: countryNameMap.get(bottom.countryId) || 'Unknown',
        score: bottom.overallScore,
      },
    };

    this.logger.log(
      `Year ${year}: ${result.countriesComputed} countries, avg=${result.averageScore}, ` +
      `top=${result.topPerformer.name} (${result.topPerformer.score}), ` +
      `bottom=${result.bottomPerformer.name} (${result.bottomPerformer.score})`,
    );

    return result;
  }

  /**
   * Compute the Youth Index for all years from 2000 to 2024.
   * Runs sequentially so rank changes can reference the previous year.
   */
  async computeAll(): Promise<{
    yearsComputed: number;
    results: { year: number; countriesComputed: number; averageScore: number }[];
  }> {
    this.logger.log('Computing Youth Index for all years (2000-2024)...');

    const results: { year: number; countriesComputed: number; averageScore: number }[] = [];

    for (let year = 2000; year <= 2024; year++) {
      // Check if there's any data for this year
      const dataCount = await this.prisma.indicatorValue.count({
        where: { year, gender: 'TOTAL' },
      });

      if (dataCount === 0) {
        this.logger.log(`Skipping year ${year} — no data`);
        continue;
      }

      const result = await this.computeForYear(year);
      results.push({
        year: result.year,
        countriesComputed: result.countriesComputed,
        averageScore: result.averageScore,
      });
    }

    this.logger.log(`Computation complete: ${results.length} years processed`);
    return { yearsComputed: results.length, results };
  }
}
