// ============================================
// AFRICAN YOUTH OBSERVATORY - MOCK DATA SERVICE
// Realistic youth data for all 54 African countries
// ============================================

import type { 
  IndicatorValue, 
  YouthIndex, 
  YouthIndexComponent,
  IndicatorTimeSeries,
  CountryStats,
  ThemeStats,
  PlatformStats,
  GenderType,
  AgeGroup,
  CountryComparison,
  ChartDataPoint,
  TimeSeriesDataPoint,
  MapDataPoint,
} from './database.types';

import { 
  AFRICAN_COUNTRIES, 
  INDICATORS, 
  THEMES,
  YOUTH_INDEX_DIMENSIONS,
  getCountryById,
  getIndicatorById,
  formatValue,
} from './constants';

// ============================================
// SEEDED RANDOM FOR CONSISTENT DATA
// ============================================

const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

// ============================================
// COUNTRY-SPECIFIC DEVELOPMENT FACTORS
// Higher = more developed (affects all indicators)
// ============================================

const COUNTRY_DEVELOPMENT_FACTORS: Record<string, number> = {
  // High performers
  'mu': 0.92, 'sc': 0.88, 'tn': 0.82, 'bw': 0.80, 'za': 0.78,
  'cv': 0.77, 'rw': 0.76, 'ma': 0.75, 'gh': 0.73, 'ke': 0.72,
  'eg': 0.71, 'na': 0.70, 'ga': 0.69, 'dz': 0.68, 'sn': 0.67,
  
  // Medium performers
  'tz': 0.62, 'ci': 0.61, 'zm': 0.60, 'ug': 0.59, 'et': 0.58,
  'ng': 0.57, 'cm': 0.56, 'bj': 0.55, 'gm': 0.54, 'ls': 0.53,
  'mw': 0.52, 'mg': 0.51, 'tg': 0.50, 'sz': 0.49, 'cg': 0.48,
  'zw': 0.47, 'ao': 0.46, 'mz': 0.45, 'gn': 0.44, 'lr': 0.43,
  
  // Lower performers  
  'bf': 0.42, 'bi': 0.41, 'sl': 0.40, 'ml': 0.39, 'ne': 0.38,
  'td': 0.37, 'mr': 0.36, 'dj': 0.35, 'gw': 0.34, 'cf': 0.33,
  'km': 0.32, 'er': 0.31, 'gq': 0.45, 'st': 0.44, 'ly': 0.50,
  'sd': 0.40, 'so': 0.28, 'ss': 0.25, 'cd': 0.35,
};

// Default factor for any missing country
const getDevFactor = (countryId: string): number => 
  COUNTRY_DEVELOPMENT_FACTORS[countryId] ?? 0.45;

// ============================================
// INDICATOR VALUE GENERATORS
// ============================================

interface IndicatorConfig {
  baseValue: number;
  variance: number;
  trend: number; // Annual improvement rate
  isInverse?: boolean; // Lower is better
}

const INDICATOR_CONFIGS: Record<string, IndicatorConfig> = {
  // Education
  'edu001': { baseValue: 75, variance: 25, trend: 0.8 },  // Literacy
  'edu002': { baseValue: 55, variance: 35, trend: 1.2 },  // Secondary enrollment
  'edu003': { baseValue: 15, variance: 25, trend: 1.5 },  // Tertiary enrollment
  'edu004': { baseValue: 18, variance: 15, trend: 0.8 },  // STEM graduates
  'edu005': { baseValue: 45, variance: 40, trend: 1.0 },  // Completion rate
  'edu006': { baseValue: 12, variance: 18, trend: 0.6 },  // TVET enrollment
  
  // Employment
  'emp001': { baseValue: 25, variance: 25, trend: -0.3, isInverse: true },  // Unemployment
  'emp002': { baseValue: 50, variance: 30, trend: 0.4 },  // Labor participation
  'emp003': { baseValue: 30, variance: 25, trend: -0.5, isInverse: true },  // NEET
  'emp004': { baseValue: 60, variance: 30, trend: 0.3 },  // Self-employment
  'emp005': { baseValue: 75, variance: 20, trend: -0.4, isInverse: true },  // Informal employment
  'emp006': { baseValue: 12, variance: 15, trend: 0.6 },  // Entrepreneurship
  
  // Health
  'hlt001': { baseValue: 3.5, variance: 4, trend: -0.1, isInverse: true },  // Mortality
  'hlt002': { baseValue: 3, variance: 8, trend: -0.2, isInverse: true },    // HIV
  'hlt003': { baseValue: 100, variance: 100, trend: -2, isInverse: true },  // Adolescent fertility
  'hlt004': { baseValue: 50, variance: 40, trend: 1.2 },   // Healthcare access
  'hlt005': { baseValue: 25, variance: 35, trend: 0.8 },   // Mental health access
  
  // Civic Engagement
  'civ001': { baseValue: 45, variance: 35, trend: 0.5 },   // Voter turnout
  'civ002': { baseValue: 8, variance: 12, trend: 0.3 },    // Youth in parliament
  'civ003': { baseValue: 20, variance: 25, trend: 0.6 },   // CSO participation
  
  // Innovation
  'inn001': { baseValue: 30, variance: 50, trend: 3.5 },   // Internet penetration
  'inn002': { baseValue: 55, variance: 40, trend: 2.8 },   // Mobile ownership
  'inn003': { baseValue: 35, variance: 45, trend: 2.0 },   // Digital skills
  'inn004': { baseValue: 150, variance: 500, trend: 15 },  // Tech startups
  
  // Agriculture
  'agr001': { baseValue: 50, variance: 35, trend: -0.8 },  // Youth in agriculture
  'agr002': { baseValue: 25, variance: 30, trend: 0.4 },   // Land access
  'agr003': { baseValue: 8, variance: 12, trend: 0.5 },    // Agribusiness ownership
  
  // Gender
  'gen001': { baseValue: 0.92, variance: 0.3, trend: 0.01 },   // GPI Education
  'gen002': { baseValue: 5, variance: 15, trend: -0.2 },       // Female unemployment gap
  'gen003': { baseValue: 40, variance: 35, trend: 0.6 },       // Female labor participation
  
  // Finance
  'fin001': { baseValue: 35, variance: 45, trend: 2.5 },   // Bank account
  'fin002': { baseValue: 40, variance: 45, trend: 4.0 },   // Mobile money
  'fin003': { baseValue: 12, variance: 20, trend: 1.0 },   // Credit access
};

// ============================================
// GENERATE INDICATOR VALUE
// ============================================

const generateIndicatorValue = (
  countryId: string,
  indicatorId: string,
  year: number,
  gender: GenderType = 'total',
  ageGroup: AgeGroup = '15-35'
): number => {
  const config = INDICATOR_CONFIGS[indicatorId];
  if (!config) return 0;

  const devFactor = getDevFactor(countryId);
  const seed = hashString(`${countryId}-${indicatorId}-${year}-${gender}-${ageGroup}`);
  const random = seededRandom(seed);
  
  // Base calculation
  const yearsSince2010 = year - 2010;
  const trendEffect = config.trend * yearsSince2010;
  
  // Development factor effect (inverted for negative indicators)
  const devEffect = config.isInverse 
    ? config.baseValue * (1.3 - devFactor)
    : config.baseValue * (0.4 + devFactor * 0.8);
  
  // Random variance
  const variance = (random - 0.5) * config.variance;
  
  // Calculate final value
  let value = devEffect + trendEffect + variance;
  
  // Gender adjustments
  if (gender === 'female') {
    if (['emp001', 'emp003'].includes(indicatorId)) value *= 1.15; // Higher unemployment for females
    if (['emp002', 'gen003'].includes(indicatorId)) value *= 0.75; // Lower labor participation
    if (['edu001', 'edu002'].includes(indicatorId)) value *= 0.95; // Slightly lower education
  } else if (gender === 'male') {
    if (['emp001', 'emp003'].includes(indicatorId)) value *= 0.85;
    if (['emp002'].includes(indicatorId)) value *= 1.1;
  }
  
  // Clamp to indicator limits
  const indicator = getIndicatorById(indicatorId);
  if (indicator) {
    const min = indicator.minValue ?? 0;
    const max = indicator.maxValue ?? 100;
    value = Math.max(min, Math.min(max, value));
  }
  
  return Number(value.toFixed(2));
};

// ============================================
// GENERATE ALL INDICATOR VALUES
// ============================================

export const generateAllIndicatorValues = (): IndicatorValue[] => {
  const values: IndicatorValue[] = [];
  
  AFRICAN_COUNTRIES.forEach(country => {
    INDICATORS.forEach(indicator => {
      // Generate data for years 2010-2024
      for (let year = 2010; year <= 2024; year++) {
        // Generate total value
        values.push({
          id: `${country.id}-${indicator.id}-${year}-total`,
          indicatorId: indicator.id,
          countryId: country.id,
          year,
          value: generateIndicatorValue(country.id, indicator.id, year, 'total'),
          gender: 'total',
          ageGroup: '15-35',
          datasetId: 'main-dataset',
          confidenceScore: 0.85 + seededRandom(hashString(`${country.id}-${indicator.id}-${year}`)) * 0.15,
          isEstimate: year >= 2023,
          isProjected: year >= 2025,
          createdAt: new Date(),
        });
        
        // Generate gender-disaggregated data for key indicators
        if (['edu001', 'edu002', 'emp001', 'emp002', 'emp003', 'hlt002'].includes(indicator.id)) {
          values.push({
            id: `${country.id}-${indicator.id}-${year}-male`,
            indicatorId: indicator.id,
            countryId: country.id,
            year,
            value: generateIndicatorValue(country.id, indicator.id, year, 'male'),
            gender: 'male',
            ageGroup: '15-35',
            datasetId: 'main-dataset',
            confidenceScore: 0.80 + seededRandom(hashString(`${country.id}-${indicator.id}-${year}-m`)) * 0.15,
            isEstimate: year >= 2023,
            isProjected: year >= 2025,
            createdAt: new Date(),
          });
          
          values.push({
            id: `${country.id}-${indicator.id}-${year}-female`,
            indicatorId: indicator.id,
            countryId: country.id,
            year,
            value: generateIndicatorValue(country.id, indicator.id, year, 'female'),
            gender: 'female',
            ageGroup: '15-35',
            datasetId: 'main-dataset',
            confidenceScore: 0.80 + seededRandom(hashString(`${country.id}-${indicator.id}-${year}-f`)) * 0.15,
            isEstimate: year >= 2023,
            isProjected: year >= 2025,
            createdAt: new Date(),
          });
        }
      }
    });
  });
  
  return values;
};

// Cached indicator values
let _cachedIndicatorValues: IndicatorValue[] | null = null;

export const getIndicatorValues = (): IndicatorValue[] => {
  if (!_cachedIndicatorValues) {
    _cachedIndicatorValues = generateAllIndicatorValues();
  }
  return _cachedIndicatorValues;
};

// ============================================
// YOUTH INDEX GENERATION
// ============================================

const calculateYouthIndexScore = (countryId: string, year: number): number => {
  let totalScore = 0;
  
  YOUTH_INDEX_DIMENSIONS.forEach(dimension => {
    let dimensionScore = 0;
    let indicatorCount = 0;
    
    dimension.indicators.forEach(indicatorId => {
      const value = generateIndicatorValue(countryId, indicatorId, year);
      const indicator = getIndicatorById(indicatorId);
      
      if (indicator) {
        // Normalize to 0-100 scale
        const min = indicator.minValue ?? 0;
        const max = indicator.maxValue ?? 100;
        let normalized = ((value - min) / (max - min)) * 100;
        
        // Invert if lower is better
        if (!indicator.isHigherBetter) {
          normalized = 100 - normalized;
        }
        
        dimensionScore += normalized;
        indicatorCount++;
      }
    });
    
    if (indicatorCount > 0) {
      const avgDimensionScore = dimensionScore / indicatorCount;
      totalScore += avgDimensionScore * dimension.weight;
    }
  });
  
  return Number(totalScore.toFixed(2));
};

export const generateYouthIndexData = (year: number = 2024): YouthIndex[] => {
  const indexData: { countryId: string; score: number }[] = [];
  
  // Calculate scores for all countries
  AFRICAN_COUNTRIES.forEach(country => {
    indexData.push({
      countryId: country.id,
      score: calculateYouthIndexScore(country.id, year),
    });
  });
  
  // Sort by score descending
  indexData.sort((a, b) => b.score - a.score);
  
  // Get previous year rankings for comparison
  const prevYearRanks: Record<string, number> = {};
  if (year > 2010) {
    const prevData = AFRICAN_COUNTRIES.map(c => ({
      countryId: c.id,
      score: calculateYouthIndexScore(c.id, year - 1),
    })).sort((a, b) => b.score - a.score);
    
    prevData.forEach((item, index) => {
      prevYearRanks[item.countryId] = index + 1;
    });
  }
  
  // Create YouthIndex records
  return indexData.map((item, index) => {
    const rank = index + 1;
    const previousRank = prevYearRanks[item.countryId] ?? rank;
    const rankChange = previousRank - rank; // Positive = improved
    
    const tier = item.score >= 70 ? 'high' 
      : item.score >= 60 ? 'medium-high'
      : item.score >= 50 ? 'medium'
      : item.score >= 40 ? 'medium-low'
      : 'low';
    
    // Generate dimension scores based on overall score with some variation
    const baseScore = item.score;
    const variation = () => (Math.random() - 0.5) * 15; // ±7.5 points variation
    const clamp = (val: number) => Math.max(20, Math.min(95, val));
    
    return {
      id: `yi-${item.countryId}-${year}`,
      countryId: item.countryId,
      year,
      indexScore: item.score,
      rank,
      previousRank,
      rankChange,
      percentile: Number((((54 - rank) / 54) * 100).toFixed(1)),
      tier,
      // Dimension scores
      educationScore: Number(clamp(baseScore + variation()).toFixed(1)),
      healthScore: Number(clamp(baseScore + variation()).toFixed(1)),
      employmentScore: Number(clamp(baseScore + variation() - 5).toFixed(1)), // Employment typically lower
      civicScore: Number(clamp(baseScore + variation()).toFixed(1)),
      innovationScore: Number(clamp(baseScore + variation() - 3).toFixed(1)),
      createdAt: new Date(),
    } as YouthIndex;
  });
};

// ============================================
// DATA QUERY FUNCTIONS
// ============================================

export const getIndicatorValuesByCountry = (
  countryId: string,
  indicatorId?: string,
  yearRange?: [number, number]
): IndicatorValue[] => {
  const values = getIndicatorValues();
  return values.filter(v => {
    if (v.countryId !== countryId) return false;
    if (indicatorId && v.indicatorId !== indicatorId) return false;
    if (yearRange && (v.year < yearRange[0] || v.year > yearRange[1])) return false;
    return true;
  });
};

export const getIndicatorValuesByIndicator = (
  indicatorId: string,
  year?: number,
  gender: GenderType = 'total'
): IndicatorValue[] => {
  const values = getIndicatorValues();
  return values.filter(v => {
    if (v.indicatorId !== indicatorId) return false;
    if (year && v.year !== year) return false;
    if (v.gender !== gender) return false;
    return true;
  });
};

export const getTimeSeriesData = (
  countryId: string,
  indicatorId: string,
  yearRange: [number, number] = [2010, 2024]
): IndicatorTimeSeries => {
  const country = getCountryById(countryId);
  const indicator = getIndicatorById(indicatorId);
  
  const data: { year: number; value: number }[] = [];
  
  for (let year = yearRange[0]; year <= yearRange[1]; year++) {
    data.push({
      year,
      value: generateIndicatorValue(countryId, indicatorId, year),
    });
  }
  
  return {
    indicatorId,
    indicatorName: indicator?.name ?? indicatorId,
    countryId,
    countryName: country?.name ?? countryId,
    unit: indicator?.unit ?? 'number',
    data,
  };
};

export const getComparisonData = (
  countryIds: string[],
  indicatorId: string,
  year: number = 2024
): ChartDataPoint[] => {
  return countryIds.map(countryId => {
    const country = getCountryById(countryId);
    return {
      name: country?.name ?? countryId,
      value: generateIndicatorValue(countryId, indicatorId, year),
      countryId,
    };
  });
};

export const getMapData = (
  indicatorId: string,
  year: number = 2024
): MapDataPoint[] => {
  const indicator = getIndicatorById(indicatorId);
  
  return AFRICAN_COUNTRIES.map(country => {
    const value = generateIndicatorValue(country.id, indicatorId, year);
    return {
      countryId: country.id,
      countryName: country.name,
      isoCode: country.isoCode,
      value,
      formattedValue: formatValue(value, indicator?.unit ?? 'number'),
    };
  });
};

export const getCountryStats = (countryId: string, year: number = 2024): CountryStats => {
  const country = getCountryById(countryId);
  const youthIndex = generateYouthIndexData(year).find(yi => yi.countryId === countryId);
  
  // Get top indicators
  const topIndicators = INDICATORS.slice(0, 8).map(indicator => {
    const currentValue = generateIndicatorValue(countryId, indicator.id, year);
    const prevValue = generateIndicatorValue(countryId, indicator.id, year - 1);
    const change = currentValue - prevValue;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(change) > 0.5) {
      if (indicator.isHigherBetter) {
        trend = change > 0 ? 'up' : 'down';
      } else {
        trend = change < 0 ? 'up' : 'down'; // For inverse indicators
      }
    }
    
    return {
      indicatorId: indicator.id,
      indicatorName: indicator.shortName,
      value: currentValue,
      unit: indicator.unit,
      trend,
    };
  });
  
  // Generate key insights
  const devFactor = getDevFactor(countryId);
  const insights: string[] = [];
  
  if (devFactor > 0.7) {
    insights.push(`${country?.name} is among the top performers in youth development in Africa.`);
  }
  
  const literacy = generateIndicatorValue(countryId, 'edu001', year);
  if (literacy > 90) {
    insights.push(`Youth literacy rate exceeds 90%, indicating strong educational foundations.`);
  }
  
  const unemployment = generateIndicatorValue(countryId, 'emp001', year);
  if (unemployment > 30) {
    insights.push(`Youth unemployment remains a significant challenge at ${unemployment.toFixed(1)}%.`);
  }
  
  const internet = generateIndicatorValue(countryId, 'inn001', year);
  if (internet > 60) {
    insights.push(`Strong digital connectivity with ${internet.toFixed(1)}% youth internet penetration.`);
  }
  
  return {
    countryId,
    countryName: country?.name ?? countryId,
    youthIndexRank: youthIndex?.rank,
    youthIndexScore: youthIndex?.indexScore,
    topIndicators,
    keyInsights: insights,
  };
};

export const getThemeStats = (themeId: string, year: number = 2024): ThemeStats => {
  const theme = THEMES.find(t => t.id === themeId);
  const themeIndicators = INDICATORS.filter(i => i.themeId === themeId);
  
  // Calculate average score across all countries for this theme
  let totalScore = 0;
  const countryScores: { countryId: string; countryName: string; score: number }[] = [];
  
  AFRICAN_COUNTRIES.forEach(country => {
    let countryThemeScore = 0;
    themeIndicators.forEach(indicator => {
      const value = generateIndicatorValue(country.id, indicator.id, year);
      const min = indicator.minValue ?? 0;
      const max = indicator.maxValue ?? 100;
      let normalized = ((value - min) / (max - min)) * 100;
      if (!indicator.isHigherBetter) normalized = 100 - normalized;
      countryThemeScore += normalized;
    });
    
    const avgScore = themeIndicators.length > 0 
      ? countryThemeScore / themeIndicators.length 
      : 0;
    
    totalScore += avgScore;
    countryScores.push({
      countryId: country.id,
      countryName: country.name,
      score: Number(avgScore.toFixed(2)),
    });
  });
  
  countryScores.sort((a, b) => b.score - a.score);
  
  return {
    themeId,
    themeName: theme?.name ?? themeId,
    averageScore: Number((totalScore / AFRICAN_COUNTRIES.length).toFixed(2)),
    topCountries: countryScores.slice(0, 5),
    indicatorCount: themeIndicators.length,
    dataPointCount: themeIndicators.length * AFRICAN_COUNTRIES.length * 15, // 15 years
  };
};

export const getPlatformStats = (): PlatformStats => {
  return {
    totalCountries: AFRICAN_COUNTRIES.length,
    totalIndicators: INDICATORS.length,
    totalDataPoints: AFRICAN_COUNTRIES.length * INDICATORS.length * 15, // 15 years of data
    totalDatasets: 12,
    totalUsers: 1247,
    latestDataYear: 2024,
    coveragePercentage: 94.5,
  };
};

// ============================================
// COUNTRY COMPARISON
// ============================================

export const compareCountries = (
  countryIds: string[],
  indicatorIds: string[],
  year: number = 2024
): CountryComparison => {
  const countries = countryIds.map(id => getCountryById(id)!).filter(Boolean);
  const indicators = indicatorIds.map(id => getIndicatorById(id)!).filter(Boolean);
  
  const data = indicators.map(indicator => {
    const values = countryIds.map(countryId => {
      const country = getCountryById(countryId);
      const currentValue = generateIndicatorValue(countryId, indicator.id, year);
      const prevValue = generateIndicatorValue(countryId, indicator.id, year - 1);
      const change = currentValue - prevValue;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (Math.abs(change) > 0.5) {
        trend = change > 0 ? 'up' : 'down';
      }
      
      return {
        countryId,
        countryName: country?.name ?? countryId,
        value: currentValue,
        year,
        trend,
      };
    });
    
    return {
      indicatorId: indicator.id,
      indicatorName: indicator.name,
      unit: indicator.unit,
      values,
    };
  });
  
  return { countries, indicators, data };
};

// ============================================
// CHART DATA FORMATTERS
// ============================================

export const formatTimeSeriesForChart = (
  countryIds: string[],
  indicatorId: string,
  yearRange: [number, number] = [2015, 2024]
): TimeSeriesDataPoint[] => {
  const years: TimeSeriesDataPoint[] = [];
  
  for (let year = yearRange[0]; year <= yearRange[1]; year++) {
    const point: TimeSeriesDataPoint = { year };
    
    countryIds.forEach(countryId => {
      const country = getCountryById(countryId);
      const value = generateIndicatorValue(countryId, indicatorId, year);
      point[country?.name ?? countryId] = Number(value.toFixed(2));
    });
    
    years.push(point);
  }
  
  return years;
};

export const formatBarChartData = (
  indicatorId: string,
  year: number = 2024,
  limit: number = 10,
  sortOrder: 'asc' | 'desc' = 'desc'
): ChartDataPoint[] => {
  const indicator = getIndicatorById(indicatorId);
  
  const data = AFRICAN_COUNTRIES.map(country => ({
    name: country.name,
    value: Number(generateIndicatorValue(country.id, indicatorId, year).toFixed(2)),
    countryId: country.id,
    flagEmoji: country.flagEmoji,
  }));
  
  data.sort((a, b) => sortOrder === 'desc' ? b.value - a.value : a.value - b.value);
  
  return data.slice(0, limit);
};

export const formatRegionalData = (
  indicatorId: string,
  year: number = 2024
): ChartDataPoint[] => {
  const regionData: Record<string, { total: number; count: number }> = {
    'North Africa': { total: 0, count: 0 },
    'West Africa': { total: 0, count: 0 },
    'Central Africa': { total: 0, count: 0 },
    'East Africa': { total: 0, count: 0 },
    'Southern Africa': { total: 0, count: 0 },
  };
  
  AFRICAN_COUNTRIES.forEach(country => {
    const value = generateIndicatorValue(country.id, indicatorId, year);
    regionData[country.region].total += value;
    regionData[country.region].count += 1;
  });
  
  return Object.entries(regionData).map(([name, data]) => ({
    name,
    value: Number((data.total / data.count).toFixed(2)),
  }));
};
