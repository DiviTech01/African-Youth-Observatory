// ============================================================
// AYD Shared Types — The API Contract
// Both frontend (@ayd/web) and backend (@ayd/api) import from here
// ============================================================

// ---- Enums as union types (no Prisma dependency) ----

export type Region =
  | 'NORTH_AFRICA'
  | 'WEST_AFRICA'
  | 'CENTRAL_AFRICA'
  | 'EAST_AFRICA'
  | 'SOUTHERN_AFRICA';

export type GenderType = 'MALE' | 'FEMALE' | 'TOTAL';

export type IndicatorUnit =
  | 'PERCENTAGE'
  | 'NUMBER'
  | 'INDEX'
  | 'RATIO'
  | 'RATE'
  | 'CURRENCY'
  | 'SCORE'
  | 'YEARS';

export type IndexTier =
  | 'HIGH'
  | 'MEDIUM_HIGH'
  | 'MEDIUM'
  | 'MEDIUM_LOW'
  | 'LOW';

export type UserRole =
  | 'PUBLIC'
  | 'REGISTERED'
  | 'RESEARCHER'
  | 'CONTRIBUTOR'
  | 'INSTITUTIONAL'
  | 'ADMIN';

// ---- Core Entities ----

export interface Country {
  id: string;
  name: string;
  isoCode2: string;
  isoCode3: string;
  region: Region;
  capital: string;
  population: number;
  youthPopulation: number;
  area?: number;
  currency?: string;
  languages: string[];
  economicBlocs: string[];
  latitude: number;
  longitude: number;
  flagEmoji?: string;
}

export interface Theme {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  sortOrder: number;
  indicatorCount?: number;
}

export interface Indicator {
  id: string;
  name: string;
  slug: string;
  description: string;
  unit: IndicatorUnit;
  source: string;
  methodology?: string;
  frequency?: string;
  themeId: string;
  themeName?: string;
}

export interface IndicatorValue {
  id: string;
  value: number;
  year: number;
  gender: GenderType;
  ageGroup: string;
  source: string;
  confidence: number;
  isEstimate: boolean;
  countryId: string;
  indicatorId: string;
  countryName?: string;
  indicatorName?: string;
}

export interface YouthIndexScore {
  id: string;
  year: number;
  overallScore: number;
  educationScore: number;
  employmentScore: number;
  healthScore: number;
  civicScore: number;
  innovationScore: number;
  rank: number;
  previousRank?: number;
  rankChange?: number;
  percentile: number;
  tier: IndexTier;
  countryId: string;
  countryName?: string;
}

export interface CountryPolicy {
  id: string;
  countryId: string;
  policyName: string;
  policyType: string;
  yearAdopted?: number;
  yearRevised?: number;
  aycRatified: boolean;
  aycRatifiedYear?: number;
  wpayCompliant: boolean;
  complianceScore?: number;
  status: string;
}

export interface Expert {
  id: string;
  name: string;
  email?: string;
  title: string;
  organization?: string;
  countryId: string;
  specializations: string[];
  languages: string[];
  bio?: string;
  verified: boolean;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  organization?: string;
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
}

export interface Dashboard {
  id: string;
  title: string;
  description?: string;
  layout: Record<string, unknown>;
  widgets: DashboardWidget[];
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardWidget {
  id: string;
  type: ChartType;
  title: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export type ChartType =
  | 'bar'
  | 'line'
  | 'area'
  | 'pie'
  | 'donut'
  | 'map'
  | 'scatter'
  | 'radar'
  | 'treemap';

export interface DataSource {
  id: string;
  name: string;
  url?: string;
  description?: string;
  type: string;
  lastSync?: string;
}

// ---- API Response Wrappers ----

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

// ---- Query Parameter Types ----

export interface DataFilters {
  countryId?: string;
  countryIds?: string[];
  indicatorId?: string;
  themeId?: string;
  yearStart?: number;
  yearEnd?: number;
  gender?: GenderType;
  region?: Region;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ---- Derived / Computed Types (for API responses) ----

export interface MapDataPoint {
  countryId: string;
  countryName: string;
  isoCode3: string;
  value: number;
  year: number;
}

export interface TimeSeriesPoint {
  year: number;
  value: number;
  gender?: GenderType;
}

export interface ComparisonData {
  countryId: string;
  countryName: string;
  isoCode3: string;
  flagEmoji?: string;
  values: {
    indicatorId: string;
    indicatorName: string;
    value: number;
    year: number;
  }[];
}

export interface RegionalAverage {
  region: Region;
  indicatorId: string;
  indicatorName: string;
  averageValue: number;
  countryCount: number;
  year: number;
}

export interface CountryStats {
  country: Country;
  indicatorCount: number;
  latestYear: number;
  youthIndexScore?: YouthIndexScore;
  highlights: {
    indicatorName: string;
    value: number;
    unit: IndicatorUnit;
    trend: 'up' | 'down' | 'stable';
  }[];
}

export interface RegionSummary {
  region: Region;
  countryCount: number;
  totalPopulation: number;
  totalYouthPopulation: number;
  countries: Pick<Country, 'id' | 'name' | 'isoCode3' | 'flagEmoji'>[];
}

export interface PlatformStats {
  totalCountries: number;
  totalIndicators: number;
  totalDataPoints: number;
  totalThemes: number;
  yearRange: { min: number; max: number };
  lastUpdated: string;
}
