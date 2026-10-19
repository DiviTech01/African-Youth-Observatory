import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache.service';
import {
  type Point,
  THOUSANDS_SLUGS,
  asStringArray,
  detectCountries,
  latestPerSeries,
  loadPoints,
  rankingYear,
  resolveCountry,
} from '../nlq/indicator-data';

const SHORT_THEME_LABELS: Record<string, string> = {
  'youth-demography-participation': 'Demo',
  'education': 'Edu',
  'employment': 'Emp',
  'health': 'Health',
  'entrepreneurship': 'Entre',
  'peace-security': 'Peace',
  'access-to-justice': 'Just',
};

function formatDimensions(dimensionScores: unknown): string {
  const d = (dimensionScores && typeof dimensionScores === 'object')
    ? (dimensionScores as Record<string, number>)
    : {};
  return Object.keys(SHORT_THEME_LABELS)
    // Never substitute a number here. This string is what the model sees, and a
    // silent 50 reads to it as a measurement -- it will then write confident
    // prose about a dimension that has no data behind it.
    .map((slug) => {
      const v = d[slug];
      return `${SHORT_THEME_LABELS[slug]}: ${typeof v === 'number' ? v.toFixed(1) : 'no data'}`;
    })
    .join(' | ');
}

@Injectable()
export class AiContextService {
  private readonly logger = new Logger(AiContextService.name);

  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  /**
   * Build a comprehensive data snapshot that the AI can reference.
   * Cached for 1 hour since it's expensive to build.
   */
  async buildFullContext(): Promise<string> {
    const cached = this.cache.get<string>('ai-context:full');
    if (cached) return cached;

    const [
      countries,
      themes,
      indicators,
      platformStats,
      youthIndexLatest,
    ] = await Promise.all([
      this.getCountrySummaries(),
      this.getThemeSummaries(),
      this.getIndicatorCatalog(),
      this.getPlatformStats(),
      this.getLatestYouthIndex(),
    ]);
    // After, not inside, the Promise.all: the pool has one connection, and the
    // snapshot is the heaviest read, so queued behind it the other five can
    // hit Prisma's 10s pool timeout.
    const recentData = await this.getRecentDataSnapshot();

    const context = `
## PLATFORM OVERVIEW
${platformStats}

## COUNTRIES (54 African Nations)
${countries}

## THEMES (9 Thematic Areas)
${themes}

## INDICATOR CATALOG (All Available Indicators)
${indicators}

## YOUTH INDEX RANKINGS (Latest Year)
${youthIndexLatest}

## RECENT DATA SNAPSHOT (Key Indicators by Country)
${recentData}
`;
    this.cache.set('ai-context:full', context, 3600);
    return context;
  }

  /**
   * Build context specific to a country query
   */
  async buildCountryContext(countryId: string): Promise<string> {
    const cacheKey = `ai-context:country:${countryId}`;
    const cached = this.cache.get<string>(cacheKey);
    if (cached) return cached;

    const country = await this.prisma.country.findUnique({
      where: { id: countryId },
    });
    if (!country) return 'Country not found.';

    const [
      allValues,
      youthIndex,
      policies,
      regionalPeers,
    ] = await Promise.all([
      this.getCountryIndicatorValues(countryId),
      this.getCountryYouthIndex(countryId),
      this.getCountryPolicies(countryId),
      this.getRegionalComparison(countryId, country.region),
    ]);

    const context = `
## COUNTRY: ${country.name} (${country.isoCode3})
Region: ${country.region}
Capital: ${country.capital}
Population: ${Number(country.population).toLocaleString()}
Youth Population: ${Number(country.youthPopulation).toLocaleString()}
Languages: ${country.languages.join(', ')}
Economic Blocs: ${country.economicBlocs.join(', ')}

## YOUTH INDEX
${youthIndex}

## POLICY STATUS
${policies}

## ALL INDICATOR VALUES (Latest Available Year)
${allValues}

## REGIONAL COMPARISON (vs ${country.region} peers)
${regionalPeers}
`;
    this.cache.set(cacheKey, context, 3600);
    return context;
  }

  /**
   * Build context for a specific data query
   */
  async buildQueryContext(params: {
    countryIds?: string[];
    indicatorSlugs?: string[];
    themeSlug?: string;
    yearStart?: number;
    yearEnd?: number;
    region?: string;
  }): Promise<string> {
    const parts: string[] = [];

    if (params.countryIds?.length) {
      for (const cid of params.countryIds.slice(0, 10)) {
        const data = await this.getCountryIndicatorValues(cid, params.indicatorSlugs, params.yearStart, params.yearEnd);
        parts.push(data);
      }
    }

    if (params.themeSlug) {
      const themeData = await this.getThemeData(params.themeSlug, params.yearStart, params.yearEnd);
      parts.push(themeData);
    }

    if (params.region) {
      const regionData = await this.getRegionData(params.region, params.indicatorSlugs);
      parts.push(regionData);
    }

    return parts.join('\n\n');
  }

  // ── Helper methods ──────────────────────────────────────────

  private async getCountrySummaries(): Promise<string> {
    const countries = await this.prisma.country.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, isoCode3: true, region: true, capital: true, population: true, youthPopulation: true },
    });
    return countries.map(c =>
      `${c.name} (${c.isoCode3}) | Region: ${c.region} | Pop: ${Number(c.population).toLocaleString()} | Youth: ${Number(c.youthPopulation).toLocaleString()}`
    ).join('\n');
  }

  private async getThemeSummaries(): Promise<string> {
    const themes = await this.prisma.theme.findMany({
      include: { _count: { select: { indicators: true } } },
      orderBy: { sortOrder: 'asc' },
    });
    return themes.map(t =>
      `${t.name} (${t.slug}) — ${t._count.indicators} indicators — ${t.description}`
    ).join('\n');
  }

  private async getIndicatorCatalog(): Promise<string> {
    const indicators = await this.prisma.indicator.findMany({
      include: { theme: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });
    return indicators.map(i =>
      `${i.slug} | ${i.name} | Theme: ${i.theme.name} | Unit: ${i.unit} | Source: ${i.source}`
    ).join('\n');
  }

  private async getPlatformStats(): Promise<string> {
    const [countryCount, indicatorCount, valueCount, latestYear] = await Promise.all([
      this.prisma.country.count(),
      this.prisma.indicator.count(),
      this.prisma.indicatorValue.count(),
      this.prisma.indicatorValue.findFirst({ orderBy: { year: 'desc' }, select: { year: true } }),
    ]);
    return `Countries: ${countryCount} | Indicators: ${indicatorCount} | Data Points: ${valueCount.toLocaleString()} | Latest Year: ${latestYear?.year || 'N/A'}`;
  }

  private async getLatestYouthIndex(): Promise<string> {
    const latestYear = await this.prisma.youthIndexScore.findFirst({
      orderBy: { year: 'desc' },
      select: { year: true },
    });
    if (!latestYear) return 'No Youth Index data available.';

    const rankings = await this.prisma.youthIndexScore.findMany({
      where: { year: latestYear.year },
      include: { country: { select: { name: true, isoCode3: true, region: true } } },
      orderBy: { rank: 'asc' },
    });

    return `Youth Index Rankings (${latestYear.year}):\n` + rankings.map(r =>
      `#${r.rank} ${r.country.name} (${r.country.isoCode3}) — Score: ${r.overallScore.toFixed(1)} | ${formatDimensions(r.dimensionScores)} | Tier: ${r.tier} | Region: ${r.country.region}`
    ).join('\n');
  }

  /**
   * One compact line per headline indicator, every country, latest year.
   *
   * The old list named slugs with no rows (`internet-penetration`,
   * `life-expectancy`, `adolescent-fertility-rate`, …) and filtered
   * `gender: 'TOTAL'`, which the sex-split headline indicators don't have — so
   * this section reached Claude empty. These six all have ~1,000+ rows across
   * 52–54 countries. Countries are written as ISO3 codes (the country list
   * above maps them) to keep the cached prompt small.
   */
  private async getRecentDataSnapshot(): Promise<string> {
    const keyIndicators = [
      'youth-population-15-35',
      'youth-unemployment-rate',
      'youth-literacy-rate',
      'secondary-school-net-enrollment-rate',
      'hiv-prevalence-rate-youth',
      'internet-access-households',
    ];
    // Only recent years are read: the pool has one connection, and 20 years
    // of rows for six indicators held it long enough to time other queries
    // out. Countries with nothing in the window are simply left out.
    const points = latestPerSeries(
      await loadPoints(this.prisma, { slugs: keyIndicators, yearFrom: currentYear() - SNAPSHOT_YEARS }),
    );
    return compactBlocks(points, keyIndicators, (p) => p.isoCode3);
  }

  private async getCountryIndicatorValues(
    countryId: string,
    indicatorSlugs?: string[],
    yearStart?: number,
    yearEnd?: number,
  ): Promise<string> {
    const where: any = { countryId };
    if (indicatorSlugs?.length) {
      where.indicator = { slug: { in: indicatorSlugs } };
    }
    if (yearStart || yearEnd) {
      where.year = {};
      if (yearStart) where.year.gte = yearStart;
      if (yearEnd) where.year.lte = yearEnd;
    }

    const values = await this.prisma.indicatorValue.findMany({
      where,
      include: {
        indicator: { select: { name: true, slug: true, unit: true } },
        country: { select: { name: true } },
      },
      orderBy: [{ indicator: { name: 'asc' } }, { year: 'desc' }],
      distinct: ['indicatorId'],
    });

    if (!values.length) return 'No data available for this country.';

    return `Data for ${values[0].country.name}:\n` + values.map(v =>
      `${v.indicator.name}: ${v.value} ${v.indicator.unit} (${v.year}) [${v.gender}, ${v.source}]`
    ).join('\n');
  }

  private async getCountryYouthIndex(countryId: string): Promise<string> {
    const scores = await this.prisma.youthIndexScore.findMany({
      where: { countryId },
      orderBy: { year: 'desc' },
      take: 5,
    });
    if (!scores.length) return 'No Youth Index data.';
    return scores.map(s =>
      `${s.year}: Score ${s.overallScore.toFixed(1)} (Rank #${s.rank}, ${s.tier}) | ${formatDimensions(s.dimensionScores)}`
    ).join('\n');
  }

  private async getCountryPolicies(countryId: string): Promise<string> {
    const policies = await this.prisma.countryPolicy.findMany({
      where: { countryId },
    });
    if (!policies.length) return 'No policy data available.';
    return policies.map(p =>
      `${p.policyType}: ${p.policyName} (${p.yearAdopted || 'N/A'}) | AYC Ratified: ${p.aycRatified} | Compliance: ${p.complianceScore?.toFixed(1) || 'N/A'} | Status: ${p.status}`
    ).join('\n');
  }

  private async getRegionalComparison(countryId: string, region: string): Promise<string> {
    const latestYear = await this.prisma.youthIndexScore.findFirst({ orderBy: { year: 'desc' }, select: { year: true } });
    if (!latestYear) return 'No regional comparison data.';

    const peers = await this.prisma.youthIndexScore.findMany({
      where: {
        country: { region: region as any },
        year: latestYear.year,
      },
      include: { country: { select: { name: true, id: true } } },
      orderBy: { rank: 'asc' },
    });
    return peers.map(p =>
      `${p.country.id === countryId ? '→ ' : '  '}${p.country.name}: ${p.overallScore.toFixed(1)} (Rank #${p.rank})`
    ).join('\n');
  }

  /**
   * Latest value per country for every indicator in the theme (within the
   * year window, never past the current year), grouped by indicator. The old
   * version filtered TOTAL, which dropped the sex-split headline indicators,
   * and sorted by year, which filled its 500 rows with 2030 policy targets.
   */
  private async getThemeData(themeSlug: string, yearStart?: number, yearEnd?: number): Promise<string> {
    const theme = await this.prisma.theme.findUnique({
      where: { slug: themeSlug },
      include: { indicators: { select: { name: true, slug: true } } },
    });
    if (!theme) return 'Theme not found.';

    const slugs = theme.indicators.map((i) => i.slug);
    const points = latestPerSeries(
      await loadPoints(this.prisma, {
        slugs,
        yearFrom: yearStart ?? (yearEnd ? null : currentYear() - RECENT_YEARS),
        yearTo: yearEnd ?? null,
      }),
    );
    return `Theme: ${theme.name}\nIndicators: ${theme.indicators.map(i => i.name).join(', ')}\n\nData (latest per country):\n` +
      compactBlocks(points, slugs, (p) => p.country);
  }

  private async getRegionData(region: string, indicatorSlugs?: string[]): Promise<string> {
    const slugs = indicatorSlugs?.length
      ? indicatorSlugs
      : (await this.prisma.indicator.findMany({ select: { slug: true }, orderBy: { name: 'asc' } })).map((i) => i.slug);
    const points = latestPerSeries(
      await loadPoints(this.prisma, { slugs, region, yearFrom: currentYear() - RECENT_YEARS }),
    );
    return `Region: ${region}\nData (latest per country):\n` + compactBlocks(points, slugs, (p) => p.country);
  }

  /**
   * Execute an arbitrary data query — used by the AI via tool use
   */
  async executeDataQuery(query: {
    type: 'country_data' | 'indicator_ranking' | 'time_series' | 'regional_average' | 'comparison' | 'count' | 'search';
    params: Record<string, any>;
  }): Promise<any> {
    switch (query.type) {
      case 'country_data': {
        const { countryName, indicatorSlug, yearStart, yearEnd } = query.params;
        const country = await resolveCountry(this.prisma, countryName);
        if (!country) return { error: `Country "${countryName}" not found` };
        const where: any = { countryId: country.id };
        if (indicatorSlug) where.indicator = { slug: indicatorSlug };
        // Capped at the current year: later rows are policy targets, not data.
        where.year = { lte: Math.min(Number(yearEnd) || currentYear(), currentYear()) };
        if (yearStart) where.year.gte = Number(yearStart);
        const values = await this.prisma.indicatorValue.findMany({
          where,
          include: { indicator: { select: { name: true, slug: true, unit: true } } },
          orderBy: { year: 'desc' },
        });
        return {
          country: country.name,
          data: values.map(v => ({
            indicator: v.indicator.name,
            slug: v.indicator.slug,
            value: v.value,
            unit: v.indicator.unit,
            year: v.year,
            gender: v.gender,
            source: v.source,
          })),
        };
      }

      case 'indicator_ranking': {
        const { indicatorSlug, year, limit, order } = query.params;
        const indicator = await this.prisma.indicator.findUnique({ where: { slug: indicatorSlug } });
        if (!indicator) return { error: `Indicator "${indicatorSlug}" not found` };
        const requested = Number(year) || null;
        const points = await loadPoints(this.prisma, { slugs: [indicator.slug], yearTo: requested });
        const targetYear = rankingYear(points, requested);
        if (targetYear === null) {
          return { indicator: indicator.name, unit: indicator.unit, ranking: [], note: 'No data for this indicator.' };
        }
        const inYear = points
          .filter((p) => p.year === targetYear)
          .sort((a, b) => (order === 'asc' ? a.value - b.value : b.value - a.value));
        const take = Math.max(1, Math.min(Number(limit) || 54, 54));
        return {
          indicator: indicator.name,
          unit: indicator.unit,
          year: targetYear,
          countriesReporting: inYear.length,
          ...basisNote(inYear),
          // `position` among every country reporting that year, computed
          // before the cut — not a stored rank. Naming it `rank` let the model
          // quote it as if it were the Youth Index rank, so one country showed
          // two different ranks.
          ranking: inYear.slice(0, take).map((p, i) => ({ position: i + 1, ...pointOut(p) })),
        };
      }

      case 'time_series': {
        const { countryName, indicatorSlug } = query.params;
        const country = await resolveCountry(this.prisma, countryName);
        const indicator = await this.prisma.indicator.findUnique({ where: { slug: indicatorSlug } });
        if (!country || !indicator) return { error: 'Country or indicator not found' };
        const points = (await loadPoints(this.prisma, { slugs: [indicator.slug], countryIds: [country.id] }))
          .sort((a, b) => a.year - b.year);
        return {
          country: country.name,
          indicator: indicator.name,
          unit: indicator.unit,
          ...basisNote(points),
          series: points.map((p) => ({
            year: p.year,
            value: round2(p.value),
            ...(p.basis === 'mf-average' ? { female: round2(p.female!), male: round2(p.male!) } : {}),
          })),
          source: [...new Set(points.map((p) => p.source))].join('; ') || undefined,
        };
      }

      case 'regional_average': {
        const { region, indicatorSlug, year } = query.params;
        const indicator = await this.prisma.indicator.findUnique({ where: { slug: indicatorSlug } });
        if (!indicator) return { error: `Indicator "${indicatorSlug}" not found` };
        const requested = Number(year) || null;
        const points = await loadPoints(this.prisma, { slugs: [indicator.slug], region, yearTo: requested });
        // One year for every country, chosen the same way as a ranking, so the
        // average never mixes a 2025 value with a 2009 one.
        const targetYear = rankingYear(points, requested);
        const inYear = targetYear === null ? [] : points.filter((p) => p.year === targetYear);
        const avg = inYear.reduce((sum, p) => sum + p.value, 0) / (inYear.length || 1);
        return {
          region,
          indicator: indicator.name,
          year: targetYear,
          average: round2(avg),
          averageMethod: 'simple unweighted mean of country values',
          ...basisNote(inYear),
          countries: inYear.map((p) => ({ name: p.country, ...pointOut(p) })),
          count: inYear.length,
        };
      }

      case 'comparison': {
        // The model sometimes sends these arrays JSON-encoded as strings.
        const countryNames = asStringArray(query.params.countryNames);
        const indicatorSlugs = asStringArray(query.params.indicatorSlugs);
        const results: any[] = [];
        for (const name of countryNames) {
          const country = await resolveCountry(this.prisma, name);
          if (!country) {
            results.push({ country: name, error: 'Country not found' });
            continue;
          }
          const latest = latestPerSeries(
            await loadPoints(this.prisma, { slugs: indicatorSlugs, countryIds: [country.id] }),
          );
          results.push({
            country: country.name,
            indicators: latest.map((p) => ({
              name: p.indicator,
              slug: p.slug,
              unit: p.unit,
              ...pointOut(p),
            })),
          });
        }
        return { comparison: results };
      }

      case 'count': {
        const { entity } = query.params;
        const counts: Record<string, number> = {
          countries: await this.prisma.country.count(),
          indicators: await this.prisma.indicator.count(),
          dataPoints: await this.prisma.indicatorValue.count(),
          experts: await this.prisma.expert.count(),
          themes: await this.prisma.theme.count(),
        };
        return entity ? { [entity]: counts[entity] } : counts;
      }

      case 'search': {
        const { term } = query.params;
        // Countries named in the term (whole words, aliases, ISO3) come first,
        // so "Niger" finds Niger rather than Nigeria and a full question such
        // as "youth unemployment in Kenya" still finds Kenya. Substring search
        // is kept only as the fallback for partial names.
        const named = detectCountries(String(term ?? ''));
        const countrySelect = { id: true, name: true, isoCode3: true, region: true } as const;
        const [countries, indicators] = await Promise.all([
          named.length
            ? this.prisma.country.findMany({ where: { name: { in: named } }, select: countrySelect })
                .then((rows) => named.map((n) => rows.find((r) => r.name === n)).filter((r): r is NonNullable<typeof r> => !!r))
            : this.prisma.country.findMany({
                where: { name: { contains: term, mode: 'insensitive' } },
                select: countrySelect,
                take: 5,
              }),
          this.prisma.indicator.findMany({
            where: {
              OR: [
                { name: { contains: term, mode: 'insensitive' } },
                { slug: { contains: term, mode: 'insensitive' } },
              ],
            },
            select: { slug: true, name: true, unit: true },
            take: 5,
          }),
        ]);
        return { countries, indicators };
      }

      default:
        return { error: 'Unknown query type' };
    }
  }
}

function currentYear(): number {
  return new Date().getFullYear();
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * One tool-result row. When only male and female rows exist, `value` is their
 * simple average and both sexes ride along, so the model can quote the real
 * published figures instead of the derived one.
 */
function pointOut(p: Point) {
  return {
    country: p.country,
    isoCode3: p.isoCode3,
    region: p.region,
    value: round2(p.value),
    basis: p.basis,
    // Stored in thousands although the catalogue says millions — say so.
    ...(THOUSANDS_SLUGS.has(p.slug) ? { valueUnit: 'thousands of people' } : {}),
    ...(p.female !== undefined ? { female: round2(p.female) } : {}),
    ...(p.male !== undefined ? { male: round2(p.male) } : {}),
    year: p.year,
    source: p.source,
  };
}

/** Tells the model, in the result itself, when values are derived averages. */
function basisNote(points: Point[]): { note?: string } {
  return points.some((p) => p.basis === 'mf-average')
    ? {
        note:
          'Published by sex only: "value" is the simple average of the male and female rates (basis "mf-average"). ' +
          'Quote the female and male figures where possible.',
      }
    : {};
}

/** Latest context values look this far back; older-only series are left out. */
const RECENT_YEARS = 6;
/** The always-sent snapshot looks back less far, to keep its read light. */
const SNAPSHOT_YEARS = 3;

const UNIT_SHORT: Record<string, string> = {
  PERCENTAGE: '%',
  NUMBER: 'number',
  INDEX: 'index',
  RATIO: 'ratio',
  RATE: 'rate',
  CURRENCY: 'currency',
  SCORE: 'score',
};

/** Thousands → millions; two decimals under a million so Seychelles isn't "0". */
function millions(thousands: number): string {
  const m = thousands / 1000;
  return String(m < 1 ? Math.round(m * 100) / 100 : Math.round(m * 10) / 10);
}

function fmt(n: number): string {
  return String(Math.round(n * 10) / 10);
}

/**
 * Context text, one block per indicator:
 *
 *   ### Youth Literacy Rate (%, female/male) — 2025 unless noted
 *   Kenya 92.3/94 | Nigeria 65.5/80 | Chad 30/42 (2023)
 *
 * The year goes in the header once (the most common year) and only on the
 * values that differ, and sex-split indicators show both published figures
 * rather than a derived average. Population is stored in thousands and is
 * written in millions. This keeps the cached prompt about as small as the
 * old one-row-per-line format while carrying more of the actual data.
 */
function compactBlocks(points: Point[], slugOrder: string[], label: (p: Point) => string): string {
  const bySlug = new Map<string, Point[]>();
  for (const p of points) bySlug.set(p.slug, [...(bySlug.get(p.slug) ?? []), p]);
  const order = (s: string) => {
    const i = slugOrder.indexOf(s);
    return i === -1 ? slugOrder.length : i;
  };

  const blocks: string[] = [];
  for (const slug of [...bySlug.keys()].sort((a, b) => order(a) - order(b))) {
    const ps = bySlug.get(slug)!.sort((a, b) => label(a).localeCompare(label(b)));
    const first = ps[0];
    const yearCount = new Map<number, number>();
    for (const p of ps) yearCount.set(p.year, (yearCount.get(p.year) ?? 0) + 1);
    const commonYear = [...yearCount.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
    const sexSplit = ps.some((p) => p.basis === 'mf-average');
    const thousands = THOUSANDS_SLUGS.has(slug);
    const unit = thousands ? 'millions' : UNIT_SHORT[first.unit] ?? first.unit.toLowerCase();
    const values = ps.map((p) => {
      const v = p.basis === 'mf-average'
        ? `${fmt(p.female!)}/${fmt(p.male!)}`
        : `${thousands ? millions(p.value) : fmt(p.value)}${p.basis === 'female' ? ' (F only)' : p.basis === 'male' ? ' (M only)' : ''}`;
      return `${label(p)} ${v}${p.year !== commonYear ? ` (${p.year})` : ''}`;
    });
    blocks.push(
      `### ${first.indicator} (${unit}${sexSplit ? ', female/male' : ''}) — ${commonYear} unless noted\n${values.join(' | ')}`,
    );
  }
  return blocks.join('\n');
}
