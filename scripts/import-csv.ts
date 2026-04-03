/**
 * AYD — Generic CSV Data Import Script
 *
 * Imports data from CSV files into the IndicatorValue table.
 * Designed to be reusable for UNESCO, ILO, WHO, or any CSV data source.
 *
 * Usage:
 *   pnpm import:csv <file> --indicator <slug> --country-col <col> --year-col <col> --value-col <col> [options]
 *
 * Examples:
 *   pnpm import:csv data/raw/unesco/enrollment.csv --indicator net-enrollment-primary --country-col "Country" --year-col "Year" --value-col "Value" --source "UNESCO UIS"
 *   pnpm import:csv data/raw/who/hiv.csv --indicator hiv-prevalence-rate-youth --country-col "ISO3" --country-format iso3 --year-col "Year" --value-col "Rate" --gender MALE
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ============================================================
// Types
// ============================================================

interface CsvImportConfig {
  filePath: string;
  countryColumn: string;
  countryFormat: 'name' | 'iso2' | 'iso3';
  yearColumn: string;
  valueColumn: string;
  indicatorSlug: string;
  source: string;
  gender: 'MALE' | 'FEMALE' | 'TOTAL';
  ageGroup: string;
  skipRows: number;
  delimiter: string;
}

interface ImportResult {
  inserted: number;
  skipped: number;
  errors: number;
  errorMessages: string[];
}

// ============================================================
// CSV Parser (minimal, no external dependency)
// ============================================================

function parseCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCsv(content: string, delimiter: string): Record<string, string>[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0], delimiter);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i], delimiter);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || '';
    }
    rows.push(row);
  }

  return rows;
}

// ============================================================
// Import function
// ============================================================

async function importCsv(config: CsvImportConfig): Promise<ImportResult> {
  const result: ImportResult = { inserted: 0, skipped: 0, errors: 0, errorMessages: [] };

  // Read file
  const absPath = path.resolve(config.filePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`File not found: ${absPath}`);
  }

  const content = fs.readFileSync(absPath, 'utf-8');
  const rows = parseCsv(content, config.delimiter);

  if (rows.length === 0) {
    throw new Error('CSV file is empty or has no data rows');
  }

  console.log(`  📄 Parsed ${rows.length} rows from ${path.basename(config.filePath)}`);

  // Validate columns exist
  const firstRow = rows[0];
  for (const col of [config.countryColumn, config.yearColumn, config.valueColumn]) {
    if (!(col in firstRow)) {
      throw new Error(`Column "${col}" not found in CSV. Available columns: ${Object.keys(firstRow).join(', ')}`);
    }
  }

  // Load countries from DB
  const countries = await prisma.country.findMany({
    select: { id: true, name: true, isoCode2: true, isoCode3: true },
  });

  const countryLookup = new Map<string, string>();
  for (const c of countries) {
    // Build lookup based on format
    countryLookup.set(c.name.toLowerCase(), c.id);
    countryLookup.set(c.isoCode2.toLowerCase(), c.id);
    countryLookup.set(c.isoCode3.toLowerCase(), c.id);
    // Common name variations
    if (c.name === "Cote d'Ivoire") countryLookup.set("côte d'ivoire", c.id);
    if (c.name === 'DR Congo') {
      countryLookup.set('democratic republic of the congo', c.id);
      countryLookup.set('congo, dem. rep.', c.id);
    }
    if (c.name === 'Congo') countryLookup.set('congo, rep.', c.id);
    if (c.name === 'Eswatini') countryLookup.set('swaziland', c.id);
    if (c.name === 'Cabo Verde') countryLookup.set('cape verde', c.id);
    if (c.name === 'Tanzania') countryLookup.set('tanzania, united republic of', c.id);
    if (c.name === 'Egypt') countryLookup.set('egypt, arab rep.', c.id);
    if (c.name === 'Gambia') countryLookup.set('gambia, the', c.id);
  }

  // Load/find indicator
  let indicator = await prisma.indicator.findUnique({
    where: { slug: config.indicatorSlug },
  });
  if (!indicator) {
    throw new Error(`Indicator "${config.indicatorSlug}" not found in database. Create it first or use a valid slug.`);
  }

  console.log(`  📊 Target indicator: ${indicator.name} (${indicator.slug})`);

  // Skip rows
  const dataRows = rows.slice(config.skipRows);

  // Process rows and build batch
  const records: Array<{
    value: number;
    year: number;
    gender: 'MALE' | 'FEMALE' | 'TOTAL';
    ageGroup: string;
    source: string;
    confidence: number;
    isEstimate: boolean;
    countryId: string;
    indicatorId: string;
  }> = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rawCountry = row[config.countryColumn];
    const rawYear = row[config.yearColumn];
    const rawValue = row[config.valueColumn];

    // Parse value
    const value = parseFloat(rawValue);
    if (isNaN(value)) {
      result.skipped++;
      continue;
    }

    // Parse year
    const year = parseInt(rawYear, 10);
    if (isNaN(year) || year < 1990 || year > 2030) {
      result.skipped++;
      continue;
    }

    // Resolve country
    const countryId = countryLookup.get(rawCountry.toLowerCase());
    if (!countryId) {
      result.skipped++;
      continue;
    }

    records.push({
      value: Math.round(value * 1000) / 1000,
      year,
      gender: config.gender,
      ageGroup: config.ageGroup,
      source: config.source,
      confidence: 0.9,
      isEstimate: false,
      countryId,
      indicatorId: indicator.id,
    });
  }

  if (records.length === 0) {
    console.log('  ⚠️  No valid records to insert');
    return result;
  }

  // Batch insert
  const batchSize = 500;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    try {
      const res = await prisma.indicatorValue.createMany({
        data: batch,
        skipDuplicates: true,
      });
      result.inserted += res.count;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      result.errors++;
      result.errorMessages.push(`Batch ${Math.floor(i / batchSize) + 1}: ${msg}`);
    }
  }

  result.skipped = dataRows.length - result.inserted - result.errors;

  return result;
}

// ============================================================
// CLI argument parser
// ============================================================

function parseArgs(): CsvImportConfig {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
AYD CSV Import Utility

Usage:
  pnpm import:csv <file> [options]

Required:
  <file>                       Path to CSV file
  --indicator <slug>           Indicator slug in database

Options:
  --country-col <name>         Column name for country (default: "Country")
  --country-format <fmt>       name | iso2 | iso3 (default: "name")
  --year-col <name>            Column name for year (default: "Year")
  --value-col <name>           Column name for value (default: "Value")
  --source <name>              Data source name (default: "CSV Import")
  --gender <type>              MALE | FEMALE | TOTAL (default: "TOTAL")
  --age-group <group>          Age group (default: "15-35")
  --skip-rows <n>              Number of data rows to skip (default: 0)
  --delimiter <char>           CSV delimiter (default: ",")
  --help, -h                   Show this help
`);
    process.exit(0);
  }

  const filePath = args[0];
  const config: CsvImportConfig = {
    filePath,
    countryColumn: 'Country',
    countryFormat: 'name',
    yearColumn: 'Year',
    valueColumn: 'Value',
    indicatorSlug: '',
    source: 'CSV Import',
    gender: 'TOTAL',
    ageGroup: '15-35',
    skipRows: 0,
    delimiter: ',',
  };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];
    switch (arg) {
      case '--indicator':
        config.indicatorSlug = next;
        i++;
        break;
      case '--country-col':
        config.countryColumn = next;
        i++;
        break;
      case '--country-format':
        config.countryFormat = next as 'name' | 'iso2' | 'iso3';
        i++;
        break;
      case '--year-col':
        config.yearColumn = next;
        i++;
        break;
      case '--value-col':
        config.valueColumn = next;
        i++;
        break;
      case '--source':
        config.source = next;
        i++;
        break;
      case '--gender':
        config.gender = next as 'MALE' | 'FEMALE' | 'TOTAL';
        i++;
        break;
      case '--age-group':
        config.ageGroup = next;
        i++;
        break;
      case '--skip-rows':
        config.skipRows = parseInt(next, 10);
        i++;
        break;
      case '--delimiter':
        config.delimiter = next;
        i++;
        break;
    }
  }

  if (!config.indicatorSlug) {
    console.error('Error: --indicator <slug> is required');
    process.exit(1);
  }

  return config;
}

// ============================================================
// Main
// ============================================================

async function main() {
  const config = parseArgs();

  console.log('');
  console.log('==========================================================');
  console.log('  AYD — CSV Data Import');
  console.log('==========================================================');
  console.log(`  File:       ${config.filePath}`);
  console.log(`  Indicator:  ${config.indicatorSlug}`);
  console.log(`  Source:      ${config.source}`);
  console.log(`  Gender:      ${config.gender}`);
  console.log('==========================================================');
  console.log('');

  const result = await importCsv(config);

  console.log('');
  console.log('==========================================================');
  console.log('  Import Complete');
  console.log('==========================================================');
  console.log(`  ✓ Inserted: ${result.inserted}`);
  console.log(`  ⚠ Skipped:  ${result.skipped}`);
  console.log(`  ✗ Errors:   ${result.errors}`);
  if (result.errorMessages.length > 0) {
    console.log('  Error details:');
    result.errorMessages.forEach((m) => console.log(`    - ${m}`));
  }
  console.log('==========================================================');
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
