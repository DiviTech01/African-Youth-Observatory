import React, { useState } from 'react';

interface HeatmapDataPoint {
  country: string;
  indicator: string;
  value: number;
}

interface HeatmapChartProps {
  data?: HeatmapDataPoint[];
  title?: string;
}

const COUNTRIES = [
  'Nigeria',
  'Kenya',
  'South Africa',
  'Ethiopia',
  'Ghana',
  'Tanzania',
  'Rwanda',
  'Egypt',
  'Morocco',
  'Senegal',
];

const INDICATORS = [
  'Literacy Rate',
  'Youth Employment',
  'School Enrollment',
  'Health Access',
  'Digital Inclusion',
];

/** Seeded pseudo-random for stable mock data */
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateDefaultData(): HeatmapDataPoint[] {
  const points: HeatmapDataPoint[] = [];
  COUNTRIES.forEach((country, ci) => {
    INDICATORS.forEach((indicator, ii) => {
      const seed = ci * 17 + ii * 31 + 42;
      const value = Math.round(seededRandom(seed) * 80 + 15); // 15-95 range
      points.push({ country, indicator, value });
    });
  });
  return points;
}

/** Interpolate from red (low) through yellow (mid) to green (high) */
function valueToColor(value: number, min: number, max: number): string {
  const t = max === min ? 0.5 : (value - min) / (max - min);

  let r: number, g: number, b: number;
  if (t < 0.5) {
    // red -> yellow
    const s = t / 0.5;
    r = 220;
    g = Math.round(60 + 160 * s);
    b = 50;
  } else {
    // yellow -> green
    const s = (t - 0.5) / 0.5;
    r = Math.round(220 - 170 * s);
    g = Math.round(220 - 30 * s);
    b = Math.round(50 + 30 * s);
  }
  return `rgb(${r}, ${g}, ${b})`;
}

const HeatmapChart: React.FC<HeatmapChartProps> = ({ data, title = 'Youth Development Heatmap' }) => {
  const [tooltip, setTooltip] = useState<{ country: string; indicator: string; value: number; x: number; y: number } | null>(null);

  const chartData = data ?? generateDefaultData();

  const values = chartData.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  const countries = [...new Set(chartData.map((d) => d.country))];
  const indicators = [...new Set(chartData.map((d) => d.indicator))];

  const lookup = new Map<string, number>();
  chartData.forEach((d) => lookup.set(`${d.country}||${d.indicator}`, d.value));

  return (
    <div className="border rounded-lg p-6 bg-card">
      <h3 className="text-xl font-bold mb-4">{title}</h3>

      <div className="overflow-x-auto">
        <div
          className="inline-grid gap-[2px]"
          style={{
            gridTemplateColumns: `140px repeat(${indicators.length}, minmax(100px, 1fr))`,
          }}
        >
          {/* Header row */}
          <div className="h-10" />
          {indicators.map((ind) => (
            <div
              key={ind}
              className="h-10 flex items-center justify-center text-xs font-semibold text-muted-foreground px-1 text-center"
            >
              {ind}
            </div>
          ))}

          {/* Data rows */}
          {countries.map((country) => (
            <React.Fragment key={country}>
              <div className="h-10 flex items-center text-sm font-medium pr-3 truncate">
                {country}
              </div>
              {indicators.map((ind) => {
                const val = lookup.get(`${country}||${ind}`) ?? 0;
                const bg = valueToColor(val, min, max);
                return (
                  <div
                    key={`${country}-${ind}`}
                    className="h-10 rounded-sm flex items-center justify-center text-xs font-bold cursor-default transition-transform hover:scale-105 relative"
                    style={{ backgroundColor: bg, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({ country, indicator: ind, value: val, x: rect.left + rect.width / 2, y: rect.top });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    {val}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none px-3 py-2 rounded-md text-xs shadow-lg border"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: 'translate(-50%, -100%)',
            backgroundColor: 'hsl(var(--popover))',
            color: 'hsl(var(--popover-foreground))',
            borderColor: 'hsl(var(--border))',
          }}
        >
          <span className="font-semibold">{tooltip.country}</span> - {tooltip.indicator}
          <br />
          Value: <span className="font-bold">{tooltip.value}</span>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
        <span>Low</span>
        <div
          className="h-3 flex-1 max-w-[200px] rounded-sm"
          style={{
            background: 'linear-gradient(to right, rgb(220, 60, 50), rgb(220, 220, 50), rgb(50, 190, 80))',
          }}
        />
        <span>High</span>
      </div>
    </div>
  );
};

export default HeatmapChart;
