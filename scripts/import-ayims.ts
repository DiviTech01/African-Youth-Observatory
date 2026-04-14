/**
 * AYIMS (African Youth Information Management System) Excel Import Script
 *
 * Imports AU Commission youth data from the AYIMS datasheet Excel file.
 * Supports the 3-sheet format: "2006 Data", "2016 Data", "2025 Data".
 *
 * Usage:
 *   pnpm import:ayims data/raw/pacsda/AYIMS_Datasheet_2006_2016_2025.xlsx
 *   npm run import:ayims -- data/raw/pacsda/AYIMS_Datasheet_2006_2016_2025.xlsx
 */

import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

// ============================================================
// Column-to-Indicator Mapping
// ============================================================

interface ColumnMapping {
  col: number;            // 0-based column index
  slug: string;
  name: string;
  themeSlug: string;
  unit: string;
  gender: 'MALE' | 'FEMALE' | 'TOTAL';
  skip?: boolean;         // skip import (text columns, non-indicator cols)
  updateCountry?: string; // special: update country field instead of indicator
  multiply?: number;      // multiply parsed value by this factor
}

const COLUMN_MAP: ColumnMapping[] = [
  // Column A (0) = country name, Column B (1) = number — both skipped by the loop
  // Columns start at index 2 (Column C)

  // DEMOGRAPHY — cols 2-9 (C-J in Excel, mapped as col 3-10 in prompt = index 2-9)
  { col: 2, slug: '', name: 'Total Population', themeSlug: '', unit: '', gender: 'TOTAL', skip: true },
  { col: 3, slug: '', name: 'Youth Pop 15-35', themeSlug: '', unit: '', gender: 'TOTAL', skip: true, updateCountry: 'youthPopulation' },
  { col: 4, slug: 'youth-population-share', name: 'Youth Share of Total Population', themeSlug: 'civic-engagement-governance', unit: 'PERCENTAGE', gender: 'TOTAL' },
  { col: 5, slug: 'youth-rural-share', name: 'Youth in Rural Areas', themeSlug: 'civic-engagement-governance', unit: 'PERCENTAGE', gender: 'TOTAL' },
  { col: 6, slug: 'youth-urban-share', name: 'Youth in Urban Areas', themeSlug: 'civic-engagement-governance', unit: 'PERCENTAGE', gender: 'TOTAL' },
  { col: 7, slug: 'youth-voter-registration-male', name: 'Youth Voter Registration Rate (Male)', themeSlug: 'civic-engagement-governance', unit: 'PERCENTAGE', gender: 'MALE' },
  { col: 8, slug: 'youth-voter-registration-female', name: 'Youth Voter Registration Rate (Female)', themeSlug: 'civic-engagement-governance', unit: 'PERCENTAGE', gender: 'FEMALE' },
  { col: 9, slug: 'youth-disability-prevalence', name: 'Youth With Disabilities', themeSlug: 'civic-engagement-governance', unit: 'PERCENTAGE', gender: 'TOTAL' },

  // EDUCATION — cols 10-18 (K-S)
  { col: 10, slug: 'youth-literacy-rate-male', name: 'Youth Literacy Rate (Male, 15-35)', themeSlug: 'education', unit: 'PERCENTAGE', gender: 'MALE' },
  { col: 11, slug: 'youth-literacy-rate-female', name: 'Youth Literacy Rate (Female, 15-35)', themeSlug: 'education', unit: 'PERCENTAGE', gender: 'FEMALE' },
  { col: 12, slug: 'education-expenditure-gdp', name: 'Education Budget (% GDP)', themeSlug: 'education', unit: 'PERCENTAGE', gender: 'TOTAL' },
  { col: 13, slug: 'primary-enrollment-rate', name: 'Primary Enrollment Rate', themeSlug: 'education', unit: 'PERCENTAGE', gender: 'TOTAL' },
  { col: 14, slug: 'secondary-enrollment-male', name: 'Secondary Enrollment Rate (Male)', themeSlug: 'education', unit: 'PERCENTAGE', gender: 'MALE' },
  { col: 15, slug: 'secondary-enrollment-female', name: 'Secondary Enrollment Rate (Female)', themeSlug: 'education', unit: 'PERCENTAGE', gender: 'FEMALE' },
  { col: 16, slug: 'tertiary-enrollment-rate', name: 'Tertiary Enrollment Rate', themeSlug: 'education', unit: 'PERCENTAGE', gender: 'TOTAL' },
  { col: 17, slug: 'school-dropout-rate', name: 'School Dropout Rate', themeSlug: 'education', unit: 'PERCENTAGE', gender: 'TOTAL' },
  { col: 18, slug: 'teacher-student-ratio', name: 'Teacher-Student Ratio', themeSlug: 'education', unit: 'RATIO', gender: 'TOTAL' },

  // EMPLOYMENT — cols 19-28 (T-AC)
  { col: 19, slug: 'youth-unemployment-male', name: 'Youth Unemployment Rate (Male)', themeSlug: 'employment-entrepreneurship', unit: 'PERCENTAGE', gender: 'MALE' },
  { col: 20, slug: 'youth-unemployment-female', name: 'Youth Unemployment Rate (Female)', themeSlug: 'employment-entrepreneurship', unit: 'PERCENTAGE', gender: 'FEMALE' },
  { col: 21, slug: 'labor-force-participation-youth-male', name: 'Youth Labor Force Participation Rate (Male)', themeSlug: 'employment-entrepreneurship', unit: 'PERCENTAGE', gender: 'MALE' },
  { col: 22, slug: 'labor-force-participation-youth-female', name: 'Youth Labor Force Participation Rate (Female)', themeSlug: 'employment-entrepreneurship', unit: 'PERCENTAGE', gender: 'FEMALE' },
  { col: 23, slug: 'youth-employment-ratio-male', name: 'Youth Employment to Population Ratio (Male)', themeSlug: 'employment-entrepreneurship', unit: 'PERCENTAGE', gender: 'MALE' },
  { col: 24, slug: 'youth-employment-ratio-female', name: 'Youth Employment to Population Ratio (Female)', themeSlug: 'employment-entrepreneurship', unit: 'PERCENTAGE', gender: 'FEMALE' },
  { col: 25, slug: 'youth-adult-unemployment-ratio', name: 'Youth/Adult Unemployment Ratio', themeSlug: 'employment-entrepreneurship', unit: 'RATIO', gender: 'TOTAL' },
  { col: 26, slug: 'youth-employment-agriculture', name: 'Agriculture Share of Youth Employment', themeSlug: 'employment-entrepreneurship', unit: 'PERCENTAGE', gender: 'TOTAL' },
  { col: 27, slug: 'youth-employment-industry', name: 'Industry Share of Youth Employment', themeSlug: 'employment-entrepreneurship', unit: 'PERCENTAGE', gender: 'TOTAL' },
  { col: 28, slug: 'youth-employment-services', name: 'Services Share of Youth Employment', themeSlug: 'employment-entrepreneurship', unit: 'PERCENTAGE', gender: 'TOTAL' },

  // HEALTH — cols 29-37 (AD-AL)
  { col: 29, slug: 'health-budget-share', name: 'Health Budget (% of National Budget)', themeSlug: 'health', unit: 'PERCENTAGE', gender: 'TOTAL' },
  { col: 30, slug: 'physician-density', name: 'Physician Density (per 10,000)', themeSlug: 'health', unit: 'RATE', gender: 'TOTAL' },
  { col: 31, slug: 'skilled-birth-attendance', name: 'Births Attended by Skilled Health Staff', themeSlug: 'health', unit: 'PERCENTAGE', gender: 'TOTAL' },
  { col: 32, slug: 'youth-contraceptive-prevalence', name: 'Contraceptive Prevalence (15-35)', themeSlug: 'health', unit: 'PERCENTAGE', gender: 'TOTAL' },
  { col: 33, slug: 'hiv-prevalence-youth-male', name: 'HIV Prevalence (Youth Male, 15-35)', themeSlug: 'health', unit: 'PERCENTAGE', gender: 'MALE' },
  { col: 34, slug: 'hiv-prevalence-youth-female', name: 'HIV Prevalence (Youth Female, 15-35)', themeSlug: 'health', unit: 'PERCENTAGE', gender: 'FEMALE' },
  { col: 35, slug: 'youth-hiv-treatment-rate', name: 'Youth PLWHA Receiving Treatment', themeSlug: 'health', unit: 'PERCENTAGE', gender: 'TOTAL' },
  { col: 36, slug: '', name: 'Top Cause of Death 1', themeSlug: '', unit: '', gender: 'TOTAL', skip: true },
  { col: 37, slug: '', name: 'Top Cause of Death 2', themeSlug: '', unit: '', gender: 'TOTAL', skip: true },

  // ENTREPRENEURSHIP — cols 38-43 (AM-AR)
  { col: 38, slug: 'ease-doing-business-rank', name: 'Ease of Doing Business Rank', themeSlug: 'financial-inclusion', unit: 'NUMBER', gender: 'TOTAL' },
  { col: 39, slug: 'getting-credit-rank', name: 'Getting Credit Rank', themeSlug: 'financial-inclusion', unit: 'NUMBER', gender: 'TOTAL' },
  { col: 40, slug: 'protecting-investors-rank', name: 'Protecting Investors Rank', themeSlug: 'financial-inclusion', unit: 'NUMBER', gender: 'TOTAL' },
  { col: 41, slug: 'household-internet-access', name: 'Internet Access (% of Households)', themeSlug: 'innovation-technology', unit: 'PERCENTAGE', gender: 'TOTAL' },
  { col: 42, slug: 'youth-microcredit-recipients', name: 'Youth Micro-credit Recipients (thousands)', themeSlug: 'financial-inclusion', unit: 'NUMBER', gender: 'TOTAL', multiply: 1000 },
  { col: 43, slug: 'youth-startup-survival-rate', name: 'Youth Startups Surviving 1st Year', themeSlug: 'innovation-technology', unit: 'PERCENTAGE', gender: 'TOTAL' },
];

// ============================================================
// Country Name Normalization
// ============================================================

const COUNTRY_NAME_ALIASES: Record<string, string> = {
  'cape verde': 'Cabo Verde',
  // Côte d'Ivoire — DB stores without accents: "Cote d'Ivoire"
  'ivory coast': "Cote d'Ivoire",
  "cote d'ivoire": "Cote d'Ivoire",
  "côte d'ivoire": "Cote d'Ivoire",
  'dr congo': 'DR Congo',
  'democratic republic of the congo': 'DR Congo',
  'democratic republic of congo': 'DR Congo',
  'drc': 'DR Congo',
  'congo (dem. rep.)': 'DR Congo',
  'congo, dem. rep.': 'DR Congo',
  'congo (rep.)': 'Congo',
  'congo, rep.': 'Congo',
  'republic of the congo': 'Congo',
  'republic of congo': 'Congo',
  // Eswatini — DB stores as "Eswatini"
  'swaziland': 'Eswatini',
  'eswatini (swaziland)': 'Eswatini',
  'guinea bissau': 'Guinea-Bissau',
  // São Tomé — DB stores without accents: "Sao Tome and Principe"
  'são tomé & príncipe': 'Sao Tome and Principe',
  'sao tome and principe': 'Sao Tome and Principe',
  'sao tome & principe': 'Sao Tome and Principe',
  'são tomé and príncipe': 'Sao Tome and Principe',
  'sao tomé and príncipe': 'Sao Tome and Principe',
  'south sudan (2011+)': 'South Sudan',
  'gambia': 'Gambia',
  'the gambia': 'Gambia',
  'western sahara': '__SKIP__',
  'sahrawi republic': '__SKIP__',
};

function normalizeCountryName(raw: string): string {
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  if (COUNTRY_NAME_ALIASES[lower]) return COUNTRY_NAME_ALIASES[lower];
  return trimmed;
}

// ============================================================
// Sheet Processing
// ============================================================

const DATA_SHEETS: Record<string, number> = {
  '2006 Data': 2006,
  '2016 Data': 2016,
  '2025 Data': 2025,
};

const DATA_ROW_START = 5;  // 0-indexed: row 6 in Excel = index 5
const DATA_ROW_END = 61;   // read up to row 61

const AGE_GROUP = '15-35'; // AU youth definition
const SOURCE = 'AYIMS/AU Commission';
const CONFIDENCE = 0.9;

// ============================================================
// Main Import
// ============================================================

async function main() {
  const filePath = process.argv[2] || 'data/raw/pacsda/AYIMS_Datasheet_2006_2016_2025.xlsx';
  const resolved = path.resolve(filePath);

  console.log(`\n📊 AYIMS Import — ${resolved}\n`);

  // Load workbook
  const workbook = XLSX.readFile(resolved);
  console.log(`  Sheets found: ${workbook.SheetNames.join(', ')}\n`);

  // Preload countries from DB
  const dbCountries = await prisma.country.findMany({
    select: { id: true, name: true, isoCode3: true },
  });
  const countryByName = new Map<string, { id: string; name: string }>();
  for (const c of dbCountries) {
    countryByName.set(c.name.toLowerCase(), { id: c.id, name: c.name });
  }

  // Preload themes
  const dbThemes = await prisma.theme.findMany({ select: { id: true, slug: true } });
  const themeBySlug = new Map(dbThemes.map((t) => [t.slug, t.id]));

  // Ensure all needed indicators exist (upsert)
  console.log('  Ensuring indicators exist in DB...');
  const indicatorIdBySlug = new Map<string, string>();

  for (const mapping of COLUMN_MAP) {
    if (mapping.skip || !mapping.slug) continue;

    const themeId = themeBySlug.get(mapping.themeSlug);
    if (!themeId) {
      console.warn(`    ⚠ Theme "${mapping.themeSlug}" not found for indicator "${mapping.slug}", skipping indicator creation`);
      continue;
    }

    const existing = await prisma.indicator.findFirst({ where: { slug: mapping.slug } });
    if (existing) {
      indicatorIdBySlug.set(mapping.slug, existing.id);
    } else {
      const created = await prisma.indicator.create({
        data: {
          name: mapping.name,
          slug: mapping.slug,
          description: `${mapping.name} — sourced from the African Youth Information Management System (AYIMS), AU Commission.`,
          unit: mapping.unit,
          source: SOURCE,
          methodology: 'AU member state reporting through the AYIMS platform',
          frequency: 'decennial',
          themeId,
        },
      });
      indicatorIdBySlug.set(mapping.slug, created.id);
      console.log(`    + Created indicator: ${mapping.slug} → theme ${mapping.themeSlug}`);
    }
  }

  // Process each data sheet
  const totalSummary: Record<number, { values: number; countries: number; themes: Record<string, number> }> = {};

  for (const [sheetName, year] of Object.entries(DATA_SHEETS)) {
    if (!workbook.SheetNames.includes(sheetName)) {
      console.log(`  ⚠ Sheet "${sheetName}" not found, skipping`);
      continue;
    }

    console.log(`\n━━━ Processing "${sheetName}" (year ${year}) ━━━`);

    const sheet = workbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    let yearValues = 0;
    let yearCountries = 0;
    const themeCount: Record<string, number> = {};

    for (let rowIdx = DATA_ROW_START; rowIdx < Math.min(rows.length, DATA_ROW_END); rowIdx++) {
      const row = rows[rowIdx];
      if (!row || !row[0]) continue;

      const rawName = String(row[0]).trim();
      if (!rawName) continue;

      const normalized = normalizeCountryName(rawName);
      if (normalized === '__SKIP__') {
        continue;
      }

      const dbCountry = countryByName.get(normalized.toLowerCase());
      if (!dbCountry) {
        console.log(`    ? Country not matched: "${rawName}" → "${normalized}"`);
        continue;
      }

      const batchRecords: Array<{
        countryId: string; indicatorId: string; year: number; value: number;
        gender: string; ageGroup: string; source: string; confidence: number; isEstimate: boolean;
      }> = [];

      for (const mapping of COLUMN_MAP) {
        if (mapping.skip || !mapping.slug) continue;

        const indicatorId = indicatorIdBySlug.get(mapping.slug);
        if (!indicatorId) continue;

        const cellValue = row[mapping.col];

        // Skip null, empty, text values
        if (cellValue === null || cellValue === undefined || cellValue === '') continue;
        const num = typeof cellValue === 'number' ? cellValue : parseFloat(String(cellValue).replace(/,/g, ''));
        if (isNaN(num)) continue;

        const finalValue = mapping.multiply ? num * mapping.multiply : num;

        batchRecords.push({
          countryId: dbCountry.id,
          indicatorId,
          year,
          value: finalValue,
          gender: mapping.gender,
          ageGroup: AGE_GROUP,
          source: SOURCE,
          confidence: CONFIDENCE,
          isEstimate: false,
        });

        // Track per theme
        const t = mapping.themeSlug;
        themeCount[t] = (themeCount[t] || 0) + 1;
      }

      if (batchRecords.length > 0) {
        const result = await prisma.indicatorValue.createMany({
          data: batchRecords,
          skipDuplicates: true,
        });
        const countryValues = result.count;
        console.log(`    ${dbCountry.name}: ${countryValues} values imported (${batchRecords.length - countryValues} skipped as duplicates)`);
        yearValues += countryValues;
        if (countryValues > 0) yearCountries++;
      }
    }

    totalSummary[year] = { values: yearValues, countries: yearCountries, themes: themeCount };
    console.log(`  ✓ ${year}: ${yearValues} values across ${yearCountries} countries`);
  }

  // Final summary
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║        AYIMS Import Summary          ║');
  console.log('╠══════════════════════════════════════╣');

  let grandTotal = 0;
  for (const [year, summary] of Object.entries(totalSummary)) {
    console.log(`║  ${year}: ${String(summary.values).padStart(5)} values, ${summary.countries} countries`);
    grandTotal += summary.values;
    for (const [theme, count] of Object.entries(summary.themes)) {
      console.log(`║    └ ${theme}: ${count}`);
    }
  }

  console.log('╠══════════════════════════════════════╣');
  console.log(`║  TOTAL: ${String(grandTotal).padStart(5)} values imported         ║`);
  console.log(`║  Source: ${SOURCE.padEnd(27)}║`);
  console.log(`║  Age Group: ${AGE_GROUP.padEnd(24)}║`);
  console.log('╚══════════════════════════════════════╝\n');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  prisma.$disconnect();
  process.exit(1);
});
