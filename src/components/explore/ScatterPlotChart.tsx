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
  primary: '#22C55E',
  secondary: '#14B8A6',
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
    <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-2xl px-4 py-3 min-w-[170px]">
      <p className="text-xs font-semibold text-white mb-1.5">{point.country}</p>
      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Education Spending</span>
          <span className="font-semibold text-emerald-400">{point.x}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Literacy Rate</span>
          <span className="font-semibold text-amber-400">{point.y}%</span>
        </div>
      </div>
      <div className="mt-2 h-[2px] rounded-full bg-gradient-to-r from-emerald-500/40 via-amber-500/30 to-transparent" />
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
    <div className="rounded-2xl border border-gray-800/60 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6">
      <h3 className="text-xl font-bold mb-1 text-white">{title}</h3>
      <p className="text-xs text-gray-500 mb-5">
        Correlation between education investment and youth literacy across 20 African countries
      </p>

      <div className="min-h-[380px] rounded-xl bg-black/20 border border-gray-800/30 p-4">
        <ResponsiveContainer width="100%" height={380}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
            <CartesianGrid
              stroke="rgba(255,255,255,0.04)"
              strokeDasharray="0"
              vertical={false}
            />
            <XAxis
              type="number"
              dataKey="x"
              name={xLabel}
              unit="%"
              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }}
              tickLine={false}
              axisLine={false}
              label={{
                value: xLabel,
                position: 'insideBottom',
                offset: -18,
                style: { fontSize: 11, fill: 'rgba(255,255,255,0.3)' },
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yLabel}
              unit="%"
              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }}
              tickLine={false}
              axisLine={false}
              width={50}
              label={{
                value: yLabel,
                angle: -90,
                position: 'insideLeft',
                offset: 5,
                style: { fontSize: 11, fill: 'rgba(255,255,255,0.3)' },
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeDasharray: '4 4' }} />
            <Scatter
              data={data}
              fill={CHART_COLORS.primary}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={1.5}
              r={7}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-5 flex items-start gap-2 px-3 py-2.5 bg-white/[0.02] border border-gray-800/30 rounded-lg">
        <div className="w-1 h-full min-h-[20px] rounded-full bg-gradient-to-b from-emerald-500/40 to-transparent flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Countries with higher education spending as a share of GDP tend to achieve higher youth literacy rates,
          though regional factors and policy effectiveness also play a significant role.
        </p>
      </div>
    </div>
  );
};

export default ScatterPlotChart;
