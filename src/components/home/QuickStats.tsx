import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, GraduationCap, Heart, Briefcase, BookOpen } from 'lucide-react';
import { GlowCard } from '@/components/ui/spotlight-card';
import { Content } from '@/components/cms';

// Tile scaffolding only — every numeric `value` is filled in from the real
// YouthIndexScore averages at render time. The starter "—" lets the page
// render before the API responds and stays put if the score doesn't exist.
// Per admin directive: no synthesised numbers anywhere on the landing page.
const statsData = [
  { slug: 'population',      title: 'Coverage',         description: 'Countries with live data',         glowColor: 'green'  as const, icon: Users,         link: '/dashboard' },
  { slug: 'education',       title: 'Education',        description: 'Avg education dimension score',    glowColor: 'blue'   as const, icon: GraduationCap, link: '/dashboard' },
  { slug: 'health',          title: 'Health',           description: 'Avg health dimension score',       glowColor: 'purple' as const, icon: Heart,         link: '/dashboard' },
  { slug: 'employment',      title: 'Employment',       description: 'Avg employment dimension score',   glowColor: 'orange' as const, icon: Briefcase,     link: '/dashboard' },
  { slug: 'entrepreneurship',title: 'Innovation',       description: 'Avg innovation dimension score',   glowColor: 'green'  as const, icon: BookOpen,      link: '/dashboard' },
];

interface PlatformStats {
  totalCountries?: number;
  totalIndicators?: number;
  totalDataPoints?: number;
  totalThemes?: number;
  countriesWithData?: number;
  dataYearRange?: { earliest?: number; latest?: number };
}

const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';
const RANKINGS_YEAR = 2025;

const QuickStats = () => {
  // Real platform counts — countries · indicators · data points · year range.
  const { data: platformStats } = useQuery<PlatformStats | null>({
    queryKey: ['platform-stats'],
    queryFn: () => fetch(`${API_BASE}/platform/stats`).then(r => r.ok ? r.json() : null).catch(() => null),
    staleTime: 60_000,
  });

  // Real Youth Index dimension averages — same source of truth the
  // Dashboard widgets use. Each tile shows the mean of its dimension's
  // score across the 54 countries that have a computed YouthIndexScore
  // for the latest year. If the rankings haven't been computed yet (API
  // returns []), every tile renders "—" instead of a fabricated number.
  const { data: rankings } = useQuery<any[] | null>({
    queryKey: ['platform-stats', 'rankings', RANKINGS_YEAR],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/youth-index/rankings?year=${RANKINGS_YEAR}`);
      if (!res.ok) return null;
      const j = await res.json();
      return Array.isArray(j) ? j : (j?.data ?? []);
    },
    staleTime: 5 * 60_000,
  });

  const dimensionAvg = (key: 'educationScore' | 'healthScore' | 'employmentScore' | 'innovationScore'): number | null => {
    if (!Array.isArray(rankings) || rankings.length === 0) return null;
    const vals = rankings.map((r) => r[key]).filter((v) => typeof v === 'number');
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };
  const fmtScore = (v: number | null): string => (v == null ? '—' : v.toFixed(1));

  const latestYear = platformStats?.dataYearRange?.latest ?? RANKINGS_YEAR;

  // Compose every tile's `value` / `trend` from real numbers. Anything
  // unavailable falls through as "—" — never a guess.
  const liveStats = statsData.map((s) => {
    let value = '—';
    let trend = 'No data';
    let description = s.description;
    if (s.slug === 'population') {
      const countries = platformStats?.totalCountries;
      const indicators = platformStats?.totalIndicators;
      const dataPoints = platformStats?.totalDataPoints;
      const withData = platformStats?.countriesWithData;
      if (countries != null) {
        value = withData != null ? `${withData}/${countries}` : `${countries}`;
        trend = 'Live';
        description = `Countries with live data${
          indicators != null ? ` · ${indicators} indicators` : ''
        }${dataPoints != null ? ` · ${dataPoints.toLocaleString()} data points` : ''}`;
      }
    } else if (s.slug === 'education') {
      const v = dimensionAvg('educationScore');
      if (v != null) { value = fmtScore(v); trend = 'Live'; }
    } else if (s.slug === 'health') {
      const v = dimensionAvg('healthScore');
      if (v != null) { value = fmtScore(v); trend = 'Live'; }
    } else if (s.slug === 'employment') {
      const v = dimensionAvg('employmentScore');
      if (v != null) { value = fmtScore(v); trend = 'Live'; }
    } else if (s.slug === 'entrepreneurship') {
      const v = dimensionAvg('innovationScore');
      if (v != null) { value = fmtScore(v); trend = 'Live'; }
    }
    return { ...s, value, trend, description };
  });

  return (
    <section className="relative py-16 md:py-24 bg-black overflow-hidden">
      {/* Grid BG - matching hero */}
      <div
        className="absolute inset-0 opacity-40 h-full w-full
        bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)]
        bg-[size:6rem_5rem]
        [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_40%,transparent_100%)]"
      />

      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center justify-center space-y-3 md:space-y-4 text-center mb-10 md:mb-14">
          <Content
            as="h2"
            id="home.quick_stats.title"
            fallback="Key Statistics"
            className="text-3xl sm:text-4xl font-semibold tracking-tighter md:text-5xl
            bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40
            bg-clip-text text-transparent"
          />
          <Content
            as="p"
            id="home.quick_stats.subtitle"
            fallback="Explore essential data points on African youth across our five core thematic areas."
            className="max-w-[700px] text-sm sm:text-base text-[#A89070] md:text-lg"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {liveStats.map((stat, index) => {
            const isLive = stat.trend === 'Live';
            const trendClass = isLive
              ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
              : 'bg-gray-500/15 text-gray-400 ring-1 ring-gray-500/30';
            const trendLabel = isLive
              ? `Live · ${latestYear}`
              : 'Awaiting upload';
            return (
              <Link key={stat.slug} to={stat.link} className="block group">
                <GlowCard
                  glowColor={stat.glowColor}
                  customSize
                  className="w-full h-full !aspect-auto cursor-pointer transition-transform duration-300 group-hover:scale-[1.02]"
                >
                  <div className="relative z-10 flex flex-col justify-between h-full p-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <Content
                          as="p"
                          id={`home.quick_stats.${stat.slug}.title`}
                          fallback={stat.title}
                          className="text-xs sm:text-sm font-medium text-gray-400 mb-1"
                        />
                        <h3 className="text-3xl sm:text-4xl font-bold text-white">{stat.value}</h3>
                      </div>
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10">
                        <stat.icon className="w-5 h-5 text-white/80" />
                      </div>
                    </div>

                    <Content
                      as="p"
                      id={`home.quick_stats.${stat.slug}.description`}
                      fallback={stat.description}
                      className="text-xs text-gray-500 mt-3"
                    />

                    <div className="mt-4 flex items-center justify-between">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${trendClass}`}>
                        {trendLabel}
                      </span>
                    </div>

                    <div className="mt-3 h-8 flex items-end gap-[2px]">
                      {[...Array(12)].map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t bg-white/20 group-hover:bg-white/30 transition-colors"
                          style={{ height: `${20 + Math.sin(i * 0.8 + index) * 30 + 30}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </GlowCard>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default QuickStats;
