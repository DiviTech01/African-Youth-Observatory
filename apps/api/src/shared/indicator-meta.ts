// ============================================================
// Per-indicator metadata that the schema does not (yet) carry.
// ============================================================
//
// Kept in code rather than on the Indicator table so it ships without a
// migration. Every entry is keyed by indicator slug, which is stable.

import { DEFAULT_AGE_GROUP } from './constants';

/**
 * Indicators that have no youth age dimension at all: national budgets,
 * business-environment ranks, health-system capacity, whole-population counts
 * and the AYC policy markers.
 *
 * Their rows are stored under whatever band the upload stamped (mostly
 * "15-35", the schema default), but the number is not a youth figure. Labelling
 * "education budget, % of GDP" as "ages 15-35" changes what it means (audit
 * H10), so readers report these as 'all' (national value) regardless of how
 * the row was stored.
 */
export const NATIONAL_LEVEL_INDICATORS: ReadonlySet<string> = new Set([
  'education-budget-share-gdp',
  'health-budget-share',
  'getting-credit-rank',
  'protecting-investors-rank',
  'physician-density',
  'teacher-student-ratio',
  'internet-access-households',
  'births-by-skilled-staff',
  'maternal-mortality-ratio',
  'total-population',
]);

export function isNationalLevel(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return NATIONAL_LEVEL_INDICATORS.has(slug) || slug.startsWith('ayc-');
}

/**
 * The age band a reader should display for a series: 'all' for national-level
 * indicators, otherwise the band the rows were actually stored under.
 */
export function displayAgeBand(slug: string | null | undefined, storedBand: string | null | undefined): string {
  if (isNationalLevel(slug)) return 'all';
  return storedBand || DEFAULT_AGE_GROUP;
}

/**
 * Indicators whose values are stored in thousands. The unit column only says
 * NUMBER, so a raw render of Nigeria's youth population reads "82,936" -- off
 * by 1,000x (audit CONS-04). Renderers multiply by this factor, or label the
 * scale, before showing the value.
 *
 * `youth-microcredit-recipients` is named "(thousands)" but its values
 * (5,000 to 1,100,000) cannot be thousands -- 1.1 billion recipients -- so it
 * is deliberately NOT listed until the source is checked.
 */
export const INDICATOR_SCALE: Readonly<Record<string, number>> = {
  'total-population': 1000,
  'youth-population-15-35': 1000,
};

export function scaleOf(slug: string | null | undefined): number {
  return (slug && INDICATOR_SCALE[slug]) || 1;
}
