/**
 * ============================================================
 * AYD — Youth Index Computation from AYIMS Data
 * ============================================================
 * Uses the indicator slugs actually imported from AYIMS.
 * Gender-disaggregated indicators (MALE/FEMALE) are averaged
 * into a single score per country.
 *
 * Run: npm run compute:youth-index
 * ============================================================
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

// ============================================================
// DIMENSION DEFINITIONS  (AYIMS slugs)
// direction: higher-is-better | lower-is-better
// weight: relative weight within the dimension (sum to 1.0)
// genders: which gender records to average for this indicator
// ============================================================

interface IndicatorDef {
  slug: string;
  direction: 'higher-is-better' | 'lower-is-better';
  weight: number;
  genders: ('TOTAL' | 'MALE' | 'FEMALE')[];
}
interface DimensionDef { weight: number; indicators: IndicatorDef[] }

const DIMENSIONS: Record<string, DimensionDef> = {
  education: {
    weight: 0.25,
    indicators: [
      { slug: 'youth-literacy-rate-male',    direction: 'higher-is-better', weight: 0.20, genders: ['MALE'] },
      { slug: 'youth-literacy-rate-female',  direction: 'higher-is-better', weight: 0.20, genders: ['FEMALE'] },
      { slug: 'primary-enrollment-rate',     direction: 'higher-is-better', weight: 0.15, genders: ['TOTAL'] },
      { slug: 'secondary-enrollment-male',   direction: 'higher-is-better', weight: 0.10, genders: ['MALE'] },
      { slug: 'secondary-enrollment-female', direction: 'higher-is-better', weight: 0.10, genders: ['FEMALE'] },
      { slug: 'tertiary-enrollment-rate',    direction: 'higher-is-better', weight: 0.10, genders: ['TOTAL'] },
      { slug: 'school-dropout-rate',         direction: 'lower-is-better',  weight: 0.10, genders: ['TOTAL'] },
      { slug: 'education-expenditure-gdp',   direction: 'higher-is-better', weight: 0.05, genders: ['TOTAL'] },
    ],
  },
  employment: {
    weight: 0.30,
    indicators: [
      { slug: 'youth-unemployment-male',              direction: 'lower-is-better',  weight: 0.20, genders: ['MALE'] },
      { slug: 'youth-unemployment-female',            direction: 'lower-is-better',  weight: 0.20, genders: ['FEMALE'] },
      { slug: 'labor-force-participation-youth-male', direction: 'higher-is-better', weight: 0.15, genders: ['MALE'] },
      { slug: 'labor-force-participation-youth-female', direction: 'higher-is-better', weight: 0.15, genders: ['FEMALE'] },
      { slug: 'youth-employment-ratio-male',          direction: 'higher-is-better', weight: 0.10, genders: ['MALE'] },
      { slug: 'youth-employment-ratio-female',        direction: 'higher-is-better', weight: 0.10, genders: ['FEMALE'] },
      { slug: 'youth-adult-unemployment-ratio',       direction: 'lower-is-better',  weight: 0.10, genders: ['TOTAL'] },
    ],
  },
  health: {
    weight: 0.25,
    indicators: [
      { slug: 'health-budget-share',          direction: 'higher-is-better', weight: 0.20, genders: ['TOTAL'] },
      { slug: 'physician-density',            direction: 'higher-is-better', weight: 0.20, genders: ['TOTAL'] },
      { slug: 'skilled-birth-attendance',     direction: 'higher-is-better', weight: 0.15, genders: ['TOTAL'] },
      { slug: 'youth-contraceptive-prevalence', direction: 'higher-is-better', weight: 0.10, genders: ['TOTAL'] },
      { slug: 'youth-hiv-treatment-rate',     direction: 'higher-is-better', weight: 0.15, genders: ['TOTAL'] },
      { slug: 'hiv-prevalence-youth-male',    direction: 'lower-is-better',  weight: 0.10, genders: ['MALE'] },
      { slug: 'hiv-prevalence-youth-female',  direction: 'lower-is-better',  weight: 0.10, genders: ['FEMALE'] },
    ],
  },
  civic: {
    weight: 0.10,
    indicators: [
      { slug: 'youth-voter-registration-male',   direction: 'higher-is-better', weight: 0.40, genders: ['MALE'] },
      { slug: 'youth-voter-registration-female', direction: 'higher-is-better', weight: 0.40, genders: ['FEMALE'] },
      { slug: 'youth-urban-share',               direction: 'higher-is-better', weight: 0.20, genders: ['TOTAL'] },
    ],
  },
  innovation: {
    weight: 0.10,
    indicators: [
      { slug: 'household-internet-access',    direction: 'higher-is-better', weight: 0.35, genders: ['TOTAL'] },
      { slug: 'youth-startup-survival-rate',  direction: 'higher-is-better', weight: 0.30, genders: ['TOTAL'] },
      { slug: 'ease-doing-business-rank',     direction: 'lower-is-better',  weight: 0.15, genders: ['TOTAL'] },
      { slug: 'getting-credit-rank',          direction: 'lower-is-better',  weight: 0.10, genders: ['TOTAL'] },
      { slug: 'youth-microcredit-recipients', direction: 'higher-is-better', weight: 0.10, genders: ['TOTAL'] },
    ],
  },
};

const YEARS = [2006, 2016, 2025];

// ============================================================
// HELPERS
// ============================================================

function minMaxNormalize(value: number, min: number, max: number, direction: 'higher-is-better' | 'lower-is-better'): number {
  if (max === min) return 50; // no variance
  const raw = (value - min) / (max - min);
  return Math.round((direction === 'higher-is-better' ? raw : 1 - raw) * 100 * 100) / 100;
}

function tier(percentile: number): string {
  if (percentile >= 80) return 'HIGH';
  if (percentile >= 60) return 'MEDIUM_HIGH';
  if (percentile >= 40) return 'MEDIUM';
  if (percentile >= 20) return 'MEDIUM_LOW';
  return 'LOW';
}

// ============================================================
// MAIN
// ============================================================

async function computeForYear(year: number) {
  console.log(`\n━━━ Computing Youth Index for ${year} ━━━`);

  // 1. All countries
  const countries = await prisma.country.findMany({ select: { id: true, name: true, region: true } });

  // 2. Resolve all slugs → IDs
  const allSlugs = Object.values(DIMENSIONS).flatMap(d => d.indicators.map(i => i.slug));
  const indicators = await prisma.indicator.findMany({
    where: { slug: { in: allSlugs } },
    select: { id: true, slug: true },
  });
  const slugToId = new Map(indicators.map(i => [i.slug, i.id]));

  const missingSlugs = allSlugs.filter(s => !slugToId.has(s));
  if (missingSlugs.length > 0) {
    console.log(`  ⚠  Slugs not found in DB: ${missingSlugs.join(', ')}`);
  }

  // 3. Fetch all values for this year (all genders)
  const indicatorIds = indicators.map(i => i.id);
  const rawValues = await prisma.indicatorValue.findMany({
    where: { year, indicatorId: { in: indicatorIds } },
    select: { countryId: true, indicatorId: true, value: true, gender: true },
  });

  // Build: indicatorId → countryId → gender → value
  type ValueMap = Map<string, Map<string, Map<string, number>>>;
  const valueMap: ValueMap = new Map();
  for (const v of rawValues) {
    if (!valueMap.has(v.indicatorId)) valueMap.set(v.indicatorId, new Map());
    const byCountry = valueMap.get(v.indicatorId)!;
    if (!byCountry.has(v.countryId)) byCountry.set(v.countryId, new Map());
    byCountry.get(v.countryId)!.set(v.gender, v.value);
  }

  // 4. For each (slug, genders) → get effective value per country, compute min/max
  type SlugStats = { min: number; max: number; values: Map<string, number> };
  const slugStats = new Map<string, SlugStats>();

  for (const [, dimDef] of Object.entries(DIMENSIONS)) {
    for (const indDef of dimDef.indicators) {
      const indId = slugToId.get(indDef.slug);
      if (!indId) continue;
      const byCountry = valueMap.get(indId);
      if (!byCountry) continue;

      const effectiveValues = new Map<string, number>();
      for (const [countryId, byGender] of byCountry) {
        const vals: number[] = [];
        for (const g of indDef.genders) {
          const v = byGender.get(g);
          if (v !== undefined) vals.push(v);
        }
        if (vals.length > 0) {
          effectiveValues.set(countryId, vals.reduce((a, b) => a + b, 0) / vals.length);
        }
      }

      const nums = Array.from(effectiveValues.values());
      if (nums.length === 0) continue;
      slugStats.set(indDef.slug, {
        min: Math.min(...nums),
        max: Math.max(...nums),
        values: effectiveValues,
      });
    }
  }

  // 5. Compute dimension and overall scores per country
  interface CountryScore {
    countryId: string;
    region: string;
    education: number;
    employment: number;
    health: number;
    civic: number;
    innovation: number;
    overall: number;
    indicatorCoverage: number;
  }

  const countryScores: CountryScore[] = [];

  for (const country of countries) {
    const dimScores: Record<string, number | null> = {};
    let totalIndicators = 0;
    let coveredIndicators = 0;

    for (const [dimKey, dimDef] of Object.entries(DIMENSIONS)) {
      let weightedSum = 0;
      let totalWeight = 0;

      for (const indDef of dimDef.indicators) {
        totalIndicators++;
        const stats = slugStats.get(indDef.slug);
        if (!stats) continue;
        const val = stats.values.get(country.id);
        if (val === undefined) continue;

        coveredIndicators++;
        const normed = minMaxNormalize(val, stats.min, stats.max, indDef.direction);
        weightedSum += normed * indDef.weight;
        totalWeight += indDef.weight;
      }

      // Rescale if we had partial coverage
      dimScores[dimKey] = totalWeight > 0
        ? Math.round((weightedSum / totalWeight) * 100) / 100
        : null;
    }

    // Skip countries with zero coverage
    if (coveredIndicators === 0) continue;

    // Compute overall: weighted average of dimension scores
    // Missing dimensions → use regional fallback (we'll do a second pass)
    let overallWeightedSum = 0;
    let overallTotalWeight = 0;

    for (const [dimKey, dimDef] of Object.entries(DIMENSIONS)) {
      const score = dimScores[dimKey];
      if (score !== null) {
        overallWeightedSum += score * dimDef.weight;
        overallTotalWeight += dimDef.weight;
      }
    }

    const overall = overallTotalWeight > 0
      ? Math.round((overallWeightedSum / overallTotalWeight) * 100) / 100
      : 0;

    countryScores.push({
      countryId: country.id,
      region: country.region,
      education: dimScores.education ?? 50,
      employment: dimScores.employment ?? 50,
      health: dimScores.health ?? 50,
      civic: dimScores.civic ?? 50,
      innovation: dimScores.innovation ?? 50,
      overall,
      indicatorCoverage: totalIndicators > 0 ? coveredIndicators / totalIndicators : 0,
    });
  }

  if (countryScores.length === 0) {
    console.log(`  ⚠  No data found for year ${year} — skipping`);
    return;
  }

  // 6. Rank by overall score
  countryScores.sort((a, b) => b.overall - a.overall);
  const total = countryScores.length;

  // 7. Get previous year ranks for rank change
  const prevYear = year === 2016 ? 2006 : year === 2025 ? 2016 : null;
  const prevRanks = new Map<string, number>();
  if (prevYear) {
    const prev = await prisma.youthIndexScore.findMany({
      where: { year: prevYear },
      select: { countryId: true, rank: true },
    });
    for (const p of prev) prevRanks.set(p.countryId, p.rank);
  }

  // 8. Upsert sequentially (connection_limit=1 — no parallel writes)
  let upserted = 0;
  for (let idx = 0; idx < countryScores.length; idx++) {
    const cs = countryScores[idx];
    const rank = idx + 1;
    const percentile = Math.round(((total - rank) / total) * 100 * 100) / 100;
    const previousRank = prevRanks.get(cs.countryId) ?? null;
    const rankChange = previousRank !== null ? previousRank - rank : 0;

    await prisma.youthIndexScore.upsert({
      where: { countryId_year: { countryId: cs.countryId, year } },
      create: {
        countryId: cs.countryId,
        year,
        rank,
        previousRank,
        rankChange,
        overallScore: cs.overall,
        educationScore: cs.education,
        employmentScore: cs.employment,
        healthScore: cs.health,
        civicScore: cs.civic,
        innovationScore: cs.innovation,
        percentile,
        tier: tier(percentile),
      },
      update: {
        rank,
        previousRank,
        rankChange,
        overallScore: cs.overall,
        educationScore: cs.education,
        employmentScore: cs.employment,
        healthScore: cs.health,
        civicScore: cs.civic,
        innovationScore: cs.innovation,
        percentile,
        tier: tier(percentile),
      },
    });
    upserted++;
  }

  const avg = Math.round(countryScores.reduce((s, c) => s + c.overall, 0) / total * 100) / 100;
  const top = countryScores[0];
  const bot = countryScores[total - 1];

  console.log(`  ✓ ${total} countries ranked`);
  console.log(`    Average score : ${avg}`);
  console.log(`    #1            : ${top.countryId} (${top.overall})`);
  console.log(`    Last          : ${bot.countryId} (${bot.overall})`);
  console.log(`    Avg coverage  : ${Math.round(countryScores.reduce((s, c) => s + c.indicatorCoverage, 0) / total * 100)}%`);

  return { year, total, avg };
}

async function main() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   AYD — Youth Index Computation      ║');
  console.log('╚══════════════════════════════════════╝');

  const results = [];
  for (const year of YEARS) {
    const r = await computeForYear(year);
    if (r) results.push(r);
  }

  console.log('\n╔══════════════════════════════════════╗');
  console.log('║         Final Summary                ║');
  console.log('╠══════════════════════════════════════╣');
  for (const r of results) {
    console.log(`║  ${r.year}: ${r.total} countries, avg ${r.avg}`);
  }
  console.log('╚══════════════════════════════════════╝\n');

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
