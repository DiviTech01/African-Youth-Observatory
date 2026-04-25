// ============================================
// AFRICAN YOUTH OBSERVATORY - DATA CHART
// Interactive chart component for data exploration
// ============================================

import React, { useMemo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Share, BarChart3, LineChart, PieChart } from 'lucide-react';
import { AYDLineChart, AYDBarChart, AYDAreaChart, AYDRankingChart, COLOR_PALETTE } from '@/components/charts';
import { 
  useBarChartData, 
  useChartTimeSeries, 
  useRegionalData,
} from '@/hooks/useData';
import { 
  AFRICAN_COUNTRIES, 
  getIndicatorById,
} from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { QuickExportDropdown } from '@/components/export';
import { exportIndicatorData, type ExportFormat } from '@/services/export';

interface DataChartProps {
  country: string;
  theme: string;
  indicator: string;
  yearRange: [number, number];
}

const DataChart: React.FC<DataChartProps> = ({ 
  country, 
  theme,
  indicator,
  yearRange
}) => {
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Map indicator names to IDs
  const getIndicatorIdFromSelection = (): string => {
    if (indicator !== "Select an indicator") {
      const indicatorMap: Record<string, string> = {
        'Youth Literacy Rate': 'edu001',
        'Secondary School Enrollment': 'edu002',
        'Tertiary Education Enrollment': 'edu003',
        'Youth Unemployment Rate': 'emp001',
        'Youth Labor Force Participation': 'emp002',
        'Youth NEET Rate': 'emp003',
        'Internet Penetration': 'inn001',
        'Mobile Phone Ownership': 'inn002',
        'HIV Prevalence': 'hlt002',
        'Adolescent Fertility Rate': 'hlt003',
        'Youth Voter Turnout': 'civ001',
        'Bank Account Ownership': 'fin001',
      };
      return indicatorMap[indicator] || 'edu001';
    }
    
    const themeDefaults: Record<string, string> = {
      'Education': 'edu001',
      'Employment': 'emp001',
      'Health': 'hlt001',
      'Innovation & Technology': 'inn001',
      'Civic Engagement': 'civ001',
      'Agriculture': 'agr001',
      'Gender': 'gen001',
      'Financial Inclusion': 'fin001',
    };
    return themeDefaults[theme] || 'edu001';
  };

  const selectedIndicatorId = getIndicatorIdFromSelection();
  const selectedIndicator = getIndicatorById(selectedIndicatorId);

  const selectedCountryIds = useMemo(() => {
    if (country === "All Countries") {
      return ['mu', 'sc', 'tn', 'bw', 'za'];
    }
    const found = AFRICAN_COUNTRIES.find(c => c.name === country);
    return found ? [found.id] : ['ng'];
  }, [country]);

  const { data: barData, isLoading: barLoading } = useBarChartData(
    selectedIndicatorId,
    yearRange[1],
    15,
    sortOrder
  );

  const { data: timeSeriesData, isLoading: timeSeriesLoading } = useChartTimeSeries(
    selectedCountryIds,
    selectedIndicatorId,
    yearRange
  );

  const { data: regionalData, isLoading: regionalLoading } = useRegionalData(
    selectedIndicatorId,
    yearRange[1]
  );

  const isLoading = barLoading || timeSeriesLoading || regionalLoading;
  const showPlaceholder = theme === "All Themes" || indicator === "Select an indicator";

  const formattedBarData = useMemo(() => {
    if (!barData) return [];
    return barData.map((item, index) => ({
      name: item.name,
      value: item.value,
      flagEmoji: (item as { flagEmoji?: string }).flagEmoji,
      rank: index + 1,
    }));
  }, [barData]);

  const formattedTimeSeriesLines = useMemo(() => {
    if (!timeSeriesData?.length) return [];
    const keys = Object.keys(timeSeriesData[0]).filter(k => k !== 'year');
    return keys.map((key, index) => ({
      dataKey: key,
      name: key,
      color: COLOR_PALETTE[index % COLOR_PALETTE.length],
    }));
  }, [timeSeriesData]);

  // Export handler for chart data
  const handleExport = useCallback((format: ExportFormat) => {
    if (!barData || barData.length === 0) return;
    
    exportIndicatorData({
      indicatorId: selectedIndicatorId,
      year: yearRange[1],
      values: barData.map(item => ({
        countryId: AFRICAN_COUNTRIES.find(c => c.name === item.name)?.id || '',
        value: item.value
      }))
    }, format);
  }, [barData, selectedIndicatorId, yearRange]);

  return (
    <div className="border rounded-lg p-4 md:p-6 bg-card">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h3 className="text-lg md:text-xl font-bold">
            {selectedIndicator?.name || indicator}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {country !== "All Countries" ? country : "All African Countries"}, {yearRange[0]}-{yearRange[1]}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <QuickExportDropdown 
            onExport={handleExport}
            disabled={!barData || barData.length === 0}
            trigger={
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span>
              </Button>
            }
          />
          <Button variant="outline" size="sm" className="gap-1">
            <Share className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>
      </div>

      {showPlaceholder ? (
        <div className="h-[300px] border border-dashed rounded-md bg-muted/50 flex items-center justify-center">
          <p className="text-muted-foreground text-center px-4">
            Select a theme and indicator to display chart data
          </p>
        </div>
      ) : (
        <Tabs defaultValue="ranking" className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-4 h-9">
              <TabsTrigger value="ranking" className="text-xs px-2">
                <BarChart3 className="h-3 w-3 mr-1" />
                Ranking
              </TabsTrigger>
              <TabsTrigger value="trend" className="text-xs px-2">
                <LineChart className="h-3 w-3 mr-1" />
                Trend
              </TabsTrigger>
              <TabsTrigger value="regional" className="text-xs px-2">
                <PieChart className="h-3 w-3 mr-1" />
                Regional
              </TabsTrigger>
              <TabsTrigger value="compare" className="text-xs px-2">
                Compare
              </TabsTrigger>
            </TabsList>

            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'asc' | 'desc')}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Highest First</SelectItem>
                <SelectItem value="asc">Lowest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="ranking" className="mt-0">
            {isLoading ? (
              <Skeleton className="h-[400px] w-full" />
            ) : (
              <div className="h-[400px] sm:h-[500px]">
                <AYDRankingChart
                  data={formattedBarData}
                  unit={selectedIndicator?.unit === 'percentage' ? '%' : ''}
                  showRank={true}
                  colorByValue={true}
                  height={480}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="trend" className="mt-0">
            {isLoading ? (
              <Skeleton className="h-[350px] w-full" />
            ) : (
              <div className="h-[350px]">
                <AYDLineChart
                  data={timeSeriesData || []}
                  xAxisKey="year"
                  lines={formattedTimeSeriesLines}
                  unit={selectedIndicator?.unit === 'percentage' ? '%' : ''}
                  height={320}
                  showLegend={true}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="regional" className="mt-0">
            {isLoading ? (
              <Skeleton className="h-[350px] w-full" />
            ) : (
              <div className="h-[350px]">
                <AYDBarChart
                  data={regionalData || []}
                  bars={[{ dataKey: 'value', name: selectedIndicator?.shortName || 'Value' }]}
                  unit={selectedIndicator?.unit === 'percentage' ? '%' : ''}
                  height={320}
                  colorByValue={true}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="compare" className="mt-0">
            {isLoading ? (
              <Skeleton className="h-[350px] w-full" />
            ) : (
              <div className="h-[350px]">
                <AYDAreaChart
                  data={timeSeriesData || []}
                  xAxisKey="year"
                  areas={formattedTimeSeriesLines.map(line => ({
                    dataKey: line.dataKey,
                    name: line.name,
                    color: line.color,
                    fillOpacity: 0.2,
                  }))}
                  unit={selectedIndicator?.unit === 'percentage' ? '%' : ''}
                  height={320}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <div className="mt-6 p-4 bg-muted rounded-md">
        <h4 className="font-medium mb-2 text-sm">Data Notes</h4>
        <div className="text-xs text-muted-foreground space-y-1">
          {!showPlaceholder ? (
            <>
              <p><strong>Source:</strong> {selectedIndicator?.sourceDefault || 'Multiple Sources (UN, World Bank, AU)'}</p>
              <p><strong>Methodology:</strong> {selectedIndicator?.methodology || 'Standard statistical methodology'}</p>
              <p><strong>Unit:</strong> {selectedIndicator?.unit === 'percentage' ? 'Percentage (%)' : selectedIndicator?.unit || 'Number'}</p>
            </>
          ) : (
            <p>Select data filters to see information about the data source and methodology.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataChart;
