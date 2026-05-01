import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface LatestIndicator {
  value: number;
  year: number;
  gender: string;
  ageGroup: string;
  source: string;
  indicator: {
    slug: string;
    name: string;
    unit: string;
    theme: { slug: string; name: string };
  };
}

/**
 * Derives a Promise Kept · Promise Broken country report card from real
 * IndicatorValue rows. The frontend merges this on top of the parametric
 * defaults in src/data/countryReports.ts so that any field with a real number
 * wins, but unmapped fields keep their placeholder values until contributors
 * upload more data.
 *
 * Scoring assumptions and thresholds live here and only here — keep them
 * documented inline so the AYEMI computation is auditable.
 */
@Injectable()
export class CountryReportsService {
  constructor(private prisma: PrismaService) {}

  async getCountryReport(countryRef: string) {
    const country = await this.resolveCountry(countryRef);
    if (!country) throw new NotFoundException(`Country not found: ${countryRef}`);

    // Pull every value the country has, then keep only the latest per (slug, gender).
    // Exclude rows with target years in the future — those are policy-commitment
    // entries (e.g. "100% education access by 2030") rather than measured outcomes.
    const currentYear = new Date().getFullYear();
    const rows = await this.prisma.indicatorValue.findMany({
      where: {
        countryId: country.id,
        year: { lte: currentYear },
      },
      include: {
        indicator: {
          select: {
            slug: true,
            name: true,
            unit: true,
            theme: { select: { slug: true, name: true } },
          },
        },
      },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    });

    const latest = new Map<string, LatestIndicator>();
    for (const r of rows) {
      const key = `${r.indicator.slug}|${r.gender}`;
      if (!latest.has(key)) latest.set(key, r as unknown as LatestIndicator);
    }

    const get = (slug: string, gender: 'TOTAL' | 'MALE' | 'FEMALE' = 'TOTAL'): LatestIndicator | null =>
      latest.get(`${slug}|${gender}`) ?? null;
    const num = (slug: string, gender: 'TOTAL' | 'MALE' | 'FEMALE' = 'TOTAL'): number | null =>
      get(slug, gender)?.value ?? null;

    /**
     * Best-fit aggregate value across MALE/FEMALE/TOTAL. Picks whichever source
     * is freshest (highest year), preferring an M+F average if both are present
     * for the same most-recent year. This means a stale mock TOTAL value can't
     * shadow real disaggregated data.
     */
    const meanGender = (slug: string): number | null => {
      const m = get(slug, 'MALE');
      const f = get(slug, 'FEMALE');
      const t = get(slug, 'TOTAL');
      const candidates: Array<{ year: number; value: number }> = [];
      if (t) candidates.push({ year: t.year, value: t.value });
      if (m && f) candidates.push({ year: Math.min(m.year, f.year), value: (m.value + f.value) / 2 });
      else if (m) candidates.push({ year: m.year, value: m.value });
      else if (f) candidates.push({ year: f.year, value: f.value });
      if (!candidates.length) return null;
      candidates.sort((a, b) => b.year - a.year);
      return candidates[0].value;
    };

    // ── Real fields we can populate from indicator values ─────────────────
    // Many CountryReport fields have no AYIMS source (e.g. press-freedom rank,
    // legislation list, narrative text). Those stay parametric or come from the
    // PKPB document upload's extractedSummary. We only emit fields here that we
    // can actually derive from a numeric indicator value.
    const real: Record<string, unknown> = {};

    const totalPop = num('total-population');
    if (totalPop != null) real.totalPopMillions = round(totalPop / 1000, 1); // stored in thousands

    const youthPop = num('youth-population-15-35');
    if (youthPop != null) real.totalYouthMillions = round(youthPop / 1000, 1);

    const youthShare = num('youth-share-of-population');
    if (youthShare != null) real.youthBulgePct = round(youthShare, 1);

    const urban = num('youth-urban-share');
    if (urban != null) real.urbanPopPct = round(urban, 1);

    const literacy = meanGender('youth-literacy-rate');
    if (literacy != null) real.literacyPct = round(literacy, 1);

    const tertiary = num('tertiary-education-gross-enrollment-rate');
    if (tertiary != null) real.tertiaryGerPct = round(tertiary, 1);

    const secondary = meanGender('secondary-school-net-enrollment-rate');
    if (secondary != null) real.secondaryCompletionPct = round(secondary, 1);

    const internet = num('internet-access-households');
    if (internet != null) real.internetAccessPct = round(internet, 1);

    const informal = num('informal-employment-rate');
    if (informal != null) real.informalEmploymentPct = round(informal, 1);

    const voterM = num('youth-voter-turnout', 'MALE');
    const voterF = num('youth-voter-turnout', 'FEMALE');
    if (voterM != null) real.voterRegMaleYouthPct = round(voterM, 1);
    if (voterF != null) real.voterRegFemaleYouthPct = round(voterF, 1);
    if (voterM != null && voterF != null) real.voterRegYouthPct = round((voterM + voterF) / 2, 1);
    else if (voterM != null) real.voterRegYouthPct = voterM;
    else if (voterF != null) real.voterRegYouthPct = voterF;

    const banked = num('youth-bank-account-ownership');
    if (banked != null) real.bankedPct = round(banked, 1);

    const idCoverage = num('total-population'); // placeholder; we don't have a digital-id slug yet

    const hiv = meanGender('hiv-prevalence-rate-youth');
    if (hiv != null) real.hivYouthSharePct = round(hiv, 2);

    const hivF = num('hiv-prevalence-rate-youth', 'FEMALE');
    if (hivF != null) real.hivWomen = `${round(hivF, 2)}% (women 15-35)`;

    const yplwha = num('yplwha-treatment-rate');
    if (yplwha != null) real.artCount = `${round(yplwha, 1)}% on ART`;

    // ── AYEMI composite — weighted avg of the real fields we have ─────────
    // 0-100 scale, higher is better. Indicators where lower is better (poverty,
    // unemployment, HIV) are inverted before averaging. Weights map roughly to
    // the AYC Composite Policy Index dimensions.
    const ayemi = computeAyemi({
      literacy,
      tertiary,
      secondary,
      internet,
      banked,
      youthUnemploymentMale: num('youth-unemployment-rate', 'MALE'),
      youthUnemploymentFemale: num('youth-unemployment-rate', 'FEMALE'),
      hiv,
      voterTurnout: real.voterRegYouthPct as number | null,
    });
    if (ayemi != null) {
      real.ayemiScore = ayemi.score;
      real.ayemiTier = ayemi.tier;
    }

    // ── Indicators array (key tiles on the report card) ───────────────────
    // Built from the real values we have, freshest year first. Falls back to
    // parametric if we have nothing.
    const indicators = buildIndicatorTiles(latest);

    const lastDataYear = latest.size
      ? Math.max(...Array.from(latest.values()).map((v) => v.year))
      : null;

    return {
      country: country.name,
      iso3: country.isoCode3,
      slug: slugify(country.name),
      lastDataYear,
      indicatorCount: latest.size,
      hasRealData: Object.keys(real).length > 0,
      real,
      indicators: indicators.length ? indicators : null,
    };
  }

  private async resolveCountry(ref: string) {
    const decoded = decodeURIComponent(ref).trim();
    const slugAsName = decoded.replace(/-/g, ' ');
    return this.prisma.country.findFirst({
      where: {
        OR: [
          { id: decoded },
          { isoCode3: decoded.toUpperCase() },
          { isoCode2: decoded.toUpperCase() },
          { name: { equals: decoded, mode: 'insensitive' } },
          { name: { equals: slugAsName, mode: 'insensitive' } },
        ],
      },
    });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────

function round(n: number, decimals = 1): number {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-');
}

interface AyemiInputs {
  literacy: number | null;
  tertiary: number | null;
  secondary: number | null;
  internet: number | null;
  banked: number | null;
  youthUnemploymentMale: number | null;
  youthUnemploymentFemale: number | null;
  hiv: number | null;
  voterTurnout: number | null;
}

function computeAyemi(x: AyemiInputs): { score: number; tier: 'Critical' | 'Developing' | 'Fulfilling' } | null {
  // Each component is a 0-100 score where higher = better. Components missing
  // data are excluded from the average — we want the score to reflect what
  // we know, not penalize countries for incomplete uploads.
  const components: number[] = [];

  if (x.literacy != null) components.push(clamp(x.literacy));
  if (x.tertiary != null) components.push(clamp(x.tertiary * 1.5)); // scale 0-66 GER → 0-100
  if (x.secondary != null) components.push(clamp(x.secondary));
  if (x.internet != null) components.push(clamp(x.internet));
  if (x.banked != null) components.push(clamp(x.banked));
  if (x.voterTurnout != null) components.push(clamp(x.voterTurnout));

  // Inverted: lower-is-better
  if (x.youthUnemploymentMale != null) components.push(clamp(100 - x.youthUnemploymentMale * 2)); // 50% unemployment → 0
  if (x.youthUnemploymentFemale != null) components.push(clamp(100 - x.youthUnemploymentFemale * 2));
  if (x.hiv != null) components.push(clamp(100 - x.hiv * 10)); // 10% HIV → 0

  if (components.length === 0) return null;
  const avg = components.reduce((a, b) => a + b, 0) / components.length;
  const score = Math.round(avg);
  const tier = score >= 67 ? 'Fulfilling' : score >= 34 ? 'Developing' : 'Critical';
  return { score, tier };
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

function buildIndicatorTiles(latest: Map<string, LatestIndicator>): any[] {
  const tiles: any[] = [];
  const push = (
    slug: string,
    gender: 'TOTAL' | 'MALE' | 'FEMALE',
    topic: string,
    label: string,
    severity: 'red' | 'gold' | 'green' | 'navy',
    goodHigh = true,
  ) => {
    const v = latest.get(`${slug}|${gender}`);
    if (!v) return;
    const display =
      v.indicator.unit === 'PERCENTAGE'
        ? `${round(v.value, 1)}%`
        : v.indicator.unit === 'NUMBER'
        ? v.value.toLocaleString()
        : `${round(v.value, 1)}`;
    const barPct = v.indicator.unit === 'PERCENTAGE' ? clamp(v.value) : clamp(v.value);
    tiles.push({
      topic,
      value: display,
      label,
      compare: `Latest ${v.year} · source: ${v.source}`,
      trend: 'flat',
      severity,
      barPct: goodHigh ? barPct : 100 - barPct,
    });
  };

  push('youth-literacy-rate', 'MALE', 'LITERACY · MEN', 'Male youth literacy 15-35', 'gold');
  push('youth-literacy-rate', 'FEMALE', 'LITERACY · WOMEN', 'Female youth literacy 15-35', 'gold');
  push('tertiary-education-gross-enrollment-rate', 'TOTAL', 'TERTIARY EDUCATION', 'Tertiary GER (all genders)', 'red', true);
  push('youth-unemployment-rate', 'MALE', 'UNEMPLOYMENT · MEN', 'Male youth unemployment', 'red', false);
  push('youth-unemployment-rate', 'FEMALE', 'UNEMPLOYMENT · WOMEN', 'Female youth unemployment', 'red', false);
  push('hiv-prevalence-rate-youth', 'FEMALE', 'HIV · YOUNG WOMEN', 'HIV prevalence women 15-35', 'red', false);
  push('internet-access-households', 'TOTAL', 'CONNECTIVITY', 'Households with internet access', 'gold');
  push('youth-bank-account-ownership', 'TOTAL', 'FINANCIAL INCLUSION', 'Youth with bank account', 'gold');

  return tiles;
}
