import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// World Bank API Indicator Mappings
// ============================================================

interface WBMapping {
  wbCode: string;
  slug: string;
  name: string;
  themeSlug: string;
  unit: string;
  gender?: 'MALE' | 'FEMALE' | 'TOTAL';
}

const WORLD_BANK_INDICATORS: WBMapping[] = [
  // === EDUCATION ===
  { wbCode: 'SE.ADT.1524.LT.ZS', slug: 'youth-literacy-rate', name: 'Youth Literacy Rate (15-24)', themeSlug: 'education', unit: 'PERCENTAGE' },
  { wbCode: 'SE.SEC.NENR', slug: 'secondary-school-net-enrollment-rate', name: 'Secondary School Net Enrollment Rate', themeSlug: 'education', unit: 'PERCENTAGE' },
  { wbCode: 'SE.TER.ENRR', slug: 'tertiary-education-gross-enrollment-rate', name: 'Tertiary Education Gross Enrollment Rate', themeSlug: 'education', unit: 'PERCENTAGE' },
  { wbCode: 'SE.PRM.CMPT.ZS', slug: 'primary-completion-rate', name: 'Primary Completion Rate', themeSlug: 'education', unit: 'PERCENTAGE' },
  { wbCode: 'SE.XPD.TOTL.GD.ZS', slug: 'education-expenditure-gdp', name: 'Government Expenditure on Education (% GDP)', themeSlug: 'education', unit: 'PERCENTAGE' },
  { wbCode: 'SE.SCH.LIFE', slug: 'mean-years-of-schooling', name: 'Expected Years of Schooling', themeSlug: 'education', unit: 'YEARS' },

  // === EMPLOYMENT ===
  { wbCode: 'SL.UEM.1524.ZS', slug: 'youth-unemployment-rate', name: 'Youth Unemployment Rate (15-24)', themeSlug: 'employment-entrepreneurship', unit: 'PERCENTAGE' },
  { wbCode: 'SL.UEM.1524.MA.ZS', slug: 'youth-unemployment-rate', name: 'Youth Unemployment Rate, Male (15-24)', themeSlug: 'employment-entrepreneurship', unit: 'PERCENTAGE', gender: 'MALE' },
  { wbCode: 'SL.UEM.1524.FE.ZS', slug: 'youth-unemployment-rate', name: 'Youth Unemployment Rate, Female (15-24)', themeSlug: 'employment-entrepreneurship', unit: 'PERCENTAGE', gender: 'FEMALE' },
  { wbCode: 'SL.TLF.ACTI.1524.ZS', slug: 'youth-labor-force-participation-rate', name: 'Youth Labor Force Participation Rate (15-24)', themeSlug: 'employment-entrepreneurship', unit: 'PERCENTAGE' },
  { wbCode: 'SL.EMP.VULN.ZS', slug: 'informal-employment-rate', name: 'Vulnerable Employment (% of total)', themeSlug: 'employment-entrepreneurship', unit: 'PERCENTAGE' },
  { wbCode: 'SL.EMP.SELF.ZS', slug: 'youth-self-employment-rate', name: 'Self-Employed (% of total employment)', themeSlug: 'employment-entrepreneurship', unit: 'PERCENTAGE' },
  { wbCode: 'SL.UEM.NEET.ZS', slug: 'youth-neet-rate', name: 'Youth NEET Rate', themeSlug: 'employment-entrepreneurship', unit: 'PERCENTAGE' },

  // === HEALTH ===
  { wbCode: 'SP.ADO.TFRT', slug: 'adolescent-fertility-rate', name: 'Adolescent Fertility Rate (births per 1,000 women 15-19)', themeSlug: 'health', unit: 'RATE' },
  { wbCode: 'SH.DYN.MORT', slug: 'youth-mortality-rate', name: 'Under-5 Mortality Rate (per 1,000)', themeSlug: 'health', unit: 'RATE' },
  { wbCode: 'SH.HIV.1524.MA.ZS', slug: 'hiv-prevalence-rate-youth', name: 'HIV Prevalence, Youth Male (15-24)', themeSlug: 'health', unit: 'PERCENTAGE', gender: 'MALE' },
  { wbCode: 'SH.HIV.1524.FE.ZS', slug: 'hiv-prevalence-rate-youth', name: 'HIV Prevalence, Youth Female (15-24)', themeSlug: 'health', unit: 'PERCENTAGE', gender: 'FEMALE' },
  { wbCode: 'SH.XPD.CHEX.GD.ZS', slug: 'youth-healthcare-access', name: 'Current Health Expenditure (% GDP)', themeSlug: 'health', unit: 'PERCENTAGE' },
  { wbCode: 'SP.DYN.LE00.IN', slug: 'stunting-prevalence-under-5', name: 'Life Expectancy at Birth', themeSlug: 'health', unit: 'YEARS' },
  { wbCode: 'SH.STA.MMRT', slug: 'maternal-mortality-ratio', name: 'Maternal Mortality Ratio (per 100,000)', themeSlug: 'health', unit: 'RATE' },

  // === INNOVATION & TECHNOLOGY ===
  { wbCode: 'IT.NET.USER.ZS', slug: 'internet-penetration-rate', name: 'Individuals Using the Internet (% of population)', themeSlug: 'innovation-technology', unit: 'PERCENTAGE' },
  { wbCode: 'IT.CEL.SETS.P2', slug: 'mobile-cellular-subscriptions', name: 'Mobile Cellular Subscriptions (per 100 people)', themeSlug: 'innovation-technology', unit: 'NUMBER' },
  { wbCode: 'IT.NET.BBND.P2', slug: 'fixed-broadband-subscriptions', name: 'Fixed Broadband Subscriptions (per 100 people)', themeSlug: 'innovation-technology', unit: 'NUMBER' },
  { wbCode: 'GB.XPD.RSDV.GD.ZS', slug: 'ict-development-index', name: 'R&D Expenditure (% GDP)', themeSlug: 'innovation-technology', unit: 'PERCENTAGE' },

  // === FINANCIAL INCLUSION ===
  { wbCode: 'FX.OWN.TOTL.ZS', slug: 'youth-bank-account-ownership', name: 'Account Ownership (% age 15+)', themeSlug: 'financial-inclusion', unit: 'PERCENTAGE' },

  // === GENDER ===
  { wbCode: 'SG.GEN.PARL.ZS', slug: 'youth-seats-in-parliament', name: 'Women in Parliament (%)', themeSlug: 'gender-equality', unit: 'PERCENTAGE' },
  { wbCode: 'SE.ENR.PRSC.FM.ZS', slug: 'gender-parity-index-education', name: 'Gender Parity Index, Primary & Secondary', themeSlug: 'gender-equality', unit: 'INDEX' },
  { wbCode: 'SL.TLF.CACT.FE.ZS', slug: 'female-labor-force-participation-rate', name: 'Female Labor Force Participation Rate (%)', themeSlug: 'gender-equality', unit: 'PERCENTAGE' },

  // === ENVIRONMENT ===
  { wbCode: 'EG.ELC.ACCS.ZS', slug: 'renewable-energy-access-rate', name: 'Access to Electricity (% of population)', themeSlug: 'environment-climate', unit: 'PERCENTAGE' },
  { wbCode: 'EN.ATM.CO2E.PC', slug: 'carbon-emissions-per-capita', name: 'CO2 Emissions (metric tons per capita)', themeSlug: 'environment-climate', unit: 'NUMBER' },
  { wbCode: 'AG.LND.FRST.ZS', slug: 'climate-vulnerability-index', name: 'Forest Area (% of land area)', themeSlug: 'environment-climate', unit: 'PERCENTAGE' },
  { wbCode: 'SH.H2O.BASW.ZS', slug: 'environmental-education-coverage', name: 'People Using Basic Drinking Water Services (%)', themeSlug: 'environment-climate', unit: 'PERCENTAGE' },

  // === AGRICULTURE ===
  { wbCode: 'SL.AGR.EMPL.ZS', slug: 'youth-employment-in-agriculture', name: 'Employment in Agriculture (% of total)', themeSlug: 'agriculture', unit: 'PERCENTAGE' },
  { wbCode: 'AG.LND.ARBL.ZS', slug: 'youth-land-ownership-rate', name: 'Arable Land (% of land area)', themeSlug: 'agriculture', unit: 'PERCENTAGE' },
  { wbCode: 'NV.AGR.TOTL.ZS', slug: 'agricultural-productivity-index', name: 'Agriculture Value Added (% of GDP)', themeSlug: 'agriculture', unit: 'PERCENTAGE' },
  { wbCode: 'AG.YLD.CREL.KG', slug: 'cereal-yield-per-hectare', name: 'Cereal Yield (kg per hectare)', themeSlug: 'agriculture', unit: 'NUMBER' },

  // === CIVIC / GOVERNANCE ===
  { wbCode: 'CC.EST', slug: 'youth-trust-in-government-index', name: 'Control of Corruption Estimate', themeSlug: 'civic-engagement-governance', unit: 'SCORE' },
  { wbCode: 'VA.EST', slug: 'freedom-of-association-score', name: 'Voice and Accountability Estimate', themeSlug: 'civic-engagement-governance', unit: 'SCORE' },
  { wbCode: 'GE.EST', slug: 'youth-political-participation-index', name: 'Government Effectiveness Estimate', themeSlug: 'civic-engagement-governance', unit: 'SCORE' },
];

// ============================================================
// Helpers
// ============================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface WBDataPoint {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  date: string;
  value: number | null;
}

async function fetchWorldBankData(
  isoCodes: string[],
  wbCode: string,
): Promise<WBDataPoint[]> {
  const countriesParam = isoCodes.join(';');
  const url = `https://api.worldbank.org/v2/country/${countriesParam}/indicator/${wbCode}?date=2000:2024&format=json&per_page=10000`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const json = await response.json();

  // WB API returns [metadata, dataArray] — if no data, [1] may be null
  if (!Array.isArray(json) || !json[1]) {
    return [];
  }

  return json[1] as WBDataPoint[];
}

// ============================================================
// Main Import
// ============================================================

async function main() {
  console.log('');
  console.log('='.repeat(60));
  console.log('  AYD — World Bank Data Import');
  console.log('='.repeat(60));
  console.log('');

  // 1. Load countries from DB
  const countries = await prisma.country.findMany({
    select: { id: true, isoCode2: true, isoCode3: true, name: true },
  });
  console.log(`📍 Found ${countries.length} countries in database`);

  // Build lookup maps
  const countryByIso2 = new Map(countries.map((c) => [c.isoCode2, c]));
  const countryByIso3 = new Map(countries.map((c) => [c.isoCode3, c]));

  const iso3Codes = countries.map((c) => c.isoCode3);

  // 2. Load themes from DB for indicator upserts
  const themes = await prisma.theme.findMany({ select: { id: true, slug: true } });
  const themeBySlug = new Map(themes.map((t) => [t.slug, t.id]));

  // 3. Process each indicator
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (let i = 0; i < WORLD_BANK_INDICATORS.length; i++) {
    const mapping = WORLD_BANK_INDICATORS[i];
    const progress = `[${i + 1}/${WORLD_BANK_INDICATORS.length}]`;

    process.stdout.write(`  ${progress} Fetching: ${mapping.name} (${mapping.wbCode})... `);

    try {
      // Ensure indicator exists in DB
      let indicator = await prisma.indicator.findUnique({
        where: { slug: mapping.slug },
      });

      if (!indicator) {
        const themeId = themeBySlug.get(mapping.themeSlug);
        if (!themeId) {
          console.log(`❌ Theme not found: ${mapping.themeSlug}`);
          totalErrors++;
          continue;
        }
        indicator = await prisma.indicator.create({
          data: {
            name: mapping.name,
            slug: mapping.slug,
            description: `Data from World Bank indicator ${mapping.wbCode}`,
            unit: mapping.unit as any,
            source: 'World Bank',
            methodology: 'World Bank Open Data',
            frequency: 'annual',
            themeId,
          },
        });
        console.log(`(created indicator) `);
      }

      // Fetch from World Bank
      const data = await fetchWorldBankData(iso3Codes, mapping.wbCode);

      if (data.length === 0) {
        console.log(`⚠️  No data returned`);
        await sleep(500);
        continue;
      }

      // Prepare records
      const records: {
        value: number;
        year: number;
        gender: 'MALE' | 'FEMALE' | 'TOTAL';
        ageGroup: string;
        source: string;
        confidence: number;
        isEstimate: boolean;
        countryId: string;
        indicatorId: string;
      }[] = [];

      let skipped = 0;
      for (const dp of data) {
        if (dp.value === null || dp.value === undefined) {
          skipped++;
          continue;
        }

        // Match country — WB uses ISO2 in the country.id field
        const country = countryByIso2.get(dp.country.id) || countryByIso3.get(dp.country.id);
        if (!country) continue;

        const year = parseInt(dp.date, 10);
        if (isNaN(year)) continue;

        records.push({
          value: dp.value,
          year,
          gender: mapping.gender || 'TOTAL',
          ageGroup: '15-35',
          source: 'World Bank',
          confidence: 1.0,
          isEstimate: false,
          countryId: country.id,
          indicatorId: indicator.id,
        });
      }

      // Batch insert with skipDuplicates
      if (records.length > 0) {
        const result = await prisma.indicatorValue.createMany({
          data: records,
          skipDuplicates: true,
        });
        totalInserted += result.count;
        totalSkipped += skipped;
        console.log(`✅ ${result.count} values inserted (${skipped} null values skipped)`);
      } else {
        console.log(`⚠️  No valid records to insert (${skipped} null)`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`❌ Error: ${msg}`);
      totalErrors++;
    }

    // Rate limit: 500ms between requests
    await sleep(500);
  }

  // 4. Summary
  console.log('');
  console.log('='.repeat(60));
  console.log('  Import Complete');
  console.log('='.repeat(60));
  console.log(`  ✅ Total values inserted: ${totalInserted}`);
  console.log(`  ⏭️  Total null values skipped: ${totalSkipped}`);
  console.log(`  ❌ Total errors: ${totalErrors}`);
  console.log(`  📊 Indicators processed: ${WORLD_BANK_INDICATORS.length}`);

  // Show DB stats
  const totalValues = await prisma.indicatorValue.count();
  const distinctCountries = await prisma.indicatorValue.groupBy({ by: ['countryId'] });
  const distinctIndicators = await prisma.indicatorValue.groupBy({ by: ['indicatorId'] });
  const yearRange = await prisma.indicatorValue.aggregate({
    _min: { year: true },
    _max: { year: true },
  });

  console.log('');
  console.log('  Database Stats:');
  console.log(`    Total data points: ${totalValues}`);
  console.log(`    Countries with data: ${distinctCountries.length}`);
  console.log(`    Indicators with data: ${distinctIndicators.length}`);
  console.log(`    Year range: ${yearRange._min.year} - ${yearRange._max.year}`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
