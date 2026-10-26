import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PulseIndicator } from '@/components/PulseIndicator';
import { api } from '@/lib/api-client';

interface TickerItem {
  label: string;
  value: string;
}

interface LiveDataTickerProps {
  /** Duration in seconds for one full scroll loop */
  speed?: number;
}

const THEME_LABELS: Record<string, string> = {
  'youth-demography-participation': 'Demography & Participation',
  'education': 'Education',
  'employment': 'Employment',
  'health': 'Health',
  'entrepreneurship': 'Entrepreneurship',
  'peace-security': 'Peace & Security',
  'access-to-justice': 'Access to Justice',
};

// Every item comes from the API (platform stats + Youth Index rankings),
// mirroring the mobile ticker. The old hard-coded country figures were
// invented and contradicted the database, on every page.
export const LiveDataTicker: React.FC<LiveDataTickerProps> = ({ speed = 30 }) => {
  const statsQ = useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => api.platform.stats(),
    staleTime: 5 * 60 * 1000,
  });
  const rankingsQ = useQuery({
    queryKey: ['youth-index-rankings', 'ticker'],
    queryFn: () => api.youthIndex.rankings(),
    staleTime: 5 * 60 * 1000,
  });

  const items: TickerItem[] = useMemo(() => {
    const out: TickerItem[] = [];
    const p = statsQ.data;
    if (p) {
      out.push({ label: 'Countries', value: String(p.totalCountries) });
      out.push({ label: 'Indicators', value: String(p.totalIndicators) });
      out.push({ label: 'Data points', value: (p.totalDataPoints ?? 0).toLocaleString() });
      if (p.dataYearRange?.latest) out.push({ label: 'Latest year', value: String(p.dataYearRange.latest) });
      if (p.dataCompleteness) out.push({ label: 'Coverage', value: `${Math.round(p.dataCompleteness * 100)}%` });
    }
    const raw = rankingsQ.data as any;
    const rankings: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const scored = rankings.filter((r) => typeof r.overallScore === 'number');
    if (scored.length > 0) {
      const top = [...scored].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))[0];
      const name = top.countryName ?? top.country?.name ?? '';
      out.push({ label: 'Top AYEMI', value: `${top.flagEmoji ?? ''} ${name} · ${top.overallScore.toFixed(1)}`.trim() });
      const avg = scored.reduce((s, r) => s + r.overallScore, 0) / scored.length;
      out.push({ label: 'Continental avg', value: avg.toFixed(1) });

      const sums: Record<string, number> = {};
      const counts: Record<string, number> = {};
      for (const r of scored) {
        for (const [slug, score] of Object.entries((r.dimensions || {}) as Record<string, number | null>)) {
          if (typeof score !== 'number') continue; // insufficient data
          sums[slug] = (sums[slug] ?? 0) + score;
          counts[slug] = (counts[slug] ?? 0) + 1;
        }
      }
      const avgs = Object.entries(sums)
        .map(([slug, sum]) => ({ slug, avg: sum / (counts[slug] || 1) }))
        .sort((a, b) => b.avg - a.avg);
      if (avgs.length > 0) {
        const best = avgs[0];
        const worst = avgs[avgs.length - 1];
        out.push({ label: 'Strongest', value: `${THEME_LABELS[best.slug] ?? best.slug} · ${best.avg.toFixed(1)}` });
        out.push({ label: 'Weakest', value: `${THEME_LABELS[worst.slug] ?? worst.slug} · ${worst.avg.toFixed(1)}` });
      }
    }
    return out;
  }, [statsQ.data, rankingsQ.data]);

  const renderItems = (key: string) =>
    items.map((item, i) => (
      <span key={`${key}-${i}`} className="inline-flex items-center whitespace-nowrap px-4">
        <span className="font-semibold text-foreground">{item.label}:</span>
        <span className="ml-1 font-medium text-foreground">{item.value}</span>
        {i < items.length - 1 && (
          <span className="ml-4 text-muted-foreground/40">|</span>
        )}
      </span>
    ));

  // Nothing to show until real data arrives: no placeholder figures.
  if (items.length === 0) return null;

  return (
    <div className="relative h-9 overflow-hidden border-b bg-muted/30 text-xs flex items-center">
      {/* Gradient fades */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-background to-transparent" />

      {/* Live badge */}
      <div className="absolute left-3 top-1/2 z-20 -translate-y-1/2">
        <PulseIndicator color="green" label="Live" />
      </div>

      {/* Scrolling content — duplicate for seamless loop */}
      <div
        className="flex animate-marquee pl-16"
        style={{
          animationDuration: `${speed}s`,
        }}
      >
        {renderItems('a')}
        {renderItems('b')}
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LiveDataTicker;
