// ============================================
// AFRICAN YOUTH DATABASE - API SERVICE
// Centralized data fetching & state management
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

import {
  AFRICAN_COUNTRIES,
  THEMES,
  INDICATORS,
  REGIONS,
  getCountryById,
  getCountryByIsoCode,
  getCountriesByRegion,
  getThemeById,
  getIndicatorById,
  getIndicatorsByTheme,
} from '@/types';

import {
  getIndicatorValues,
  generateYouthIndexData,
  getIndicatorValuesByCountry,
  getIndicatorValuesByIndicator,
  getTimeSeriesData,
  getComparisonData,
  getMapData,
  getCountryStats,
  getThemeStats,
  getPlatformStats,
  compareCountries,
  formatTimeSeriesForChart,
  formatBarChartData,
  formatRegionalData,
} from '@/types';

// ============================================
// SIMULATED API DELAY
// ============================================

const simulateDelay = (ms: number = 300): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

// ============================================
// COUNTRY API
// ============================================

export const countryApi = {
  /**
   * Get all African countries
   */
  async getAll(): Promise<Country[]> {
    await simulateDelay(100);
    return AFRICAN_COUNTRIES;
  },

  /**
   * Get country by ID
   */
  async getById(id: string): Promise<Country | null> {
    await simulateDelay(50);
    return getCountryById(id) ?? null;
  },

  /**
   * Get country by ISO code (2 or 3 letter)
   */
  async getByIsoCode(isoCode: string): Promise<Country | null> {
    await simulateDelay(50);
    return getCountryByIsoCode(isoCode) ?? null;
  },

  /**
   * Get countries by region
   */
  async getByRegion(region: RegionType): Promise<Country[]> {
    await simulateDelay(100);
    return getCountriesByRegion(region);
  },

  /**
   * Search countries by name
   */
  async search(query: string): Promise<Country[]> {
    await simulateDelay(100);
    const lowerQuery = query.toLowerCase();
    return AFRICAN_COUNTRIES.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) ||
      c.isoCode.toLowerCase().includes(lowerQuery)
    );
  },

  /**
   * Get country statistics
   */
  async getStats(countryId: string, year?: number): Promise<CountryStats> {
    await simulateDelay(200);
    return getCountryStats(countryId, year);
  },

  /**
   * Get all regions
   */
  async getRegions(): Promise<typeof REGIONS> {
    await simulateDelay(50);
    return REGIONS;
  },
};

// ============================================
// THEME API
// ============================================

export const themeApi = {
  /**
   * Get all themes
   */
  async getAll(): Promise<Theme[]> {
    await simulateDelay(100);
    return THEMES;
  },

  /**
   * Get theme by ID
   */
  async getById(id: string): Promise<Theme | null> {
    await simulateDelay(50);
    return getThemeById(id) ?? null;
  },

  /**
   * Get theme statistics
   */
  async getStats(themeId: string, year?: number): Promise<ThemeStats> {
    await simulateDelay(200);
    return getThemeStats(themeId, year);
  },
};

// ============================================
// INDICATOR API
// ============================================

export const indicatorApi = {
  /**
   * Get all indicators
   */
  async getAll(): Promise<Indicator[]> {
    await simulateDelay(100);
    return INDICATORS;
  },

  /**
   * Get indicator by ID
   */
  async getById(id: string): Promise<Indicator | null> {
    await simulateDelay(50);
    return getIndicatorById(id) ?? null;
  },

  /**
   * Get indicators by theme
   */
  async getByTheme(themeId: string): Promise<Indicator[]> {
    await simulateDelay(100);
    return getIndicatorsByTheme(themeId);
  },

  /**
   * Search indicators
   */
  async search(query: string): Promise<Indicator[]> {
    await simulateDelay(100);
    const lowerQuery = query.toLowerCase();
    return INDICATORS.filter(i => 
      i.name.toLowerCase().includes(lowerQuery) ||
      i.shortName.toLowerCase().includes(lowerQuery) ||
      i.code.toLowerCase().includes(lowerQuery) ||
      i.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  },
};

// ============================================
// DATA API
// ============================================

export const dataApi = {
  /**
   * Get indicator values with filters
   */
  async getIndicatorValues(filters: DataFilters): Promise<IndicatorValue[]> {
    await simulateDelay(300);
    let values = getIndicatorValues();

    if (filters.countryIds?.length) {
      values = values.filter(v => filters.countryIds!.includes(v.countryId));
    }
    if (filters.indicatorIds?.length) {
      values = values.filter(v => filters.indicatorIds!.includes(v.indicatorId));
    }
    if (filters.yearRange) {
      values = values.filter(v => 
        v.year >= filters.yearRange![0] && v.year <= filters.yearRange![1]
      );
    }
    if (filters.gender) {
      values = values.filter(v => v.gender === filters.gender);
    }

    return values;
  },

  /**
   * Get time series for a country and indicator
   */
  async getTimeSeries(
    countryId: string, 
    indicatorId: string,
    yearRange?: [number, number]
  ): Promise<IndicatorTimeSeries> {
    await simulateDelay(200);
    return getTimeSeriesData(countryId, indicatorId, yearRange);
  },

  /**
   * Get comparison chart data for multiple countries
   */
  async getComparisonData(
    countryIds: string[],
    indicatorId: string,
    year?: number
  ): Promise<ChartDataPoint[]> {
    await simulateDelay(200);
    return getComparisonData(countryIds, indicatorId, year);
  },

  /**
   * Get map visualization data
   */
  async getMapData(indicatorId: string, year?: number): Promise<MapDataPoint[]> {
    await simulateDelay(300);
    return getMapData(indicatorId, year);
  },

  /**
   * Get formatted time series for charts
   */
  async getChartTimeSeries(
    countryIds: string[],
    indicatorId: string,
    yearRange?: [number, number]
  ): Promise<TimeSeriesDataPoint[]> {
    await simulateDelay(200);
    return formatTimeSeriesForChart(countryIds, indicatorId, yearRange);
  },

  /**
   * Get bar chart data (top/bottom countries)
   */
  async getBarChartData(
    indicatorId: string,
    year?: number,
    limit?: number,
    sortOrder?: 'asc' | 'desc'
  ): Promise<ChartDataPoint[]> {
    await simulateDelay(200);
    return formatBarChartData(indicatorId, year, limit, sortOrder);
  },

  /**
   * Get regional average data
   */
  async getRegionalData(indicatorId: string, year?: number): Promise<ChartDataPoint[]> {
    await simulateDelay(200);
    return formatRegionalData(indicatorId, year);
  },
};

// ============================================
// YOUTH INDEX API
// ============================================

export const youthIndexApi = {
  /**
   * Get youth index rankings for a year
   */
  async getRankings(year: number = 2024): Promise<YouthIndex[]> {
    await simulateDelay(300);
    return generateYouthIndexData(year);
  },

  /**
   * Get youth index for a specific country
   */
  async getByCountry(countryId: string, year?: number): Promise<YouthIndex | null> {
    await simulateDelay(200);
    const rankings = generateYouthIndexData(year);
    return rankings.find(r => r.countryId === countryId) ?? null;
  },

  /**
   * Get youth index history for a country
   */
  async getHistory(countryId: string): Promise<YouthIndex[]> {
    await simulateDelay(400);
    const history: YouthIndex[] = [];
    
    for (let year = 2015; year <= 2024; year++) {
      const rankings = generateYouthIndexData(year);
      const countryRanking = rankings.find(r => r.countryId === countryId);
      if (countryRanking) {
        history.push(countryRanking);
      }
    }
    
    return history;
  },

  /**
   * Get top performers
   */
  async getTopPerformers(limit: number = 10, year?: number): Promise<YouthIndex[]> {
    await simulateDelay(200);
    const rankings = generateYouthIndexData(year);
    return rankings.slice(0, limit);
  },

  /**
   * Get most improved countries
   */
  async getMostImproved(limit: number = 10, year?: number): Promise<YouthIndex[]> {
    await simulateDelay(200);
    const rankings = generateYouthIndexData(year);
    return [...rankings]
      .sort((a, b) => b.rankChange - a.rankChange)
      .slice(0, limit);
  },
};

// ============================================
// COMPARISON API
// ============================================

export const comparisonApi = {
  /**
   * Compare multiple countries across indicators
   */
  async compareCountries(
    countryIds: string[],
    indicatorIds: string[],
    year?: number
  ): Promise<CountryComparison> {
    await simulateDelay(300);
    return compareCountries(countryIds, indicatorIds, year);
  },
};

// ============================================
// PLATFORM API
// ============================================

export const platformApi = {
  /**
   * Get platform-wide statistics
   */
  async getStats(): Promise<PlatformStats> {
    await simulateDelay(100);
    return getPlatformStats();
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
