import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, TrendingUp, TrendingDown, Minus, Info, Award, BarChart3 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const indexData = [
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

const YouthIndex = () => {
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedRegion, setSelectedRegion] = useState("All Regions");

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-pan-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-pan-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-pan-green-600";
    if (score >= 60) return "text-pan-gold-600";
    if (score >= 50) return "text-pan-blue-600";
    return "text-pan-red-600";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <header className="gradient-hero py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-8 w-8 text-primary" />
                <h1 className="section-title">African Youth Index</h1>
              </div>
              <p className="section-description">
                Comprehensive ranking of African countries based on youth development outcomes.
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

      <main className="flex-grow py-6 md:py-8">
        <div className="container px-4 md:px-6">
          {/* Methodology Overview */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            {dimensions.map((dim) => (
              <Card key={dim.key}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-semibold ${dim.color}`}>{dim.label}</span>
                    <Badge variant="secondary" className="text-xs">{dim.weight}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Measures youth outcomes in {dim.label.toLowerCase()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Top 3 Highlight */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            {indexData.slice(0, 3).map((item, idx) => (
              <Card key={item.country} className={`relative overflow-hidden ${idx === 0 ? 'border-2 border-pan-gold-400' : ''}`}>
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
                      <h3 className="font-bold text-lg">{item.country}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl font-bold ${getScoreColor(item.score)}`}>{item.score}</span>
                        <span className="text-sm text-muted-foreground">/ 100</span>
                        {getTrendIcon(item.change)}
                        <span className={`text-xs ${item.change > 0 ? 'text-pan-green-500' : item.change < 0 ? 'text-pan-red-500' : 'text-muted-foreground'}`}>
                          {item.change > 0 ? '+' : ''}{item.change} from last year
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Education</p>
                      <p className="font-semibold text-sm">{item.education}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Employment</p>
                      <p className="font-semibold text-sm">{item.employment}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Health</p>
                      <p className="font-semibold text-sm">{item.health}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Civic</p>
                      <p className="font-semibold text-sm">{item.civic}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Full Rankings Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Full Rankings
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
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Rank</th>
                      <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Country</th>
                      <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">
                        <span className="flex items-center gap-1">
                          Overall Score
                          <Tooltip>
                            <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                            <TooltipContent>Weighted composite of all dimensions</TooltipContent>
                          </Tooltip>
                        </span>
                      </th>
                      <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Change</th>
                      <th className="text-center py-3 px-2 text-xs font-medium text-muted-foreground text-pan-blue-500">Education</th>
                      <th className="text-center py-3 px-2 text-xs font-medium text-muted-foreground text-pan-gold-500">Employment</th>
                      <th className="text-center py-3 px-2 text-xs font-medium text-muted-foreground text-pan-green-500">Health</th>
                      <th className="text-center py-3 px-2 text-xs font-medium text-muted-foreground text-pan-red-500">Civic</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indexData.map((item) => (
                      <tr key={item.country} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-2 font-bold">{item.rank}</td>
                        <td className="py-3 px-2 font-medium">{item.country}</td>
                        <td className={`py-3 px-2 font-bold ${getScoreColor(item.score)}`}>{item.score}</td>
                        <td className="py-3 px-2">
                          <span className="flex items-center gap-1">
                            {getTrendIcon(item.change)}
                            <span className={`text-xs ${item.change > 0 ? 'text-pan-green-500' : item.change < 0 ? 'text-pan-red-500' : 'text-muted-foreground'}`}>
                              {item.change > 0 ? '+' : ''}{item.change}
                            </span>
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center text-sm">{item.education}</td>
                        <td className="py-3 px-2 text-center text-sm">{item.employment}</td>
                        <td className="py-3 px-2 text-center text-sm">{item.health}</td>
                        <td className="py-3 px-2 text-center text-sm">{item.civic}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Methodology Note */}
          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-bold mb-2">About the African Youth Index</h3>
            <p className="text-sm text-muted-foreground">
              The AYI is a composite indicator ranking African countries based on youth development outcomes. 
              Scores range from 0-100, calculated across four dimensions: Education (25%), Employment (30%), 
              Health (25%), and Civic Engagement (20%). Rankings are updated annually. 
              <a href="/resources/methodology" className="text-primary hover:underline ml-1">
                View full methodology
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
