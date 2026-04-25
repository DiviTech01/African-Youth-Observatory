// ============================================
// AFRICAN YOUTH OBSERVATORY - DASHBOARD SERVICE
// Customizable dashboard configuration and management
// ============================================

import { generateYouthIndexData } from '@/types/mockData';
import { AFRICAN_COUNTRIES, THEMES, INDICATORS } from '@/types';

// ============================================
// TYPES
// ============================================

export type WidgetType = 
  | 'youth-index-ranking'
  | 'top-countries'
  | 'bottom-countries'
  | 'regional-comparison'
  | 'indicator-chart'
  | 'country-spotlight'
  | 'trend-analysis'
  | 'quick-stats'
  | 'map-overview'
  | 'theme-breakdown'
  | 'recent-insights'
  | 'data-table';

export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  config: WidgetConfig;
  position: { row: number; col: number };
}

export interface WidgetConfig {
  year?: number;
  region?: string;
  countryId?: string;
  themeId?: string;
  indicatorId?: string;
  limit?: number;
  chartType?: 'bar' | 'line' | 'radar' | 'pie';
  showTrend?: boolean;
  compareYears?: number[];
}

export interface DashboardConfig {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
}

export interface WidgetTemplate {
  type: WidgetType;
  name: string;
  description: string;
  icon: string;
  defaultSize: WidgetSize;
  defaultConfig: Partial<WidgetConfig>;
  category: 'overview' | 'rankings' | 'analysis' | 'data';
}

// ============================================
// WIDGET TEMPLATES
// ============================================

export const WIDGET_TEMPLATES: WidgetTemplate[] = [
  {
    type: 'youth-index-ranking',
    name: 'Youth Index Rankings',
    description: 'Display youth index scores for all countries',
    icon: 'Trophy',
    defaultSize: 'large',
    defaultConfig: { year: 2024, limit: 10 },
    category: 'rankings',
  },
  {
    type: 'top-countries',
    name: 'Top Performers',
    description: 'Highlight top-performing countries',
    icon: 'TrendingUp',
    defaultSize: 'medium',
    defaultConfig: { year: 2024, limit: 5 },
    category: 'rankings',
  },
  {
    type: 'bottom-countries',
    name: 'Countries Needing Support',
    description: 'Countries with the most room for improvement',
    icon: 'AlertTriangle',
    defaultSize: 'medium',
    defaultConfig: { year: 2024, limit: 5 },
    category: 'rankings',
  },
  {
    type: 'regional-comparison',
    name: 'Regional Comparison',
    description: 'Compare youth metrics across African regions',
    icon: 'Map',
    defaultSize: 'large',
    defaultConfig: { year: 2024, chartType: 'bar' },
    category: 'analysis',
  },
  {
    type: 'indicator-chart',
    name: 'Indicator Visualization',
    description: 'Chart a specific indicator across countries',
    icon: 'BarChart3',
    defaultSize: 'medium',
    defaultConfig: { year: 2024, chartType: 'bar', limit: 10 },
    category: 'data',
  },
  {
    type: 'country-spotlight',
    name: 'Country Spotlight',
    description: 'Detailed view of a single country',
    icon: 'Flag',
    defaultSize: 'medium',
    defaultConfig: { countryId: 'NG', year: 2024 },
    category: 'overview',
  },
  {
    type: 'trend-analysis',
    name: 'Trend Analysis',
    description: 'Track indicator trends over time',
    icon: 'TrendingUp',
    defaultSize: 'large',
    defaultConfig: { compareYears: [2020, 2021, 2022, 2023, 2024], chartType: 'line' },
    category: 'analysis',
  },
  {
    type: 'quick-stats',
    name: 'Quick Statistics',
    description: 'Key summary statistics at a glance',
    icon: 'Activity',
    defaultSize: 'small',
    defaultConfig: { year: 2024 },
    category: 'overview',
  },
  {
    type: 'map-overview',
    name: 'Map Overview',
    description: 'Visual map of African youth data',
    icon: 'Globe',
    defaultSize: 'large',
    defaultConfig: { year: 2024 },
    category: 'overview',
  },
  {
    type: 'theme-breakdown',
    name: 'Theme Breakdown',
    description: 'Performance across different themes',
    icon: 'PieChart',
    defaultSize: 'medium',
    defaultConfig: { year: 2024, chartType: 'radar' },
    category: 'analysis',
  },
  {
    type: 'recent-insights',
    name: 'Recent Insights',
    description: 'AI-generated insights and recommendations',
    icon: 'Lightbulb',
    defaultSize: 'medium',
    defaultConfig: { limit: 5 },
    category: 'analysis',
  },
  {
    type: 'data-table',
    name: 'Data Table',
    description: 'Tabular view of youth data',
    icon: 'Table',
    defaultSize: 'full',
    defaultConfig: { year: 2024, limit: 20 },
    category: 'data',
  },
];

// ============================================
// DEFAULT DASHBOARDS
// ============================================

export const DEFAULT_DASHBOARDS: DashboardConfig[] = [
  {
    id: 'executive-overview',
    name: 'Executive Overview',
    description: 'High-level summary of African youth development status',
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    widgets: [
      {
        id: 'w1',
        type: 'quick-stats',
        title: 'Key Metrics',
        size: 'small',
        config: { year: 2024 },
        position: { row: 0, col: 0 },
      },
      {
        id: 'w2',
        type: 'top-countries',
        title: 'Top 5 Performers',
        size: 'medium',
        config: { year: 2024, limit: 5 },
        position: { row: 0, col: 1 },
      },
      {
        id: 'w3',
        type: 'regional-comparison',
        title: 'Regional Overview',
        size: 'large',
        config: { year: 2024, chartType: 'bar' },
        position: { row: 1, col: 0 },
      },
      {
        id: 'w4',
        type: 'recent-insights',
        title: 'AI Insights',
        size: 'medium',
        config: { limit: 3 },
        position: { row: 1, col: 1 },
      },
    ],
  },
  {
    id: 'rankings-focus',
    name: 'Rankings & Performance',
    description: 'Detailed country rankings and performance analysis',
    isDefault: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    widgets: [
      {
        id: 'w1',
        type: 'youth-index-ranking',
        title: 'Full Rankings',
        size: 'large',
        config: { year: 2024, limit: 15 },
        position: { row: 0, col: 0 },
      },
      {
        id: 'w2',
        type: 'top-countries',
        title: 'Leaders',
        size: 'small',
        config: { year: 2024, limit: 3 },
        position: { row: 0, col: 1 },
      },
      {
        id: 'w3',
        type: 'bottom-countries',
        title: 'Needs Improvement',
        size: 'small',
        config: { year: 2024, limit: 3 },
        position: { row: 1, col: 0 },
      },
      {
        id: 'w4',
        type: 'theme-breakdown',
        title: 'Theme Performance',
        size: 'medium',
        config: { year: 2024, chartType: 'radar' },
        position: { row: 1, col: 1 },
      },
    ],
  },
  {
    id: 'trend-analysis',
    name: 'Trends & Analysis',
    description: 'Track changes and trends over time',
    isDefault: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    widgets: [
      {
        id: 'w1',
        type: 'trend-analysis',
        title: 'Youth Index Trends',
        size: 'large',
        config: { compareYears: [2020, 2021, 2022, 2023, 2024], chartType: 'line' },
        position: { row: 0, col: 0 },
      },
      {
        id: 'w2',
        type: 'regional-comparison',
        title: 'Regional Trends',
        size: 'large',
        config: { year: 2024, chartType: 'bar' },
        position: { row: 1, col: 0 },
      },
      {
        id: 'w3',
        type: 'recent-insights',
        title: 'Trend Insights',
        size: 'medium',
        config: { limit: 4 },
        position: { row: 2, col: 0 },
      },
    ],
  },
];

// ============================================
// DASHBOARD MANAGEMENT (syncs to backend API when logged in)
// ============================================

const STORAGE_KEY = 'ayd_dashboards';
const ACTIVE_DASHBOARD_KEY = 'ayd_active_dashboard';

// ---- API helpers ----

const _viteUrl = import.meta.env.VITE_API_URL as string | undefined;
const API_BASE = (_viteUrl && _viteUrl.startsWith('http'))
  ? _viteUrl
  : (import.meta.env.PROD ? 'https://african-youth-observatory.onrender.com/api' : '/api');

function getAuthToken(): string | null {
  // Supabase stores session in localStorage
  const raw = localStorage.getItem(`sb-${new URL(import.meta.env.VITE_SUPABASE_URL || 'https://x.supabase.co').hostname.split('.')[0]}-auth-token`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.access_token || null;
  } catch { return null; }
}

async function apiRequest<T>(method: string, path: string, body?: unknown): Promise<T | null> {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    if (res.status === 204) return null;
    return res.json();
  } catch {
    return null;
  }
}

// Convert between frontend DashboardConfig and backend format
function toApiFormat(d: DashboardConfig) {
  return {
    title: d.name,
    description: d.description,
    widgets: d.widgets,
    isPublic: false,
  };
}

function fromApiFormat(d: { id: string; title: string; description?: string | null; widgets: unknown; createdAt: string; updatedAt: string }): DashboardConfig {
  return {
    id: d.id,
    name: d.title,
    description: d.description || '',
    widgets: (Array.isArray(d.widgets) ? d.widgets : []) as DashboardWidget[],
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    isDefault: false,
  };
}

// ---- In-memory cache of server dashboards ----
let _serverDashboards: DashboardConfig[] | null = null;
let _syncPromise: Promise<void> | null = null;

/** Pull dashboards from the backend and merge into local cache */
export async function syncDashboardsFromServer(): Promise<void> {
  const token = getAuthToken();
  if (!token) { _serverDashboards = null; return; }

  try {
    const list = await apiRequest<Array<{ id: string; title: string; description?: string | null; widgets: unknown; createdAt: string; updatedAt: string }>>('GET', '/dashboards');
    if (list && Array.isArray(list)) {
      _serverDashboards = list.map(fromApiFormat);
      // Persist server dashboards to localStorage as cache
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_serverDashboards));
    }
  } catch {
    // Fall back to localStorage
  }
}

/** Call this on login to pull user dashboards */
export function triggerDashboardSync(): void {
  _syncPromise = syncDashboardsFromServer();
}

// Get all saved dashboards
export function getAllDashboards(): DashboardConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const custom = JSON.parse(stored) as DashboardConfig[];
      // Merge with defaults, custom dashboards override defaults with same ID
      const customIds = new Set(custom.map(d => d.id));
      const defaults = DEFAULT_DASHBOARDS.filter(d => !customIds.has(d.id));
      return [...defaults, ...custom];
    }
  } catch {
    console.error('Failed to load dashboards from storage');
  }
  return [...DEFAULT_DASHBOARDS];
}

// Get a specific dashboard by ID
export function getDashboard(id: string): DashboardConfig | undefined {
  return getAllDashboards().find(d => d.id === id);
}

// Get the active dashboard
export function getActiveDashboard(): DashboardConfig {
  try {
    const activeId = localStorage.getItem(ACTIVE_DASHBOARD_KEY);
    if (activeId) {
      const dashboard = getDashboard(activeId);
      if (dashboard) return dashboard;
    }
  } catch {
    console.error('Failed to load active dashboard');
  }
  return DEFAULT_DASHBOARDS[0];
}

// Set the active dashboard
export function setActiveDashboard(id: string): void {
  localStorage.setItem(ACTIVE_DASHBOARD_KEY, id);
}

// Save a dashboard (localStorage + API)
export function saveDashboard(dashboard: DashboardConfig): void {
  const dashboards = getAllDashboards().filter(d => d.id !== dashboard.id);
  dashboard.updatedAt = new Date().toISOString();
  dashboards.push(dashboard);

  // Only store non-default dashboards
  const customDashboards = dashboards.filter(d => !DEFAULT_DASHBOARDS.some(def => def.id === d.id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customDashboards));

  // Sync to backend (fire-and-forget)
  const isServerDashboard = dashboard.id && !dashboard.id.startsWith('custom-');
  if (isServerDashboard) {
    // Update existing server dashboard
    apiRequest('PUT', `/dashboards/${dashboard.id}`, toApiFormat(dashboard));
  }
}

// Create a new dashboard (localStorage + API)
export function createDashboard(name: string, description: string = ''): DashboardConfig {
  const dashboard: DashboardConfig = {
    id: `custom-${Date.now()}`,
    name,
    description,
    widgets: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: false,
  };

  // Save locally first
  saveDashboard(dashboard);

  // Create on server and update ID when response comes back
  const token = getAuthToken();
  if (token) {
    apiRequest<{ id: string }>('POST', '/dashboards', toApiFormat(dashboard))
      .then((result) => {
        if (result?.id) {
          // Replace the temp ID with the server ID
          const all = getAllDashboards();
          const idx = all.findIndex(d => d.id === dashboard.id);
          if (idx >= 0) {
            all[idx].id = result.id;
            const custom = all.filter(d => !DEFAULT_DASHBOARDS.some(def => def.id === d.id));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
          }
          dashboard.id = result.id;
        }
      });
  }

  return dashboard;
}

// Delete a dashboard
export function deleteDashboard(id: string): boolean {
  const dashboard = getDashboard(id);
  if (!dashboard || dashboard.isDefault) return false;

  const dashboards = getAllDashboards().filter(d => d.id !== id);
  const customDashboards = dashboards.filter(d => !DEFAULT_DASHBOARDS.some(def => def.id === d.id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customDashboards));

  // Delete from server too
  if (!id.startsWith('custom-')) {
    apiRequest('DELETE', `/dashboards/${id}`);
  }

  // If we deleted the active dashboard, switch to default
  if (localStorage.getItem(ACTIVE_DASHBOARD_KEY) === id) {
    setActiveDashboard(DEFAULT_DASHBOARDS[0].id);
  }

  return true;
}

// ============================================
// WIDGET MANAGEMENT
// ============================================

// Add a widget to a dashboard
export function addWidget(
  dashboardId: string, 
  widgetType: WidgetType, 
  title?: string,
  config?: Partial<WidgetConfig>
): DashboardWidget | null {
  const dashboard = getDashboard(dashboardId);
  if (!dashboard) return null;
  
  const template = WIDGET_TEMPLATES.find(t => t.type === widgetType);
  if (!template) return null;
  
  // Find the next available position
  const maxRow = dashboard.widgets.reduce((max, w) => Math.max(max, w.position.row), -1);
  
  const widget: DashboardWidget = {
    id: `widget-${Date.now()}`,
    type: widgetType,
    title: title || template.name,
    size: template.defaultSize,
    config: { ...template.defaultConfig, ...config },
    position: { row: maxRow + 1, col: 0 },
  };
  
  dashboard.widgets.push(widget);
  saveDashboard(dashboard);
  
  return widget;
}

// Remove a widget from a dashboard
export function removeWidget(dashboardId: string, widgetId: string): boolean {
  const dashboard = getDashboard(dashboardId);
  if (!dashboard) return false;
  
  const initialLength = dashboard.widgets.length;
  dashboard.widgets = dashboard.widgets.filter(w => w.id !== widgetId);
  
  if (dashboard.widgets.length < initialLength) {
    saveDashboard(dashboard);
    return true;
  }
  return false;
}

// Update widget configuration
export function updateWidget(
  dashboardId: string, 
  widgetId: string, 
  updates: Partial<Pick<DashboardWidget, 'title' | 'size' | 'config' | 'position'>>
): boolean {
  const dashboard = getDashboard(dashboardId);
  if (!dashboard) return false;
  
  const widget = dashboard.widgets.find(w => w.id === widgetId);
  if (!widget) return false;
  
  if (updates.title !== undefined) widget.title = updates.title;
  if (updates.size !== undefined) widget.size = updates.size;
  if (updates.config !== undefined) widget.config = { ...widget.config, ...updates.config };
  if (updates.position !== undefined) widget.position = updates.position;
  
  saveDashboard(dashboard);
  return true;
}

// ============================================
// WIDGET DATA GENERATION
// ============================================

export interface WidgetData {
  type: WidgetType;
  data: any;
  meta: {
    year: number;
    updatedAt: string;
    dataPoints: number;
  };
}

// Generate data for a widget based on its type and config
export function getWidgetData(widget: DashboardWidget): WidgetData {
  const year = widget.config.year || 2024;
  const youthIndexData = generateYouthIndexData();
  const indicators = INDICATORS;
  
  const yearData = youthIndexData.filter(d => d.year === year);
  const sortedByScore = [...yearData].sort((a, b) => b.indexScore - a.indexScore);
  
  let data: any;
  let dataPoints = 0;
  
  switch (widget.type) {
    case 'youth-index-ranking':
      data = sortedByScore.slice(0, widget.config.limit || 10).map((d, i) => ({
        rank: i + 1,
        countryId: d.countryId,
        countryName: AFRICAN_COUNTRIES.find(c => c.id === d.countryId)?.name || d.countryId,
        score: d.indexScore,
        educationScore: d.educationScore,
        healthScore: d.healthScore,
        employmentScore: d.employmentScore,
      }));
      dataPoints = data.length;
      break;
      
    case 'top-countries':
      data = sortedByScore.slice(0, widget.config.limit || 5).map((d, i) => ({
        rank: i + 1,
        countryId: d.countryId,
        countryName: AFRICAN_COUNTRIES.find(c => c.id === d.countryId)?.name || d.countryId,
        score: d.indexScore,
        flag: AFRICAN_COUNTRIES.find(c => c.id === d.countryId)?.flagEmoji,
      }));
      dataPoints = data.length;
      break;
      
    case 'bottom-countries':
      data = sortedByScore.slice(-widget.config.limit || -5).reverse().map((d, i) => ({
        rank: sortedByScore.length - (widget.config.limit || 5) + i + 1,
        countryId: d.countryId,
        countryName: AFRICAN_COUNTRIES.find(c => c.id === d.countryId)?.name || d.countryId,
        score: d.indexScore,
        flag: AFRICAN_COUNTRIES.find(c => c.id === d.countryId)?.flagEmoji,
      }));
      dataPoints = data.length;
      break;
      
    case 'regional-comparison':
      const regions = ['North Africa', 'West Africa', 'East Africa', 'Central Africa', 'Southern Africa'];
      data = regions.map(region => {
        const regionCountries = AFRICAN_COUNTRIES.filter(c => c.region === region);
        const regionData = yearData.filter(d => regionCountries.some(c => c.id === d.countryId));
        const avgScore = regionData.length > 0 
          ? regionData.reduce((sum, d) => sum + d.indexScore, 0) / regionData.length 
          : 0;
        return {
          region,
          avgScore: Math.round(avgScore * 10) / 10,
          countryCount: regionCountries.length,
          dataPoints: regionData.length,
        };
      });
      dataPoints = data.length;
      break;
      
    case 'quick-stats':
      const avgScore = yearData.reduce((sum, d) => sum + d.indexScore, 0) / yearData.length;
      const avgEducation = yearData.reduce((sum, d) => sum + d.educationScore, 0) / yearData.length;
      const avgHealth = yearData.reduce((sum, d) => sum + d.healthScore, 0) / yearData.length;
      const avgEmployment = yearData.reduce((sum, d) => sum + d.employmentScore, 0) / yearData.length;
      
      data = {
        totalCountries: AFRICAN_COUNTRIES.length,
        averageScore: Math.round(avgScore * 10) / 10,
        averageEducation: Math.round(avgEducation * 10) / 10,
        averageHealth: Math.round(avgHealth * 10) / 10,
        averageEmployment: Math.round(avgEmployment * 10) / 10,
        totalIndicators: indicators.length,
        totalThemes: THEMES.length,
        dataYear: year,
      };
      dataPoints = 8;
      break;
      
    case 'theme-breakdown':
      data = THEMES.map(theme => {
        const themeIndicators = indicators.filter(i => i.themeId === theme.id);
        return {
          themeId: theme.id,
          themeName: theme.name,
          indicatorCount: themeIndicators.length,
          color: theme.color,
        };
      });
      dataPoints = data.length;
      break;
      
    case 'trend-analysis':
      const years = widget.config.compareYears || [2020, 2021, 2022, 2023, 2024];
      data = years.map(y => {
        const yData = youthIndexData.filter(d => d.year === y);
        const avg = yData.reduce((sum, d) => sum + d.indexScore, 0) / yData.length;
        return {
          year: y,
          averageScore: Math.round(avg * 10) / 10,
          dataPoints: yData.length,
        };
      });
      dataPoints = data.length;
      break;
      
    case 'country-spotlight':
      const countryId = widget.config.countryId || 'NG';
      const country = AFRICAN_COUNTRIES.find(c => c.id === countryId);
      const countryData = yearData.find(d => d.countryId === countryId);
      const rank = sortedByScore.findIndex(d => d.countryId === countryId) + 1;
      
      data = {
        country,
        rank,
        totalCountries: sortedByScore.length,
        overallScore: countryData?.indexScore || 0,
        educationScore: countryData?.educationScore || 0,
        healthScore: countryData?.healthScore || 0,
        employmentScore: countryData?.employmentScore || 0,
        civicScore: countryData?.civicScore || 0,
        innovationScore: countryData?.innovationScore || 0,
      };
      dataPoints = 1;
      break;
      
    case 'recent-insights':
      // Return placeholder - actual insights come from insights service
      data = {
        count: widget.config.limit || 5,
        message: 'Insights loaded from insights service',
      };
      dataPoints = widget.config.limit || 5;
      break;
      
    case 'data-table':
      data = sortedByScore.slice(0, widget.config.limit || 20).map((d, i) => {
        const country = AFRICAN_COUNTRIES.find(c => c.id === d.countryId);
        return {
          rank: i + 1,
          countryId: d.countryId,
          countryName: country?.name || d.countryId,
          region: country?.region || 'Unknown',
          overallScore: d.indexScore,
          educationScore: d.educationScore,
          healthScore: d.healthScore,
          employmentScore: d.employmentScore,
          civicScore: d.civicScore,
          innovationScore: d.innovationScore,
        };
      });
      dataPoints = data.length;
      break;
      
    case 'map-overview':
      data = yearData.map(d => {
        const country = AFRICAN_COUNTRIES.find(c => c.id === d.countryId);
        return {
          countryId: d.countryId,
          countryName: country?.name,
          score: d.indexScore,
          region: country?.region,
        };
      });
      dataPoints = data.length;
      break;
      
    default:
      data = null;
      dataPoints = 0;
  }
  
  return {
    type: widget.type,
    data,
    meta: {
      year,
      updatedAt: new Date().toISOString(),
      dataPoints,
    },
  };
}

// Get data for all widgets in a dashboard
export function getDashboardData(dashboardId: string): Map<string, WidgetData> {
  const dashboard = getDashboard(dashboardId);
  if (!dashboard) return new Map();
  
  const dataMap = new Map<string, WidgetData>();
  for (const widget of dashboard.widgets) {
    dataMap.set(widget.id, getWidgetData(widget));
  }
  return dataMap;
}
