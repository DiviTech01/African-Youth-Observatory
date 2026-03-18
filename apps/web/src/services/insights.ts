// ============================================
// AFRICAN YOUTH DATABASE - AI INSIGHTS SERVICE
// Generate intelligent insights from youth data
// ============================================

import { 
  AFRICAN_COUNTRIES, 
  THEMES, 
  INDICATORS,
  getCountryById,
  getIndicatorById,
  type Country,
  type RegionType 
} from '@/types';
import { generateYouthIndexData } from '@/types/mockData';

// ============================================
// TYPES
// ============================================

export type InsightType = 
  | 'trend' 
  | 'comparison' 
  | 'achievement' 
  | 'concern' 
  | 'opportunity' 
  | 'recommendation';

export type InsightPriority = 'high' | 'medium' | 'low';

export type InsightCategory = 
  | 'overall' 
  | 'education' 
  | 'health' 
  | 'employment' 
  | 'innovation' 
  | 'civic' 
  | 'regional';

export interface AIInsight {
  id: string;
  type: InsightType;
  category: InsightCategory;
  priority: InsightPriority;
  title: string;
  description: string;
  metric?: string;
  value?: number | string;
  change?: number;
  countries?: string[];
  indicators?: string[];
  recommendation?: string;
  source?: string;
  confidence: number; // 0-100
  generatedAt: Date;
}

export interface InsightSummary {
  totalInsights: number;
  highPriority: number;
  trends: number;
  achievements: number;
  concerns: number;
  opportunities: number;
}

// ============================================
// INSIGHT GENERATION ENGINE
// ============================================

/**
 * Generate AI insights based on current data
 */
export const generateInsights = (year: number = 2024): AIInsight[] => {
  const insights: AIInsight[] = [];
  const youthIndexData = generateYouthIndexData(year);
  const prevYearData = generateYouthIndexData(year - 1);
  
  // Sort by score
  const topPerformers = [...youthIndexData].slice(0, 5);
  const bottomPerformers = [...youthIndexData].slice(-5).reverse();
  const mostImproved = [...youthIndexData]
    .filter(yi => yi.rankChange > 0)
    .sort((a, b) => b.rankChange - a.rankChange)
    .slice(0, 5);
  const declining = [...youthIndexData]
    .filter(yi => yi.rankChange < 0)
    .sort((a, b) => a.rankChange - b.rankChange)
    .slice(0, 5);

  // Regional analysis
  const regions = ['Northern Africa', 'Western Africa', 'Eastern Africa', 'Central Africa', 'Southern Africa'];
  const regionalAverages = regions.map(region => {
    const regionCountries = youthIndexData.filter(yi => {
      const country = getCountryById(yi.countryId);
      return country?.region === region;
    });
    const avg = regionCountries.reduce((sum, yi) => sum + yi.indexScore, 0) / regionCountries.length;
    return { region, average: avg, count: regionCountries.length };
  }).sort((a, b) => b.average - a.average);

  // Continental average
  const continentalAverage = youthIndexData.reduce((sum, yi) => sum + yi.indexScore, 0) / youthIndexData.length;

  // -----------------------------
  // OVERALL INSIGHTS
  // -----------------------------
  
  // Top performer insight
  const topCountry = getCountryById(topPerformers[0].countryId);
  insights.push({
    id: 'overall-top-performer',
    type: 'achievement',
    category: 'overall',
    priority: 'high',
    title: `${topCountry?.name} Leads Africa in Youth Development`,
    description: `${topCountry?.name} ranks #1 on the African Youth Index with a score of ${topPerformers[0].indexScore.toFixed(1)}, demonstrating strong performance across all five dimensions of youth development.`,
    metric: 'Youth Index Score',
    value: topPerformers[0].indexScore.toFixed(1),
    countries: [topPerformers[0].countryId],
    confidence: 95,
    generatedAt: new Date(),
  });

  // Continental average trend
  insights.push({
    id: 'overall-continental-avg',
    type: 'trend',
    category: 'overall',
    priority: 'medium',
    title: 'Continental Youth Index Average Shows Steady Growth',
    description: `The average Youth Index score across all 54 African countries is ${continentalAverage.toFixed(1)} points in ${year}, indicating moderate progress in youth development outcomes.`,
    metric: 'Continental Average',
    value: continentalAverage.toFixed(1),
    confidence: 92,
    generatedAt: new Date(),
  });

  // Most improved countries
  if (mostImproved.length > 0) {
    const improvedNames = mostImproved.slice(0, 3).map(yi => getCountryById(yi.countryId)?.name).join(', ');
    insights.push({
      id: 'overall-most-improved',
      type: 'achievement',
      category: 'overall',
      priority: 'high',
      title: 'Significant Improvement in Youth Development',
      description: `${improvedNames} have shown the most improvement in youth development rankings, climbing an average of ${Math.round(mostImproved.slice(0, 3).reduce((sum, yi) => sum + yi.rankChange, 0) / 3)} positions from last year.`,
      countries: mostImproved.slice(0, 3).map(yi => yi.countryId),
      confidence: 88,
      generatedAt: new Date(),
    });
  }

  // -----------------------------
  // REGIONAL INSIGHTS
  // -----------------------------

  // Best performing region
  insights.push({
    id: 'regional-top',
    type: 'comparison',
    category: 'regional',
    priority: 'medium',
    title: `${regionalAverages[0].region} Leads Regional Rankings`,
    description: `${regionalAverages[0].region} has the highest regional average Youth Index score at ${regionalAverages[0].average.toFixed(1)} points, ${(regionalAverages[0].average - regionalAverages[4].average).toFixed(1)} points higher than ${regionalAverages[4].region}.`,
    metric: 'Regional Average',
    value: regionalAverages[0].average.toFixed(1),
    confidence: 90,
    generatedAt: new Date(),
  });

  // Regional gap concern
  const regionalGap = regionalAverages[0].average - regionalAverages[4].average;
  if (regionalGap > 10) {
    insights.push({
      id: 'regional-gap',
      type: 'concern',
      category: 'regional',
      priority: 'high',
      title: 'Significant Regional Disparities in Youth Outcomes',
      description: `There is a ${regionalGap.toFixed(1)} point gap between the highest and lowest performing regions, highlighting the need for targeted interventions in underperforming areas.`,
      value: regionalGap.toFixed(1),
      recommendation: 'Implement cross-regional knowledge sharing and targeted investment in lower-performing regions.',
      confidence: 85,
      generatedAt: new Date(),
    });
  }

  // -----------------------------
  // EDUCATION INSIGHTS
  // -----------------------------

  const highEducation = youthIndexData.filter(yi => yi.educationScore >= 70);
  const lowEducation = youthIndexData.filter(yi => yi.educationScore < 40);

  insights.push({
    id: 'education-achievement',
    type: 'achievement',
    category: 'education',
    priority: 'medium',
    title: `${highEducation.length} Countries Achieve High Education Scores`,
    description: `${highEducation.length} African countries have achieved education dimension scores above 70, indicating strong youth literacy rates and school enrollment.`,
    metric: 'Countries with high education scores',
    value: highEducation.length,
    confidence: 92,
    generatedAt: new Date(),
  });

  if (lowEducation.length > 0) {
    insights.push({
      id: 'education-concern',
      type: 'concern',
      category: 'education',
      priority: 'high',
      title: 'Education Access Remains a Challenge',
      description: `${lowEducation.length} countries have education scores below 40, indicating significant gaps in youth literacy and enrollment rates that require urgent attention.`,
      metric: 'Countries needing education support',
      value: lowEducation.length,
      recommendation: 'Increase investment in basic education infrastructure and teacher training programs.',
      confidence: 88,
      generatedAt: new Date(),
    });
  }

  // -----------------------------
  // EMPLOYMENT INSIGHTS
  // -----------------------------

  const avgEmployment = youthIndexData.reduce((sum, yi) => sum + yi.employmentScore, 0) / youthIndexData.length;
  
  insights.push({
    id: 'employment-trend',
    type: 'trend',
    category: 'employment',
    priority: 'high',
    title: 'Youth Employment Remains Africa\'s Biggest Challenge',
    description: `With an average employment dimension score of ${avgEmployment.toFixed(1)}, youth unemployment and underemployment continue to be the most pressing issues across the continent.`,
    metric: 'Average Employment Score',
    value: avgEmployment.toFixed(1),
    recommendation: 'Focus on vocational training, entrepreneurship programs, and policies supporting youth-led businesses.',
    confidence: 94,
    generatedAt: new Date(),
  });

  // Employment leaders
  const employmentLeaders = [...youthIndexData]
    .sort((a, b) => b.employmentScore - a.employmentScore)
    .slice(0, 3);
  const empLeaderNames = employmentLeaders.map(yi => getCountryById(yi.countryId)?.name).join(', ');
  
  insights.push({
    id: 'employment-leaders',
    type: 'achievement',
    category: 'employment',
    priority: 'medium',
    title: 'Youth Employment Success Stories',
    description: `${empLeaderNames} lead in youth employment outcomes, with successful job creation policies that other countries can learn from.`,
    countries: employmentLeaders.map(yi => yi.countryId),
    confidence: 86,
    generatedAt: new Date(),
  });

  // -----------------------------
  // INNOVATION INSIGHTS
  // -----------------------------

  const highInnovation = youthIndexData.filter(yi => yi.innovationScore >= 60);
  const avgInnovation = youthIndexData.reduce((sum, yi) => sum + yi.innovationScore, 0) / youthIndexData.length;

  insights.push({
    id: 'innovation-opportunity',
    type: 'opportunity',
    category: 'innovation',
    priority: 'high',
    title: 'Digital Innovation Among Youth is Growing',
    description: `${highInnovation.length} countries show strong innovation scores above 60, indicating growing digital literacy and tech entrepreneurship among African youth.`,
    metric: 'High innovation countries',
    value: highInnovation.length,
    confidence: 87,
    generatedAt: new Date(),
  });

  insights.push({
    id: 'innovation-gap',
    type: 'concern',
    category: 'innovation',
    priority: 'medium',
    title: 'Digital Divide Persists Across Africa',
    description: `The continental average innovation score of ${avgInnovation.toFixed(1)} masks significant disparities in digital access and tech skills between urban and rural youth.`,
    recommendation: 'Expand digital infrastructure and tech education to underserved areas.',
    confidence: 83,
    generatedAt: new Date(),
  });

  // -----------------------------
  // HEALTH INSIGHTS
  // -----------------------------

  const avgHealth = youthIndexData.reduce((sum, yi) => sum + yi.healthScore, 0) / youthIndexData.length;

  insights.push({
    id: 'health-trend',
    type: 'trend',
    category: 'health',
    priority: 'medium',
    title: 'Youth Health Outcomes Show Improvement',
    description: `The average health dimension score of ${avgHealth.toFixed(1)} reflects progress in healthcare access, though mental health services and reproductive health remain areas for improvement.`,
    metric: 'Average Health Score',
    value: avgHealth.toFixed(1),
    confidence: 89,
    generatedAt: new Date(),
  });

  // -----------------------------
  // CIVIC ENGAGEMENT INSIGHTS
  // -----------------------------

  const avgCivic = youthIndexData.reduce((sum, yi) => sum + yi.civicScore, 0) / youthIndexData.length;
  const highCivic = youthIndexData.filter(yi => yi.civicScore >= 65);

  insights.push({
    id: 'civic-opportunity',
    type: 'opportunity',
    category: 'civic',
    priority: 'medium',
    title: 'Youth Civic Engagement is Rising',
    description: `${highCivic.length} countries show strong civic engagement scores, with youth increasingly participating in governance, advocacy, and community development.`,
    metric: 'High civic engagement countries',
    value: highCivic.length,
    confidence: 84,
    generatedAt: new Date(),
  });

  // -----------------------------
  // RECOMMENDATIONS
  // -----------------------------

  insights.push({
    id: 'rec-employment',
    type: 'recommendation',
    category: 'employment',
    priority: 'high',
    title: 'Priority: Address Youth Unemployment Crisis',
    description: 'With employment being the lowest-scoring dimension continent-wide, countries should prioritize job creation programs, vocational training, and support for youth entrepreneurship.',
    recommendation: 'Implement comprehensive youth employment strategies including internship programs, startup incubators, and skill development initiatives.',
    confidence: 95,
    generatedAt: new Date(),
  });

  insights.push({
    id: 'rec-regional',
    type: 'recommendation',
    category: 'regional',
    priority: 'medium',
    title: 'Foster Regional Collaboration',
    description: 'Top-performing countries should share best practices with neighbors through regional youth development forums and cross-border initiatives.',
    recommendation: 'Establish pan-African youth development partnerships and knowledge exchange programs.',
    confidence: 88,
    generatedAt: new Date(),
  });

  insights.push({
    id: 'rec-innovation',
    type: 'recommendation',
    category: 'innovation',
    priority: 'medium',
    title: 'Invest in Digital Future',
    description: 'The digital economy presents significant opportunities for African youth employment and entrepreneurship.',
    recommendation: 'Expand broadband access, coding bootcamps, and tech incubators targeting youth in underserved areas.',
    confidence: 90,
    generatedAt: new Date(),
  });

  return insights;
};

/**
 * Get insights filtered by category
 */
export const getInsightsByCategory = (category: InsightCategory, year?: number): AIInsight[] => {
  const allInsights = generateInsights(year);
  return allInsights.filter(insight => insight.category === category);
};

/**
 * Get insights filtered by type
 */
export const getInsightsByType = (type: InsightType, year?: number): AIInsight[] => {
  const allInsights = generateInsights(year);
  return allInsights.filter(insight => insight.type === type);
};

/**
 * Get high priority insights
 */
export const getHighPriorityInsights = (year?: number): AIInsight[] => {
  const allInsights = generateInsights(year);
  return allInsights.filter(insight => insight.priority === 'high');
};

/**
 * Get insight summary statistics
 */
export const getInsightSummary = (year?: number): InsightSummary => {
  const allInsights = generateInsights(year);
  return {
    totalInsights: allInsights.length,
    highPriority: allInsights.filter(i => i.priority === 'high').length,
    trends: allInsights.filter(i => i.type === 'trend').length,
    achievements: allInsights.filter(i => i.type === 'achievement').length,
    concerns: allInsights.filter(i => i.type === 'concern').length,
    opportunities: allInsights.filter(i => i.type === 'opportunity').length,
  };
};

/**
 * Generate country-specific insights
 */
export const getCountryInsights = (countryId: string, year: number = 2024): AIInsight[] => {
  const insights: AIInsight[] = [];
  const youthIndexData = generateYouthIndexData(year);
  const countryData = youthIndexData.find(yi => yi.countryId === countryId);
  const country = getCountryById(countryId);
  
  if (!countryData || !country) return insights;

  // Overall ranking insight
  const tier = countryData.indexScore >= 70 ? 'top-tier' 
    : countryData.indexScore >= 55 ? 'mid-tier' 
    : 'developing';

  insights.push({
    id: `${countryId}-overall`,
    type: countryData.indexScore >= 60 ? 'achievement' : 'concern',
    category: 'overall',
    priority: countryData.rank <= 10 ? 'high' : 'medium',
    title: `${country.name} Ranks #${countryData.rank} in Africa`,
    description: `With a Youth Index score of ${countryData.indexScore.toFixed(1)}, ${country.name} is classified as a ${tier} country for youth development.`,
    metric: 'Youth Index Rank',
    value: countryData.rank,
    countries: [countryId],
    confidence: 95,
    generatedAt: new Date(),
  });

  // Rank change insight
  if (countryData.rankChange !== 0) {
    const improved = countryData.rankChange > 0;
    insights.push({
      id: `${countryId}-trend`,
      type: 'trend',
      category: 'overall',
      priority: Math.abs(countryData.rankChange) >= 5 ? 'high' : 'medium',
      title: improved 
        ? `${country.name} Improved ${countryData.rankChange} Positions`
        : `${country.name} Declined ${Math.abs(countryData.rankChange)} Positions`,
      description: improved
        ? `${country.name} has shown positive momentum, climbing ${countryData.rankChange} positions in the rankings compared to last year.`
        : `${country.name} has dropped ${Math.abs(countryData.rankChange)} positions, indicating areas requiring attention.`,
      change: countryData.rankChange,
      countries: [countryId],
      confidence: 90,
      generatedAt: new Date(),
    });
  }

  // Strength analysis
  const dimensions = [
    { name: 'Education', score: countryData.educationScore, category: 'education' as InsightCategory },
    { name: 'Health', score: countryData.healthScore, category: 'health' as InsightCategory },
    { name: 'Employment', score: countryData.employmentScore, category: 'employment' as InsightCategory },
    { name: 'Civic', score: countryData.civicScore, category: 'civic' as InsightCategory },
    { name: 'Innovation', score: countryData.innovationScore, category: 'innovation' as InsightCategory },
  ];

  const sortedDimensions = [...dimensions].sort((a, b) => b.score - a.score);
  const strongest = sortedDimensions[0];
  const weakest = sortedDimensions[4];

  // Strongest dimension
  insights.push({
    id: `${countryId}-strength`,
    type: 'achievement',
    category: strongest.category,
    priority: 'medium',
    title: `${strongest.name} is ${country.name}'s Strongest Area`,
    description: `${country.name} scores ${strongest.score.toFixed(1)} in ${strongest.name.toLowerCase()}, making it the country's strongest youth development dimension.`,
    metric: `${strongest.name} Score`,
    value: strongest.score.toFixed(1),
    countries: [countryId],
    confidence: 92,
    generatedAt: new Date(),
  });

  // Weakest dimension
  insights.push({
    id: `${countryId}-challenge`,
    type: 'concern',
    category: weakest.category,
    priority: weakest.score < 40 ? 'high' : 'medium',
    title: `${weakest.name} Requires Attention in ${country.name}`,
    description: `With a score of ${weakest.score.toFixed(1)}, ${weakest.name.toLowerCase()} is the area where ${country.name} has the most room for improvement.`,
    metric: `${weakest.name} Score`,
    value: weakest.score.toFixed(1),
    recommendation: `Focus policy interventions on improving ${weakest.name.toLowerCase()} outcomes for youth.`,
    countries: [countryId],
    confidence: 90,
    generatedAt: new Date(),
  });

  // Regional comparison
  const regionCountries = youthIndexData.filter(yi => {
    const c = getCountryById(yi.countryId);
    return c?.region === country.region;
  });
  const regionRank = regionCountries
    .sort((a, b) => b.indexScore - a.indexScore)
    .findIndex(yi => yi.countryId === countryId) + 1;

  insights.push({
    id: `${countryId}-regional`,
    type: 'comparison',
    category: 'regional',
    priority: regionRank <= 3 ? 'high' : 'low',
    title: `#${regionRank} in ${country.region}`,
    description: `${country.name} ranks #${regionRank} among ${regionCountries.length} countries in ${country.region} for youth development.`,
    metric: 'Regional Rank',
    value: regionRank,
    countries: [countryId],
    confidence: 95,
    generatedAt: new Date(),
  });

  return insights;
};

export default {
  generateInsights,
  getInsightsByCategory,
  getInsightsByType,
  getHighPriorityInsights,
  getInsightSummary,
  getCountryInsights,
};
