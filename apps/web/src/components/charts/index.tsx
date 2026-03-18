// ============================================
// AFRICAN YOUTH DATABASE - CHART COMPONENTS
// Reusable chart components using Recharts
// ============================================

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// ============================================
// CHART COLORS
// ============================================

export const CHART_COLORS = {
  primary: '#22C55E',      // Pan-African Green
  secondary: '#F59E0B',    // Pan-African Gold
  tertiary: '#EF4444',     // Pan-African Red
  blue: '#3B82F6',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
  pink: '#EC4899',
  orange: '#F97316',
};

export const COLOR_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.blue,
  CHART_COLORS.tertiary,
  CHART_COLORS.purple,
  CHART_COLORS.cyan,
  CHART_COLORS.pink,
  CHART_COLORS.orange,
];

// ============================================
// CUSTOM TOOLTIP
// ============================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string; dataKey?: string }>;
  label?: string;
  unit?: string;
  formatter?: (value: number) => string;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({ 
  active, 
  payload, 
  label, 
  unit = '',
  formatter 
}) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[150px]">
      <p className="font-semibold text-sm mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center justify-between gap-4 text-sm">
          <span className="flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color || COLOR_PALETTE[index % COLOR_PALETTE.length] }}
            />
            <span className="text-muted-foreground">{entry.name || entry.dataKey}</span>
          </span>
          <span className="font-medium">
            {formatter ? formatter(entry.value) : `${entry.value.toLocaleString()}${unit}`}
          </span>
        </div>
      ))}
    </div>
  );
};

// ============================================
// LINE CHART COMPONENT
// ============================================

interface LineChartData {
  [key: string]: string | number;
}

interface AYDLineChartProps {
  data: LineChartData[];
  xAxisKey: string;
  lines: Array<{
    dataKey: string;
    name?: string;
    color?: string;
    strokeWidth?: number;
    dot?: boolean;
  }>;
  title?: string;
  description?: string;
  unit?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  animated?: boolean;
}

export const AYDLineChart: React.FC<AYDLineChartProps> = ({
  data,
  xAxisKey,
  lines,
  title,
  description,
  unit = '',
  height = 300,
  showGrid = true,
  showLegend = true,
  animated = true,
}) => {
  const chart = (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
        <XAxis 
          dataKey={xAxisKey} 
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
          tickFormatter={(value) => `${value}${unit}`}
        />
        <Tooltip content={<CustomTooltip unit={unit} />} />
        {showLegend && <Legend />}
        {lines.map((line, index) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name || line.dataKey}
            stroke={line.color || COLOR_PALETTE[index % COLOR_PALETTE.length]}
            strokeWidth={line.strokeWidth || 2}
            dot={line.dot !== false}
            activeDot={{ r: 6 }}
            isAnimationActive={animated}
            animationDuration={1500}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );

  if (!title) return chart;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{chart}</CardContent>
    </Card>
  );
};

// ============================================
// BAR CHART COMPONENT
// ============================================

interface BarChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface AYDBarChartProps {
  data: BarChartData[];
  xAxisKey?: string;
  bars: Array<{
    dataKey: string;
    name?: string;
    color?: string;
    stackId?: string;
  }>;
  title?: string;
  description?: string;
  unit?: string;
  height?: number;
  layout?: 'vertical' | 'horizontal';
  showGrid?: boolean;
  showLegend?: boolean;
  animated?: boolean;
  colorByValue?: boolean;
}

export const AYDBarChart: React.FC<AYDBarChartProps> = ({
  data,
  xAxisKey = 'name',
  bars,
  title,
  description,
  unit = '',
  height = 300,
  layout = 'vertical',
  showGrid = true,
  showLegend = false,
  animated = true,
  colorByValue = false,
}) => {
  const getBarColor = (value: number, index: number) => {
    if (!colorByValue) return COLOR_PALETTE[index % COLOR_PALETTE.length];
    if (value >= 70) return CHART_COLORS.primary;
    if (value >= 50) return CHART_COLORS.secondary;
    if (value >= 30) return CHART_COLORS.blue;
    return CHART_COLORS.tertiary;
  };

  const chart = (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart 
        data={data} 
        layout={layout === 'horizontal' ? 'vertical' : 'horizontal'}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
        {layout === 'horizontal' ? (
          <>
            <XAxis type="number" tickFormatter={(v) => `${v}${unit}`} />
            <YAxis dataKey={xAxisKey} type="category" width={100} tick={{ fontSize: 11 }} />
          </>
        ) : (
          <>
            <XAxis dataKey={xAxisKey} tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `${v}${unit}`} />
          </>
        )}
        <Tooltip content={<CustomTooltip unit={unit} />} />
        {showLegend && <Legend />}
        {bars.map((bar, barIndex) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            name={bar.name || bar.dataKey}
            fill={bar.color || COLOR_PALETTE[barIndex % COLOR_PALETTE.length]}
            stackId={bar.stackId}
            isAnimationActive={animated}
            animationDuration={1500}
            radius={[4, 4, 0, 0]}
          >
            {colorByValue && data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry[bar.dataKey] as number, index)} />
            ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );

  if (!title) return chart;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{chart}</CardContent>
    </Card>
  );
};

// ============================================
// AREA CHART COMPONENT
// ============================================

interface AYDAreaChartProps {
  data: LineChartData[];
  xAxisKey: string;
  areas: Array<{
    dataKey: string;
    name?: string;
    color?: string;
    stackId?: string;
    fillOpacity?: number;
  }>;
  title?: string;
  description?: string;
  unit?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  animated?: boolean;
}

export const AYDAreaChart: React.FC<AYDAreaChartProps> = ({
  data,
  xAxisKey,
  areas,
  title,
  description,
  unit = '',
  height = 300,
  showGrid = true,
  showLegend = true,
  animated = true,
}) => {
  const chart = (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
        <XAxis dataKey={xAxisKey} tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={(v) => `${v}${unit}`} />
        <Tooltip content={<CustomTooltip unit={unit} />} />
        {showLegend && <Legend />}
        {areas.map((area, index) => (
          <Area
            key={area.dataKey}
            type="monotone"
            dataKey={area.dataKey}
            name={area.name || area.dataKey}
            stroke={area.color || COLOR_PALETTE[index % COLOR_PALETTE.length]}
            fill={area.color || COLOR_PALETTE[index % COLOR_PALETTE.length]}
            fillOpacity={area.fillOpacity || 0.3}
            stackId={area.stackId}
            isAnimationActive={animated}
            animationDuration={1500}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );

  if (!title) return chart;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{chart}</CardContent>
    </Card>
  );
};

// ============================================
// PIE CHART COMPONENT
// ============================================

interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface AYDPieChartProps {
  data: PieChartData[];
  title?: string;
  description?: string;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  animated?: boolean;
}

export const AYDPieChart: React.FC<AYDPieChartProps> = ({
  data,
  title,
  description,
  height = 300,
  innerRadius = 0,
  outerRadius = 100,
  showLabels = true,
  showLegend = true,
  animated = true,
}) => {
  const RADIAN = Math.PI / 180;
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
    name: string;
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="currentColor"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs"
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  const chart = (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={showLabels}
          label={showLabels ? renderLabel : undefined}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
          isAnimationActive={animated}
          animationDuration={1500}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color || COLOR_PALETTE[index % COLOR_PALETTE.length]} 
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend />}
      </PieChart>
    </ResponsiveContainer>
  );

  if (!title) return chart;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{chart}</CardContent>
    </Card>
  );
};

// ============================================
// RADAR CHART COMPONENT
// ============================================

interface RadarChartData {
  subject: string;
  [key: string]: string | number;
}

interface AYDRadarChartProps {
  data: RadarChartData[];
  dataKeys: Array<{
    key: string;
    name?: string;
    color?: string;
  }>;
  title?: string;
  description?: string;
  height?: number;
  showLegend?: boolean;
  animated?: boolean;
}

export const AYDRadarChart: React.FC<AYDRadarChartProps> = ({
  data,
  dataKeys,
  title,
  description,
  height = 300,
  showLegend = true,
  animated = true,
}) => {
  const chart = (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid className="stroke-muted" />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
        {dataKeys.map((dk, index) => (
          <Radar
            key={dk.key}
            name={dk.name || dk.key}
            dataKey={dk.key}
            stroke={dk.color || COLOR_PALETTE[index % COLOR_PALETTE.length]}
            fill={dk.color || COLOR_PALETTE[index % COLOR_PALETTE.length]}
            fillOpacity={0.3}
            isAnimationActive={animated}
            animationDuration={1500}
          />
        ))}
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend />}
      </RadarChart>
    </ResponsiveContainer>
  );

  if (!title) return chart;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{chart}</CardContent>
    </Card>
  );
};

// ============================================
// RANKING BAR CHART (Horizontal with Ranking)
// ============================================

interface RankingData {
  name: string;
  value: number;
  rank?: number;
  change?: number;
  flagEmoji?: string;
}

interface AYDRankingChartProps {
  data: RankingData[];
  title?: string;
  description?: string;
  unit?: string;
  height?: number;
  showRank?: boolean;
  showChange?: boolean;
  colorByValue?: boolean;
  animated?: boolean;
}

export const AYDRankingChart: React.FC<AYDRankingChartProps> = ({
  data,
  title,
  description,
  unit = '',
  height,
  showRank = true,
  showChange = false,
  colorByValue = true,
  animated = true,
}) => {
  const getBarColor = (value: number) => {
    if (value >= 70) return CHART_COLORS.primary;
    if (value >= 50) return CHART_COLORS.secondary;
    if (value >= 30) return CHART_COLORS.blue;
    return CHART_COLORS.tertiary;
  };

  const chartHeight = height || Math.max(300, data.length * 40);

  const chart = (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
        <XAxis type="number" tickFormatter={(v) => `${v}${unit}`} domain={[0, 'auto']} />
        <YAxis 
          type="category" 
          dataKey="name" 
          tick={({ x, y, payload }) => (
            <g transform={`translate(${x},${y})`}>
              <text
                x={-10}
                y={0}
                dy={4}
                textAnchor="end"
                className="fill-current text-xs"
              >
                {showRank && <tspan className="font-semibold">#{data.findIndex(d => d.name === payload.value) + 1} </tspan>}
                {data.find(d => d.name === payload.value)?.flagEmoji && (
                  <tspan>{data.find(d => d.name === payload.value)?.flagEmoji} </tspan>
                )}
                {payload.value}
              </text>
            </g>
          )}
          width={90}
        />
        <Tooltip content={<CustomTooltip unit={unit} />} />
        <Bar
          dataKey="value"
          isAnimationActive={animated}
          animationDuration={1500}
          radius={[0, 4, 4, 0]}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={colorByValue ? getBarColor(entry.value) : COLOR_PALETTE[0]} 
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  if (!title) return chart;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{chart}</CardContent>
    </Card>
  );
};

// ============================================
// COMPARISON CHART (Multiple Countries)
// ============================================

interface ComparisonData {
  indicator: string;
  [country: string]: string | number;
}

interface AYDComparisonChartProps {
  data: ComparisonData[];
  countries: string[];
  title?: string;
  description?: string;
  unit?: string;
  height?: number;
  showLegend?: boolean;
  animated?: boolean;
}

export const AYDComparisonChart: React.FC<AYDComparisonChartProps> = ({
  data,
  countries,
  title,
  description,
  unit = '',
  height = 400,
  showLegend = true,
  animated = true,
}) => {
  const chart = (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
        <XAxis type="number" tickFormatter={(v) => `${v}${unit}`} />
        <YAxis type="category" dataKey="indicator" width={110} tick={{ fontSize: 11 }} />
        <Tooltip content={<CustomTooltip unit={unit} />} />
        {showLegend && <Legend />}
        {countries.map((country, index) => (
          <Bar
            key={country}
            dataKey={country}
            name={country}
            fill={COLOR_PALETTE[index % COLOR_PALETTE.length]}
            isAnimationActive={animated}
            animationDuration={1500}
            radius={[0, 4, 4, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );

  if (!title) return chart;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{chart}</CardContent>
    </Card>
  );
};

export default {
  LineChart: AYDLineChart,
  BarChart: AYDBarChart,
  AreaChart: AYDAreaChart,
  PieChart: AYDPieChart,
  RadarChart: AYDRadarChart,
  RankingChart: AYDRankingChart,
  ComparisonChart: AYDComparisonChart,
};
