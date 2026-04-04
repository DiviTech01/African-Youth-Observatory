import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as XLSX from 'xlsx';
import * as crypto from 'crypto';

// ── Types ────────────────────────────────────────────────────────────────────

interface ColumnMapping {
  column: string;
  indicatorSlug: string;
  year?: number;
  gender?: 'MALE' | 'FEMALE' | 'TOTAL';
  ageGroup?: string;
  transform?: 'none' | 'multiply_1000' | 'divide_100' | 'invert';
}

interface UploadConfig {
  sheetName?: string;
  headerRow?: number;
  skipRows?: number;
  countryColumn: string;
  countryFormat: 'name' | 'iso2' | 'iso3';
  mappings: ColumnMapping[];
  source: string;
  notes?: string;
  year?: number;
}

interface UploadJob {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  status: 'preview' | 'committed' | 'failed' | 'expired';
  config: UploadConfig;
  summary: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    countriesMatched: number;
    countriesUnmatched: string[];
    indicatorsMapped: number;
    valuesTotal: number;
    valuesByIndicator: { slug: string; name: string; count: number }[];
  };
  preview: {
    headers: string[];
    rows: any[][];
    mappedPreview: {
      country: string;
      indicator: string;
      year: number;
      value: number;
      gender: string;
      status: 'valid' | 'warning' | 'error';
      message?: string;
    }[];
  };
  errors: { row: number; column: string; message: string; severity: 'warning' | 'error' }[];
  parsedValues?: {
    countryId: string;
    indicatorId: string;
    year: number;
    value: number;
    gender: import('@prisma/client').GenderType;
    ageGroup: string;
    source: string;
  }[];
  result?: { inserted: number; skipped: number; errors: number; duration: number };
}

// ── Country name normalization ───────────────────────────────────────────────

const COUNTRY_ALIASES: Record<string, string> = {
  'cape verde': 'Cabo Verde',
  'ivory coast': "Côte d'Ivoire",
  "cote d'ivoire": "Côte d'Ivoire",
  'swaziland': 'Eswatini',
  'dr congo': 'DR Congo',
  'democratic republic of the congo': 'DR Congo',
  'democratic republic of congo': 'DR Congo',
  'drc': 'DR Congo',
  'republic of the congo': 'Congo',
  'republic of congo': 'Congo',
  'congo republic': 'Congo',
  'the gambia': 'Gambia',
  'guinea bissau': 'Guinea-Bissau',
  'sao tome and principe': 'São Tomé and Príncipe',
  'são tomé & príncipe': 'São Tomé and Príncipe',
};

// ── In-memory job store (24h expiry) ─────────────────────────────────────────

const jobStore = new Map<string, UploadJob>();
const JOB_TTL = 24 * 60 * 60 * 1000;

function cleanExpiredJobs() {
  const now = Date.now();
  for (const [id, job] of jobStore) {
    if (now - new Date(job.uploadedAt).getTime() > JOB_TTL) {
      jobStore.delete(id);
    }
  }
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class DataUploadService {
  constructor(private prisma: PrismaService) {}

  // ── Upload & Parse ─────────────────────────────────────────────────────────

  async uploadFile(file: Express.Multer.File, userId: string, config: UploadConfig): Promise<UploadJob> {
    cleanExpiredJobs();

    if (!file) throw new BadRequestException('No file provided');
    if (file.size > 10 * 1024 * 1024) throw new BadRequestException('File exceeds 10MB limit');

    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      throw new BadRequestException('Only CSV, XLSX, and XLS files are accepted');
    }

    // Parse file
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = config.sheetName || workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) throw new BadRequestException(`Sheet "${sheetName}" not found. Available: ${workbook.SheetNames.join(', ')}`);

    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    // Find header row
    let headerIdx = config.headerRow ?? 0;
    if (!config.headerRow) {
      for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
        const filledCols = (rawRows[i] || []).filter((c: any) => c !== null && c !== '').length;
        if (filledCols >= 3) { headerIdx = i; break; }
      }
    }

    const headers = (rawRows[headerIdx] || []).map((h: any) => String(h || '').trim());
    const dataStartRow = headerIdx + 1 + (config.skipRows || 0);
    const dataRows = rawRows.slice(dataStartRow).filter((r) => r && r.some((c: any) => c !== null));

    // Load countries from DB
    const dbCountries = await this.prisma.country.findMany({
      select: { id: true, name: true, isoCode2: true, isoCode3: true },
    });
    const countryMap = new Map<string, { id: string; name: string }>();
    for (const c of dbCountries) {
      countryMap.set(c.name.toLowerCase(), { id: c.id, name: c.name });
      countryMap.set(c.isoCode2.toLowerCase(), { id: c.id, name: c.name });
      countryMap.set(c.isoCode3.toLowerCase(), { id: c.id, name: c.name });
    }
    // Add aliases
    for (const [alias, real] of Object.entries(COUNTRY_ALIASES)) {
      const found = countryMap.get(real.toLowerCase());
      if (found) countryMap.set(alias, found);
    }

    // Load indicators
    const dbIndicators = await this.prisma.indicator.findMany({
      select: { id: true, slug: true, name: true, unit: true },
    });
    const indicatorMap = new Map(dbIndicators.map((i) => [i.slug, { id: i.id, name: i.name, unit: i.unit }]));

    // Find country column index
    const countryColIdx = headers.findIndex(
      (h) => h.toLowerCase() === config.countryColumn.toLowerCase(),
    );
    if (countryColIdx < 0) throw new BadRequestException(`Country column "${config.countryColumn}" not found in headers: ${headers.filter(Boolean).join(', ')}`);

    // Process rows
    const errors: UploadJob['errors'] = [];
    const parsedValues: UploadJob['parsedValues'] = [];
    const countriesMatched = new Set<string>();
    const countriesUnmatched = new Set<string>();
    const indicatorCounts = new Map<string, number>();
    let validRows = 0;
    let errorRows = 0;
    const mappedPreview: UploadJob['preview']['mappedPreview'] = [];

    for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
      const row = dataRows[rowIdx];
      const rawCountry = String(row[countryColIdx] || '').trim();
      if (!rawCountry) continue;

      const normalizedCountry = COUNTRY_ALIASES[rawCountry.toLowerCase()] || rawCountry;
      const matchKey = normalizedCountry.toLowerCase();
      const dbCountry = countryMap.get(matchKey);

      if (!dbCountry) {
        countriesUnmatched.add(rawCountry);
        errors.push({ row: rowIdx + dataStartRow + 1, column: config.countryColumn, message: `Country not matched: "${rawCountry}"`, severity: 'error' });
        errorRows++;
        continue;
      }

      countriesMatched.add(dbCountry.name);
      let rowHasValue = false;

      for (const mapping of config.mappings) {
        const colIdx = headers.findIndex((h) => h.toLowerCase() === mapping.column.toLowerCase());
        if (colIdx < 0) continue;

        const cellValue = row[colIdx];
        if (cellValue === null || cellValue === undefined || cellValue === '') continue;

        let num = typeof cellValue === 'number' ? cellValue : parseFloat(String(cellValue).replace(/,/g, ''));
        if (isNaN(num)) {
          errors.push({ row: rowIdx + dataStartRow + 1, column: mapping.column, message: `Non-numeric value: "${cellValue}"`, severity: 'warning' });
          continue;
        }

        // Apply transform
        if (mapping.transform === 'multiply_1000') num *= 1000;
        else if (mapping.transform === 'divide_100') num /= 100;
        else if (mapping.transform === 'invert') num = 100 - num;

        const indicator = indicatorMap.get(mapping.indicatorSlug);
        if (!indicator) {
          errors.push({ row: rowIdx + dataStartRow + 1, column: mapping.column, message: `Indicator not found: "${mapping.indicatorSlug}"`, severity: 'error' });
          continue;
        }

        // Range validation
        if (indicator.unit === 'PERCENTAGE' && (num < 0 || num > 100)) {
          errors.push({ row: rowIdx + dataStartRow + 1, column: mapping.column, message: `Value ${num} out of percentage range (0-100)`, severity: 'warning' });
        }

        const year = mapping.year || config.year || new Date().getFullYear();
        const gender = (mapping.gender || 'TOTAL') as import('@prisma/client').GenderType;
        const ageGroup = mapping.ageGroup || '15-24';

        parsedValues!.push({
          countryId: dbCountry.id,
          indicatorId: indicator.id,
          year,
          value: num,
          gender,
          ageGroup,
          source: config.source,
        });

        indicatorCounts.set(mapping.indicatorSlug, (indicatorCounts.get(mapping.indicatorSlug) || 0) + 1);
        rowHasValue = true;

        // Add to preview (first 20 mapped rows)
        if (mappedPreview.length < 20) {
          mappedPreview.push({
            country: dbCountry.name,
            indicator: indicator.name,
            year,
            value: num,
            gender,
            status: 'valid',
          });
        }
      }

      if (rowHasValue) validRows++;
    }

    // Build job
    const jobId = crypto.randomUUID();
    const job: UploadJob = {
      id: jobId,
      userId,
      fileName: file.originalname,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      status: 'preview',
      config,
      summary: {
        totalRows: dataRows.length,
        validRows,
        errorRows,
        countriesMatched: countriesMatched.size,
        countriesUnmatched: Array.from(countriesUnmatched),
        indicatorsMapped: indicatorCounts.size,
        valuesTotal: parsedValues!.length,
        valuesByIndicator: Array.from(indicatorCounts.entries()).map(([slug, count]) => ({
          slug,
          name: indicatorMap.get(slug)?.name || slug,
          count,
        })),
      },
      preview: {
        headers: headers.filter(Boolean),
        rows: dataRows.slice(0, 20).map((r) => r.slice(0, 15)),
        mappedPreview,
      },
      errors: errors.slice(0, 100),
      parsedValues,
    };

    jobStore.set(jobId, job);
    return job;
  }

  // ── Preview ────────────────────────────────────────────────────────────────

  getPreview(jobId: string, userId: string): Omit<UploadJob, 'parsedValues'> {
    const job = jobStore.get(jobId);
    if (!job) throw new NotFoundException('Upload job not found or expired');
    if (job.userId !== userId) throw new NotFoundException('Upload job not found');
    const { parsedValues, ...rest } = job;
    return rest;
  }

  // ── Commit ─────────────────────────────────────────────────────────────────

  async commitJob(jobId: string, userId: string) {
    const job = jobStore.get(jobId);
    if (!job) throw new NotFoundException('Upload job not found or expired');
    if (job.userId !== userId) throw new NotFoundException('Upload job not found');
    if (job.status === 'committed') throw new BadRequestException('This upload has already been committed');
    if (!job.parsedValues?.length) throw new BadRequestException('No valid data to commit');

    const startTime = Date.now();
    let inserted = 0;
    let skipped = 0;
    let errCount = 0;

    // Batch upsert
    for (const val of job.parsedValues) {
      try {
        await this.prisma.indicatorValue.upsert({
          where: {
            countryId_indicatorId_year_gender_ageGroup: {
              countryId: val.countryId,
              indicatorId: val.indicatorId,
              year: val.year,
              gender: val.gender,
              ageGroup: val.ageGroup,
            },
          },
          update: { value: val.value, source: val.source, confidence: 0.9 },
          create: {
            countryId: val.countryId,
            indicatorId: val.indicatorId,
            year: val.year,
            value: val.value,
            gender: val.gender,
            ageGroup: val.ageGroup,
            source: val.source,
            confidence: 0.9,
            isEstimate: false,
          },
        });
        inserted++;
      } catch (err: any) {
        if (err.code === 'P2002') { skipped++; } else { errCount++; }
      }
    }

    job.status = 'committed';
    job.result = { inserted, skipped, errors: errCount, duration: Date.now() - startTime };
    delete (job as any).parsedValues; // free memory

    return job.result;
  }

  // ── History ────────────────────────────────────────────────────────────────

  getHistory(userId: string, isAdmin: boolean) {
    cleanExpiredJobs();
    const jobs: any[] = [];
    for (const job of jobStore.values()) {
      if (isAdmin || job.userId === userId) {
        jobs.push({
          id: job.id,
          fileName: job.fileName,
          fileSize: job.fileSize,
          uploadedAt: job.uploadedAt,
          status: job.status,
          source: job.config.source,
          valuesTotal: job.summary.valuesTotal,
          valuesInserted: job.result?.inserted ?? null,
          countriesCount: job.summary.countriesMatched,
          indicatorsCount: job.summary.indicatorsMapped,
          notes: job.config.notes,
        });
      }
    }
    return jobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  getHistoryDetail(id: string, userId: string, isAdmin: boolean) {
    const job = jobStore.get(id);
    if (!job) throw new NotFoundException('Upload not found');
    if (!isAdmin && job.userId !== userId) throw new NotFoundException('Upload not found');
    const { parsedValues, ...rest } = job;
    return rest;
  }

  deleteUpload(id: string) {
    if (!jobStore.has(id)) throw new NotFoundException('Upload not found');
    jobStore.delete(id);
    return { message: 'Upload record deleted' };
  }

  // ── Data needs ─────────────────────────────────────────────────────────────

  async getDataNeeds() {
    const [totalCountries, indicators, valueCounts] = await Promise.all([
      this.prisma.country.count(),
      this.prisma.indicator.findMany({
        select: { id: true, slug: true, name: true, source: true, theme: { select: { name: true, slug: true } } },
      }),
      this.prisma.indicatorValue.groupBy({
        by: ['indicatorId'],
        _count: { countryId: true },
      }),
    ]);

    const coverageMap = new Map(valueCounts.map((v) => [v.indicatorId, v._count.countryId]));

    // Country-level gaps
    const countryCounts = await this.prisma.indicatorValue.groupBy({
      by: ['countryId'],
      _count: { indicatorId: true },
    });
    const countryCoverageMap = new Map(countryCounts.map((c) => [c.countryId, c._count.indicatorId]));
    const allCountries = await this.prisma.country.findMany({
      select: { id: true, name: true, isoCode3: true },
      orderBy: { name: 'asc' },
    });

    const totalIndicators = indicators.length;

    // By theme
    const themeGroups = new Map<string, { name: string; indicators: typeof indicators }>();
    for (const ind of indicators) {
      const key = ind.theme.slug;
      if (!themeGroups.has(key)) themeGroups.set(key, { name: ind.theme.name, indicators: [] });
      themeGroups.get(key)!.indicators.push(ind);
    }

    let totalGaps = 0;
    let highGaps = 0;
    let medGaps = 0;
    let lowGaps = 0;

    const byTheme = Array.from(themeGroups.entries()).map(([slug, group]) => {
      let themeCountriesTotal = 0;
      let themeCountriesHave = 0;

      const missingIndicators = group.indicators.map((ind) => {
        const coverage = coverageMap.get(ind.id) || 0;
        const missing = totalCountries - coverage;
        const completeness = totalCountries > 0 ? coverage / totalCountries : 0;
        const priority = completeness < 0.3 ? 'high' : completeness < 0.7 ? 'medium' : 'low';

        themeCountriesTotal += totalCountries;
        themeCountriesHave += coverage;
        totalGaps += missing;
        if (priority === 'high') highGaps += missing;
        else if (priority === 'medium') medGaps += missing;
        else lowGaps += missing;

        return {
          slug: ind.slug,
          name: ind.name,
          countriesCovered: coverage,
          countriesMissing: missing,
          priority,
          suggestedSources: [ind.source || 'National statistics bureaus'],
        };
      }).filter((i) => i.countriesMissing > 0).sort((a, b) => b.countriesMissing - a.countriesMissing);

      return {
        theme: group.name,
        slug,
        completeness: themeCountriesTotal > 0 ? Math.round((themeCountriesHave / themeCountriesTotal) * 100) / 100 : 0,
        missingIndicators,
      };
    }).sort((a, b) => a.completeness - b.completeness);

    const byCountry = allCountries.map((c) => {
      const covered = countryCoverageMap.get(c.id) || 0;
      const missing = totalIndicators - covered;
      const completeness = totalIndicators > 0 ? Math.round((covered / totalIndicators) * 100) / 100 : 0;
      return {
        country: c.name,
        isoCode3: c.isoCode3,
        completeness,
        missingCount: missing,
        coveredCount: covered,
        priority: completeness < 0.3 ? 'high' : completeness < 0.7 ? 'medium' : 'low',
      };
    }).sort((a, b) => a.completeness - b.completeness);

    return {
      summary: {
        totalGaps,
        criticalGaps: highGaps,
        byPriority: { high: highGaps, medium: medGaps, low: lowGaps },
      },
      byTheme,
      byCountry: byCountry.slice(0, 20),
    };
  }

  // ── Indicators list for mapping UI ─────────────────────────────────────────

  async getIndicatorsForMapping() {
    const indicators = await this.prisma.indicator.findMany({
      select: { id: true, slug: true, name: true, unit: true, source: true, theme: { select: { name: true } } },
      orderBy: [{ theme: { sortOrder: 'asc' } }, { name: 'asc' }],
    });

    // Get coverage stats
    const coverageCounts = await this.prisma.indicatorValue.groupBy({
      by: ['indicatorId'],
      _count: { countryId: true },
      _max: { year: true },
    });
    const coverageMap = new Map(coverageCounts.map((c) => [c.indicatorId, { countries: c._count.countryId, latestYear: c._max.year }]));

    return indicators.map((ind) => {
      const coverage = coverageMap.get(ind.id);
      const expectedRange = ind.unit === 'PERCENTAGE' ? { min: 0, max: 100 }
        : ind.unit === 'RATE' ? { min: 0, max: 1000 }
        : { min: 0, max: 999999 };

      return {
        id: ind.id,
        slug: ind.slug,
        name: ind.name,
        theme: ind.theme.name,
        unit: ind.unit,
        expectedRange,
        currentCoverage: { countries: coverage?.countries || 0, latestYear: coverage?.latestYear || null },
        source: ind.source,
      };
    });
  }

  // ── Templates ──────────────────────────────────────────────────────────────

  getTemplates() {
    return [
      { slug: 'education-indicators', name: 'Education Indicators', description: 'Literacy, enrollment, completion rates by country', indicatorCount: 6, columns: ['Country', 'ISO3', 'Year', 'Youth Literacy Rate (%)', 'Primary Enrollment Rate (%)', 'Secondary Enrollment Rate (%)', 'Tertiary Enrollment Rate (%)', 'Education Spending (% GDP)', 'Mean Years of Schooling'] },
      { slug: 'employment-indicators', name: 'Employment Indicators', description: 'Unemployment, labor participation, NEET rates', indicatorCount: 7, columns: ['Country', 'ISO3', 'Year', 'Youth Unemployment Rate (%)', 'Labor Force Participation (%)', 'NEET Rate (%)', 'Informal Employment (%)', 'Self-Employment (%)'] },
      { slug: 'health-indicators', name: 'Health Indicators', description: 'Health expenditure, HIV, mortality', indicatorCount: 7, columns: ['Country', 'ISO3', 'Year', 'Life Expectancy', 'Under-5 Mortality', 'HIV Prevalence Youth (%)', 'Health Expenditure (% GDP)', 'Maternal Mortality'] },
      { slug: 'civic-governance', name: 'Civic Engagement & Governance', description: 'Voter registration, political participation', indicatorCount: 4, columns: ['Country', 'ISO3', 'Year', 'Youth Voter Registration (%)', 'Women in Parliament (%)', 'Voice & Accountability Score'] },
      { slug: 'innovation-technology', name: 'Innovation & Technology', description: 'Internet, mobile, R&D', indicatorCount: 4, columns: ['Country', 'ISO3', 'Year', 'Internet Penetration (%)', 'Mobile Subscriptions (per 100)', 'R&D Expenditure (% GDP)', 'Fixed Broadband (per 100)'] },
      { slug: 'financial-inclusion', name: 'Financial Inclusion', description: 'Bank accounts, mobile money, credit', indicatorCount: 3, columns: ['Country', 'ISO3', 'Year', 'Account Ownership Youth (%)', 'Mobile Money Usage (%)', 'Microcredit Recipients'] },
      { slug: 'gender', name: 'Gender Equality', description: 'Gender parity, female participation', indicatorCount: 3, columns: ['Country', 'ISO3', 'Year', 'Gender Parity Index (Education)', 'Female Labor Participation (%)', 'Women in Parliament (%)'] },
      { slug: 'environment', name: 'Environment & Climate', description: 'Electricity, water, emissions', indicatorCount: 4, columns: ['Country', 'ISO3', 'Year', 'Access to Clean Water (%)', 'Electricity Access (%)', 'Forest Area (%)', 'CO2 per Capita'] },
      { slug: 'full-ayims', name: 'Full AYIMS Format (AU Commission)', description: 'Complete 42-indicator format matching AU Youth Division datasheet', indicatorCount: 42, columns: ['Country', 'Total Pop (M)', 'Youth Pop 15-35 (M)', 'Youth % of Total', '...all 42 columns'] },
    ];
  }

  async downloadTemplate(slug: string) {
    const countries = await this.prisma.country.findMany({
      select: { name: true, isoCode3: true },
      orderBy: { name: 'asc' },
    });

    const templates = this.getTemplates();
    const template = templates.find((t) => t.slug === slug);
    if (!template) throw new NotFoundException(`Template "${slug}" not found`);

    const headers = template.columns;
    const rows = countries.map((c) => {
      const row = new Array(headers.length).fill('');
      row[0] = c.name;
      if (headers.includes('ISO3')) row[1] = c.isoCode3;
      return row;
    });

    // Generate CSV
    const csvLines = [
      headers.map((h) => `"${h}"`).join(','),
      ...rows.map((r) => r.map((v: string) => `"${v}"`).join(',')),
    ];

    return csvLines.join('\n');
  }
}
