import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share, ExternalLink, BarChart3, TrendingUp, Layers } from 'lucide-react';
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
  Legend,
} from 'recharts';

type ChartType = 'bar' | 'line' | 'area';

const CHART_COLORS = {
  primary: 'hsl(var(--chart-1))',
  secondary: 'hsl(var(--chart-2))',
  tertiary: 'hsl(var(--chart-3))',
  quaternary: 'hsl(var(--chart-4))',
  quinary: 'hsl(var(--chart-5))',
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

  // Pick a realistic baseline and range based on indicator keywords
  let base = 45;
  let variance = 15;
  let trend = 1.2; // upward trend per year
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

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 10, right: 20, left: 0, bottom: 0 },
    };

    const axisProps = {
      xAxis: (
        <XAxis
          dataKey="year"
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={{ stroke: 'hsl(var(--border))' }}
        />
      ),
      yAxis: (
        <YAxis
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          width={45}
        />
      ),
      grid: (
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          vertical={false}
        />
      ),
      tooltip: (
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            color: 'hsl(var(--popover-foreground))',
            fontSize: 13,
          }}
          labelFormatter={(label) => `Year: ${label}`}
          formatter={(val: number) => [val, indicator]}
        />
      ),
      legend: (
        <Legend
          wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}
        />
      ),
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {axisProps.grid}
            {axisProps.xAxis}
            {axisProps.yAxis}
            {axisProps.tooltip}
            {axisProps.legend}
            <Line
              type="monotone"
              dataKey="value"
              name={indicator}
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              dot={{ r: 4, fill: CHART_COLORS.primary }}
              activeDot={{ r: 6, fill: CHART_COLORS.secondary }}
            />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {axisProps.grid}
            {axisProps.xAxis}
            {axisProps.yAxis}
            {axisProps.tooltip}
            {axisProps.legend}
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={CHART_COLORS.primary}
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor={CHART_COLORS.primary}
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              name={indicator}
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              fill="url(#areaGradient)"
            />
          </AreaChart>
        );
      default:
        return (
          <BarChart {...commonProps}>
            {axisProps.grid}
            {axisProps.xAxis}
            {axisProps.yAxis}
            {axisProps.tooltip}
            {axisProps.legend}
            <Bar
              dataKey="value"
              name={indicator}
              fill={CHART_COLORS.primary}
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        );
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-card">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold">{indicator}</h3>
          <p className="text-sm text-muted-foreground">
            {country !== 'All Countries' ? country : 'All African Countries'},{' '}
            {yearRange[0]}-{yearRange[1]}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Share className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Embed</span>
          </Button>
        </div>
      </div>

      {hasSelection && (
        <div className="flex gap-1 mb-4">
          <Button
            variant={chartType === 'bar' ? 'default' : 'outline'}
            size="sm"
            className="gap-1"
            onClick={() => setChartType('bar')}
          >
            <BarChart3 className="h-4 w-4" />
            Bar
          </Button>
          <Button
            variant={chartType === 'line' ? 'default' : 'outline'}
            size="sm"
            className="gap-1"
            onClick={() => setChartType('line')}
          >
            <TrendingUp className="h-4 w-4" />
            Line
          </Button>
          <Button
            variant={chartType === 'area' ? 'default' : 'outline'}
            size="sm"
            className="gap-1"
            onClick={() => setChartType('area')}
          >
            <Layers className="h-4 w-4" />
            Area
          </Button>
        </div>
      )}

      <div className="chart-container border border-dashed rounded-md bg-background p-4 flex items-center justify-center min-h-[350px]">
        {!hasSelection ? (
          <p className="text-muted-foreground">
            Select a theme and indicator to display chart data
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            {renderChart()}
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-6 p-4 bg-muted rounded-md">
        <h4 className="font-medium mb-2">Data Notes</h4>
        <p className="text-sm text-muted-foreground">
          {hasSelection
            ? `This data displays ${indicator.toLowerCase()} for ${
                country !== 'All Countries' ? country : 'all African countries'
              } from ${yearRange[0]} to ${yearRange[1]}. Source: Ministry of Youth and Sports, UNDP Africa.`
            : 'Select data filters to see information about the data source and methodology.'}
        </p>
      </div>
    </div>
  );
};

export default DataChart;
