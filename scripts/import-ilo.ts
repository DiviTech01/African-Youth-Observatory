/**
 * ============================================================
 * ILO Data Import Script
 * ============================================================
 *
 * Imports employment/labor data from the International Labour Organization.
 *
 * Two modes:
 *   1. CSV mode (default) — reads pre-downloaded ILO CSV files from data/raw/ilo/
 *   2. API mode (--api flag) — fetches from ILO SDMX REST API (experimental)
 *
 * CSV files should be downloaded from https://ilostat.ilo.org/data/
 * and placed in the data/raw/ilo/ directory.
 *
 * Usage:
 *   pnpm import:ilo                          # CSV mode (reads data/raw/ilo/*.csv)
 *   pnpm import:ilo -- --api                 # API mode (fetches from ILO SDMX)
 *   pnpm import:ilo -- --file path/to/file.csv  # Import a specific CSV file
 *
 * ============================================================
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ============================================================
// ILO Indicator Mappings
// ============================================================

interface ILOMapping {
  iloCode: string;
  slug: string;
  name: string;
  themeSlug: string;
  unit: string;
}

const ILO_INDICATORS: ILOMapping[] = [
  {
    iloCode: 'EMP_TEMP_SEX_AGE_NB',
    slug: 'youth-employment-total',
    name: 'Youth employment (15-24), total',
    themeSlug: 'employment-entrepreneurship',
    unit: 'NUMBER',
  },
  {
    iloCode: 'UNE_DEAP_SEX_AGE_RT',
    slug: 'youth-unemployment-rate',
    name: 'Youth unemployment rate (ILO estimate)',
    themeSlug: 'employment-entrepreneurship',
    unit: 'PERCENTAGE',
  },
  {
    iloCode: 'EAP_TEAP_SEX_AGE_RT',
    slug: 'youth-labor-force-participation-rate',
    name: 'Youth labor force participation rate (ILO)',
    themeSlug: 'employment-entrepreneurship',
    unit: 'PERCENTAGE',
  },
  {
    iloCode: 'EES_TEES_SEX_AGE_NB',
    slug: 'youth-self-employment-rate',
    name: 'Youth self-employment',
    themeSlug: 'employment-entrepreneurship',
    unit: 'PERCENTAGE',
  },
];

// ISO3 → Country name mappings for ILO data (ILO uses ISO Alpha-3)
// We match against our database by isoCode3

// ============================================================
// CSV Parser (built-in, no external deps)
// ============================================================

function parseCSV(content: string, delimiter = ','): Record<string, string>[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0], delimiter);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j].trim()] = (values[j] || '').trim();
    }
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// ============================================================
// ILO SDMX API Fetcher (experimental)
// ============================================================

interface SDMXObservation {
  value: number;
  year: number;
  countryCode: string;
}

async function fetchILOData(
  iloCode: string,
  countryCodes: string[],
): Promise<SDMXObservation[]> {
  const results: SDMXObservation[] = [];

  // ILO SDMX API processes one country at a time
  for (const code of countryCodes) {
    try {
      const url = `https://www.ilo.org/sdmx/rest/data/ILO,DF_${iloCode}/${code}..SEX_T.AGE_YTHADULT_Y15-24?startPeriod=2000&endPeriod=2024&format=jsondata`;

      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        // ILO returns 404 for countries with no data — expected
        if (response.status !== 404) {
          console.warn(`  ⚠ ILO API ${response.status} for ${code}/${iloCode}`);
        }
        continue;
      }

      const data = await response.json();

      // Parse SDMX JSON response
      const observations = parseSDMXResponse(data, code);
      results.push(...observations);

      // Rate limiting
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      if ((err as Error).name === 'TimeoutError') {
        console.warn(`  ⚠ Timeout for ${code}/${iloCode}`);
      } else {
        console.warn(`  ⚠ Error fetching ${code}/${iloCode}: ${(err as Error).message}`);
      }
    }
  }

  return results;
}

function parseSDMXResponse(data: any, countryCode: string): SDMXObservation[] {
  const results: SDMXObservation[] = [];

  try {
    const dataSets = data?.dataSets;
    if (!dataSets?.length) return results;

    const series = dataSets[0].series;
    if (!series) return results;

    // Get time period dimension
    const dimensions = data?.structure?.dimensions;
    const timeDim = dimensions?.observation?.[0];
    const timeValues = timeDim?.values || [];

    for (const seriesKey of Object.keys(series)) {
      const observations = series[seriesKey].observations;
      if (!observations) continue;

      for (const [obsKey, obsValue] of Object.entries(observations)) {
        const timeIndex = parseInt(obsKey, 10);
        const timePeriod = timeValues[timeIndex];
        if (!timePeriod) continue;

        const year = parseInt(timePeriod.id || timePeriod.name, 10);
        const value = Array.isArray(obsValue) ? (obsValue as number[])[0] : null;

        if (value !== null && !isNaN(year) && !isNaN(value)) {
          results.push({ value, year, countryCode });
        }
      }
    }
  } catch {
    // Malformed SDMX response — skip
  }

  return results;
}

// ============================================================
// CSV Import Mode
// ============================================================

async function importFromCSV(filePath?: string) {
  const iloDir = path.resolve(process.cwd(), 'data', 'raw', 'ilo');

  let csvFiles: string[];
  if (filePath) {
    csvFiles = [path.resolve(filePath)];
  } else {
    if (!fs.existsSync(iloDir)) {
      console.log(`📁 Creating directory: ${iloDir}`);
      fs.mkdirSync(iloDir, { recursive: true });
      console.log('\n⚠ No ILO CSV files found.');
      console.log('  Download CSV files from https://ilostat.ilo.org/data/');
      console.log(`  Place them in: ${iloDir}`);
      console.log('\n  Expected CSV columns: ref_area (ISO3), time, obs_value');
      console.log('  Or: Country, Year, Value');
      return;
    }

    csvFiles = fs.readdirSync(iloDir)
      .filter((f) => f.endsWith('.csv'))
      .map((f) => path.join(iloDir, f));
  }

  if (csvFiles.length === 0) {
    console.log('⚠ No CSV files found in', iloDir);
    return;
  }

  // Load country mapping (isoCode3 → id)
  const countries = await prisma.country.findMany({
    select: { id: true, isoCode3: true, name: true },
  });
  const isoToCountry = new Map(countries.map((c) => [c.isoCode3, c]));

  let totalInserted = 0;
  let totalSkipped = 0;

  for (const csvFile of csvFiles) {
    console.log(`\n📄 Processing: ${path.basename(csvFile)}`);

    const content = fs.readFileSync(csvFile, 'utf-8');
    const rows = parseCSV(content);

    if (rows.length === 0) {
      console.log('  ⚠ Empty CSV file');
      continue;
    }

    // Detect column names (ILO uses various formats)
    const headers = Object.keys(rows[0]);
    const countryCol = headers.find((h) =>
      /^(ref_area|country|iso3|countrycode)$/i.test(h),
    ) || headers[0];
    const yearCol = headers.find((h) =>
      /^(time|year|time_period)$/i.test(h),
    ) || headers[1];
    const valueCol = headers.find((h) =>
      /^(obs_value|value|data_value)$/i.test(h),
    ) || headers[2];
    const indicatorCol = headers.find((h) =>
      /^(indicator|indicator_code|classif1)$/i.test(h),
    );

    console.log(`  Columns: country=${countryCol}, year=${yearCol}, value=${valueCol}`);

    // Try to match the file to an ILO indicator
    const fileName = path.basename(csvFile, '.csv').toLowerCase();
    let matchedIndicator = ILO_INDICATORS.find((m) =>
      fileName.includes(m.iloCode.toLowerCase()) ||
      fileName.includes(m.slug),
    );

    // If no match by filename, ask user to specify via CLI
    if (!matchedIndicator && !indicatorCol) {
      console.log(`  ⚠ Could not auto-detect indicator for ${path.basename(csvFile)}`);
      console.log(`  Rename file to include an ILO code: ${ILO_INDICATORS.map((i) => i.iloCode).join(', ')}`);
      continue;
    }

    // Ensure indicator exists in DB
    if (matchedIndicator) {
      await ensureIndicator(matchedIndicator);
    }

    const batch: {
      value: number;
      year: number;
      countryId: string;
      indicatorId: string;
      source: string;
      gender: 'TOTAL' | 'MALE' | 'FEMALE';
      ageGroup: string;
    }[] = [];

    for (const row of rows) {
      const countryCode = row[countryCol]?.trim();
      const yearStr = row[yearCol]?.trim();
      const valueStr = row[valueCol]?.trim();

      if (!countryCode || !yearStr || !valueStr) continue;

      const country = isoToCountry.get(countryCode.toUpperCase());
      if (!country) continue;

      const year = parseInt(yearStr, 10);
      const value = parseFloat(valueStr);
      if (isNaN(year) || isNaN(value) || year < 2000 || year > 2024) continue;

      // If file has indicator column, try to match each row
      let indicator = matchedIndicator;
      if (indicatorCol && row[indicatorCol]) {
        const rowCode = row[indicatorCol].trim();
        indicator = ILO_INDICATORS.find((m) => m.iloCode === rowCode) || matchedIndicator;
        if (indicator && indicator !== matchedIndicator) {
          await ensureIndicator(indicator);
        }
      }

      if (!indicator) continue;

      const dbIndicator = await prisma.indicator.findUnique({
        where: { slug: indicator.slug },
        select: { id: true },
      });
      if (!dbIndicator) continue;

      batch.push({
        value,
        year,
        countryId: country.id,
        indicatorId: dbIndicator.id,
        source: 'ILO STAT',
        gender: 'TOTAL',
        ageGroup: '15-24',
      });
    }

    // Insert in chunks, preferring ILO data for employment indicators
    const chunkSize = 500;
    for (let i = 0; i < batch.length; i += chunkSize) {
      const chunk = batch.slice(i, i + chunkSize);

      // For employment indicators, delete existing WB data and insert ILO data
      for (const item of chunk) {
        try {
          await prisma.indicatorValue.upsert({
            where: {
              countryId_indicatorId_year_gender_ageGroup: {
                countryId: item.countryId,
                indicatorId: item.indicatorId,
                year: item.year,
                gender: item.gender,
                ageGroup: item.ageGroup,
              },
            },
            update: {
              value: item.value,
              source: item.source,
            },
            create: item,
          });
          totalInserted++;
        } catch {
          totalSkipped++;
        }
      }
    }

    console.log(`  ✅ Processed ${batch.length} data points`);
  }

  console.log(`\n📊 ILO CSV Import Summary:`);
  console.log(`   Inserted/Updated: ${totalInserted}`);
  console.log(`   Skipped: ${totalSkipped}`);
}

// ============================================================
// API Import Mode (experimental)
// ============================================================

async function importFromAPI() {
  console.log('🌐 ILO SDMX API Import Mode (experimental)');
  console.log('  Note: ILO API can be slow/unreliable. CSV mode is recommended.\n');

  const countries = await prisma.country.findMany({
    select: { id: true, isoCode3: true, name: true },
  });
  const isoToCountry = new Map(countries.map((c) => [c.isoCode3, c]));
  const countryCodes = countries.map((c) => c.isoCode3);

  let totalInserted = 0;
  let totalErrors = 0;

  for (const mapping of ILO_INDICATORS) {
    console.log(`\n📡 Fetching: ${mapping.name} (${mapping.iloCode})`);

    await ensureIndicator(mapping);

    const dbIndicator = await prisma.indicator.findUnique({
      where: { slug: mapping.slug },
      select: { id: true },
    });
    if (!dbIndicator) {
      console.log(`  ⚠ Could not find/create indicator: ${mapping.slug}`);
      continue;
    }

    const observations = await fetchILOData(mapping.iloCode, countryCodes);
    console.log(`  Retrieved ${observations.length} observations`);

    for (const obs of observations) {
      const country = isoToCountry.get(obs.countryCode);
      if (!country) continue;

      try {
        await prisma.indicatorValue.upsert({
          where: {
            countryId_indicatorId_year_gender_ageGroup: {
              countryId: country.id,
              indicatorId: dbIndicator.id,
              year: obs.year,
              gender: 'TOTAL',
              ageGroup: '15-24',
            },
          },
          update: {
            value: obs.value,
            source: 'ILO STAT (API)',
          },
          create: {
            value: obs.value,
            year: obs.year,
            countryId: country.id,
            indicatorId: dbIndicator.id,
            source: 'ILO STAT (API)',
            gender: 'TOTAL',
            ageGroup: '15-24',
          },
        });
        totalInserted++;
      } catch {
        totalErrors++;
      }
    }
  }

  console.log(`\n📊 ILO API Import Summary:`);
  console.log(`   Inserted/Updated: ${totalInserted}`);
  console.log(`   Errors: ${totalErrors}`);
}

// ============================================================
// Helpers
// ============================================================

async function ensureIndicator(mapping: ILOMapping) {
  const theme = await prisma.theme.findUnique({
    where: { slug: mapping.themeSlug },
    select: { id: true },
  });
  if (!theme) return;

  await prisma.indicator.upsert({
    where: { slug: mapping.slug },
    update: {},
    create: {
      name: mapping.name,
      slug: mapping.slug,
      description: `${mapping.name} — sourced from ILO STAT`,
      unit: mapping.unit as any,
      source: 'ILO STAT',
      themeId: theme.id,
    },
  });
}

// ============================================================
// Main
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const useAPI = args.includes('--api');
  const fileIndex = args.indexOf('--file');
  const specificFile = fileIndex >= 0 ? args[fileIndex + 1] : undefined;

  console.log('============================================================');
  console.log('  ILO Data Import Script — African Youth Database');
  console.log('============================================================\n');

  // Upsert ILO data source
  await prisma.dataSource.upsert({
    where: { name: 'ILO STAT' },
    update: { lastSync: new Date() },
    create: {
      name: 'ILO STAT',
      url: 'https://ilostat.ilo.org',
      description: 'International Labour Organization statistics — employment, labor force, unemployment data',
      type: 'API/CSV',
    },
  });

  if (useAPI) {
    await importFromAPI();
  } else {
    await importFromCSV(specificFile);
  }

  // Print final DB stats
  const totalValues = await prisma.indicatorValue.count();
  const iloValues = await prisma.indicatorValue.count({
    where: { source: { startsWith: 'ILO' } },
  });
  console.log(`\n📈 Database totals:`);
  console.log(`   Total data points: ${totalValues}`);
  console.log(`   ILO data points: ${iloValues}`);
}

main()
  .catch((e) => {
    console.error('❌ Import failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
