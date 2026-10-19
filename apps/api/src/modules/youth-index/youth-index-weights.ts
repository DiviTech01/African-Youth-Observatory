// Single source of truth for the African Youth Index sub-weights.
// Theme weights themselves live on Theme.weight in the DB (seeded to user-mandated
// 20/15/15/15/15/10/10). This file defines which indicators feed each theme score
// and how they're weighted within the theme.
//
// Indicators not listed here are "display-only" — visible in explorer/theme pages
// but excluded from the index score.

export type Direction = 'higher-is-better' | 'lower-is-better';

export interface SubIndicator {
  slug: string;
  direction: Direction;
  weight: number; // within-theme weight; renormalised over the indicators that have data
  /**
   * Raw headcount: score it as a rate per 100,000 youth (same country, same
   * year) instead. Unnormalised, the largest countries scored worst on every
   * count simply for being large -- Access to Justice rested on a detention
   * headcount that compared Nigeria with Seychelles (audit C2).
   */
  perCapita?: boolean;
}

/** Denominator for perCapita indicators. Stored in thousands. */
export const YOUTH_POPULATION_SLUG = 'youth-population-15-35';

/**
 * Coverage floor (audit C2). Weights used to be redistributed with no floor, so
 * one indicator could carry a whole 20% dimension, and a dimension with no data
 * at all was filled with the regional average or a flat 50.
 *
 * A dimension is scored only when the indicators that have data carry at least
 * MIN_DIMENSION_COVERAGE of the dimension's weight AND number at least
 * MIN_DIMENSION_INDICATORS. Otherwise it is null ("insufficient data").
 *
 * A country is scored and ranked only when its scored dimensions carry at least
 * MIN_INDEX_COVERAGE of the total theme weight. Its overall score is the
 * weighted mean over the scored dimensions only -- nothing is imputed.
 */
export const MIN_DIMENSION_COVERAGE = 0.5;
export const MIN_DIMENSION_INDICATORS = 2;
export const MIN_INDEX_COVERAGE = 0.5;

export const SUB_WEIGHTS: Record<string, SubIndicator[]> = {
  'youth-demography-participation': [
    { slug: 'youth-voter-turnout',                  direction: 'higher-is-better', weight: 0.35 },
    // youth-share-of-population (was 0.20, higher-is-better) is NEUTRAL and is
    // excluded from scoring. A larger youth share is a demographic fact, not
    // development: scored as "better" it put Niger near the top and Mauritius,
    // Africa's oldest age structure, near the bottom on this one variable
    // (audit C2). It remains visible as display data.
    { slug: 'youth-political-participation-index',  direction: 'higher-is-better', weight: 0.15 },
    { slug: 'youth-seats-in-parliament',            direction: 'higher-is-better', weight: 0.10 },
    { slug: 'youth-trust-in-government-index',      direction: 'higher-is-better', weight: 0.10 },
    { slug: 'freedom-of-association-score',         direction: 'higher-is-better', weight: 0.10 },
  ],
  'education': [
    { slug: 'youth-literacy-rate',                       direction: 'higher-is-better', weight: 0.25 },
    { slug: 'secondary-school-net-enrollment-rate',      direction: 'higher-is-better', weight: 0.20 },
    { slug: 'tertiary-education-gross-enrollment-rate',  direction: 'higher-is-better', weight: 0.15 },
    { slug: 'school-dropout-rate',                       direction: 'lower-is-better',  weight: 0.15 },
    { slug: 'primary-enrollment-rate',                   direction: 'higher-is-better', weight: 0.10 },
    { slug: 'education-budget-share-gdp',                direction: 'higher-is-better', weight: 0.10 },
    { slug: 'teacher-student-ratio',                     direction: 'lower-is-better',  weight: 0.05 },
  ],
  'employment': [
    { slug: 'youth-unemployment-rate',                 direction: 'lower-is-better',  weight: 0.35 },
    { slug: 'youth-labor-force-participation-rate',    direction: 'higher-is-better', weight: 0.25 },
    { slug: 'youth-employment-to-population-ratio',    direction: 'higher-is-better', weight: 0.20 },
    { slug: 'youth-adult-unemployment-ratio',          direction: 'lower-is-better',  weight: 0.10 },
    { slug: 'informal-employment-rate',                direction: 'lower-is-better',  weight: 0.10 },
  ],
  'health': [
    { slug: 'births-by-skilled-staff',             direction: 'higher-is-better', weight: 0.15 },
    { slug: 'physician-density',                   direction: 'higher-is-better', weight: 0.15 },
    { slug: 'hiv-prevalence-rate-youth',           direction: 'lower-is-better',  weight: 0.15 },
    { slug: 'yplwha-treatment-rate',               direction: 'higher-is-better', weight: 0.10 },
    { slug: 'youth-suicide-rate',                  direction: 'lower-is-better',  weight: 0.10 },
    { slug: 'contraceptive-prevalence-rate-youth', direction: 'higher-is-better', weight: 0.10 },
    { slug: 'maternal-mortality-ratio',            direction: 'lower-is-better',  weight: 0.10 },
    { slug: 'health-budget-share',                 direction: 'higher-is-better', weight: 0.05 },
    { slug: 'youth-aids-deaths',                   direction: 'lower-is-better',  weight: 0.05, perCapita: true },
    { slug: 'youth-substance-abuse-deaths',        direction: 'lower-is-better',  weight: 0.05, perCapita: true },
  ],
  'entrepreneurship': [
    { slug: 'youth-startup-survival-rate',         direction: 'higher-is-better', weight: 0.20 },
    { slug: 'youth-microcredit-recipients',        direction: 'higher-is-better', weight: 0.15, perCapita: true },
    { slug: 'internet-access-households',          direction: 'higher-is-better', weight: 0.15 },
    { slug: 'getting-credit-rank',                 direction: 'lower-is-better',  weight: 0.10 },
    { slug: 'protecting-investors-rank',           direction: 'lower-is-better',  weight: 0.10 },
    { slug: 'youth-ip-registrations',              direction: 'higher-is-better', weight: 0.10, perCapita: true },
    { slug: 'youth-entrepreneurship-rate',         direction: 'higher-is-better', weight: 0.10 },
    { slug: 'mobile-money-account-penetration',    direction: 'higher-is-better', weight: 0.05 },
    { slug: 'financial-literacy-rate',             direction: 'higher-is-better', weight: 0.05 },
  ],
  // Peace & Security read a constant 50 for every country until the age-band
  // fix (2.1): all three series are stored under 18-30 / 18-35. They are raw
  // headcounts, so they are scored per capita like the justice counts.
  'peace-security': [
    { slug: 'youth-idps',                  direction: 'lower-is-better', weight: 0.40, perCapita: true },
    { slug: 'youth-trafficking-victims',   direction: 'lower-is-better', weight: 0.35, perCapita: true },
    { slug: 'youth-extremism-deaths',      direction: 'lower-is-better', weight: 0.25, perCapita: true },
  ],
  'access-to-justice': [
    { slug: 'youth-awaiting-trial',  direction: 'lower-is-better', weight: 0.45, perCapita: true },
    { slug: 'youth-imprisoned',      direction: 'lower-is-better', weight: 0.40, perCapita: true },
    { slug: 'juvenile-detentions',   direction: 'lower-is-better', weight: 0.15, perCapita: true },
  ],
};

export const THEME_SLUGS = Object.keys(SUB_WEIGHTS);

export const ALL_INDEX_INDICATOR_SLUGS = Object.values(SUB_WEIGHTS).flatMap((arr) =>
  arr.map((s) => s.slug),
);
