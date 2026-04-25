// ============================================
// AFRICAN YOUTH OBSERVATORY - COUNTRY COMPARISON
// Compare countries across multiple indicators
// ============================================

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, BarChart3, PieChart, Filter, X, Search, Plus, TrendingUp, TrendingDown, Minus, Globe, Users, BookOpen, Heart, Briefcase, Lightbulb } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { QuickExportDropdown } from '@/components/export';
import { exportComparisonData, type ExportFormat } from '@/services/export';
import { AFRICAN_COUNTRIES, THEMES, INDICATORS, getCountryById, getIndicatorById } from '@/types';
import { useYouthIndexRankings, useComparisonData } from '@/hooks/useData';
import { AYDBarChart, AYDRadarChart, COLOR_PALETTE } from '@/components/charts';

// Theme icon mapping
const themeIcons: Record<string, React.ElementType> = {
  edu: BookOpen,
  hlt: Heart,
  emp: Briefcase,
  inn: Lightbulb,
  civ: Users,
};

const CountryComparison = () => {
  const [selectedCountryIds, setSelectedCountryIds] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>("edu");
  const [selectedIndicator, setSelectedIndicator] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [chartType, setChartType] = useState<'bar' | 'radar'>('bar');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch Youth Index for overall comparison
  const { data: youthIndexData } = useYouthIndexRankings(selectedYear);

  // Get available themes and indicators
  const availableThemes = THEMES.slice(0, 5); // Main themes
  const availableIndicators = useMemo(() => {
    return INDICATORS.filter(ind => ind.themeId === selectedTheme);
  }, [selectedTheme]);

  // Filter countries by search
  const filteredCountries = useMemo(() => {
    return AFRICAN_COUNTRIES.filter(country => 
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedCountryIds.includes(country.id)
    );
  }, [searchQuery, selectedCountryIds]);

  // Get selected countries with full data
  const selectedCountries = useMemo(() => {
    return selectedCountryIds.map(id => getCountryById(id)).filter(Boolean);
  }, [selectedCountryIds]);

  // Generate comparison data
  const comparisonData = useMemo(() => {
    if (selectedCountryIds.length === 0) return [];
    
    // Get Youth Index data for selected countries
    const countryData = selectedCountryIds.map(countryId => {
      const country = getCountryById(countryId);
      const youthIndex = youthIndexData?.find(yi => yi.countryId === countryId);
      
      // Generate consistent mock data based on country
      const seed = countryId.charCodeAt(0) + countryId.charCodeAt(1);
      const baseValue = 30 + (seed % 50);
      
      return {
        id: countryId,
        name: country?.name || countryId,
        flag: country?.flagEmoji || '🌍',
        value: youthIndex?.indexScore || baseValue,
        education: youthIndex?.educationScore || baseValue + 5,
        health: youthIndex?.healthScore || baseValue + 3,
        employment: youthIndex?.employmentScore || baseValue - 5,
        civic: youthIndex?.civicScore || baseValue + 2,
        innovation: youthIndex?.innovationScore || baseValue - 3,
        rank: youthIndex?.rank || 0,
      };
    });
    
    return countryData.sort((a, b) => b.value - a.value);
  }, [selectedCountryIds, youthIndexData]);

  // Data for charts
  const barChartData = useMemo(() => {
    return comparisonData.map((item, index) => ({
      name: item.name,
      value: item.value,
      flagEmoji: item.flag,
      fill: COLOR_PALETTE[index % COLOR_PALETTE.length],
    }));
  }, [comparisonData]);

  const radarChartData = useMemo(() => {
    const dimensions = ['Education', 'Health', 'Employment', 'Civic', 'Innovation'];
    return dimensions.map(dim => {
      const dataPoint: { subject: string; [key: string]: string | number } = { subject: dim };
      comparisonData.forEach(country => {
        const key = dim.toLowerCase() as keyof typeof country;
        dataPoint[country.name] = Number(country[key]) || 0;
      });
      return dataPoint;
    });
  }, [comparisonData]);

  // Handlers
  const handleAddCountry = (countryId: string) => {
    if (selectedCountryIds.length < 6 && !selectedCountryIds.includes(countryId)) {
      setSelectedCountryIds([...selectedCountryIds, countryId]);
      setSearchQuery("");
    }
  };

  const handleRemoveCountry = (countryId: string) => {
    setSelectedCountryIds(selectedCountryIds.filter(id => id !== countryId));
  };

  const handleExport = useCallback((format: ExportFormat) => {
    if (selectedCountryIds.length === 0) return;
    
    exportComparisonData({
      countries: selectedCountryIds,
      indicatorId: selectedIndicator || 'youth_index',
      year: selectedYear,
      values: comparisonData.map(item => ({
        countryId: item.id,
        value: item.value
      }))
    }, format);
  }, [selectedCountryIds, selectedIndicator, selectedYear, comparisonData]);

  // Filter Panel Component
  const FilterContent = () => (
    <div className="space-y-5">
      {/* Selected Countries */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Selected Countries ({selectedCountryIds.length}/6)
        </Label>
        <div className="flex flex-wrap gap-2">
          {selectedCountries.map(country => country && (
            <Badge 
              key={country.id} 
              variant="secondary" 
              className="pl-2 pr-1 py-1 flex items-center gap-1"
            >
              <span>{country.flagEmoji}</span>
              <span className="text-xs">{country.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveCountry(country.id)}
                className="h-5 w-5 p-0 ml-1 hover:bg-destructive/20"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          {selectedCountryIds.length === 0 && (
            <p className="text-xs text-muted-foreground">No countries selected</p>
          )}
        </div>
      </div>

      {/* Add Countries */}
      {selectedCountryIds.length < 6 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Add Country</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search countries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-sm"
            />
          </div>
          {searchQuery && (
            <div className="max-h-[150px] overflow-y-auto border rounded-md">
              {filteredCountries.slice(0, 10).map(country => (
                <button
                  key={country.id}
                  onClick={() => handleAddCountry(country.id)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                >
                  <span>{country.flagEmoji}</span>
                  <span>{country.name}</span>
                  <Plus className="h-3 w-3 ml-auto text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
          
          {/* Quick Add Popular Countries */}
          <div className="flex flex-wrap gap-1 mt-2">
            {['ng', 'za', 'eg', 'ke', 'et'].filter(id => !selectedCountryIds.includes(id)).slice(0, 3).map(id => {
              const country = getCountryById(id);
              return country && (
                <Button
                  key={id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddCountry(id)}
                  className="text-xs h-7 px-2"
                >
                  {country.flagEmoji} {country.name}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Year Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Year</Label>
        <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2024, 2023, 2022, 2021, 2020].map(year => (
              <SelectItem key={year} value={String(year)}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Theme Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Theme</Label>
        <Select 
          value={selectedTheme} 
          onValueChange={(value) => {
            setSelectedTheme(value);
            setSelectedIndicator("");
          }}
        >
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableThemes.map((theme) => {
              const Icon = themeIcons[theme.id] || Globe;
              return (
                <SelectItem key={theme.id} value={theme.id}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {theme.name}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Indicator Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Indicator</Label>
        <Select value={selectedIndicator} onValueChange={setSelectedIndicator}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Youth Index Score" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Youth Index Score</SelectItem>
            {availableIndicators.map((indicator) => (
              <SelectItem key={indicator.id} value={indicator.id}>
                {indicator.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Chart Type */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Chart Type</Label>
        <div className="flex gap-2">
          <Button 
            variant={chartType === 'bar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('bar')}
            className="flex-1"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Bar
          </Button>
          <Button 
            variant={chartType === 'radar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('radar')}
            className="flex-1"
          >
            <PieChart className="w-4 h-4 mr-2" />
            Radar
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container px-4 md:px-6 py-6">
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4 flex items-center justify-between">
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {selectedCountryIds.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {selectedCountryIds.length}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[320px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Compare Countries
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
        
        {selectedCountryIds.length > 0 && (
          <QuickExportDropdown 
            onExport={handleExport}
            trigger={
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            }
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Desktop Filters */}
        <div className="hidden lg:block">
          <Card className="sticky top-4">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5" />
                Compare Countries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FilterContent />
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Chart Card */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                <div>
                  <CardTitle className="text-lg">
                    {selectedIndicator ? getIndicatorById(selectedIndicator)?.name : 'Youth Index Score'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Comparing {selectedCountryIds.length} countries, {selectedYear}
                  </p>
                </div>
                <div className="hidden lg:block">
                  <QuickExportDropdown 
                    onExport={handleExport}
                    disabled={selectedCountryIds.length === 0}
                    trigger={
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Export
                      </Button>
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedCountryIds.length === 0 ? (
                <div className="h-[300px] border border-dashed rounded-lg flex items-center justify-center bg-muted/30">
                  <div className="text-center">
                    <Globe className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">Select countries to compare</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Add up to 6 countries for comparison
                    </p>
                  </div>
                </div>
              ) : chartType === 'bar' ? (
                <div className="h-[350px]">
                  <AYDBarChart 
                    data={barChartData}
                    bars={[{ dataKey: 'value', name: 'Score' }]}
                    xAxisKey="name"
                    unit=""
                    height={350}
                    colorByValue={true}
                  />
                </div>
              ) : (
                <div className="h-[350px]">
                  <AYDRadarChart
                    data={radarChartData}
                    dataKeys={selectedCountries.map((c, i) => c && ({
                      key: c.name,
                      name: c.name,
                      color: COLOR_PALETTE[i % COLOR_PALETTE.length],
                    })).filter(Boolean) as { key: string; name: string; color: string }[]}
                    height={350}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Table */}
          {selectedCountryIds.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detailed Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Country</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Rank</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Overall</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Education</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Health</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Employment</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Innovation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.map((item, index) => (
                        <tr key={item.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{item.flag}</span>
                              <span className="font-medium text-sm">{item.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="outline">#{item.rank || index + 1}</Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-bold ${item.value >= 60 ? 'text-green-600' : item.value >= 45 ? 'text-amber-600' : 'text-red-600'}`}>
                              {item.value.toFixed(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-sm">{item.education.toFixed(1)}</td>
                          <td className="py-3 px-4 text-center text-sm">{item.health.toFixed(1)}</td>
                          <td className="py-3 px-4 text-center text-sm">{item.employment.toFixed(1)}</td>
                          <td className="py-3 px-4 text-center text-sm">{item.innovation.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Insights Card */}
          {selectedCountryIds.length >= 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Highest Performer</p>
                    <p className="text-lg font-bold mt-1">
                      {comparisonData[0]?.flag} {comparisonData[0]?.name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Score: {comparisonData[0]?.value.toFixed(1)} points
                    </p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Score Gap</p>
                    <p className="text-lg font-bold mt-1">
                      {(comparisonData[0]?.value - comparisonData[comparisonData.length - 1]?.value).toFixed(1)} pts
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Between highest and lowest
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Best in Education</p>
                    <p className="text-lg font-bold mt-1">
                      {comparisonData.reduce((best, curr) => curr.education > best.education ? curr : best, comparisonData[0])?.flag}{' '}
                      {comparisonData.reduce((best, curr) => curr.education > best.education ? curr : best, comparisonData[0])?.name}
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-sm font-medium text-purple-800 dark:text-purple-200">Best in Innovation</p>
                    <p className="text-lg font-bold mt-1">
                      {comparisonData.reduce((best, curr) => curr.innovation > best.innovation ? curr : best, comparisonData[0])?.flag}{' '}
                      {comparisonData.reduce((best, curr) => curr.innovation > best.innovation ? curr : best, comparisonData[0])?.name}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CountryComparison;
