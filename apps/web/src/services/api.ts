// ============================================
// AFRICAN YOUTH OBSERVATORY - API SERVICE
// Real HTTP calls to the NestJS backend
// ============================================

import type {
  Country,
  Theme,
  Indicator,
  IndicatorValue,
  YouthIndex,
  CountryStats,
  ThemeStats,
  PlatformStats,
  DataFilters,
  IndicatorTimeSeries,
  CountryComparison,
  ChartDataPoint,
  TimeSeriesDataPoint,
  MapDataPoint,
  RegionType,
  GenderType,
} from '@/types';

// ============================================
// BASE URL
// ============================================

const _envApiUrl = import.meta.env.VITE_API_URL as string | undefined;
// Only use the env var if it's a full URL (not a relative path like /api)
const BASE_URL = (_envApiUrl && _envApiUrl.startsWith('http'))
  ? _envApiUrl
  : (import.meta.env.PROD
    ? 'https://african-youth-observatory.onrender.com/api'
    : '/api');

// ============================================
// HTTP HELPERS
// ============================================

async function get<T>(path: string, params?: Record<string, string | number | boolean | null | undefined>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== null && v !== undefined && v !== '') {
        url.searchParams.set(k, String(v));
      }
    }
  }
  const res = await fetch(url.toString(), {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText} (${path})`);
  }
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText} (${path})`);
  }
  return res.json() as Promise<T>;
}

// ============================================
// RESPONSE SHAPE ADAPTERS
// ============================================

// Backend returns { data: T[], total, page, pageSize } for lists
type PagedResponse<T> = { data: T[]; total: number; page: number; pageSize: number; totalPages: number };

// Youth index entry from backend
interface ApiYouthIndex {
  rank: number;
  countryId: string;
  countryName: string;
  isoCode3: string;
  flagEmoji?: string;
  region: string;
  overallScore: number;
  educationScore: number;
  employmentScore: number;
  healthScore: number;
  civicScore: number;
  innovationScore: number;
  previousRank: number;
  rankChange: number;
  percentile: number;
  tier: string;
}

// Normalize backend youth index → frontend YouthIndex shape
function normalizeYouthIndex(r: ApiYouthIndex): YouthIndex {
  return {
    countryId: r.countryId,
    rank: r.rank,
    indexScore: r.overallScore,
    educationScore: r.educationScore,
    healthScore: r.healthScore,
    employmentScore: r.employmentScore,
    civicScore: r.civicScore,
    innovationScore: r.innovationScore,
    previousRank: r.previousRank,
    rankChange: r.rankChange ?? 0,
    percentile: r.percentile ?? 0,
    tier: (r.tier ?? 'medium') as YouthIndex['tier'],
    year: 0, // filled by caller
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ============================================
// COUNTRY API
// ============================================

export const countryApi = {
  async getAll(): Promise<Country[]> {
    const res = await get<PagedResponse<Country>>('/countries', { pageSize: 54 });
    return res.data;
  },

  async getById(id: string): Promise<Country | null> {
    try {
      return await get<Country>(`/countries/${id}`);
    } catch {
      return null;
    }
  },

  async getByIsoCode(isoCode: string): Promise<Country | null> {
    const all = await countryApi.getAll();
    return all.find(c =>
      c.isoCode?.toLowerCase() === isoCode.toLowerCase() ||
      (c as unknown as Record<string, unknown>).isoCode3?.toString().toLowerCase() === isoCode.toLowerCase() ||
      (c as unknown as Record<string, unknown>).isoCode2?.toString().toLowerCase() === isoCode.toLowerCase()
    ) ?? null;
  },

  async getByRegion(region: RegionType): Promise<Country[]> {
    const res = await get<PagedResponse<Country>>('/countries', { region, pageSize: 54 });
    return res.data;
  },

  async search(query: string): Promise<Country[]> {
    const res = await get<PagedResponse<Country>>('/countries', { search: query, pageSize: 54 });
    return res.data;
  },

  async getStats(countryId: string, year?: number): Promise<CountryStats> {
    return get<CountryStats>(`/countries/${countryId}/stats`, year ? { year } : undefined);
  },

  async getRegions(): Promise<{ name: string; countries: number }[]> {
    return get('/countries/regions');
  },
};

// ============================================
// THEME API
// ============================================

export const themeApi = {
  async getAll(): Promise<Theme[]> {
    const res = await get<PagedResponse<Theme> | Theme[]>('/themes');
    return Array.isArray(res) ? res : (res as PagedResponse<Theme>).data;
  },

  async getById(id: string): Promise<Theme | null> {
    try {
      return await get<Theme>(`/themes/${id}`);
    } catch {
      return null;
    }
  },

  async getStats(themeId: string, year?: number): Promise<ThemeStats> {
    return get<ThemeStats>(`/themes/${themeId}/stats`, year ? { year } : undefined);
  },
};

// ============================================
// INDICATOR API
// ============================================

export const indicatorApi = {
  async getAll(): Promise<Indicator[]> {
    const res = await get<PagedResponse<Indicator> | Indicator[]>('/indicators', { pageSize: 200 });
    return Array.isArray(res) ? res : (res as PagedResponse<Indicator>).data;
  },

  async getById(id: string): Promise<Indicator | null> {
    try {
      return await get<Indicator>(`/indicators/${id}`);
    } catch {
      return null;
    }
  },

  async getByTheme(themeId: string): Promise<Indicator[]> {
    const res = await get<PagedResponse<Indicator> | Indicator[]>('/indicators', { themeId, pageSize: 100 });
    return Array.isArray(res) ? res : (res as PagedResponse<Indicator>).data;
  },

  async search(query: string): Promise<Indicator[]> {
    const res = await get<PagedResponse<Indicator> | Indicator[]>('/indicators', { search: query, pageSize: 100 });
    return Array.isArray(res) ? res : (res as PagedResponse<Indicator>).data;
  },
};

// ============================================
// DATA API
// ============================================

export const dataApi = {
  async getIndicatorValues(filters: DataFilters): Promise<IndicatorValue[]> {
    const params: Record<string, string | number | boolean | null | undefined> = {
      pageSize: 500,
    };
    if (filters.countryIds?.length === 1) params.countryId = filters.countryIds[0];
    if (filters.countryIds && filters.countryIds.length > 1) params.countryIds = filters.countryIds.join(',');
    if (filters.indicatorIds?.length === 1) params.indicatorId = filters.indicatorIds[0];
    if (filters.yearRange) {
      params.yearStart = filters.yearRange[0];
      params.yearEnd = filters.yearRange[1];
    }
    if (filters.gender) params.gender = filters.gender;
    const res = await get<PagedResponse<IndicatorValue>>('/data/values', params);
    return res.data;
  },

  async getTimeSeries(
    countryId: string,
    indicatorId: string,
    yearRange?: [number, number]
  ): Promise<IndicatorTimeSeries> {
    const params: Record<string, string | number | undefined> = { countryId, indicatorId };
    if (yearRange) { params.yearStart = yearRange[0]; params.yearEnd = yearRange[1]; }
    return get<IndicatorTimeSeries>('/data/timeseries', params);
  },

  async getComparisonData(
    countryIds: string[],
    indicatorId: string,
    year?: number
  ): Promise<ChartDataPoint[]> {
    const params: Record<string, string | number | undefined> = {
      countryIds: countryIds.join(','),
      indicatorId,
    };
    if (year) params.year = year;
    const res = await get<ChartDataPoint[] | { data: ChartDataPoint[] }>('/data/comparison', params);
    return Array.isArray(res) ? res : (res as { data: ChartDataPoint[] }).data;
  },

  async getMapData(indicatorId: string, year?: number): Promise<MapDataPoint[]> {
    const params: Record<string, string | number | undefined> = { indicatorId };
    if (year) params.year = year;
    const res = await get<{ data: MapDataPoint[] } | MapDataPoint[]>('/data/map', params);
    return Array.isArray(res) ? res : (res as { data: MapDataPoint[] }).data;
  },

  async getChartTimeSeries(
    countryIds: string[],
    indicatorId: string,
    yearRange?: [number, number]
  ): Promise<TimeSeriesDataPoint[]> {
    const params: Record<string, string | number | undefined> = {
      countryIds: countryIds.join(','),
      indicatorId,
    };
    if (yearRange) { params.yearStart = yearRange[0]; params.yearEnd = yearRange[1]; }
    const res = await get<TimeSeriesDataPoint[] | { data: TimeSeriesDataPoint[] }>('/data/timeseries', params);
    return Array.isArray(res) ? res : (res as { data: TimeSeriesDataPoint[] }).data;
  },

  async getBarChartData(
    indicatorId: string,
    year?: number,
    limit?: number,
    sortOrder?: 'asc' | 'desc'
  ): Promise<ChartDataPoint[]> {
    const params: Record<string, string | number | undefined> = { indicatorId };
    if (year) params.year = year;
    if (limit) params.limit = limit;
    if (sortOrder) params.sortOrder = sortOrder;
    const res = await get<ChartDataPoint[] | { data: ChartDataPoint[] }>('/data/bar-chart', params);
    return Array.isArray(res) ? res : (res as { data: ChartDataPoint[] }).data;
  },

  async getRegionalData(indicatorId: string, year?: number): Promise<ChartDataPoint[]> {
    const params: Record<string, string | number | undefined> = { indicatorId };
    if (year) params.year = year;
    const res = await get<ChartDataPoint[] | { data: ChartDataPoint[] }>('/data/regional-averages', params);
    return Array.isArray(res) ? res : (res as { data: ChartDataPoint[] }).data;
  },
};

// ============================================
// YOUTH INDEX API
// ============================================

export const youthIndexApi = {
  async getRankings(year: number = 2024): Promise<YouthIndex[]> {
    const res = await get<{ data: ApiYouthIndex[] } | ApiYouthIndex[]>('/youth-index/rankings', { year });
    const raw = Array.isArray(res) ? res : (res as { data: ApiYouthIndex[] }).data;
    return raw.map(r => ({ ...normalizeYouthIndex(r), year }));
  },

  async getByCountry(countryId: string, year?: number): Promise<YouthIndex | null> {
    try {
      const res = await get<ApiYouthIndex | { data: ApiYouthIndex }>(`/youth-index/${countryId}`, year ? { year } : undefined);
      const raw = ('overallScore' in res) ? res as ApiYouthIndex : (res as { data: ApiYouthIndex }).data;
      return { ...normalizeYouthIndex(raw), year: year ?? 2024 };
    } catch {
      return null;
    }
  },

  async getHistory(countryId: string): Promise<YouthIndex[]> {
    // Backend doesn't have a dedicated history endpoint — fetch across available years
    const years = [2006, 2016, 2025];
    const results = await Promise.allSettled(
      years.map(yr => youthIndexApi.getByCountry(countryId, yr))
    );
    return results
      .filter((r): r is PromiseFulfilledResult<YouthIndex | null> => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value as YouthIndex);
  },

  async getTopPerformers(limit: number = 10, year: number = 2024): Promise<YouthIndex[]> {
    const res = await get<{ data: ApiYouthIndex[] } | ApiYouthIndex[]>(`/youth-index/top/${limit}`, { year });
    const raw = Array.isArray(res) ? res : (res as { data: ApiYouthIndex[] }).data;
    return raw.map(r => ({ ...normalizeYouthIndex(r), year }));
  },

  async getMostImproved(limit: number = 10, year: number = 2024): Promise<YouthIndex[]> {
    const res = await get<{ data: ApiYouthIndex[] } | ApiYouthIndex[]>(`/youth-index/most-improved/${limit}`, { year });
    const raw = Array.isArray(res) ? res : (res as { data: ApiYouthIndex[] }).data;
    return raw.map(r => ({ ...normalizeYouthIndex(r), year }));
  },
};

// ============================================
// COMPARISON API
// ============================================

export const comparisonApi = {
  async compareCountries(
    countryIds: string[],
    indicatorIds: string[],
    year?: number
  ): Promise<CountryComparison> {
    return post<CountryComparison>('/compare/countries', { countryIds, indicatorIds, year });
  },
};

// ============================================
// PLATFORM API
// ============================================

export const platformApi = {
  async getStats(): Promise<PlatformStats> {
    return get<PlatformStats>('/platform/stats');
  },
};

// ============================================
// UNIFIED API EXPORT
// ============================================

export const api = {
  countries: countryApi,
  themes: themeApi,
  indicators: indicatorApi,
  data: dataApi,
  youthIndex: youthIndexApi,
  comparison: comparisonApi,
  platform: platformApi,
};

export default api;
