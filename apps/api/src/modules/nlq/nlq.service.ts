import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache.service';
import { AiService } from '../insights/ai.service';
import {
  type Gender,
  type Point,
  THOUSANDS_SLUGS,
  asStringArray,
  buildRules,
  detectCountries,
  latestPerSeries,
  loadPoints,
  matchPhrases,
  normalise,
  rankingYear,
} from './indicator-data';

export { detectCountries };

/**
 * Rule-based answer engine for the Ask AI page.
 *
 * This is what answers when Claude is unavailable (no key, budget exhausted,
 * API failure), so it has to get the common questions right on its own:
 * a value for a named country, a comparison of 2–3 countries, a top-N
 * ranking, a trend, a regional breakdown.
 *
 * Three facts about the stored data shape every query below:
 *  - The headline indicators (youth unemployment, literacy, secondary
 *    enrolment, HIV prevalence) are published by sex only — MALE and FEMALE
 *    rows, no TOTAL row. The old engine filtered `gender: 'TOTAL'` and so
 *    answered "I couldn't find data" for "youth unemployment in Nigeria"
 *    while ~40 Nigerian rows sat in the table. Rows are now collapsed per
 *    country/indicator/year: TOTAL when it exists, otherwise both sexes are
 *    reported, and where one number is needed (ranking, chart) the simple
 *    male–female average is used and labelled as such.
 *  - Age bands vary per indicator (15-35, 18-35, 18-30, all, ''). No band is
 *    passed here: PrismaService's middleware already selects each
 *    indicator's canonical band, and if a series still carries several,
 *    15-35 wins.
 *  - Years run past today (2026–2050 policy targets). Answers use the latest
 *    observed year at or before the current year unless one is asked for.
 *
 * AI is opt-in (`allowAi`). The chat fallback calls this when Claude has just
 * failed or been refused by the spend meter, so by default it must not make
 * three more paid calls — and an answer it returns is labelled rule-based,
 * which would be a lie if Claude had written the prose.
 */

// Region detection. Countries, and the shared value loading, live in
// ./indicator-data so the AI tools read the data the same way.
const REGION_RULES = buildRules<string>([
  ['north africa', 'NORTH_AFRICA'],
  ['northern africa', 'NORTH_AFRICA'],
  ['north african', 'NORTH_AFRICA'],
  ['west africa', 'WEST_AFRICA'],
  ['western africa', 'WEST_AFRICA'],
  ['west african', 'WEST_AFRICA'],
  ['central africa', 'CENTRAL_AFRICA'],
  ['central african region', 'CENTRAL_AFRICA'],
  ['east africa', 'EAST_AFRICA'],
  ['eastern africa', 'EAST_AFRICA'],
  ['east african', 'EAST_AFRICA'],
  ['southern africa', 'SOUTHERN_AFRICA'],
  ['southern african', 'SOUTHERN_AFRICA'],
]);

const REGION_LABEL: Record<string, string> = {
  NORTH_AFRICA: 'Northern Africa',
  WEST_AFRICA: 'Western Africa',
  CENTRAL_AFRICA: 'Central Africa',
  EAST_AFRICA: 'Eastern Africa',
  SOUTHERN_AFRICA: 'Southern Africa',
};

// ============================================================
// Indicator detection
// ============================================================

/**
 * Keyword → indicator slug. Only slugs that hold data are listed: the
 * catalogue has ~40 indicators with zero rows (internet-penetration-rate,
 * youth-neet-rate, adolescent-fertility-rate, …), and routing a question to
 * one of those is just a slower way to say "no data".
 */
const INDICATOR_RULES = buildRules<string>([
  ['youth-adult unemployment ratio', 'youth-adult-unemployment-ratio'],
  ['youth to adult unemployment', 'youth-adult-unemployment-ratio'],
  ['unemployment ratio', 'youth-adult-unemployment-ratio'],
  ['unemployment', 'youth-unemployment-rate'],
  ['unemployed', 'youth-unemployment-rate'],
  ['jobless', 'youth-unemployment-rate'],
  ['joblessness', 'youth-unemployment-rate'],
  ['labour force', 'youth-labor-force-participation-rate'],
  ['labor force', 'youth-labor-force-participation-rate'],
  ['labour-force', 'youth-labor-force-participation-rate'],
  ['labor-force', 'youth-labor-force-participation-rate'],
  ['employment-to-population', 'youth-employment-to-population-ratio'],
  ['employment to population', 'youth-employment-to-population-ratio'],
  ['employment rate', 'youth-employment-to-population-ratio'],
  ['agriculture', 'youth-employment-in-agriculture'],
  ['agricultural', 'youth-employment-in-agriculture'],
  ['farming', 'youth-employment-in-agriculture'],
  ['industry', 'youth-employment-in-industry'],
  ['services sector', 'youth-employment-in-services'],
  ['literacy', 'youth-literacy-rate'],
  ['literate', 'youth-literacy-rate'],
  ['secondary', 'secondary-school-net-enrollment-rate'],
  ['enrollment', 'secondary-school-net-enrollment-rate'],
  ['enrolment', 'secondary-school-net-enrollment-rate'],
  ['primary', 'primary-enrollment-rate'],
  ['tertiary', 'tertiary-education-gross-enrollment-rate'],
  ['university', 'tertiary-education-gross-enrollment-rate'],
  ['higher education', 'tertiary-education-gross-enrollment-rate'],
  ['dropout', 'school-dropout-rate'],
  ['drop-out', 'school-dropout-rate'],
  ['drop out', 'school-dropout-rate'],
  ['teacher', 'teacher-student-ratio'],
  ['teachers', 'teacher-student-ratio'],
  ['education spending', 'education-budget-share-gdp'],
  ['education budget', 'education-budget-share-gdp'],
  ['education expenditure', 'education-budget-share-gdp'],
  ['spending on education', 'education-budget-share-gdp'],
  ['hiv', 'hiv-prevalence-rate-youth'],
  ['aids deaths', 'youth-aids-deaths'],
  ['aids-related', 'youth-aids-deaths'],
  ['contraceptive', 'contraceptive-prevalence-rate-youth'],
  ['contraception', 'contraceptive-prevalence-rate-youth'],
  ['skilled birth', 'births-by-skilled-staff'],
  ['births attended', 'births-by-skilled-staff'],
  ['skilled staff', 'births-by-skilled-staff'],
  ['physician', 'physician-density'],
  ['physicians', 'physician-density'],
  ['doctors', 'physician-density'],
  ['health spending', 'health-budget-share'],
  ['health budget', 'health-budget-share'],
  ['health expenditure', 'health-budget-share'],
  ['spending on health', 'health-budget-share'],
  ['suicide', 'youth-suicide-rate'],
  ['treatment', 'yplwha-treatment-rate'],
  ['total population', 'total-population'],
  ['youth share', 'youth-share-of-population'],
  ['share of youth', 'youth-share-of-population'],
  ['share of the population', 'youth-share-of-population'],
  ['proportion of youth', 'youth-share-of-population'],
  ['population', 'youth-population-15-35'],
  ['how many young people', 'youth-population-15-35'],
  ['urban', 'youth-urban-share'],
  ['rural', 'youth-rural-share'],
  ['voter turnout', 'youth-voter-turnout'],
  ['turnout', 'youth-voter-turnout'],
  ['voting', 'youth-voter-turnout'],
  ['disability', 'youth-disability-share'],
  ['disabilities', 'youth-disability-share'],
  ['internet', 'internet-access-households'],
  ['online', 'internet-access-households'],
  ['startup', 'youth-startup-survival-rate'],
  ['startups', 'youth-startup-survival-rate'],
  ['start-up', 'youth-startup-survival-rate'],
  ['start-ups', 'youth-startup-survival-rate'],
  ['microcredit', 'youth-microcredit-recipients'],
  ['micro-credit', 'youth-microcredit-recipients'],
  ['displaced', 'youth-idps'],
  ['idps', 'youth-idps'],
  ['extremism', 'youth-extremism-deaths'],
  ['trafficking', 'youth-trafficking-victims'],
  ['imprisoned', 'youth-imprisoned'],
  ['prison', 'youth-imprisoned'],
  ['awaiting trial', 'youth-awaiting-trial'],
  ['pre-trial', 'youth-awaiting-trial'],
  ['juvenile', 'juvenile-detentions'],
  ['policy index', 'ayc-composite-policy-index'],
]);

/**
 * Broad topic words with no specific indicator ("education in Kenya") answer
 * with the theme's best-covered headline indicators rather than whatever five
 * a `take: 5` happens to return.
 */
const THEME_HEADLINES: Record<string, string[]> = {
  education: [
    'youth-literacy-rate',
    'secondary-school-net-enrollment-rate',
    'primary-enrollment-rate',
    'tertiary-education-gross-enrollment-rate',
  ],
  employment: [
    'youth-unemployment-rate',
    'youth-labor-force-participation-rate',
    'youth-employment-to-population-ratio',
  ],
  health: [
    'hiv-prevalence-rate-youth',
    'births-by-skilled-staff',
    'physician-density',
    'contraceptive-prevalence-rate-youth',
  ],
  demography: ['youth-population-15-35', 'youth-share-of-population', 'total-population'],
};

const THEME_RULES = buildRules<string>([
  ['education', 'education'],
  ['educational', 'education'],
  ['school', 'education'],
  ['schooling', 'education'],
  ['schools', 'education'],
  ['learning', 'education'],
  ['employment', 'employment'],
  ['jobs', 'employment'],
  ['work', 'employment'],
  ['labour', 'employment'],
  ['labor', 'employment'],
  ['health', 'health'],
  ['healthcare', 'health'],
  ['demography', 'demography'],
  ['demographic', 'demography'],
  ['demographics', 'demography'],
]);

/** What a country question with no topic gets: one headline per theme. */
const COUNTRY_SNAPSHOT = [
  'youth-population-15-35',
  'youth-unemployment-rate',
  'youth-literacy-rate',
  'secondary-school-net-enrollment-rate',
  'hiv-prevalence-rate-youth',
];

const NUMBER_WORDS: Record<string, number> = {
  three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  fifteen: 15, twenty: 20,
};

// ============================================================
// Types
// ============================================================

type Intent = 'single_value' | 'comparison' | 'ranking' | 'trend' | 'regional' | 'correlation';

interface ParsedQuery {
  intent: Intent;
  countries: string[];
  regions: string[];
  indicatorSlugs: string[];
  themes: string[];
  /** "Youth Index" questions read the stored YouthIndexScore table. */
  youthIndex: boolean;
  /** Asked about change over time ("trend", "since 2015", "from 2018 to 2024"). */
  wantsTrend: boolean;
  yearStart: number | null;
  yearEnd: number | null;
  gender: Gender | null;
  limit: number;
  sortOrder: 'asc' | 'desc';
}

export interface NlqVisualization {
  type: 'bar_chart' | 'line_chart' | 'stat_cards' | 'table';
  title: string;
  data: Record<string, unknown>[];
  xAxis?: string;
  yAxis?: string;
  headers?: string[];
  rows?: string[][];
}

export interface NlqResponse {
  question: string;
  answer: string;
  data: Record<string, unknown>[];
  /** Null when there is nothing worth drawing — never an empty chart. */
  visualization: NlqVisualization | null;
  followUpQuestions: string[];
  intent: string;
  source: 'ai' | 'rule-based';
  processingTime: number;
}


interface QueryResult {
  data: Record<string, unknown>[];
  answer: string;
  visualization: NlqVisualization | null;
}


@Injectable()
export class NlqService {
  private readonly logger = new Logger(NlqService.name);

  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
    private ai: AiService,
  ) {}

  async processQuery(question: string, options: { allowAi?: boolean } = {}): Promise<NlqResponse> {
    const start = Date.now();
    const allowAi = options.allowAi === true;

    // Step 1: Parse the question (AI when allowed, else keyword-based)
    const parsed = (allowAi && (await this.tryAiParse(question))) || this.keywordParse(question);

    // Step 2: Query the database and build the template answer + chart
    let result: QueryResult;
    try {
      result = await this.executeQuery(parsed);
    } catch (err) {
      this.logger.error(`Rule-based query failed: ${err instanceof Error ? err.message : String(err)}`);
      result = { data: [], answer: this.noDataAnswer(parsed), visualization: null };
    }

    // Step 3: Optionally let the model rewrite the prose over the same rows
    let answer = result.answer;
    let source: 'ai' | 'rule-based' = 'rule-based';
    if (allowAi && result.data.length > 0) {
      const aiAnswer = await this.ai.generate(
        `You are a data analyst answering a question about African youth data. Generate a clear, concise answer in 2-4 sentences. Reference specific numbers, years and sources from the results. Do NOT make up data — only reference what's in the results.`,
        `User question: "${question}"\n\nQuery results:\n${JSON.stringify(result.data.slice(0, 20), null, 2)}`,
        400,
      );
      if (aiAnswer) {
        answer = aiAnswer;
        source = 'ai';
      }
    }

    // Step 4: Follow-up questions
    const topic = typeof result.data[0]?.indicator === 'string'
      ? (result.data[0].indicator as string).replace(/\s*\(.*?\)\s*/g, ' ').trim().toLowerCase()
      : 'youth unemployment';
    const followUpQuestions = await this.generateFollowUps(question, parsed, allowAi, topic);

    const processingTime = Math.round((Date.now() - start) / 100) / 10;

    return {
      question,
      answer,
      data: result.data,
      visualization: result.visualization && this.hasDrawableData(result.visualization) ? result.visualization : null,
      followUpQuestions,
      intent: parsed.intent,
      source,
      processingTime,
    };
  }

  private hasDrawableData(viz: NlqVisualization): boolean {
    if (viz.type === 'table') return Array.isArray(viz.rows) && viz.rows.length > 0;
    return Array.isArray(viz.data) && viz.data.length > 0;
  }

  // ============================================================
  // Step 1: Parse the question
  // ============================================================

  private async tryAiParse(question: string): Promise<ParsedQuery | null> {
    const slugs = [...new Set(INDICATOR_RULES.map((r) => r.value))].join(', ');
    const systemPrompt = `You are a query parser for the African Youth Observatory. The database contains youth-related indicators for 54 African countries.

Given a user question, extract structured query parameters. Return ONLY valid JSON:

{
  "intent": "single_value|comparison|ranking|trend|regional|correlation",
  "countries": ["Nigeria"] or [],
  "regions": ["NORTH_AFRICA"] or [],
  "indicatorSlugs": ["youth-unemployment-rate"] or [],
  "yearStart": 2020 or null,
  "yearEnd": 2023 or null,
  "gender": "MALE"|"FEMALE"|"TOTAL" or null,
  "limit": 10 or null,
  "sortOrder": "asc"|"desc"
}

Available indicator slugs: ${slugs}.

Regions: NORTH_AFRICA, WEST_AFRICA, CENTRAL_AFRICA, EAST_AFRICA, SOUTHERN_AFRICA.`;

    const raw = await this.ai.generate(systemPrompt, question, 400);
    if (!raw) return null;

    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      const parsed = JSON.parse(jsonMatch[0]);

      // Keyword parse supplies the fallbacks, and the model's country names
      // go back through the same matcher so "Niger" can't stand in for
      // "Nigeria" and an invented name can't reach the query.
      const base = this.keywordParse(question);
      const countries = asStringArray(parsed.countries).flatMap((c) => detectCountries(c));
      const regions = asStringArray(parsed.regions).filter((r) => r in REGION_LABEL);
      const known = new Set(INDICATOR_RULES.map((r) => r.value));
      const indicatorSlugs = asStringArray(parsed.indicatorSlugs).filter((s) => known.has(s));
      const intents: Intent[] = ['single_value', 'comparison', 'ranking', 'trend', 'regional', 'correlation'];
      return {
        ...base,
        intent: intents.includes(parsed.intent) ? parsed.intent : base.intent,
        countries: countries.length ? [...new Set(countries)] : base.countries,
        regions: regions.length ? regions : base.regions,
        indicatorSlugs: indicatorSlugs.length ? indicatorSlugs : base.indicatorSlugs,
        yearStart: Number.isInteger(parsed.yearStart) ? parsed.yearStart : base.yearStart,
        yearEnd: Number.isInteger(parsed.yearEnd) ? parsed.yearEnd : base.yearEnd,
        gender: ['MALE', 'FEMALE', 'TOTAL'].includes(parsed.gender) ? parsed.gender : base.gender,
        limit: Number.isInteger(parsed.limit) && parsed.limit > 0 ? Math.min(parsed.limit, 54) : base.limit,
        sortOrder: parsed.sortOrder === 'asc' ? 'asc' : parsed.sortOrder === 'desc' ? 'desc' : base.sortOrder,
      };
    } catch {
      return null;
    }
  }

  keywordParse(question: string): ParsedQuery {
    const q = normalise(question);

    const countries = detectCountries(question);
    const regions = matchPhrases(question, REGION_RULES);
    const indicatorSlugs = matchPhrases(question, INDICATOR_RULES);
    const themes = matchPhrases(question, THEME_RULES);
    const youthIndex = /\b(youth index|youth development index|ayi|index scores?|index rank(ing)?s?)\b/.test(q);

    // Years — capture 4-digit years in 1990–2099.
    const years = (q.match(/\b(19[9]\d|20\d{2})\b/g) ?? []).map(Number).sort((a, b) => a - b);
    const yearStart = years.length ? years[0] : null;
    const yearEnd = years.length > 1 ? years[years.length - 1] : null;

    // Sex — "female" contains "male", hence the boundaries.
    const wantsFemale = /\b(female|females|women|girls|young women)\b/.test(q);
    const wantsMale = /\b(male|males|men|boys|young men)\b/.test(q);
    const gender: Gender | null = wantsFemale && !wantsMale ? 'FEMALE' : wantsMale && !wantsFemale ? 'MALE' : null;

    const sortOrder: 'asc' | 'desc' = /\b(lowest|worst|least|bottom|smallest|fewest)\b/.test(q) ? 'asc' : 'desc';

    const limitMatch =
      q.match(/\b(?:top|bottom|best|worst|first|last)\s+(\d{1,2})\b/) ||
      q.match(/\b(\d{1,2})\s+(?:best|worst|top|bottom|highest|lowest|african\s+)?countries\b/);
    const wordMatch = q.match(/\b(?:top|bottom|best|worst)\s+(three|four|five|six|seven|eight|nine|ten|fifteen|twenty)\b/) ||
      q.match(/\b(three|four|five|six|seven|eight|nine|ten|fifteen|twenty)\s+(?:african\s+)?countries\b/);
    const rawLimit = limitMatch ? parseInt(limitMatch[1], 10) : wordMatch ? NUMBER_WORDS[wordMatch[1]] : 10;
    const limit = Math.max(1, Math.min(rawLimit || 10, 54));

    const rankingWords = /\b(highest|lowest|top|best|worst|rank|ranks|ranking|rankings|ranked|most|least|bottom|leading|lead|leads|largest|biggest|smallest|greatest|fewest)\b/.test(q);
    const trendWords = /\b(trend|trends|over time|changed|change|history|historical|since|progress|evolution|over the (last|past))\b/.test(q) ||
      (yearStart !== null && yearEnd !== null && yearStart !== yearEnd);

    let intent: Intent = 'single_value';
    if (trendWords && countries.length >= 1 && countries.length <= 3) intent = 'trend';
    else if (countries.length >= 2) intent = 'comparison';
    else if (countries.length === 1) intent = 'single_value';
    else if (regions.length > 0) intent = 'regional';
    else if (rankingWords || youthIndex) intent = 'ranking';
    else if (/\b(correlat\w*|relationship|related)\b/.test(q)) intent = 'correlation';
    else if (indicatorSlugs.length > 0 || themes.length > 0) intent = 'ranking';

    return {
      intent,
      countries,
      regions,
      indicatorSlugs,
      themes,
      youthIndex,
      wantsTrend: trendWords,
      yearStart,
      yearEnd,
      gender,
      limit,
      sortOrder,
    };
  }

  // ============================================================
  // Step 2: Execute database query
  // ============================================================

  private async executeQuery(parsed: ParsedQuery): Promise<QueryResult> {
    if (parsed.youthIndex && parsed.indicatorSlugs.length === 0) {
      return this.youthIndexQuery(parsed);
    }
    if (parsed.intent === 'correlation') {
      return {
        data: [],
        visualization: null,
        answer:
          "Correlations between indicators need the full AI assistant, which isn't available right now. " +
          'You can still ask for one indicator at a time — for example "Top 5 countries by youth literacy" — ' +
          'or compare countries side by side in **Compare Countries**.',
      };
    }

    const slugs = this.resolveSlugs(parsed);
    if (slugs.length === 0) return { data: [], visualization: null, answer: this.noDataAnswer(parsed) };

    const countryIds = await this.resolveCountryIds(parsed.countries);
    if (parsed.countries.length > 0 && countryIds.length === 0) {
      return { data: [], visualization: null, answer: this.noDataAnswer(parsed) };
    }

    switch (parsed.intent) {
      case 'trend':
        return this.trendQuery(parsed, slugs[0], countryIds);
      case 'comparison':
        return this.comparisonQuery(parsed, slugs, countryIds);
      case 'single_value':
        return this.singleCountryQuery(parsed, slugs, countryIds[0]);
      case 'regional':
      case 'ranking':
      default:
        return parsed.wantsTrend
          ? this.averageTrendQuery(parsed, slugs[0])
          : this.rankingQuery(parsed, slugs[0]);
    }
  }

  /** Specific indicators win; else theme headlines; else a country snapshot. */
  private resolveSlugs(parsed: ParsedQuery): string[] {
    if (parsed.indicatorSlugs.length > 0) return parsed.indicatorSlugs.slice(0, 4);
    // Several broad topics ("education, employment and health") → the lead
    // indicator of each; one topic → its headline set.
    const fromThemes = parsed.themes.length > 1
      ? parsed.themes.map((t) => THEME_HEADLINES[t]?.[0]).filter((s): s is string => !!s)
      : parsed.themes.flatMap((t) => THEME_HEADLINES[t] ?? []);
    if (fromThemes.length > 0) {
      // A ranking or trend needs a single indicator — the theme's lead one.
      if (parsed.intent === 'ranking' || parsed.intent === 'regional' || parsed.intent === 'trend') {
        return [fromThemes[0]];
      }
      return [...new Set(fromThemes)].slice(0, 4);
    }
    if (parsed.countries.length > 0) {
      return parsed.intent === 'trend' ? ['youth-unemployment-rate'] : COUNTRY_SNAPSHOT;
    }
    return [];
  }

  private async resolveCountryIds(names: string[]): Promise<string[]> {
    if (names.length === 0) return [];
    const rows = await this.prisma.country.findMany({
      where: { name: { in: names } },
      select: { id: true, name: true },
    });
    // Keep the order the question named them in.
    return names.map((n) => rows.find((r) => r.name === n)?.id).filter((id): id is string => !!id);
  }


  private async singleCountryQuery(parsed: ParsedQuery, slugs: string[], countryId: string): Promise<QueryResult> {
    const points = await loadPoints(this.prisma, {
      slugs,
      countryIds: [countryId],
      yearTo: parsed.yearEnd ?? parsed.yearStart ?? null,
      gender: parsed.gender,
    });
    const latest = latestPerSeries(points).sort((a, b) => slugs.indexOf(a.slug) - slugs.indexOf(b.slug));
    if (latest.length === 0) return { data: [], visualization: null, answer: this.noDataAnswer(parsed) };

    const country = latest[0].country;
    const lines = latest.map((p) => `- **${p.indicator}**: ${describePoint(p)} (${p.source}, ${p.year})`);
    const asked = parsed.yearEnd ?? parsed.yearStart;
    const yearNote = asked && latest.some((p) => p.year !== asked)
      ? `\n\nWhere ${asked} isn't available, the latest earlier year is shown.`
      : '';
    const answer =
      latest.length === 1
        ? `${sentenceFor(latest[0])}\n\nSource: ${latest[0].source}, ${latest[0].year}.${yearNote}`
        : `Here are the latest figures for **${country}** on the platform:\n\n${lines.join('\n')}${yearNote}`;

    // One number needs no chart; several get headline cards.
    const visualization: NlqVisualization | null =
      latest.length > 1
        ? {
            type: 'stat_cards',
            title: `Key indicators — ${country}`,
            // The renderer prints `value` + `unit` together, so the formatted
            // value carries its own unit and the year rides on the label.
            data: latest.map((p) => ({
              label: `${p.indicator} (${p.year})`,
              value: p.basis === 'mf-average'
                ? `${formatValue(p.female!, p.unit, p.slug)} F · ${formatValue(p.male!, p.unit, p.slug)} M`
                : formatValue(p.value, p.unit, p.slug),
            })),
          }
        : null;

    return { data: latest.map(toRow), answer, visualization };
  }

  private async comparisonQuery(parsed: ParsedQuery, slugs: string[], countryIds: string[]): Promise<QueryResult> {
    const ids = countryIds.slice(0, 5);
    const points = await loadPoints(this.prisma, {
      slugs,
      countryIds: ids,
      yearTo: parsed.yearEnd ?? parsed.yearStart ?? null,
      gender: parsed.gender,
    });
    const latest = latestPerSeries(points);
    if (latest.length === 0) return { data: [], visualization: null, answer: this.noDataAnswer(parsed) };

    const order = (p: Point) => ids.indexOf(p.countryId);
    const indicatorsWithData = slugs.filter((s) => latest.some((p) => p.slug === s));
    const sections = indicatorsWithData.map((slug) => {
      const rows = latest.filter((p) => p.slug === slug).sort((a, b) => order(a) - order(b));
      const name = rows[0].indicator;
      const missing = parsed.countries.filter((c) => !rows.some((r) => r.country === c));
      const items = rows.map((p) => `- ${p.country}: ${describePoint(p)} (${p.year})`);
      if (missing.length) items.push(`- ${missing.join(', ')}: no data on the platform`);
      return `**${name}**\n${items.join('\n')}`;
    });
    const sources = [...new Set(latest.map((p) => p.source))].join('; ');
    const answer = `Comparing **${parsed.countries.join(', ')}**:\n\n${sections.join('\n\n')}\n\nSource: ${sources}.${averageNote(latest)}`;

    let visualization: NlqVisualization | null = null;
    if (indicatorsWithData.length === 1) {
      const rows = latest.sort((a, b) => order(a) - order(b));
      visualization = barChart(rows, `${rows[0].indicator} — ${rows.map((r) => r.country).join(' vs ')}`);
    } else {
      const countryNames = ids
        .map((id) => latest.find((p) => p.countryId === id)?.country)
        .filter((n): n is string => !!n);
      visualization = {
        type: 'table',
        title: `${countryNames.join(' vs ')} — latest values`,
        data: [],
        headers: ['Indicator', ...countryNames],
        rows: indicatorsWithData.map((slug) => {
          const rows = latest.filter((p) => p.slug === slug);
          return [
            rows[0].indicator,
            ...countryNames.map((c) => {
              const p = rows.find((r) => r.country === c);
              return p ? `${formatValue(p.value, p.unit, p.slug)} (${p.year})` : '—';
            }),
          ];
        }),
      };
    }

    return { data: latest.sort((a, b) => order(a) - order(b)).map(toRow), answer, visualization };
  }

  private async rankingQuery(parsed: ParsedQuery, slug: string): Promise<QueryResult> {
    const region = parsed.regions[0];
    const points = await loadPoints(this.prisma, {
      slugs: [slug],
      region,
      yearTo: parsed.yearEnd ?? parsed.yearStart ?? null,
      gender: parsed.gender,
    });
    const year = rankingYear(points, parsed.yearEnd ?? parsed.yearStart);
    if (year === null) return { data: [], visualization: null, answer: this.noDataAnswer(parsed) };

    const inYear = points
      .filter((p) => p.year === year)
      .sort((a, b) => (parsed.sortOrder === 'asc' ? a.value - b.value : b.value - a.value));
    // `position` is the place among every country reporting that year (in the
    // region, if one was named) — computed before the cut, so it is never a
    // subset-relative "rank" that disagrees with the Youth Index rank.
    const ranked = inYear.map((p, i) => ({ ...p, position: i + 1 }));
    const top = ranked.slice(0, parsed.limit);
    const first = top[0];
    const scope = region ? REGION_LABEL[region] : 'Africa';
    const direction = parsed.sortOrder === 'asc' ? 'lowest' : 'highest';
    const avg = inYear.reduce((s, p) => s + p.value, 0) / inYear.length;

    const lines = top.map((p) => `${p.position}. **${p.country}** — ${describePoint(p)}`);
    const answer =
      `${scope}: the ${top.length} ${top.length === 1 ? 'country' : 'countries'} with the ${direction} **${first.indicator}** in ${year}` +
      ` (out of ${inYear.length} reporting):\n\n${lines.join('\n')}\n\n` +
      `${region ? 'Regional' : 'Continental'} average across reporting countries: ${formatValue(avg, first.unit, first.slug)}.\n\n` +
      `Source: ${[...new Set(top.map((p) => p.source))].join('; ')}, ${year}.${averageNote(top)}`;

    const data = top.map((p) => ({ ...toRow(p), position: p.position, outOf: inYear.length }));
    return {
      data,
      answer,
      visualization: barChart(top, `${first.indicator} — ${direction} in ${scope}, ${year}`),
    };
  }

  private async trendQuery(parsed: ParsedQuery, slug: string, countryIds: string[]): Promise<QueryResult> {
    const ids = countryIds.slice(0, 3);
    const points = await loadPoints(this.prisma, {
      slugs: [slug],
      countryIds: ids,
      yearFrom: parsed.yearStart,
      yearTo: parsed.yearEnd ?? null,
      gender: parsed.gender,
    });
    if (points.length === 0) return { data: [], visualization: null, answer: this.noDataAnswer(parsed) };

    const byCountry = ids
      .map((id) => points.filter((p) => p.countryId === id).sort((a, b) => a.year - b.year))
      .filter((s) => s.length > 0);
    const first = byCountry[0][0];

    const lines = byCountry.map((series) => {
      const s = series[0];
      const e = series[series.length - 1];
      if (s.basis === 'mf-average' && e.basis === 'mf-average') {
        return (
          `- **${s.country}**, young women: ${movement(s.female!, e.female!, s, e)}\n` +
          `- **${s.country}**, young men: ${movement(s.male!, e.male!, s, e)}`
        );
      }
      return `- **${s.country}**: ${movement(s.value, e.value, s, e)}`;
    });
    const sources = [...new Set(points.map((p) => p.source))].join('; ');
    // A single sex-split country is charted as female/male lines, so only the
    // multi-country chart needs the averaging note.
    const answer = `**${first.indicator}** over time:\n\n${lines.join('\n')}\n\nSource: ${sources}.${averageNote(byCountry.length > 1 ? points : [])}`;

    // One country published by sex → female/male lines; several countries →
    // one line each.
    let data: Record<string, unknown>[];
    const gendered = byCountry.length === 1 && byCountry[0].every((p) => p.male !== undefined && p.female !== undefined) && !parsed.gender;
    if (gendered) {
      data = byCountry[0].map((p) => ({ year: p.year, female: round(p.female!), male: round(p.male!) }));
    } else if (byCountry.length === 1) {
      data = byCountry[0].map((p) => ({ year: p.year, value: round(scaled(p.value, p.slug)) }));
    } else {
      const years = [...new Set(points.map((p) => p.year))].sort((a, b) => a - b);
      data = years.map((y) => {
        const row: Record<string, unknown> = { year: y };
        for (const series of byCountry) {
          const p = series.find((x) => x.year === y);
          if (p) row[p.country] = round(scaled(p.value, p.slug));
        }
        return row;
      });
    }

    return {
      data: points.sort((a, b) => a.year - b.year).map(toRow),
      answer,
      visualization: {
        type: 'line_chart',
        title: `${first.indicator} — ${byCountry.map((s) => s[0].country).join(', ')}`,
        data,
        xAxis: 'Year',
        yAxis: unitLabel(first.unit, first.slug),
      },
    };
  }

  /**
   * "Trend in West Africa" with no country named: the simple average across
   * the countries reporting each year, as one line (or a female/male pair).
   * Years where fewer than 60% of the best-covered year's countries reported
   * are dropped, so a thin year can't swing the line.
   */
  private async averageTrendQuery(parsed: ParsedQuery, slug: string): Promise<QueryResult> {
    const region = parsed.regions[0];
    const points = await loadPoints(this.prisma, {
      slugs: [slug],
      region,
      yearFrom: parsed.yearStart,
      yearTo: parsed.yearEnd ?? null,
      gender: parsed.gender,
    });
    const byYear = new Map<number, Point[]>();
    for (const p of points) byYear.set(p.year, [...(byYear.get(p.year) ?? []), p]);
    const maxCount = Math.max(0, ...[...byYear.values()].map((v) => v.length));
    const years = [...byYear.keys()].filter((y) => byYear.get(y)!.length >= maxCount * 0.6).sort((a, b) => a - b);
    if (years.length < 2) return this.rankingQuery(parsed, slug);

    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const first = points[0];
    const sexSplit = !parsed.gender && points.every((p) => p.basis === 'mf-average');
    const series = years.map((y) => {
      const ps = byYear.get(y)!;
      return {
        year: y,
        n: ps.length,
        value: mean(ps.map((p) => p.value)),
        female: sexSplit ? mean(ps.map((p) => p.female!)) : undefined,
        male: sexSplit ? mean(ps.map((p) => p.male!)) : undefined,
      };
    });
    const s = series[0];
    const e = series[series.length - 1];
    const scope = region ? REGION_LABEL[region] : 'Africa';
    const at = (year: number) => ({ year, unit: first.unit, slug });
    const body = sexSplit
      ? `- Young women: ${movement(s.female!, e.female!, at(s.year), at(e.year))}\n- Young men: ${movement(s.male!, e.male!, at(s.year), at(e.year))}`
      : `- ${movement(s.value, e.value, at(s.year), at(e.year))}`;
    const answer =
      `**${first.indicator}** in **${scope}**, average across reporting countries (${e.n} in ${e.year}):\n\n${body}\n\n` +
      'This is a simple, unweighted average of country values, not a population-weighted regional rate. ' +
      `Source: ${[...new Set(points.map((p) => p.source))].join('; ')}.`;

    return {
      data: series.map((r) => ({
        year: r.year,
        countriesReporting: r.n,
        value: round(r.value),
        ...(sexSplit ? { female: round(r.female!), male: round(r.male!) } : {}),
        indicator: first.indicator,
        region: scope,
      })),
      answer,
      visualization: {
        type: 'line_chart',
        title: `${first.indicator} — ${scope} average`,
        data: series.map((r) =>
          sexSplit
            ? { year: r.year, female: round(r.female!), male: round(r.male!) }
            : { year: r.year, value: round(scaled(r.value, slug)) },
        ),
        xAxis: 'Year',
        yAxis: unitLabel(first.unit, slug),
      },
    };
  }

  /**
   * Youth Index questions read the stored scores, and quote the stored rank —
   * the same number the Youth Index page shows.
   */
  private async youthIndexQuery(parsed: ParsedQuery): Promise<QueryResult> {
    const latest = await this.prisma.youthIndexScore.findFirst({
      where: parsed.yearEnd || parsed.yearStart ? { year: { lte: parsed.yearEnd ?? parsed.yearStart! } } : undefined,
      orderBy: { year: 'desc' },
      select: { year: true },
    });
    if (!latest) return { data: [], visualization: null, answer: this.noDataAnswer(parsed) };

    const where: Record<string, unknown> = { year: latest.year };
    if (parsed.countries.length > 0) where.country = { name: { in: parsed.countries } };
    else if (parsed.regions.length > 0) where.country = { region: { in: parsed.regions } };

    const scores = await this.prisma.youthIndexScore.findMany({
      where,
      orderBy: { rank: parsed.sortOrder === 'asc' ? 'desc' : 'asc' },
      take: parsed.countries.length > 0 ? undefined : parsed.limit,
      select: { rank: true, overallScore: true, tier: true, country: { select: { name: true } } },
    });
    if (scores.length === 0) return { data: [], visualization: null, answer: this.noDataAnswer(parsed) };
    const total = await this.prisma.youthIndexScore.count({ where: { year: latest.year } });

    const lines = scores.map((s) => `- **${s.country.name}** — rank ${s.rank} of ${total}, score ${s.overallScore.toFixed(1)}/100 (${s.tier.toLowerCase()} tier)`);
    const lead = parsed.countries.length > 0
      ? `AYEMI ${latest.year}:`
      : `AYEMI ${latest.year} — ${parsed.sortOrder === 'asc' ? 'lowest' : 'highest'}-ranked ${scores.length}${parsed.regions[0] ? ` in ${REGION_LABEL[parsed.regions[0]]}` : ''}:`;
    const answer = `${lead}\n\n${lines.join('\n')}\n\nSource: AYEMI (AYO), ${latest.year}. See the **AYEMI** page for each country's dimension scores.`;

    return {
      data: scores.map((s) => ({ rank: s.rank, country: s.country.name, score: s.overallScore, tier: s.tier, year: latest.year })),
      answer,
      visualization:
        scores.length > 1
          ? {
              type: 'bar_chart',
              title: `AYEMI score, ${latest.year}`,
              data: scores.map((s) => ({ name: s.country.name, value: round(s.overallScore) })),
              xAxis: 'Country',
              yAxis: 'Score /100',
            }
          : null,
    };
  }

  private noDataAnswer(parsed: ParsedQuery): string {
    const what = parsed.indicatorSlugs.length || parsed.themes.length ? 'that indicator' : 'that topic';
    const where = parsed.countries.length ? ` for ${parsed.countries.join(', ')}` : '';
    return (
      `I couldn't find data on ${what}${where} on the platform. ` +
      'I can answer questions about youth unemployment, literacy, school enrolment, population, HIV prevalence, ' +
      'labour-force participation, internet access and the AYEMI — for example ' +
      '"What is youth unemployment in Nigeria?", "Compare literacy in Kenya and Ghana" or ' +
      '"Top 5 countries by secondary enrolment".'
    );
  }

  // ============================================================
  // Step 4: Follow-up questions
  // ============================================================

  private async generateFollowUps(
    question: string,
    parsed: ParsedQuery,
    allowAi: boolean,
    topic: string,
  ): Promise<string[]> {
    if (allowAi) {
      const aiFollowUps = await this.ai.generate(
        'Given a question about African youth data, suggest exactly 3 relevant follow-up questions. Return ONLY a JSON array of 3 strings.',
        `Original question: "${question}"\nDetected intent: ${parsed.intent}\nCountries: ${parsed.countries.join(', ') || 'none'}\nIndicators: ${parsed.indicatorSlugs.join(', ') || 'none'}`,
        200,
      );
      if (aiFollowUps) {
        try {
          const match = aiFollowUps.match(/\[[\s\S]*\]/);
          const arr = match ? asStringArray(JSON.parse(match[0])) : [];
          if (arr.length > 0) return arr.slice(0, 3);
        } catch { /* fall through */ }
      }
    }

    // Rule-based follow-ups — phrased so this engine can answer them too.
    const country = parsed.countries[0];
    const followUps: string[] = [];

    if (country && parsed.intent !== 'trend') {
      followUps.push(`How has ${topic} in ${country} changed over time?`);
    }
    if (country && parsed.intent !== 'comparison') {
      followUps.push(`Which countries have the highest ${topic} in ${REGION_LABEL[(await this.regionOf(country)) ?? ''] ?? 'Africa'}?`);
    }
    if (parsed.intent !== 'ranking') {
      followUps.push(`Top 5 African countries by ${topic}`);
    }
    if (!parsed.youthIndex) {
      followUps.push('Which 5 African countries have the highest AYEMI scores?');
    }
    for (const extra of [
      'Compare youth literacy in Kenya, Nigeria and Ghana',
      'Which countries have the lowest youth unemployment in Southern Africa?',
      'What is the youth population of Ethiopia?',
    ]) {
      if (followUps.length >= 3) break;
      if (!followUps.includes(extra)) followUps.push(extra);
    }
    return followUps.slice(0, 3);
  }

  private async regionOf(countryName: string): Promise<string | null> {
    const c = await this.prisma.country.findUnique({ where: { name: countryName }, select: { region: true } });
    return c?.region ?? null;
  }
}

// ============================================================
// Formatting helpers
// ============================================================


function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function scaled(value: number, slug: string): number {
  return THOUSANDS_SLUGS.has(slug) ? value / 1000 : value;
}

function formatNumber(value: number, unit: string, slug: string): string {
  if (THOUSANDS_SLUGS.has(slug)) return `${(value / 1000).toFixed(1)} million`;
  switch (unit) {
    case 'PERCENTAGE':
      return value.toFixed(1);
    case 'RATIO':
      return value.toFixed(2);
    case 'NUMBER':
    case 'CURRENCY':
      return Math.round(value).toLocaleString('en-US');
    default:
      return value.toFixed(1);
  }
}

function formatValue(value: number, unit: string, slug: string): string {
  const n = formatNumber(value, unit, slug);
  return unit === 'PERCENTAGE' && !THOUSANDS_SLUGS.has(slug) ? `${n}%` : n;
}

/** "7.3% in 2015 → 15.4% in 2025 (+8.1 percentage points)" */
function movement(
  from: number,
  to: number,
  start: Pick<Point, 'year' | 'unit' | 'slug'>,
  end: Pick<Point, 'year' | 'unit' | 'slug'>,
): string {
  const delta = to - from;
  const suffix = start.unit === 'PERCENTAGE' && !THOUSANDS_SLUGS.has(start.slug) ? ' percentage points' : '';
  const change = `${delta >= 0 ? '+' : ''}${formatNumber(delta, start.unit, start.slug)}${suffix}`;
  return `${formatValue(from, start.unit, start.slug)} in ${start.year} → ${formatValue(to, end.unit, end.slug)} in ${end.year} (${change})`;
}

function unitLabel(unit: string, slug: string): string {
  if (THOUSANDS_SLUGS.has(slug)) return 'Millions';
  return unit === 'PERCENTAGE' ? '%' : unit.charAt(0) + unit.slice(1).toLowerCase();
}

/** "6.3% for young women, 4.4% for young men" or a single value. */
function describePoint(p: Point): string {
  if (p.basis === 'mf-average') {
    return `${formatValue(p.female!, p.unit, p.slug)} young women, ${formatValue(p.male!, p.unit, p.slug)} young men`;
  }
  const v = formatValue(p.value, p.unit, p.slug);
  if (p.basis === 'female') return `${v} (young women)`;
  if (p.basis === 'male') return `${v} (young men)`;
  return v;
}

function sentenceFor(p: Point): string {
  if (p.basis === 'mf-average') {
    return (
      `In ${p.year}, **${p.indicator}** in **${p.country}** was **${formatValue(p.female!, p.unit, p.slug)} for young women** ` +
      `and **${formatValue(p.male!, p.unit, p.slug)} for young men**. The platform publishes this indicator by sex only, so there is no combined figure.`
    );
  }
  const who = p.basis === 'female' ? ' for young women' : p.basis === 'male' ? ' for young men' : '';
  return `In ${p.year}, **${p.indicator}** in **${p.country}** was **${formatValue(p.value, p.unit, p.slug)}**${who}.`;
}

/** Says so whenever a single number shown is a derived male–female average. */
function averageNote(points: Point[]): string {
  return points.some((p) => p.basis === 'mf-average')
    ? '\n\n_This indicator is published by sex only; where one number is needed (ranking order, chart), it is the simple average of the male and female rates._'
    : '';
}

function toRow(p: Point): Record<string, unknown> {
  const row: Record<string, unknown> = {
    country: p.country,
    isoCode3: p.isoCode3,
    region: p.region,
    indicator: p.indicator,
    slug: p.slug,
    value: round(p.value),
    basis: p.basis,
    unit: p.unit,
    year: p.year,
    source: p.source,
  };
  if (p.male !== undefined) row.male = round(p.male);
  if (p.female !== undefined) row.female = round(p.female);
  return row;
}

/** Bar chart in the shape the web renderer reads: `{name, value}` or `{name, female, male}`. */
function barChart(points: Point[], title: string): NlqVisualization | null {
  if (points.length === 0) return null;
  const bySex = points.every((p) => p.basis === 'mf-average');
  return {
    type: 'bar_chart',
    title,
    data: points.map((p) =>
      bySex
        ? { name: p.country, female: round(p.female!), male: round(p.male!) }
        : { name: p.country, value: round(scaled(p.value, p.slug)) },
    ),
    xAxis: 'Country',
    yAxis: unitLabel(points[0].unit, points[0].slug),
  };
}
