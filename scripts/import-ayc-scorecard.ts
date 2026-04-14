/**
 * AYC Composite Policy Index Scorecard Import Script
 *
 * Imports the AYC Policy Index from the PACSDA scorecard Excel file.
 * Reads indicator scores, per-country years, and computes the composite score.
 *
 * Usage:
 *   npm run import:ayc-scorecard
 *   tsx scripts/import-ayc-scorecard.ts [path/to/file.xlsx]
 */

import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

// ============================================================
// Constants
// ============================================================

const DEFAULT_FILE = 'data/raw/pacsda/AYC_Composite_Policy_Index_Scorecard.xlsx';
const SOURCE = 'AYC Policy Index / PACSDA';
const AGE_GROUP = ''; // policy data — not age-specific
const DEFAULT_YEAR = 2024;
const CONFIDENCE = 1.0;

// ============================================================
// Indicator Definitions
// ============================================================

interface IndicatorDef {
  colIdx: number;   // 0-based index in sheet_to_json rows
  slug: string;
  name: string;
  themeSlug: string;
}

// 27 unique indicators (ayc-startup-act appears in two dimensions, defined once)
const INDICATORS: IndicatorDef[] = [
  // GOVERNANCE_PARTICIPATION
  { colIdx: 3,  slug: 'ayc-national-youth-policy',        name: 'National Youth Policy',                           themeSlug: 'civic-engagement-governance' },
  { colIdx: 7,  slug: 'ayc-youth-volunteer-programme',    name: 'Youth Volunteer Programme',                       themeSlug: 'civic-engagement-governance' },
  { colIdx: 8,  slug: 'ayc-youth-peace-security-plan',    name: 'Youth Peace & Security Plan',                     themeSlug: 'civic-engagement-governance' },
  // ECONOMIC_INCLUSION
  { colIdx: 4,  slug: 'ayc-youth-employment-plan',        name: 'Youth Employment Plan',                           themeSlug: 'employment-entrepreneurship' },
  { colIdx: 5,  slug: 'ayc-entrepreneurship-programme',   name: 'Entrepreneurship Programme',                      themeSlug: 'employment-entrepreneurship' },
  { colIdx: 21, slug: 'ayc-sme-development-policy',       name: 'SME Development Policy / Act',                    themeSlug: 'employment-entrepreneurship' },
  { colIdx: 22, slug: 'ayc-startup-act',                  name: 'Startup Act / Innovation Law',                    themeSlug: 'employment-entrepreneurship' },
  { colIdx: 28, slug: 'ayc-youth-tax-incentives',         name: 'Tax Incentives for Youth / SMEs',                 themeSlug: 'employment-entrepreneurship' },
  // HUMAN_CAPITAL_RIGHTS
  { colIdx: 9,  slug: 'ayc-education-policy-sdg4',        name: 'National Education Policy / SDG-4 Plan',          themeSlug: 'education' },
  { colIdx: 10, slug: 'ayc-tvet-policy',                  name: 'Technical & Vocational Education Policy (TVET)',  themeSlug: 'education' },
  { colIdx: 6,  slug: 'ayc-adolescent-health-policy',     name: 'Adolescent Health Policy',                        themeSlug: 'education' },
  { colIdx: 12, slug: 'ayc-national-gender-policy',       name: 'National Gender Policy',                          themeSlug: 'education' },
  { colIdx: 13, slug: 'ayc-women-empowerment-programme',  name: 'Girl-Child / Women Empowerment Programme',        themeSlug: 'education' },
  { colIdx: 14, slug: 'ayc-gbv-prevention-framework',     name: 'GBV Prevention & Response Framework',             themeSlug: 'education' },
  // DIGITAL_INNOVATION
  { colIdx: 11, slug: 'ayc-digital-skills-education',     name: 'Digital / ICT Skills in Education',               themeSlug: 'innovation-technology' },
  { colIdx: 15, slug: 'ayc-national-ict-policy',          name: 'National Digital / ICT Policy',                   themeSlug: 'innovation-technology' },
  { colIdx: 16, slug: 'ayc-digital-economy-strategy',     name: 'National Digital Economy Strategy',               themeSlug: 'innovation-technology' },
  { colIdx: 17, slug: 'ayc-cybersecurity-policy',         name: 'National Cybersecurity Policy',                   themeSlug: 'innovation-technology' },
  // GREEN_TRANSITION
  { colIdx: 18, slug: 'ayc-ndc-climate-commitment',       name: 'Nationally Determined Contribution (NDC)',        themeSlug: 'environment-climate' },
  { colIdx: 19, slug: 'ayc-national-adaptation-plan',     name: 'National Adaptation Plan (NAP)',                  themeSlug: 'environment-climate' },
  { colIdx: 20, slug: 'ayc-green-jobs-programme',         name: 'Green Jobs / Climate-Youth Programme',            themeSlug: 'environment-climate' },
  // TRADE_INVESTMENT_ENABLERS
  { colIdx: 23, slug: 'ayc-sez-framework',                name: 'Special Economic Zone (SEZ) Framework',           themeSlug: 'financial-inclusion' },
  { colIdx: 24, slug: 'ayc-investment-promotion-law',     name: 'Investment Promotion Law / Act',                  themeSlug: 'financial-inclusion' },
  { colIdx: 25, slug: 'ayc-investment-promotion-agency',  name: 'Investment Promotion Agency (IPA)',               themeSlug: 'financial-inclusion' },
  { colIdx: 26, slug: 'ayc-ppp-framework',                name: 'Public-Private Partnership (PPP) Framework',      themeSlug: 'financial-inclusion' },
  { colIdx: 27, slug: 'ayc-tax-reform-legislation',       name: 'Tax Reform Legislation',                          themeSlug: 'financial-inclusion' },
];

// ============================================================
// Dimension Column Indices (for composite score calculation)
// ayc-startup-act (colIdx 22) is shared between economic & digital
// ============================================================

const DIMENSION_COLS: Record<string, number[]> = {
  governance:   [3, 7, 8],
  economic:     [4, 5, 21, 22, 28],
  human_capital:[9, 10, 6, 12, 13, 14],
  digital:      [11, 15, 16, 17, 22],
  green:        [18, 19, 20],
  trade:        [23, 24, 25, 26, 27],
};

const DIMENSION_WEIGHTS: Record<string, number> = {
  governance:    0.20,
  economic:      0.20,
  human_capital: 0.20,
  digital:       0.15,
  green:         0.10,
  trade:         0.15,
};

// ============================================================
// Country Name Aliases
// ============================================================

const COUNTRY_ALIASES: Record<string, string> = {
  // DB stores without accents: "Cote d'Ivoire"
  "côte d'ivoire":                     "Cote d'Ivoire",
  "cote d'ivoire":                     "Cote d'Ivoire",
  'ivory coast':                       "Cote d'Ivoire",
  'congo, dem. rep.':                  'DR Congo',
  'drc':                               'DR Congo',
  'dr congo':                          'DR Congo',
  'democratic republic of the congo':  'DR Congo',
  'democratic republic of congo':      'DR Congo',
  'eswatini':                          'Eswatini',
  'swaziland':                         'Eswatini',
  'eswatini (swaziland)':              'Eswatini',
  'cabo verde':                        'Cabo Verde',
  'cape verde':                        'Cabo Verde',
  // DB stores without accents: "Sao Tome and Principe"
  'são tomé and príncipe':             'Sao Tome and Principe',
  'sao tome and principe':             'Sao Tome and Principe',
  'sao tome':                          'Sao Tome and Principe',
  'são tomé & príncipe':               'Sao Tome and Principe',
  'sao tome & principe':               'Sao Tome and Principe',
  'the gambia':                        'Gambia',
  'gambia':                            'Gambia',
  'south sudan (2011+)':               'South Sudan',
};

function resolveCountryName(raw: string): string {
  const lower = raw.trim().toLowerCase();
  return COUNTRY_ALIASES[lower] ?? raw.trim();
}

// ============================================================
// Helpers
// ============================================================

function toNumber(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  const n = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// ============================================================
// Main
// ============================================================

async function main() {
  const filePath = process.argv[2] || DEFAULT_FILE;
  const resolved = path.resolve(filePath);

  console.log(`\n📊 AYC Policy Index Import — ${resolved}\n`);

  // Load workbook
  const workbook = XLSX.readFile(resolved);
  console.log(`  Sheets: ${workbook.SheetNames.join(', ')}\n`);

  // Parse sheets
  const scoresSheet  = workbook.Sheets['Indicator Scores (0-1)'];
  const yearsSheet   = workbook.Sheets['Extracted Years'];

  if (!scoresSheet) throw new Error('Sheet "Indicator Scores (0-1)" not found');
  if (!yearsSheet)  throw new Error('Sheet "Extracted Years" not found');

  // Read as row arrays (row 0 = header, rows 1-30 = data)
  const scoreRows: any[][] = XLSX.utils.sheet_to_json(scoresSheet, { header: 1, defval: null });
  const yearRows:  any[][] = XLSX.utils.sheet_to_json(yearsSheet,  { header: 1, defval: null });

  const DATA_START = 1; // row index 0 = header
  const DATA_END   = 31;

  // --------------------------------------------------------
  // Preload DB — countries + themes
  // --------------------------------------------------------
  const dbCountries = await prisma.country.findMany({ select: { id: true, name: true } });
  const countryByName = new Map<string, string>(); // normalized name → id
  for (const c of dbCountries) {
    countryByName.set(c.name.toLowerCase(), c.id);
    countryByName.set(c.name, c.id);
  }

  const dbThemes = await prisma.theme.findMany({ select: { id: true, slug: true } });
  const themeBySlug = new Map(dbThemes.map((t) => [t.slug, t.id]));

  // --------------------------------------------------------
  // Ensure all indicators exist
  // --------------------------------------------------------
  console.log('  Ensuring indicators exist in DB...');
  const indicatorIdBySlug = new Map<string, string>();

  // Also need composite indicator
  const allIndicatorDefs = [
    ...INDICATORS,
    {
      colIdx: -1,
      slug:      'ayc-composite-policy-index',
      name:      'AYC Composite Policy Index',
      themeSlug: 'civic-engagement-governance',
    },
  ];

  for (const def of allIndicatorDefs) {
    const themeId = themeBySlug.get(def.themeSlug);
    if (!themeId) {
      console.warn(`  ⚠ Theme "${def.themeSlug}" not found — skipping indicator "${def.slug}"`);
      continue;
    }

    const existing = await prisma.indicator.findFirst({ where: { slug: def.slug } });
    if (existing) {
      indicatorIdBySlug.set(def.slug, existing.id);
    } else {
      const created = await prisma.indicator.create({
        data: {
          name:        def.name,
          slug:        def.slug,
          description: `${def.name} — AYC Composite Policy Index, sourced from PACSDA.`,
          unit:        'SCORE',
          source:      SOURCE,
          methodology: 'Binary/partial scoring (0–1) per policy instrument; scaled to 0–100.',
          frequency:   'annual',
          themeId,
        },
      });
      indicatorIdBySlug.set(def.slug, created.id);
      console.log(`    + Created: ${def.slug}`);
    }
  }

  // --------------------------------------------------------
  // Process country rows
  // --------------------------------------------------------
  const indicatorRecords: Array<{
    countryId:   string;
    indicatorId: string;
    year:        number;
    value:       number;
    gender:      'TOTAL';
    ageGroup:    string;
    source:      string;
    confidence:  number;
    isEstimate:  boolean;
  }> = [];

  const unmatched: string[] = [];
  let countriesProcessed = 0;

  // Store raw 0-1 scores per country for composite calc
  // Map: countryName → { colIdx → rawScore (0-1) }
  const rawScoresByCountry = new Map<string, Map<number, number>>();

  for (let rowIdx = DATA_START; rowIdx < Math.min(scoreRows.length, DATA_END); rowIdx++) {
    const scoreRow = scoreRows[rowIdx];
    const yearRow  = yearRows[rowIdx] ?? [];

    if (!scoreRow || !scoreRow[0]) continue;

    const rawName    = String(scoreRow[0]).trim();
    const resolved_name   = resolveCountryName(rawName);
    const countryId  = countryByName.get(resolved_name.toLowerCase()) ?? countryByName.get(resolved_name);

    if (!countryId) {
      console.log(`  Country not matched: ${rawName}`);
      unmatched.push(rawName);
      continue;
    }

    countriesProcessed++;
    const colScores = new Map<number, number>();

    for (const def of INDICATORS) {
      const raw01 = toNumber(scoreRow[def.colIdx]);
      if (raw01 === null) continue;

      // Store raw 0-1 for composite calc
      colScores.set(def.colIdx, raw01);

      const value = raw01 * 100;  // scale to 0-100

      // Year from Extracted Years sheet (same column), default 2024
      const rawYear = toNumber(yearRow[def.colIdx]);
      const year    = rawYear !== null && rawYear > 1900 ? Math.round(rawYear) : DEFAULT_YEAR;

      const indicatorId = indicatorIdBySlug.get(def.slug);
      if (!indicatorId) continue;

      indicatorRecords.push({
        countryId,
        indicatorId,
        year,
        value,
        gender:     'TOTAL',
        ageGroup:   AGE_GROUP,
        source:     SOURCE,
        confidence: CONFIDENCE,
        isEstimate: false,
      });
    }

    rawScoresByCountry.set(countryId, colScores);
    console.log(`  ✓ ${resolved_name}: ${colScores.size} scores`);
  }

  // --------------------------------------------------------
  // Bulk insert indicator values (skip duplicates)
  // --------------------------------------------------------
  console.log(`\n  Inserting ${indicatorRecords.length} indicator values...`);
  const insertResult = await prisma.indicatorValue.createMany({
    data:          indicatorRecords,
    skipDuplicates: true,
  });
  console.log(`  Inserted: ${insertResult.count} (duplicates skipped)`);

  // --------------------------------------------------------
  // Compute & store composite scores
  // --------------------------------------------------------
  console.log('\n  Computing composite scores...');
  const compositeIndicatorId = indicatorIdBySlug.get('ayc-composite-policy-index');

  if (!compositeIndicatorId) {
    console.warn('  ⚠ Composite indicator ID not found — skipping composite scores');
  } else {
    const compositeRecords: typeof indicatorRecords = [];

    for (const [countryId, colScores] of rawScoresByCountry) {
      const dimScores: Record<string, number> = {};

      for (const [dim, cols] of Object.entries(DIMENSION_COLS)) {
        const vals = cols
          .map((c) => colScores.get(c))
          .filter((v): v is number => v !== undefined);
        dimScores[dim] = average(vals) * 100; // 0-100
      }

      const composite =
        dimScores.governance    * DIMENSION_WEIGHTS.governance    +
        dimScores.economic      * DIMENSION_WEIGHTS.economic      +
        dimScores.human_capital * DIMENSION_WEIGHTS.human_capital +
        dimScores.digital       * DIMENSION_WEIGHTS.digital       +
        dimScores.green         * DIMENSION_WEIGHTS.green         +
        dimScores.trade         * DIMENSION_WEIGHTS.trade;

      compositeRecords.push({
        countryId,
        indicatorId: compositeIndicatorId,
        year:        DEFAULT_YEAR,
        value:       Math.round(composite * 100) / 100, // 2 d.p.
        gender:      'TOTAL',
        ageGroup:    AGE_GROUP,
        source:      SOURCE,
        confidence:  CONFIDENCE,
        isEstimate:  false,
      });
    }

    const compositeResult = await prisma.indicatorValue.createMany({
      data:          compositeRecords,
      skipDuplicates: true,
    });
    console.log(`  Composite scores inserted: ${compositeResult.count}`);
  }

  // --------------------------------------------------------
  // Summary
  // --------------------------------------------------------
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║     AYC Policy Index Import — Summary        ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Countries processed : ${String(countriesProcessed).padEnd(20)}║`);
  console.log(`║  Indicator values    : ${String(indicatorRecords.length).padEnd(20)}║`);
  console.log(`║  Composite scores    : ${String(rawScoresByCountry.size).padEnd(20)}║`);
  console.log(`║  Unmatched countries : ${String(unmatched.length).padEnd(20)}║`);
  if (unmatched.length > 0) {
    console.log('╠══════════════════════════════════════════════╣');
    for (const name of unmatched) {
      console.log(`║  - ${name.padEnd(41)}║`);
    }
  }
  console.log('╚══════════════════════════════════════════════╝\n');

  // --------------------------------------------------------
  // TASK 2 — Verify AYIMS data is present
  // --------------------------------------------------------
  const ayimsCount = await prisma.indicatorValue.count({
    where: { source: 'AYIMS/AU Commission' },
  });
  if (ayimsCount === 0) {
    console.warn('\n⚠ WARNING: AYIMS data not found in the database.');
    console.warn('  Run: npm run import:ayims -- data/raw/pacsda/AYIMS_Datasheet_2006_2016_2025.xlsx\n');
  } else {
    console.log(`\n  ✓ AYIMS data present: ${ayimsCount} indicator values (source: AYIMS/AU Commission)\n`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  prisma.$disconnect();
  process.exit(1);
});
