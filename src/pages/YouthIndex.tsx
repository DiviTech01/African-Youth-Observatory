// ============================================
// AFRICAN YOUTH DATABASE - YOUTH INDEX RANKINGS
// Complete rankings of African countries by youth development
// ============================================

import React, { useState, useMemo, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Download, TrendingUp, TrendingDown, Minus, Info, Award, BarChart3, Search, Globe, Users, BookOpen, Heart, Briefcase, Lightbulb } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useYouthIndexRankings, useYouthIndexTopPerformers, useYouthIndexMostImproved } from '@/hooks/useData';
import { getCountryById, REGIONS, RegionType } from '@/types';
import { AYDBarChart, AYDRankingChart } from '@/components/charts';
import { QuickExportDropdown } from '@/components/export';
import { exportYouthIndexRankings, type ExportFormat } from '@/services/export';

const dimensions = [
  { key: "education", label: "Education", icon: BookOpen, weight: "20%", color: "text-blue-600", bgColor: "bg-blue-500" },
  { key: "health", label: "Health", icon: Heart, weight: "20%", color: "text-green-600", bgColor: "bg-green-500" },
  { key: "employment", label: "Employment", icon: Briefcase, weight: "25%", color: "text-amber-600", bgColor: "bg-amber-500" },
  { key: "civic", label: "Civic", icon: Users, weight: "15%", color: "text-purple-600", bgColor: "bg-purple-500" },
  { key: "innovation", label: "Innovation", icon: Lightbulb, weight: "20%", color: "text-cyan-600", bgColor: "bg-cyan-500" },
];

const YouthIndex = () => {
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch real data
  const { data: rankings, isLoading } = useYouthIndexRankings(selectedYear);
  const { data: topPerformers } = useYouthIndexTopPerformers(3, selectedYear);
  const { data: mostImproved } = useYouthIndexMostImproved(5, selectedYear);

  // Filter and search rankings
  const filteredRankings = useMemo(() => {
    if (!rankings) return [];
    
    let filtered = [...rankings];
    
    // Filter by region
    if (selectedRegion !== "all") {
      filtered = filtered.filter(item => {
        const country = getCountryById(item.countryId);
        return country?.region === selectedRegion;
      });
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        const country = getCountryById(item.countryId);
        return country?.name.toLowerCase().includes(query);
      });
    }
    
    return filtered;
  }, [rankings, selectedRegion, searchQuery]);

  const getTrendIcon = (change: number | undefined) => {
    if (!change || change === 0) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    if (score >= 50) return "text-blue-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 60) return "bg-amber-500";
    if (score >= 50) return "bg-blue-500";
    return "bg-red-500";
  };

  const getRankMedal = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (!rankings || rankings.length === 0) return null;
    
    const scores = rankings.map(r => r.indexScore);
    return {
      highest: Math.max(...scores),
      lowest: Math.min(...scores),
      average: scores.reduce((a, b) => a + b, 0) / scores.length,
      median: scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)],
    };
  }, [rankings]);

  // Export handler
  const handleExport = useCallback((format: ExportFormat) => {
    if (!rankings) return;
    
    const exportData = rankings.map(item => ({
      rank: item.rank,
      countryId: item.countryId,
      indexScore: item.indexScore,
      educationScore: item.educationScore,
      healthScore: item.healthScore,
      employmentScore: item.employmentScore,
      civicScore: item.civicScore,
      innovationScore: item.innovationScore,
    }));
    
    exportYouthIndexRankings(exportData, selectedYear, format);
  }, [rankings, selectedYear]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <header className="gradient-hero py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-8 w-8 text-primary" />
                <h1 className="section-title">African Youth Index {selectedYear}</h1>
              </div>
              <p className="section-description">
                Comprehensive ranking of 54 African countries based on youth development outcomes across 5 dimensions.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015].map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <QuickExportDropdown 
                onExport={handleExport}
                disabled={!rankings || rankings.length === 0}
                trigger={
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow py-6 md:py-8">
        <div className="container px-4 md:px-6">
          
          {/* Summary Stats */}
          {summaryStats && (
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Countries Ranked</p>
                  </div>
                  <p className="text-2xl font-bold">{rankings?.length || 54}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Highest Score</p>
                  <p className="text-2xl font-bold text-green-600">{summaryStats.highest.toFixed(1)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Continental Average</p>
                  <p className="text-2xl font-bold text-blue-600">{summaryStats.average.toFixed(1)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Median Score</p>
                  <p className="text-2xl font-bold text-amber-600">{summaryStats.median.toFixed(1)}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Methodology Overview */}
          <div className="grid gap-3 md:grid-cols-5 mb-8">
            {dimensions.map((dim) => {
              const Icon = dim.icon;
              return (
                <Card key={dim.key}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${dim.color}`} />
                        <span className={`font-semibold text-sm ${dim.color}`}>{dim.label}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">{dim.weight}</Badge>
                    </div>
                    <div className={`h-1 w-full rounded ${dim.bgColor} opacity-30`} />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Top 3 Podium */}
          {topPerformers && topPerformers.length >= 3 && (
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              {topPerformers.slice(0, 3).map((item, idx) => {
                const country = getCountryById(item.countryId);
                if (!country) return null;
                
                return (
                  <Card key={item.countryId} className={`relative overflow-hidden ${idx === 0 ? 'border-2 border-amber-400 md:order-2' : idx === 1 ? 'md:order-1' : 'md:order-3'}`}>
                    {idx === 0 && (
                      <div className="absolute top-0 right-0 bg-amber-400 text-white px-3 py-1 text-xs font-bold">
                        #1 RANKED
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">
                          {country.flagEmoji}
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{getRankMedal(item.rank)}</span>
                            <h3 className="font-bold text-lg">{country.name}</h3>
                          </div>
                          <p className="text-xs text-muted-foreground">{country.region}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-2xl font-bold ${getScoreColor(item.indexScore)}`}>
                              {item.indexScore.toFixed(1)}
                            </span>
                            <span className="text-sm text-muted-foreground">/ 100</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-2 mt-4 text-center">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Edu</p>
                          <p className="font-semibold text-xs">{item.educationScore?.toFixed(0) || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Health</p>
                          <p className="font-semibold text-xs">{item.healthScore?.toFixed(0) || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Emp</p>
                          <p className="font-semibold text-xs">{item.employmentScore?.toFixed(0) || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Civic</p>
                          <p className="font-semibold text-xs">{item.civicScore?.toFixed(0) || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Innov</p>
                          <p className="font-semibold text-xs">{item.innovationScore?.toFixed(0) || '-'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Full Rankings Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Full Rankings ({filteredRankings.length} countries)
                </CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search country..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-[180px]"
                    />
                  </div>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regions</SelectItem>
                      {REGIONS.map(region => (
                        <SelectItem key={region.name} value={region.name}>{region.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Loading rankings...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Rank</th>
                        <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Country</th>
                        <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Region</th>
                        <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">
                          <span className="flex items-center gap-1">
                            Score
                            <Tooltip>
                              <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                              <TooltipContent>Weighted composite of all 5 dimensions</TooltipContent>
                            </Tooltip>
                          </span>
                        </th>
                        <th className="text-center py-3 px-2 text-xs font-medium text-blue-600">Edu</th>
                        <th className="text-center py-3 px-2 text-xs font-medium text-green-600">Health</th>
                        <th className="text-center py-3 px-2 text-xs font-medium text-amber-600">Emp</th>
                        <th className="text-center py-3 px-2 text-xs font-medium text-purple-600">Civic</th>
                        <th className="text-center py-3 px-2 text-xs font-medium text-cyan-600">Innov</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRankings.map((item) => {
                        const country = getCountryById(item.countryId);
                        if (!country) return null;
                        
                        return (
                          <tr key={item.countryId} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-2 font-bold">
                              <span className="flex items-center gap-1">
                                {getRankMedal(item.rank) || `#${item.rank}`}
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              <span className="flex items-center gap-2">
                                <span className="text-lg">{country.flagEmoji}</span>
                                <span className="font-medium">{country.name}</span>
                              </span>
                            </td>
                            <td className="py-3 px-2 text-xs text-muted-foreground">{country.region}</td>
                            <td className="py-3 px-2">
                              <span className="flex items-center gap-2">
                                <span className={`font-bold ${getScoreColor(item.indexScore)}`}>
                                  {item.indexScore.toFixed(1)}
                                </span>
                                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden hidden md:block">
                                  <div 
                                    className={`h-full rounded-full ${getScoreBgColor(item.indexScore)}`}
                                    style={{ width: `${item.indexScore}%` }}
                                  />
                                </div>
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center text-sm">{item.educationScore?.toFixed(0) || '-'}</td>
                            <td className="py-3 px-2 text-center text-sm">{item.healthScore?.toFixed(0) || '-'}</td>
                            <td className="py-3 px-2 text-center text-sm">{item.employmentScore?.toFixed(0) || '-'}</td>
                            <td className="py-3 px-2 text-center text-sm">{item.civicScore?.toFixed(0) || '-'}</td>
                            <td className="py-3 px-2 text-center text-sm">{item.innovationScore?.toFixed(0) || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Methodology Note */}
          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-bold mb-2">About the African Youth Index</h3>
            <p className="text-sm text-muted-foreground">
              The AYI is a composite indicator ranking African countries based on youth development outcomes. 
              Scores range from 0-100, calculated across five dimensions: Education (20%), Health (20%), 
              Employment (25%), Civic Engagement (15%), and Innovation (20%). Rankings are updated annually.
              <a href="/resources/methodology" className="text-primary hover:underline ml-1">
                View full methodology →
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default YouthIndex;
