/**
 * Region format utilities for frontend compatibility.
 * Backend stores NORTH_AFRICA, frontend expects "North Africa".
 */

const REGION_TO_READABLE: Record<string, string> = {
  NORTH_AFRICA: 'North Africa',
  WEST_AFRICA: 'West Africa',
  CENTRAL_AFRICA: 'Central Africa',
  EAST_AFRICA: 'East Africa',
  SOUTHERN_AFRICA: 'Southern Africa',
};

const READABLE_TO_REGION: Record<string, string> = {
  'North Africa': 'NORTH_AFRICA',
  'West Africa': 'WEST_AFRICA',
  'Central Africa': 'CENTRAL_AFRICA',
  'East Africa': 'EAST_AFRICA',
  'Southern Africa': 'SOUTHERN_AFRICA',
};

const TIER_TO_LOWERCASE: Record<string, string> = {
  HIGH: 'high',
  MEDIUM_HIGH: 'medium-high',
  MEDIUM: 'medium',
  MEDIUM_LOW: 'medium-low',
  LOW: 'low',
};

export function formatRegion(region: string): string {
  return REGION_TO_READABLE[region] || region;
}

export function parseRegion(readable: string): string {
  return READABLE_TO_REGION[readable] || readable;
}

export function formatTier(tier: string): string {
  return TIER_TO_LOWERCASE[tier] || tier?.toLowerCase();
}

/**
 * Transform a country record to include frontend-compatible field aliases.
 * Adds isoCode (alias for isoCode2), iso3Code (alias for isoCode3),
 * and formats region to human-readable.
 */
export function formatCountry(country: Record<string, unknown>): Record<string, unknown> {
  return {
    ...country,
    // Frontend aliases
    isoCode: country.isoCode2,
    iso3Code: country.isoCode3,
    // Human-readable region
    region: typeof country.region === 'string' ? formatRegion(country.region) : country.region,
    // Keep originals for backward compatibility
    isoCode2: country.isoCode2,
    isoCode3: country.isoCode3,
  };
}
