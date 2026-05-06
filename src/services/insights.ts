// ============================================
// AFRICAN YOUTH OBSERVATORY - AI INSIGHTS SERVICE
// ============================================
//
// Per admin directive: NO MOCK / SYNTHESISED INSIGHTS. The previous version
// of this file generated ~350 lines of authoritative-looking insight cards
// ("Country X improved by Y points", "Region Z leads on…") from the same
// mock youth-index generator we've already removed everywhere else. Those
// were fabrications.
//
// Until the dedicated `/api/insights/*` endpoints (anomalies, correlations,
// trends, narratives) are wired into the consumer pages, every export here
// returns an empty array / zero-valued summary so the UI shows an empty
// state rather than fake claims. Type signatures are preserved so consumer
// pages and the dashboard widget keep compiling unchanged.

// ============================================
// TYPES (unchanged so consumers still type-check)
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
  confidence: number;
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
// EMPTY STUBS (real-API wiring pending)
// ============================================

export const generateInsights = (_year: number = 2024): AIInsight[] => [];

export const getInsightsByCategory = (
  _category: InsightCategory,
  _year?: number,
): AIInsight[] => [];

export const getInsightsByType = (
  _type: InsightType,
  _year?: number,
): AIInsight[] => [];

export const getHighPriorityInsights = (_year?: number): AIInsight[] => [];

export const getInsightSummary = (_year?: number): InsightSummary => ({
  totalInsights: 0,
  highPriority: 0,
  trends: 0,
  achievements: 0,
  concerns: 0,
  opportunities: 0,
});

export const getCountryInsights = (
  _countryId: string,
  _year: number = 2024,
): AIInsight[] => [];
