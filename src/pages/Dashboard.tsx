import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Plus, Save, Share2, Settings, Trash2,
  BarChart3, TrendingUp, AreaChart as AreaChartIcon, Radar as RadarIcon, Hash,
  LayoutDashboard, Users, Star, Clock, Sparkles,
} from 'lucide-react';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import CountryFlag from '@/components/CountryFlag';
import { getCountryMeta } from '@/lib/country-flags';

// ── Types ──────────────────────────────────────────────────────────────────────

type ChartType = 'bar' | 'line' | 'area' | 'radar' | 'stat';

interface Widget {
  id: string;
  title: string;
  chartType: ChartType;
  indicator: string;
  countries: string[];
  data: Record<string, unknown>[];
}

// ── Constants ──────────────────────────────────────────────────────────────────

const COUNTRIES = [
  'Nigeria', 'Kenya', 'South Africa', 'Ghana', 'Ethiopia',
  'Tanzania', 'Rwanda', 'Senegal', 'Egypt', 'Morocco',
];

const INDICATORS = [
  'Youth Literacy Rate',
  'Youth Unemployment Rate',
  'Health Access Index',
  'Digital Inclusion Score',
  'Secondary Enrollment Rate',
  'NEET Rate',
  'Skilled Employment Share',
  'Civic Participation Index',
];

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

// ── Mock data generators ───────────────────────────────────────────────────────

function generateTimeSeriesData(countries: string[]) {
  const years = [2018, 2019, 2020, 2021, 2022, 2023];
  return years.map((year) => {
    const entry: Record<string, unknown> = { year: year.toString() };
    countries.forEach((c) => {
      entry[c] = Math.round(40 + Math.random() * 50);
    });
    return entry;
  });
}

function generateRadarData(countries: string[]) {
  const dimensions = ['Education', 'Health', 'Employment', 'Digital', 'Civic', 'Environment'];
  return dimensions.map((dim) => {
    const entry: Record<string, unknown> = { dimension: dim };
    countries.forEach((c) => {
      entry[c] = Math.round(30 + Math.random() * 70);
    });
    return entry;
  });
}

function generateStatData() {
  return [{ value: Math.round(40 + Math.random() * 55), change: +(Math.random() * 10 - 3).toFixed(1) }];
}

// ── Default widgets ────────────────────────────────────────────────────────────

const defaultWidgets: Widget[] = [
  {
    id: 'w1',
    title: 'Youth Literacy Rates',
    chartType: 'bar',
    indicator: 'Youth Literacy Rate',
    countries: ['Nigeria', 'Kenya', 'South Africa'],
    data: generateTimeSeriesData(['Nigeria', 'Kenya', 'South Africa']),
  },
  {
    id: 'w2',
    title: 'Employment Trends',
    chartType: 'line',
    indicator: 'Youth Unemployment Rate',
    countries: ['Ghana', 'Rwanda', 'Senegal'],
    data: generateTimeSeriesData(['Ghana', 'Rwanda', 'Senegal']),
  },
  {
    id: 'w3',
    title: 'Health Access Overview',
    chartType: 'area',
    indicator: 'Health Access Index',
    countries: ['Ethiopia', 'Tanzania', 'Egypt'],
    data: generateTimeSeriesData(['Ethiopia', 'Tanzania', 'Egypt']),
  },
];

// ── Chart rendering ────────────────────────────────────────────────────────────

function WidgetChart({ widget }: { widget: Widget }) {
  const { chartType, countries, data } = widget;

  if (chartType === 'stat') {
    const stat = data[0] as { value: number; change: number };
    const positive = stat.change >= 0;
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <span className="text-5xl font-bold">{stat.value}%</span>
        <span className={`text-sm font-medium ${positive ? 'text-green-600' : 'text-red-500'}`}>
          {positive ? '+' : ''}{stat.change}% from last year
        </span>
      </div>
    );
  }

  if (chartType === 'radar') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
          <PolarRadiusAxis tick={{ fontSize: 10 }} />
          {countries.map((c, i) => (
            <Radar
              key={c}
              name={c}
              dataKey={c}
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              fill={CHART_COLORS[i % CHART_COLORS.length]}
              fillOpacity={0.15}
            />
          ))}
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    );
  }

  const ChartWrapper = chartType === 'line' ? LineChart : chartType === 'area' ? AreaChart : BarChart;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ChartWrapper data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            color: 'hsl(var(--popover-foreground))',
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {countries.map((c, i) => {
          const color = CHART_COLORS[i % CHART_COLORS.length];
          if (chartType === 'line') {
            return <Line key={c} type="monotone" dataKey={c} stroke={color} strokeWidth={2} dot={{ r: 3 }} />;
          }
          if (chartType === 'area') {
            return <Area key={c} type="monotone" dataKey={c} stroke={color} fill={color} fillOpacity={0.2} />;
          }
          return <Bar key={c} dataKey={c} fill={color} radius={[4, 4, 0, 0]} />;
        })}
      </ChartWrapper>
    </ResponsiveContainer>
  );
}

// ── Chart type selector config ─────────────────────────────────────────────────

const chartTypeOptions: { type: ChartType; label: string; icon: React.ReactNode }[] = [
  { type: 'bar', label: 'Bar', icon: <BarChart3 className="h-5 w-5" /> },
  { type: 'line', label: 'Line', icon: <TrendingUp className="h-5 w-5" /> },
  { type: 'area', label: 'Area', icon: <AreaChartIcon className="h-5 w-5" /> },
  { type: 'radar', label: 'Radar', icon: <RadarIcon className="h-5 w-5" /> },
  { type: 'stat', label: 'Stat', icon: <Hash className="h-5 w-5" /> },
];

// ── Main Dashboard component ───────────────────────────────────────────────────

const Dashboard = () => {
  const { preferences, isPersonalized } = useUserPreferences();
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets);
  const [dialogOpen, setDialogOpen] = useState(false);
  const countryMeta = isPersonalized && preferences.myCountry ? getCountryMeta(preferences.myCountry) : null;

  // Add-widget form state
  const [newChartType, setNewChartType] = useState<ChartType>('bar');
  const [newIndicator, setNewIndicator] = useState('');
  const [newCountries, setNewCountries] = useState<string[]>([]);
  const [newTitle, setNewTitle] = useState('');

  const resetForm = () => {
    setNewChartType('bar');
    setNewIndicator('');
    setNewCountries([]);
    setNewTitle('');
  };

  const handleAddWidget = () => {
    if (!newTitle.trim() || !newIndicator) return;
    const countries = newCountries.length > 0 ? newCountries : ['Nigeria'];
    const data =
      newChartType === 'stat'
        ? generateStatData()
        : newChartType === 'radar'
        ? generateRadarData(countries)
        : generateTimeSeriesData(countries);

    const widget: Widget = {
      id: `w-${Date.now()}`,
      title: newTitle.trim(),
      chartType: newChartType,
      indicator: newIndicator,
      countries,
      data,
    };
    setWidgets((prev) => [...prev, widget]);
    resetForm();
    setDialogOpen(false);
  };

  const handleRemoveWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  const toggleCountry = (country: string) => {
    setNewCountries((prev) => {
      if (prev.includes(country)) return prev.filter((c) => c !== country);
      if (prev.length >= 5) return prev;
      return [...prev, country];
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-7 w-7 text-[#D4A017]" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tighter bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40 bg-clip-text text-transparent">My Dashboard</h1>
            <p className="text-sm text-gray-400">
              Build and customize your data overview
            </p>
          </div>
        </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Widget
                </Button>
              </DialogTrigger>

              {/* ── Add Widget Dialog ──────────────────────────────────── */}
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-black/95 border-gray-800">
                <DialogHeader>
                  <DialogTitle>Add Widget</DialogTitle>
                  <DialogDescription>
                    Configure a new widget to add to your dashboard.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 pt-2">
                  {/* Chart type */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Chart Type</label>
                    <div className="flex gap-2 flex-wrap">
                      {chartTypeOptions.map((opt) => (
                        <button
                          key={opt.type}
                          type="button"
                          onClick={() => setNewChartType(opt.type)}
                          className={`flex flex-col items-center gap-1 rounded-lg border px-3 py-2 text-xs transition-colors
                            ${newChartType === opt.type
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-gray-800 hover:bg-white/[0.05]'}`}
                        >
                          {opt.icon}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Indicator */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Indicator</label>
                    <Select value={newIndicator} onValueChange={setNewIndicator}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an indicator" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDICATORS.map((ind) => (
                          <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Countries multi-select */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Countries <span className="text-gray-400 font-normal">(up to 5)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {COUNTRIES.map((country) => (
                        <label
                          key={country}
                          className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <Checkbox
                            checked={newCountries.includes(country)}
                            onCheckedChange={() => toggleCountry(country)}
                            disabled={!newCountries.includes(country) && newCountries.length >= 5}
                          />
                          {country}
                        </label>
                      ))}
                    </div>
                    {newCountries.length > 0 && (
                      <div className="flex gap-1 flex-wrap pt-1">
                        {newCountries.map((c) => (
                          <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Widget Title</label>
                    <Input
                      placeholder="e.g. Youth Literacy Comparison"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    className="w-full gap-2"
                    onClick={handleAddWidget}
                    disabled={!newTitle.trim() || !newIndicator}
                  >
                    <Plus className="h-4 w-4" />
                    Add Widget
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="gap-2">
              <Save className="h-4 w-4" />
              Save
            </Button>
            <Button variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
      </div>

      {/* ── Personalized Welcome Section ────────────────────────────────── */}
      <div>
        {isPersonalized && preferences.myCountry ? (
          <Card className="bg-white/[0.03] border-gray-800 rounded-2xl">
            <CardContent className="p-5 space-y-4">
              {/* Welcome row with country flag and stats */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <CountryFlag country={preferences.myCountry} size="lg" showName />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">
                    Welcome back! Here's your overview for {preferences.myCountry}
                  </h2>
                  {countryMeta && (
                    <div className="flex flex-wrap gap-4 mt-1.5 text-sm text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        Population: {countryMeta.population}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Youth Population: {countryMeta.youthPop}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Favorite Countries row */}
              {preferences.favoriteCountries.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-gray-400 flex items-center gap-1">
                    <Star className="h-3 w-3" /> Favorite Countries
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {preferences.favoriteCountries.map((country) => (
                      <Link
                        key={country}
                        to="/dashboard/countries"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-gray-800 bg-white/[0.03] hover:bg-white/[0.05] transition-colors text-sm"
                      >
                        <CountryFlag country={country} size="xs" />
                        <span>{country}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Recently Viewed row */}
              {preferences.recentlyViewed.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-gray-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Recently Viewed
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {preferences.recentlyViewed.map((country) => (
                      <span
                        key={country}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-gray-800 text-xs text-gray-400"
                      >
                        <CountryFlag country={country} size="xs" />
                        {country}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed border-gray-800 bg-white/[0.03] rounded-2xl">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Sparkles className="h-4 w-4 text-[#D4A017]" />
                <span>Personalize your experience to see country-specific insights and favorites.</span>
              </div>
              <Link to="/settings">
                <Button variant="outline" size="sm">
                  Personalize
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Widget Grid / Empty State ─────────────────────────────────────── */}
      <div>
        {widgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <LayoutDashboard className="h-16 w-16 text-gray-400/40 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No widgets yet</h2>
            <p className="text-gray-400 mb-6 max-w-sm">
              Start building your custom dashboard by adding your first widget.
            </p>
            <Button className="gap-2" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add your first widget
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {widgets.map((widget) => (
              <Card key={widget.id} className="flex flex-col bg-white/[0.03] border-gray-800 rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="font-semibold text-sm leading-tight truncate">{widget.title}</h3>
                    <p className="text-xs text-gray-400 truncate">{widget.indicator}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Settings className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveWidget(widget.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 px-2 pb-4">
                  <div className="h-56">
                    <WidgetChart widget={widget} />
                  </div>
                  <div className="flex gap-1 flex-wrap mt-2 px-2">
                    {widget.countries.map((c) => (
                      <Badge key={c} variant="outline" className="text-[10px] px-1.5 py-0">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
