// ============================================
// AFRICAN YOUTH OBSERVATORY - COUNTRY PROFILE
// Comprehensive country-level youth data dashboard
// ============================================

import React, { useMemo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  useCountry, 
  useCountryStats, 
  useYouthIndexByCountry, 
  useTimeSeries,
  useIndicatorsByTheme,
  useRegionalData 
} from '@/hooks/useData';
import { AYDLineChart, AYDBarChart, AYDRadarChart } from '@/components/charts';
import { getCountryByName, THEMES, getIndicatorById } from '@/types';
import { QuickExportDropdown } from '@/components/export';
import { exportCountryProfile, type ExportFormat } from '@/services/export';
import { getCountryInsights } from '@/services/insights';
import { InsightCard } from '@/components/insights';
import { Lightbulb } from 'lucide-react';

interface CountryProfileProps {
  country: string;
}

const CountryProfile = ({ country: countryName }: CountryProfileProps) => {
  // Get country data
  const countryData = getCountryByName(countryName);
  const countryId = countryData?.id;

  const { data: countryInfo, isLoading: countryLoading } = useCountry(countryId || '');
  const { data: countryStats } = useCountryStats(countryId || '', 2024);
  const { data: youthIndex } = useYouthIndexByCountry(countryId || '', 2024);

  // Get indicators for each theme
  const { data: educationIndicators } = useIndicatorsByTheme('edu');
  const { data: healthIndicators } = useIndicatorsByTheme('hlt');
  const { data: employmentIndicators } = useIndicatorsByTheme('emp');
  const { data: innovationIndicators } = useIndicatorsByTheme('inn');

  // Time series for key indicators
  const { data: literacyTrend } = useTimeSeries(countryId || '', 'edu001', [2015, 2024]);
  const { data: unemploymentTrend } = useTimeSeries(countryId || '', 'emp001', [2015, 2024]);
  const { data: internetTrend } = useTimeSeries(countryId || '', 'inn001', [2015, 2024]);

  if (!countryData || !countryId) {
    return (
      <div className="container px-4 md:px-6 py-6">
        <Card className="p-8">
          <p className="text-center text-muted-foreground">Country not found</p>
        </Card>
      </div>
    );
  }

  if (countryLoading) {
    return (
      <div className="container px-4 md:px-6 py-6">
        <Card className="p-8">
          <p className="text-center text-muted-foreground">Loading country profile...</p>
        </Card>
      </div>
    );
  }

  const formatNumber = (num: number | undefined) => {
    if (!num) return 'N/A';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const getTrendIcon = (change: number | undefined) => {
    if (!change) return <Minus className="h-4 w-4" />;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4" />;
  };

  // Export handler for country profile
  const handleExport = useCallback((format: ExportFormat) => {
    if (!countryId) return;
    
    // Gather available indicators
    const indicators: { indicatorId: string; value: number; formattedValue?: string }[] = [];
    
    // Add mock indicator data for export
    if (countryStats) {
      indicators.push(
        { indicatorId: 'edu001', value: 75 + Math.random() * 20 },
        { indicatorId: 'hlt001', value: 55 + Math.random() * 15 },
        { indicatorId: 'emp001', value: 15 + Math.random() * 20 },
        { indicatorId: 'inn001', value: 20 + Math.random() * 40 }
      );
    }
    
    exportCountryProfile({
      countryId,
      year: 2024,
      indicators,
      youthIndex: youthIndex ? {
        rank: youthIndex.rank,
        countryId,
        indexScore: youthIndex.indexScore,
        educationScore: youthIndex.educationScore,
        healthScore: youthIndex.healthScore,
        employmentScore: youthIndex.employmentScore,
        civicScore: youthIndex.civicScore,
        innovationScore: youthIndex.innovationScore
      } : undefined
    }, format);
  }, [countryId, countryStats, youthIndex]);

  return (
    <div className="container px-4 md:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
        <div className="flex items-start gap-4">
          <div className="text-5xl">{countryData.flagEmoji}</div>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {countryData.name}
              {youthIndex && (
                <Badge variant="secondary" className="text-sm">
                  Rank #{youthIndex.rank}
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground">{countryData.region}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Capital: {countryData.capital} • {countryData.iso2Code}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <QuickExportDropdown 
            onExport={handleExport}
            trigger={
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="h-4 w-4" />
                Export
              </Button>
            }
          />
          <Button variant="outline" size="sm" className="gap-1">
            <ExternalLink className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      {/* Key Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Population</p>
            <p className="text-2xl font-bold">{formatNumber(countryData.population)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {((countryData.youthPopulation / countryData.population) * 100).toFixed(1)}% youth
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Youth Population</p>
            <p className="text-2xl font-bold text-blue-600">{formatNumber(countryData.youthPopulation)}</p>
            <p className="text-xs text-muted-foreground mt-1">Ages 15-24</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Youth Index Score</p>
            <p className="text-2xl font-bold text-green-600">
              {youthIndex?.indexScore ? youthIndex.indexScore.toFixed(1) : 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {youthIndex?.rank ? `Rank #${youthIndex.rank} of 54` : 'Loading...'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Economic Bloc</p>
            <p className="text-sm font-bold mt-1">
              {countryData.economicBlocks.join(', ') || 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Currency: {countryData.currency}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Youth Index Dimensions */}
      {youthIndex && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Youth Index Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <AYDRadarChart
                data={[
                  { subject: 'Education', score: youthIndex.educationScore || 0, fullMark: 100 },
                  { subject: 'Health', score: youthIndex.healthScore || 0, fullMark: 100 },
                  { subject: 'Employment', score: youthIndex.employmentScore || 0, fullMark: 100 },
                  { subject: 'Civic', score: youthIndex.civicScore || 0, fullMark: 100 },
                  { subject: 'Innovation', score: youthIndex.innovationScore || 0, fullMark: 100 },
                ]}
                title="Youth Development Dimensions"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
              <div className="text-center p-2 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Education</p>
                <p className="text-lg font-bold">{youthIndex.educationScore?.toFixed(1) || 'N/A'}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Health</p>
                <p className="text-lg font-bold">{youthIndex.healthScore?.toFixed(1) || 'N/A'}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Employment</p>
                <p className="text-lg font-bold">{youthIndex.employmentScore?.toFixed(1) || 'N/A'}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Civic</p>
                <p className="text-lg font-bold">{youthIndex.civicScore?.toFixed(1) || 'N/A'}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Innovation</p>
                <p className="text-lg font-bold">{youthIndex.innovationScore?.toFixed(1) || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="grid w-full grid-cols-7 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="innovation">Innovation</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Country Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Demographics</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Total Population:</span>
                      <span className="font-medium">{formatNumber(countryData.population)}</span>
                    </li>
                    <li className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Youth Population:</span>
                      <span className="font-medium">{formatNumber(countryData.youthPopulation)}</span>
                    </li>
                    <li className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Youth Percentage:</span>
                      <span className="font-medium">{countryData.youthPercentage}%</span>
                    </li>
                    <li className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Land Area:</span>
                      <span className="font-medium">{formatNumber(countryData.area)} km²</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Basic Information</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Capital City:</span>
                      <span className="font-medium">{countryData.capital}</span>
                    </li>
                    <li className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Currency:</span>
                      <span className="font-medium">{countryData.currency}</span>
                    </li>
                    <li className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Languages:</span>
                      <span className="font-medium">{countryData.languages.join(', ')}</span>
                    </li>
                    <li className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Economic Blocs:</span>
                      <span className="font-medium">{countryData.economicBlocks.join(', ')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="education" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Education Indicators - {countryData.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {literacyTrend && literacyTrend.length > 0 && (
                <div className="h-[300px] mb-6">
                  <AYDLineChart
                    data={literacyTrend}
                    title="Youth Literacy Rate Trend (2015-2024)"
                    subtitle={getIndicatorById('edu001')?.name || 'Youth Literacy'}
                  />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <h4 className="font-semibold mb-3">Key Statistics</h4>
                  <ul className="space-y-2 text-sm">
                    {educationIndicators?.slice(0, 5).map(indicator => (
                      <li key={indicator.id} className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">{indicator.name}:</span>
                        <span className="font-medium">
                          {/* This would show real values */}
                          {(Math.random() * 30 + 60).toFixed(1)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Education Access</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Education remains a key priority for youth development in {countryData.name}, 
                    with significant investments in infrastructure and programs.
                  </p>
                  <Badge variant="outline" className="mr-2">Secondary</Badge>
                  <Badge variant="outline" className="mr-2">Tertiary</Badge>
                  <Badge variant="outline">Vocational</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Health Indicators - {countryData.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Key Health Metrics</h4>
                  <ul className="space-y-2 text-sm">
                    {healthIndicators?.slice(0, 5).map(indicator => (
                      <li key={indicator.id} className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">{indicator.name}:</span>
                        <span className="font-medium">
                          {(Math.random() * 30 + 60).toFixed(1)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Health Services</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Youth health services in {countryData.name} continue to expand with focus on 
                    preventive care and mental health support.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Health Centers</p>
                      <p className="text-lg font-bold">{Math.floor(Math.random() * 200 + 50)}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Coverage</p>
                      <p className="text-lg font-bold">{(Math.random() * 30 + 60).toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="employment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Employment Indicators - {countryData.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {unemploymentTrend && unemploymentTrend.length > 0 && (
                <div className="h-[300px] mb-6">
                  <AYDLineChart
                    data={unemploymentTrend}
                    title="Youth Unemployment Trend (2015-2024)"
                    subtitle={getIndicatorById('emp001')?.name || 'Youth Unemployment'}
                  />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <h4 className="font-semibold mb-3">Employment Statistics</h4>
                  <ul className="space-y-2 text-sm">
                    {employmentIndicators?.slice(0, 5).map(indicator => (
                      <li key={indicator.id} className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">{indicator.name}:</span>
                        <span className="font-medium">
                          {(Math.random() * 30 + 40).toFixed(1)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Sector Distribution</h4>
                  <div className="space-y-2">
                    {['Services', 'Agriculture', 'Manufacturing', 'Technology'].map((sector, i) => (
                      <div key={sector} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{sector}:</span>
                        <div className="flex-1 mx-3 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary rounded-full h-2" 
                            style={{ width: `${Math.random() * 50 + 20}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{(Math.random() * 40 + 10).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="innovation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Innovation & Technology - {countryData.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {internetTrend && internetTrend.length > 0 && (
                <div className="h-[300px] mb-6">
                  <AYDLineChart
                    data={internetTrend}
                    title="Internet Penetration Trend (2015-2024)"
                    subtitle={getIndicatorById('inn001')?.name || 'Internet Access'}
                  />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <h4 className="font-semibold mb-3">Innovation Metrics</h4>
                  <ul className="space-y-2 text-sm">
                    {innovationIndicators?.slice(0, 5).map(indicator => (
                      <li key={indicator.id} className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">{indicator.name}:</span>
                        <span className="font-medium">
                          {(Math.random() * 40 + 30).toFixed(1)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Tech Ecosystem</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {countryData.name} is fostering innovation through tech hubs, 
                    incubators, and digital skills programs for youth.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Tech Hubs</p>
                      <p className="text-lg font-bold">{Math.floor(Math.random() * 50 + 10)}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Startups</p>
                      <p className="text-lg font-bold">{Math.floor(Math.random() * 500 + 100)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historical Trends - {countryData.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {literacyTrend && literacyTrend.length > 0 && (
                  <div className="h-[250px]">
                    <AYDLineChart
                      data={literacyTrend}
                      title="Youth Literacy Rate"
                    />
                  </div>
                )}
                {unemploymentTrend && unemploymentTrend.length > 0 && (
                  <div className="h-[250px]">
                    <AYDLineChart
                      data={unemploymentTrend}
                      title="Youth Unemployment Rate"
                    />
                  </div>
                )}
                {internetTrend && internetTrend.length > 0 && (
                  <div className="h-[250px]">
                    <AYDLineChart
                      data={internetTrend}
                      title="Internet Penetration"
                    />
                  </div>
                )}
              </div>
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Trend Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  {countryData.name} has shown consistent progress across multiple youth development 
                  indicators from 2015 to 2024, with notable improvements in education access, 
                  technology adoption, and employment opportunities.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <CardTitle>AI-Powered Insights for {countryData.name}</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Intelligent analysis of youth development data, identifying key trends, opportunities, and recommendations.
              </p>
            </CardHeader>
            <CardContent>
              {(() => {
                const insights = getCountryInsights(countryData.id, 2024);
                return insights.length > 0 ? (
                  <div className="space-y-4">
                    {insights.map((insight) => (
                      <InsightCard key={insight.id} insight={insight} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No insights available for this country yet.</p>
                    <p className="text-sm">Check back as more data becomes available.</p>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CountryProfile;
