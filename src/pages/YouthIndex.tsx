import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, TrendingUp, TrendingDown, Minus, Info, Award, BarChart3, ArrowUpDown, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import CountryFlag from '@/components/CountryFlag';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';

const mockIndexData = [
  { rank: 1, country: "Mauritius", score: 78.4, change: 2, education: 85.2, employment: 71.3, health: 82.1, civic: 74.8 },
  { rank: 2, country: "Seychelles", score: 76.2, change: 0, education: 82.4, employment: 69.8, health: 79.5, civic: 73.2 },
  { rank: 3, country: "Tunisia", score: 72.8, change: 1, education: 79.1, employment: 62.4, health: 78.3, civic: 71.5 },
  { rank: 4, country: "Botswana", score: 71.5, change: -1, education: 76.8, employment: 65.7, health: 74.2, civic: 69.4 },
  { rank: 5, country: "South Africa", score: 70.2, change: 2, education: 74.5, employment: 58.9, health: 76.8, civic: 70.6 },
  { rank: 6, country: "Cape Verde", score: 69.8, change: 0, education: 75.2, employment: 61.4, health: 73.5, civic: 69.1 },
  { rank: 7, country: "Rwanda", score: 68.4, change: 3, education: 72.1, employment: 64.8, health: 69.7, civic: 67.0 },
  { rank: 8, country: "Morocco", score: 67.9, change: -1, education: 73.4, employment: 59.2, health: 71.8, civic: 67.2 },
  { rank: 9, country: "Ghana", score: 66.5, change: 1, education: 71.8, employment: 58.4, health: 68.9, civic: 66.8 },
  { rank: 10, country: "Kenya", score: 65.8, change: 0, education: 70.5, employment: 56.7, health: 69.2, civic: 66.9 },
  { rank: 11, country: "Egypt", score: 64.2, change: -2, education: 71.2, employment: 52.8, health: 68.4, civic: 64.5 },
  { rank: 12, country: "Namibia", score: 63.9, change: 1, education: 69.8, employment: 54.3, health: 67.5, civic: 64.0 },
  { rank: 13, country: "Senegal", score: 62.1, change: 2, education: 65.4, employment: 57.2, health: 64.8, civic: 61.0 },
  { rank: 14, country: "Tanzania", score: 61.5, change: 0, education: 64.8, employment: 58.1, health: 63.2, civic: 59.8 },
  { rank: 15, country: "Ethiopia", score: 58.4, change: 1, education: 59.2, employment: 54.6, health: 61.8, civic: 58.0 },
];

const dimensions = [
  { key: "education", label: "Education", weight: "25%", color: "text-pan-blue-500" },
  { key: "employment", label: "Employment", weight: "30%", color: "text-pan-gold-500" },
  { key: "health", label: "Health", weight: "25%", color: "text-pan-green-500" },
  { key: "civic", label: "Civic Engagement", weight: "20%", color: "text-pan-red-500" },
];

type SortField = 'rank' | 'country' | 'score' | 'change' | 'education' | 'employment' | 'health' | 'civic';

const getTierBadge = (score: number) => {
  if (score >= 70) return <Badge className="ml-2 bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 hover:bg-green-500/25">High</Badge>;
  if (score >= 60) return <Badge className="ml-2 bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25">Medium</Badge>;
  return <Badge className="ml-2 bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30 hover:bg-red-500/25">Low</Badge>;
};

const YouthIndex = () => {
  const { t } = useLanguage();
  const { preferences } = useUserPreferences();
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedRegion, setSelectedRegion] = useState("All Regions");
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCountry, setSelectedCountry] = useState<any>(null);

  // Fetch rankings from API
  const { data: apiRankings, isLoading, isError } = useQuery({
    queryKey: ['youth-index', selectedYear],
    queryFn: () => api.youthIndex.rankings({ year: parseInt(selectedYear) }),
  });

  // Transform API data to match UI format, fallback to mock
  const indexData = useMemo(() => {
    const apiData = (apiRankings as any)?.data || apiRankings;
    if (Array.isArray(apiData) && apiData.length > 0) {
      return apiData.map((r: any) => ({
        rank: r.rank,
        country: r.countryName || r.country?.name,
        score: r.overallScore,
        change: r.rankChange || 0,
        education: r.dimensions?.education ?? r.educationScore ?? 0,
        employment: r.dimensions?.employment ?? r.employmentScore ?? 0,
        health: r.dimensions?.health ?? r.healthScore ?? 0,
        civic: r.dimensions?.civic ?? r.civicScore ?? 0,
        tier: r.tier,
      }));
    }
    return mockIndexData;
  }, [apiRankings]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'rank' ? 'asc' : 'desc');
    }
  };

  const sortedData = useMemo(() => {
    return [...indexData].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const modifier = sortDirection === 'asc' ? 1 : -1;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * modifier;
      }
      return ((aVal as number) - (bVal as number)) * modifier;
    });
  }, [sortField, sortDirection]);

  const radarData = selectedCountry ? [
    { dimension: 'Education', value: selectedCountry.education, fullMark: 100 },
    { dimension: 'Employment', value: selectedCountry.employment, fullMark: 100 },
    { dimension: 'Health', value: selectedCountry.health, fullMark: 100 },
    { dimension: 'Civic', value: selectedCountry.civic, fullMark: 100 },
  ] : [];

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-pan-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-pan-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-pan-green-600";
    if (score >= 60) return "text-pan-gold-600";
    if (score >= 50) return "text-pan-blue-600";
    return "text-pan-red-600";
  };

  return (
    <>
      <header className="relative py-8 md:py-12 overflow-hidden">
        <div className="absolute inset-0 opacity-30 w-full bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:6rem_5rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-8 w-8 text-[#D4A017]" />
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tighter bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40 bg-clip-text text-transparent">{t('youthIndex.title')}</h1>
              </div>
              <p className="text-sm sm:text-base text-[#A89070]">
                {t('youthIndex.subtitle')}
              </p>
            </div>
            <div className="flex gap-2">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="py-6 md:py-8">
        <div className="container px-4 md:px-6">
          {/* Methodology Overview */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            {dimensions.map((dim) => (
              <Card key={dim.key} className="bg-white/[0.03] border-gray-800 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-semibold ${dim.color}`}>{dim.label}</span>
                    <Badge variant="secondary" className="text-xs">{dim.weight}</Badge>
                  </div>
                  <p className="text-xs text-gray-400">
                    Measures youth outcomes in {dim.label.toLowerCase()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Top 3 Highlight */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            {indexData.slice(0, 3).map((item, idx) => (
              <Card key={item.country} className={`relative overflow-hidden bg-white/[0.03] border-gray-800 rounded-2xl ${idx === 0 ? 'border-2 border-pan-gold-400' : ''}`}>
                {idx === 0 && (
                  <div className="absolute top-0 right-0 bg-pan-gold-400 text-white px-3 py-1 text-xs font-medium">
                    Top Ranked
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`text-4xl font-bold ${idx === 0 ? 'text-pan-gold-500' : idx === 1 ? 'text-gray-400' : 'text-amber-700'}`}>
                      #{item.rank}
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <CountryFlag country={item.country} size="lg" />
                        {item.country}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl font-bold ${getScoreColor(item.score)}`}>{item.score}</span>
                        <span className="text-sm text-gray-500">/ 100</span>
                        {getTrendIcon(item.change)}
                        <span className={`text-xs ${item.change > 0 ? 'text-pan-green-500' : item.change < 0 ? 'text-pan-red-500' : 'text-gray-500'}`}>
                          {item.change > 0 ? '+' : ''}{item.change} from last year
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-4 text-center">
                    <div>
                      <p className="text-xs text-gray-400">Education</p>
                      <p className="font-semibold text-sm">{item.education}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Employment</p>
                      <p className="font-semibold text-sm">{item.employment}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Health</p>
                      <p className="font-semibold text-sm">{item.health}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Civic</p>
                      <p className="font-semibold text-sm">{item.civic}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Radar Chart Dialog */}
          <Dialog open={!!selectedCountry} onOpenChange={(open) => { if (!open) setSelectedCountry(null); }}>
            <DialogContent className="sm:max-w-[500px] bg-black/95 border-gray-800">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedCountry && <CountryFlag country={selectedCountry.country} size="lg" />}
                  {selectedCountry?.country} — Dimension Breakdown
                  {selectedCountry && getTierBadge(selectedCountry.score)}
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                    <PolarGrid strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 13 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Radar
                      name={selectedCountry?.country}
                      dataKey="value"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1))"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                {selectedCountry && (
                  <div className="grid grid-cols-4 gap-4 mt-2 w-full text-center">
                    <div>
                      <p className="text-xs text-gray-400">Education</p>
                      <p className="font-bold text-sm">{selectedCountry.education}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Employment</p>
                      <p className="font-bold text-sm">{selectedCountry.employment}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Health</p>
                      <p className="font-bold text-sm">{selectedCountry.health}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Civic</p>
                      <p className="font-bold text-sm">{selectedCountry.civic}</p>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Full Rankings Table */}
          <Card className="bg-white/[0.03] border-gray-800 rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  {t('youthIndex.fullRankings')}
                </CardTitle>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Regions">All Regions</SelectItem>
                    <SelectItem value="North Africa">North Africa</SelectItem>
                    <SelectItem value="West Africa">West Africa</SelectItem>
                    <SelectItem value="East Africa">East Africa</SelectItem>
                    <SelectItem value="Central Africa">Central Africa</SelectItem>
                    <SelectItem value="Southern Africa">Southern Africa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800/50">
                      {([
                        { field: 'rank' as SortField, label: 'Rank', align: 'text-left', color: '' },
                        { field: 'country' as SortField, label: 'Country', align: 'text-left', color: '' },
                        { field: 'score' as SortField, label: 'Overall Score', align: 'text-left', color: '', hasTooltip: true },
                        { field: 'change' as SortField, label: 'Change', align: 'text-left', color: '' },
                        { field: 'education' as SortField, label: 'Education', align: 'text-center', color: 'text-pan-blue-500' },
                        { field: 'employment' as SortField, label: 'Employment', align: 'text-center', color: 'text-pan-gold-500' },
                        { field: 'health' as SortField, label: 'Health', align: 'text-center', color: 'text-pan-green-500' },
                        { field: 'civic' as SortField, label: 'Civic', align: 'text-center', color: 'text-pan-red-500' },
                      ]).map((col) => (
                        <th
                          key={col.field}
                          className={`${col.align} py-3 px-2 text-xs font-medium text-gray-400 ${col.color} cursor-pointer select-none hover:text-foreground transition-colors`}
                          onClick={() => handleSort(col.field)}
                        >
                          <span className="inline-flex items-center gap-1">
                            {col.label}
                            {col.hasTooltip && (
                              <Tooltip>
                                <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                                <TooltipContent>Weighted composite of all dimensions</TooltipContent>
                              </Tooltip>
                            )}
                            <ArrowUpDown className={`h-3 w-3 ${sortField === col.field ? 'opacity-100' : 'opacity-30'}`} />
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData.map((item) => {
                      const isMyCountry = preferences.myCountry && item.country.toLowerCase() === preferences.myCountry.toLowerCase();
                      return (
                      <tr
                        key={item.country}
                        className={`border-b border-gray-800/50 hover:bg-white/[0.04] transition-colors cursor-pointer ${isMyCountry ? 'bg-[#D4A017]/10 border-l-2 border-l-[#D4A017]' : ''}`}
                        onClick={() => setSelectedCountry(item)}
                      >
                        <td className="py-3 px-2 font-bold">{item.rank}</td>
                        <td className="py-3 px-2 font-medium">
                          <span className="inline-flex items-center gap-2">
                            <CountryFlag country={item.country} size="sm" />
                            {item.country}
                            {isMyCountry && <Badge className="ml-1 bg-primary/15 text-primary border-primary/30 text-[10px] px-1.5 py-0">Your Country</Badge>}
                          </span>
                        </td>
                        <td className={`py-3 px-2 font-bold ${getScoreColor(item.score)}`}>
                          <span className="inline-flex items-center">
                            {item.score}
                            {getTierBadge(item.score)}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="flex items-center gap-1">
                            {getTrendIcon(item.change)}
                            <span className={`text-xs ${item.change > 0 ? 'text-pan-green-500' : item.change < 0 ? 'text-pan-red-500' : 'text-gray-500'}`}>
                              {item.change > 0 ? '+' : ''}{item.change}
                            </span>
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center text-sm">{item.education}</td>
                        <td className="py-3 px-2 text-center text-sm">{item.employment}</td>
                        <td className="py-3 px-2 text-center text-sm">{item.health}</td>
                        <td className="py-3 px-2 text-center text-sm">{item.civic}</td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Methodology Note */}
          <div className="mt-8 p-4 bg-white/[0.03] border border-gray-800 rounded-2xl">
            <h3 className="font-bold mb-2">About the African Youth Index</h3>
            <p className="text-sm text-gray-400">
              The AYI is a composite indicator ranking African countries based on youth development outcomes. 
              Scores range from 0-100, calculated across four dimensions: Education (25%), Employment (30%), 
              Health (25%), and Civic Engagement (20%). Rankings are updated annually. 
              <a href="/resources/methodology" className="text-primary hover:underline ml-1">
                View full methodology
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default YouthIndex;
