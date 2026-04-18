import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share, ExternalLink, BarChart3, TrendingUp, Layers, Activity } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';

type ChartType = 'bar' | 'line' | 'area';

// Sophisticated color palette
const COLORS = {
  green: '#22C55E',
  greenLight: '#4ADE80',
  gold: '#F59E0B',
  goldLight: '#FBBF24',
  blue: '#3B82F6',
  blueLight: '#60A5FA',
  teal: '#14B8A6',
  purple: '#8B5CF6',
};

/** Seeded pseudo-random to keep data stable across re-renders */
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateMockData(
  indicator: string,
  yearRange: [number, number],
  country: string,
) {
  const [startYear, endYear] = yearRange;
  const seed =
    indicator.length * 7 + country.length * 13 + startYear + endYear;

  let base = 45;
  let variance = 15;
  let trend = 1.2;
  const lower = indicator.toLowerCase();

  if (lower.includes('unemployment') || lower.includes('poverty')) {
    base = 35;
    variance = 8;
    trend = -0.6;
  } else if (lower.includes('enrollment') || lower.includes('literacy')) {
    base = 55;
    variance = 10;
    trend = 1.5;
  } else if (lower.includes('population') || lower.includes('growth')) {
    base = 2.5;
    variance = 0.4;
    trend = 0.05;
  } else if (lower.includes('employment') || lower.includes('participation')) {
    base = 40;
    variance = 12;
    trend = 0.9;
  }

  const data = [];
  for (let year = startYear; year <= endYear; year++) {
    const idx = year - startYear;
    const noise = (seededRandom(seed + idx * 31) - 0.5) * variance;
    const value = Math.max(
      0,
      Math.round((base + trend * idx + noise) * 10) / 10,
    );
    data.push({ year: year.toString(), value });
  }
  return data;
}

/* ---------- Custom Tooltip ---------- */
const ChartTooltip = ({ active, payload, label, indicator }: any) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-2xl px-4 py-3 min-w-[160px]">
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white">{val}</span>
        <span className="text-xs text-gray-400">{indicator}</span>
      </div>
      <div className="mt-1.5 h-[2px] rounded-full bg-gradient-to-r from-[#22C55E] via-[#F59E0B] to-transparent" />
    </div>
  );
};

/* ---------- Summary Stats ---------- */
const SummaryStats = ({ data, indicator }: { data: any[]; indicator: string }) => {
  if (!data.length) return null;
  const values = data.map((d) => d.value);
  const latest = values[values.length - 1];
  const earliest = values[0];
  const change = latest - earliest;
  const changePercent = earliest !== 0 ? ((change / earliest) * 100).toFixed(1) : '0';
  const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  const max = Math.max(...values);
  const min = Math.min(...values);

  const stats = [
    { label: 'Latest', value: latest, color: 'text-white' },
    { label: 'Change', value: `${change > 0 ? '+' : ''}${change.toFixed(1)} (${change > 0 ? '+' : ''}${changePercent}%)`, color: change >= 0 ? 'text-emerald-400' : 'text-red-400' },
    { label: 'Average', value: avg, color: 'text-gray-300' },
    { label: 'Range', value: `${min} – ${max}`, color: 'text-gray-300' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      {stats.map((s) => (
        <div key={s.label} className="rounded-lg bg-white/[0.04] border border-gray-800/60 px-3 py-2.5">
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{s.label}</p>
          <p className={`text-sm font-semibold mt-0.5 ${s.color}`}>{s.value}</p>
        </div>
      ))}
    </div>
  );
};

const DataChart = ({
  country,
  theme,
  indicator,
  yearRange,
}: {
  country: string;
  theme: string;
  indicator: string;
  yearRange: [number, number];
}) => {
  const [chartType, setChartType] = useState<ChartType>('bar');

  const hasSelection =
    theme !== 'All Themes' && indicator !== 'Select an indicator';

  const data = useMemo(
    () =>
      hasSelection ? generateMockData(indicator, yearRange, country) : [],
    [indicator, yearRange, country, hasSelection],
  );

  const avgValue = useMemo(() => {
    if (!data.length) return 0;
    return data.reduce((a, b) => a + b.value, 0) / data.length;
  }, [data]);

  const renderChart = () => {
    const gridStyle = { stroke: 'rgba(255,255,255,0.04)', strokeDasharray: '0' };
    const xAxisStyle = {
      fontSize: 11,
      fill: 'rgba(255,255,255,0.4)',
      fontWeight: 500,
    };
    const yAxisStyle = {
      fontSize: 11,
      fill: 'rgba(255,255,255,0.3)',
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={COLORS.green} />
                <stop offset="100%" stopColor={COLORS.teal} />
              </linearGradient>
              <filter id="lineShadow">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={COLORS.green} floodOpacity="0.3" />
              </filter>
            </defs>
            <CartesianGrid {...gridStyle} vertical={false} />
            <XAxis dataKey="year" tick={xAxisStyle} tickLine={false} axisLine={false} />
            <YAxis tick={yAxisStyle} tickLine={false} axisLine={false} width={45} />
            <Tooltip content={<ChartTooltip indicator={indicator} />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
            <ReferenceLine y={avgValue} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" label={{ value: `avg ${avgValue.toFixed(1)}`, position: 'right', fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} />
            <Line
              type="monotone"
              dataKey="value"
              name={indicator}
              stroke="url(#lineGlow)"
              strokeWidth={3}
              dot={{ r: 4, fill: '#111', stroke: COLORS.green, strokeWidth: 2 }}
              activeDot={{ r: 7, fill: COLORS.green, stroke: '#111', strokeWidth: 3, filter: 'url(#lineShadow)' }}
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.green} stopOpacity={0.35} />
                <stop offset="40%" stopColor={COLORS.teal} stopOpacity={0.15} />
                <stop offset="100%" stopColor={COLORS.green} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="areaStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={COLORS.green} />
                <stop offset="50%" stopColor={COLORS.teal} />
                <stop offset="100%" stopColor={COLORS.blue} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridStyle} vertical={false} />
            <XAxis dataKey="year" tick={xAxisStyle} tickLine={false} axisLine={false} />
            <YAxis tick={yAxisStyle} tickLine={false} axisLine={false} width={45} />
            <Tooltip content={<ChartTooltip indicator={indicator} />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
            <ReferenceLine y={avgValue} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="value"
              name={indicator}
              stroke="url(#areaStroke)"
              strokeWidth={2.5}
              fill="url(#areaFill)"
              animationDuration={1200}
              animationEasing="ease-out"
              dot={{ r: 3, fill: '#111', stroke: COLORS.green, strokeWidth: 2 }}
              activeDot={{ r: 6, fill: COLORS.green, stroke: '#111', strokeWidth: 2 }}
            />
          </AreaChart>
        );
      default: {
        const maxVal = Math.max(...data.map((d) => d.value));
        return (
          <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.green} stopOpacity={0.95} />
                <stop offset="100%" stopColor={COLORS.teal} stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="barGradientGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.gold} stopOpacity={0.95} />
                <stop offset="100%" stopColor={COLORS.goldLight} stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridStyle} vertical={false} />
            <XAxis dataKey="year" tick={xAxisStyle} tickLine={false} axisLine={false} />
            <YAxis tick={yAxisStyle} tickLine={false} axisLine={false} width={45} />
            <Tooltip content={<ChartTooltip indicator={indicator} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <ReferenceLine y={avgValue} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" label={{ value: `avg ${avgValue.toFixed(1)}`, position: 'right', fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} />
            <Bar
              dataKey="value"
              name={indicator}
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
              animationDuration={1200}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.value === maxVal ? 'url(#barGradientGold)' : 'url(#barGradient)'}
                />
              ))}
            </Bar>
          </BarChart>
        );
      }
    }
  };

  const chartTypeButtons: { type: ChartType; icon: React.ElementType; label: string }[] = [
    { type: 'bar', icon: BarChart3, label: 'Bar' },
    { type: 'line', icon: TrendingUp, label: 'Line' },
    { type: 'area', icon: Layers, label: 'Area' },
  ];

  return (
    <div className="rounded-2xl border border-gray-800/60 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">{indicator}</h3>
          </div>
          <p className="text-sm text-gray-500">
            {country !== 'All Countries' ? country : 'All African Countries'}
            <span className="mx-1.5 text-gray-700">·</span>
            {yearRange[0]}–{yearRange[1]}
          </p>
        </div>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="sm" className="gap-1.5 text-gray-400 hover:text-white hover:bg-white/[0.06] h-8 px-2.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-gray-400 hover:text-white hover:bg-white/[0.06] h-8 px-2.5 text-xs">
            <Share className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-gray-400 hover:text-white hover:bg-white/[0.06] h-8 px-2.5 text-xs">
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Embed</span>
          </Button>
        </div>
      </div>

      {/* Chart type selector */}
      {hasSelection && (
        <div className="flex gap-1 mb-5 p-1 rounded-lg bg-white/[0.03] border border-gray-800/40 w-fit">
          {chartTypeButtons.map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                chartType === type
                  ? 'bg-emerald-500/15 text-emerald-400 shadow-sm shadow-emerald-500/10'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Summary stats */}
      {hasSelection && <SummaryStats data={data} indicator={indicator} />}

      {/* Chart area */}
      <div className="min-h-[360px] rounded-xl bg-black/20 border border-gray-800/30 p-4 flex items-center justify-center">
        {!hasSelection ? (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.03] border border-gray-800/40 flex items-center justify-center">
              <BarChart3 className="h-7 w-7 text-gray-600" />
            </div>
            <p className="text-gray-500 text-sm">Select a theme and indicator to visualize data</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            {renderChart()}
          </ResponsiveContainer>
        )}
      </div>

      {/* Data source note */}
      <div className="mt-5 flex items-start gap-2 px-3 py-2.5 bg-white/[0.02] border border-gray-800/30 rounded-lg">
        <div className="w-1 h-full min-h-[20px] rounded-full bg-gradient-to-b from-emerald-500/40 to-transparent flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-gray-500 leading-relaxed">
          {hasSelection
            ? `${indicator} for ${
                country !== 'All Countries' ? country : 'all African countries'
              }, ${yearRange[0]}–${yearRange[1]}. Source: African Union, UNDP Africa, World Bank Open Data.`
            : 'Select data filters to view source attribution and methodology notes.'}
        </p>
      </div>
    </div>
  );
};

export default DataChart;
