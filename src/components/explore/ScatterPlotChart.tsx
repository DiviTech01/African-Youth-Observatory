import React, { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ScatterPlotChartProps {
  xLabel?: string;
  yLabel?: string;
  title?: string;
}

const CHART_COLORS = {
  primary: 'hsl(var(--chart-1))',
  secondary: 'hsl(var(--chart-2))',
};

interface DataPoint {
  country: string;
  x: number;
  y: number;
}

/** Seeded pseudo-random for stable mock data */
function seededRandom(seed: number) {
  const v = Math.sin(seed) * 10000;
  return v - Math.floor(v);
}

function generateMockScatterData(): DataPoint[] {
  const countries = [
    'Nigeria', 'Kenya', 'South Africa', 'Ethiopia', 'Ghana',
    'Tanzania', 'Rwanda', 'Egypt', 'Morocco', 'Senegal',
    'Uganda', 'Cameroon', 'Mozambique', 'Zambia', 'Ivory Coast',
    'Algeria', 'Tunisia', 'Botswana', 'Namibia', 'Mauritius',
  ];

  return countries.map((country, i) => {
    const seed = i * 37 + 13;
    // Education spending: 2-12% of GDP
    const x = Math.round((seededRandom(seed) * 10 + 2) * 10) / 10;
    // Literacy rate correlates with spending but with noise
    const base = 40 + x * 4.5;
    const noise = (seededRandom(seed + 7) - 0.5) * 16;
    const y = Math.round(Math.min(99, Math.max(30, base + noise)) * 10) / 10;
    return { country, x, y };
  });
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as DataPoint;
  return (
    <div
      className="rounded-md px-3 py-2 text-xs shadow-lg border"
      style={{
        backgroundColor: 'hsl(var(--popover))',
        color: 'hsl(var(--popover-foreground))',
        borderColor: 'hsl(var(--border))',
      }}
    >
      <p className="font-semibold mb-1">{point.country}</p>
      <p>Education Spending: {point.x}%</p>
      <p>Literacy Rate: {point.y}%</p>
    </div>
  );
};

const ScatterPlotChart: React.FC<ScatterPlotChartProps> = ({
  xLabel = 'Education Spending (% of GDP)',
  yLabel = 'Youth Literacy Rate (%)',
  title = 'Education Spending vs Literacy Rate',
}) => {
  const data = useMemo(() => generateMockScatterData(), []);

  return (
    <div className="border rounded-lg p-6 bg-card">
      <h3 className="text-xl font-bold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Correlation between education investment and youth literacy across 20 African countries
      </p>

      <div className="min-h-[380px]">
        <ResponsiveContainer width="100%" height={380}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              type="number"
              dataKey="x"
              name={xLabel}
              unit="%"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              label={{
                value: xLabel,
                position: 'insideBottom',
                offset: -18,
                style: { fontSize: 12, fill: 'hsl(var(--muted-foreground))' },
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yLabel}
              unit="%"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              width={50}
              label={{
                value: yLabel,
                angle: -90,
                position: 'insideLeft',
                offset: 5,
                style: { fontSize: 12, fill: 'hsl(var(--muted-foreground))' },
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter
              data={data}
              fill={CHART_COLORS.primary}
              stroke={CHART_COLORS.secondary}
              strokeWidth={1}
              r={6}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 p-4 bg-muted rounded-md">
        <h4 className="font-medium mb-1 text-sm">Insight</h4>
        <p className="text-sm text-muted-foreground">
          Countries with higher education spending as a share of GDP tend to achieve higher youth literacy rates,
          though regional factors and policy effectiveness also play a significant role.
        </p>
      </div>
    </div>
  );
};

export default ScatterPlotChart;
