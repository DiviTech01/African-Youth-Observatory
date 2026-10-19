import { PrismaService } from '../../prisma/prisma.service';

/**
 * Shared reading of IndicatorValue rows for every surface that answers
 * questions from the data: the rule-based Ask AI engine (NlqService) and the
 * tools Claude calls (AiContextService.executeDataQuery, used by /nlq/query
 * and insight-report generation).
 *
 * Kept in one place because each surface got the same three things wrong
 * on its own:
 *  - Country lookup by substring ("Niger" inside "Nigeria", "Guinea" inside
 *    "Guinea-Bissau", "Sudan" inside "South Sudan").
 *  - Filtering `gender: 'TOTAL'` — the headline indicators (youth
 *    unemployment, literacy, secondary enrolment, HIV) are published by sex
 *    only, so that filter returns nothing for them.
 *  - Taking the newest year as "latest", when the table holds 2026–2050
 *    policy-target rows for a handful of countries.
 */

// ============================================================
// Country detection
// ============================================================

interface CountryEntry {
  /** Exactly as stored in `Country.name`. */
  name: string;
  iso3: string;
  /** Other spellings, short forms and demonyms, matched as whole words. */
  aliases?: string[];
}

const COUNTRIES: CountryEntry[] = [
  { name: 'Algeria', iso3: 'DZA', aliases: ['algerian', 'algerie'] },
  { name: 'Angola', iso3: 'AGO', aliases: ['angolan'] },
  { name: 'Benin', iso3: 'BEN', aliases: ['beninese'] },
  { name: 'Botswana', iso3: 'BWA' },
  { name: 'Burkina Faso', iso3: 'BFA', aliases: ['burkina', 'burkinabe'] },
  { name: 'Burundi', iso3: 'BDI', aliases: ['burundian'] },
  { name: 'Cabo Verde', iso3: 'CPV', aliases: ['cape verde', 'cape verdean'] },
  { name: 'Cameroon', iso3: 'CMR', aliases: ['cameroonian', 'cameroun'] },
  { name: 'Central African Republic', iso3: 'CAF', aliases: ['central african rep'] },
  { name: 'Chad', iso3: 'TCD', aliases: ['chadian', 'tchad'] },
  { name: 'Comoros', iso3: 'COM', aliases: ['comorian', 'comores'] },
  {
    name: 'Congo',
    iso3: 'COG',
    aliases: ['republic of the congo', 'republic of congo', 'congo-brazzaville', 'congo brazzaville', 'congo republic'],
  },
  { name: "Cote d'Ivoire", iso3: 'CIV', aliases: ['cote divoire', 'ivory coast', 'ivorian'] },
  { name: 'Djibouti', iso3: 'DJI', aliases: ['djiboutian'] },
  {
    name: 'DR Congo',
    iso3: 'COD',
    aliases: [
      'democratic republic of the congo',
      'democratic republic of congo',
      'dem. rep. congo',
      'd.r. congo',
      'congo-kinshasa',
      'congo kinshasa',
      'drc',
    ],
  },
  { name: 'Egypt', iso3: 'EGY', aliases: ['egyptian'] },
  { name: 'Equatorial Guinea', iso3: 'GNQ', aliases: ['equatoguinean'] },
  { name: 'Eritrea', iso3: 'ERI', aliases: ['eritrean'] },
  { name: 'Eswatini', iso3: 'SWZ', aliases: ['swaziland', 'swazi'] },
  { name: 'Ethiopia', iso3: 'ETH', aliases: ['ethiopian'] },
  { name: 'Gabon', iso3: 'GAB', aliases: ['gabonese'] },
  { name: 'Gambia', iso3: 'GMB', aliases: ['the gambia', 'gambian'] },
  { name: 'Ghana', iso3: 'GHA', aliases: ['ghanaian'] },
  { name: 'Guinea', iso3: 'GIN', aliases: ['guinea-conakry', 'guinea conakry', 'guinean'] },
  { name: 'Guinea-Bissau', iso3: 'GNB', aliases: ['guinea bissau', 'bissau-guinean'] },
  { name: 'Kenya', iso3: 'KEN', aliases: ['kenyan'] },
  { name: 'Lesotho', iso3: 'LSO' },
  { name: 'Liberia', iso3: 'LBR', aliases: ['liberian'] },
  { name: 'Libya', iso3: 'LBY', aliases: ['libyan'] },
  { name: 'Madagascar', iso3: 'MDG', aliases: ['malagasy'] },
  { name: 'Malawi', iso3: 'MWI', aliases: ['malawian'] },
  { name: 'Mali', iso3: 'MLI', aliases: ['malian'] },
  { name: 'Mauritania', iso3: 'MRT', aliases: ['mauritanian'] },
  { name: 'Mauritius', iso3: 'MUS', aliases: ['mauritian'] },
  { name: 'Morocco', iso3: 'MAR', aliases: ['moroccan', 'maroc'] },
  { name: 'Mozambique', iso3: 'MOZ', aliases: ['mozambican'] },
  { name: 'Namibia', iso3: 'NAM', aliases: ['namibian'] },
  { name: 'Niger', iso3: 'NER', aliases: ['nigerien'] },
  { name: 'Nigeria', iso3: 'NGA', aliases: ['nigerian'] },
  { name: 'Rwanda', iso3: 'RWA', aliases: ['rwandan'] },
  { name: 'Sao Tome and Principe', iso3: 'STP', aliases: ['sao tome & principe', 'sao tome', 'santomean'] },
  { name: 'Senegal', iso3: 'SEN', aliases: ['senegalese'] },
  { name: 'Seychelles', iso3: 'SYC' },
  { name: 'Sierra Leone', iso3: 'SLE', aliases: ['sierra leonean'] },
  { name: 'Somalia', iso3: 'SOM', aliases: ['somali'] },
  { name: 'South Africa', iso3: 'ZAF', aliases: ['south african', 'rsa'] },
  { name: 'South Sudan', iso3: 'SSD', aliases: ['south sudanese'] },
  { name: 'Sudan', iso3: 'SDN', aliases: ['sudanese'] },
  { name: 'Tanzania', iso3: 'TZA', aliases: ['tanzanian', 'united republic of tanzania'] },
  { name: 'Togo', iso3: 'TGO', aliases: ['togolese'] },
  { name: 'Tunisia', iso3: 'TUN', aliases: ['tunisian'] },
  { name: 'Uganda', iso3: 'UGA', aliases: ['ugandan'] },
  { name: 'Zambia', iso3: 'ZMB', aliases: ['zambian'] },
  { name: 'Zimbabwe', iso3: 'ZWE', aliases: ['zimbabwean'] },
];

/** Lowercase, strip accents, unify apostrophes — so "Côte d’Ivoire" matches. */
export function normalise(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’‘`´]/g, "'");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Whole-phrase pattern: not preceded or followed by a letter or digit. */
function phrasePattern(phrase: string): RegExp {
  return new RegExp(`(?<![a-z0-9])${escapeRegex(phrase)}(?![a-z0-9])`, 'g');
}

export interface PhraseRule<T> {
  phrase: string;
  value: T;
  re: RegExp;
}

export function buildRules<T>(pairs: Array<[string, T]>): PhraseRule<T>[] {
  return pairs
    .map(([phrase, value]) => ({ phrase: normalise(phrase), value, re: phrasePattern(normalise(phrase)) }))
    // Longest first, so "guinea-bissau" / "equatorial guinea" / "south sudan"
    // / "dr congo" claim their span before "guinea" / "sudan" / "congo" can.
    .sort((a, b) => b.phrase.length - a.phrase.length);
}

/**
 * Finds every rule phrase in the text, longest first, blanking out each match
 * so a shorter phrase cannot re-match inside it. Results are returned in the
 * order they appear in the text (so "Nigeria vs Niger" keeps that order).
 */
export function matchPhrases<T>(text: string, rules: PhraseRule<T>[]): T[] {
  let working = normalise(text);
  const hits: Array<{ at: number; value: T }> = [];
  for (const rule of rules) {
    rule.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rule.re.exec(working)) !== null) {
      hits.push({ at: m.index, value: rule.value });
      working = working.slice(0, m.index) + ' '.repeat(m[0].length) + working.slice(m.index + m[0].length);
      rule.re.lastIndex = m.index + m[0].length;
    }
  }
  const seen = new Set<T>();
  return hits
    .sort((a, b) => a.at - b.at)
    .map((h) => h.value)
    .filter((v) => (seen.has(v) ? false : (seen.add(v), true)));
}

const COUNTRY_RULES = buildRules<string>(
  COUNTRIES.flatMap((c) => [[c.name, c.name] as [string, string], ...(c.aliases ?? []).map((a) => [a, c.name] as [string, string])]),
);

const ISO3_TO_COUNTRY = new Map(COUNTRIES.map((c) => [c.iso3, c.name]));
// Upper-case short forms people type that are not ISO3 codes.
ISO3_TO_COUNTRY.set('DRC', 'DR Congo');
ISO3_TO_COUNTRY.set('CAR', 'Central African Republic');
ISO3_TO_COUNTRY.set('RSA', 'South Africa');

/**
 * Countries named in a question: whole-word names and aliases (longest match
 * first), plus upper-case ISO3 codes such as "NGA" or "KEN". Codes are only
 * read when the question isn't typed in all caps, where "MAR" or "BEN" would
 * be ordinary words.
 */
export function detectCountries(question: string): string[] {
  const named = matchPhrases(question, COUNTRY_RULES);
  const out = [...named];
  if (/[a-z]/.test(question)) {
    for (const m of question.matchAll(/(?<![A-Za-z])([A-Z]{3})(?![A-Za-z])/g)) {
      const name = ISO3_TO_COUNTRY.get(m[1]);
      if (name && !out.includes(name)) out.push(name);
    }
  }
  return out;
}

/**
 * The one stored country a free-text name refers to: alias / whole-word
 * match first, then an exact case-insensitive name. Never a substring.
 */
export async function resolveCountry(prisma: PrismaService, name: string) {
  const candidate = detectCountries(String(name ?? ''))[0];
  if (candidate) {
    const hit = await prisma.country.findUnique({ where: { name: candidate } });
    if (hit) return hit;
  }
  return prisma.country.findFirst({ where: { name: { equals: String(name ?? '').trim(), mode: 'insensitive' } } });
}

// ============================================================
// Indicator values
// ============================================================

export type Gender = 'MALE' | 'FEMALE' | 'TOTAL';

/** One country × indicator × year, collapsed across sex and age band. */
export interface Point {
  countryId: string;
  country: string;
  isoCode3: string;
  region: string;
  indicatorId: string;
  slug: string;
  indicator: string;
  unit: string;
  year: number;
  /** TOTAL if published; else the male–female average; else the one sex. */
  value: number;
  basis: 'total' | 'mf-average' | 'male' | 'female';
  male?: number;
  female?: number;
  source: string;
}

const AGE_PREFERENCE = ['15-35', '18-35', '18-30', 'all', ''];

/**
 * Loads every row for the given indicators (optionally limited to some
 * countries / a region / a year window) and collapses them into one Point
 * per country × indicator × year.
 */
export async function loadPoints(prisma: PrismaService, opts: {
  slugs: string[];
  countryIds?: string[];
  region?: string;
  yearFrom?: number | null;
  yearTo?: number | null;
  gender?: Gender | null;
}): Promise<Point[]> {
  const where: Record<string, unknown> = { indicator: { slug: { in: opts.slugs } } };
  if (opts.countryIds && opts.countryIds.length > 0) where.countryId = { in: opts.countryIds };
  if (opts.region) where.country = { region: opts.region };
  const year: Record<string, number> = {};
  if (opts.yearFrom) year.gte = opts.yearFrom;
  year.lte = opts.yearTo ?? new Date().getFullYear();
  where.year = year;

  const rows = await prisma.indicatorValue.findMany({
    where,
    select: {
      value: true,
      year: true,
      gender: true,
      ageGroup: true,
      source: true,
      country: { select: { id: true, name: true, isoCode3: true, region: true } },
      indicator: { select: { id: true, slug: true, name: true, unit: true } },
    },
  });

  type Bucket = { base: (typeof rows)[number]; byGender: Partial<Record<Gender, { value: number; age: number }>> };
  const buckets = new Map<string, Bucket>();
  for (const r of rows) {
    const key = `${r.country.id}|${r.indicator.id}|${r.year}`;
    let b = buckets.get(key);
    if (!b) {
      b = { base: r, byGender: {} };
      buckets.set(key, b);
    }
    const ageRank = AGE_PREFERENCE.indexOf(r.ageGroup ?? '');
    const age = ageRank === -1 ? AGE_PREFERENCE.length : ageRank;
    const prev = b.byGender[r.gender as Gender];
    if (!prev || age < prev.age) b.byGender[r.gender as Gender] = { value: r.value, age };
  }

  const points: Point[] = [];
  for (const { base, byGender } of buckets.values()) {
    const total = byGender.TOTAL?.value;
    const male = byGender.MALE?.value;
    const female = byGender.FEMALE?.value;
    let value: number | undefined;
    let basis: Point['basis'] = 'total';
    if (opts.gender === 'MALE' || opts.gender === 'FEMALE') {
      value = opts.gender === 'MALE' ? male : female;
      basis = opts.gender === 'MALE' ? 'male' : 'female';
    } else if (total !== undefined) {
      value = total;
    } else if (male !== undefined && female !== undefined) {
      value = (male + female) / 2;
      basis = 'mf-average';
    } else if (male !== undefined || female !== undefined) {
      value = (male ?? female)!;
      basis = male !== undefined ? 'male' : 'female';
    }
    if (value === undefined || !Number.isFinite(value)) continue;
    points.push({
      countryId: base.country.id,
      country: base.country.name,
      isoCode3: base.country.isoCode3,
      region: base.country.region,
      indicatorId: base.indicator.id,
      slug: base.indicator.slug,
      indicator: base.indicator.name,
      unit: base.indicator.unit,
      year: base.year,
      value,
      basis,
      male,
      female,
      source: base.source,
    });
  }
  return points;
}

/** Latest point per country × indicator. */
export function latestPerSeries(points: Point[]): Point[] {
  const best = new Map<string, Point>();
  for (const p of points) {
    const key = `${p.countryId}|${p.indicatorId}`;
    const cur = best.get(key);
    if (!cur || p.year > cur.year) best.set(key, p);
  }
  return [...best.values()];
}

/**
 * The year a cross-country ranking should use: the asked-for year, or the
 * latest year whose country coverage is at least 60% of the best-covered
 * year. Ranking the newest year blindly can rank 3 countries against each
 * other because only they have reported yet.
 */
export function rankingYear(points: Point[], requested: number | null): number | null {
  const coverage = new Map<number, number>();
  for (const p of points) coverage.set(p.year, (coverage.get(p.year) ?? 0) + 1);
  if (coverage.size === 0) return null;
  if (requested && coverage.has(requested)) return requested;
  const maxCount = Math.max(...coverage.values());
  const eligible = [...coverage.entries()]
    .filter(([y, c]) => c >= maxCount * 0.6 && (!requested || y <= requested))
    .map(([y]) => y);
  return eligible.length ? Math.max(...eligible) : Math.max(...coverage.keys());
}

/**
 * Claude sometimes returns a nested array as a JSON-encoded string
 * (`"countries": "[\"Kenya\"]"`); a bare Array.isArray check would discard it.
 */
export function asStringArray(value: unknown): string[] {
  let v = value;
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (trimmed.startsWith('[')) {
      try { v = JSON.parse(trimmed); } catch { return []; }
    } else {
      return trimmed ? [trimmed] : [];
    }
  }
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0) : [];
}

/**
 * The two population indicators are stored in thousands (Nigeria's 2025 total
 * is 237,476), although their catalogue descriptions say "in millions". Callers scale
 * so an answer never reads "237,476 people".
 */
export const THOUSANDS_SLUGS = new Set(['youth-population-15-35', 'total-population']);
