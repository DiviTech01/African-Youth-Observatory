import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, GraduationCap, Heart, Briefcase, BookOpen } from 'lucide-react';
import { GlowCard } from '@/components/ui/spotlight-card';
import { Content } from '@/components/cms';

const statsData = [
  {
    slug: 'population',
    title: 'Population',
    value: '226M',
    description: 'African youth aged 15-24',
    trend: '+2.3%',
    glowColor: 'green' as const,
    icon: Users,
    link: '/dashboard'
  },
  {
    slug: 'education',
    title: 'Education',
    value: '63%',
    description: 'Secondary enrollment rate',
    trend: '+5.7%',
    glowColor: 'blue' as const,
    icon: GraduationCap,
    link: '/dashboard'
  },
  {
    slug: 'health',
    title: 'Health',
    value: '72%',
    description: 'Access to healthcare',
    trend: '+3.1%',
    glowColor: 'purple' as const,
    icon: Heart,
    link: '/dashboard'
  },
  {
    slug: 'employment',
    title: 'Employment',
    value: '42%',
    description: 'Youth labor participation',
    trend: '-1.2%',
    glowColor: 'orange' as const,
    icon: Briefcase,
    link: '/dashboard'
  },
  {
    slug: 'entrepreneurship',
    title: 'Entrepreneurship',
    value: '18%',
    description: 'Youth-led businesses',
    trend: '+4.5%',
    glowColor: 'green' as const,
    icon: BookOpen,
    link: '/dashboard'
  }
];

interface PlatformStats {
  totalCountries?: number;
  totalIndicators?: number;
  totalDataPoints?: number;
  totalThemes?: number;
  countriesWithData?: number;
  dataYearRange?: { earliest?: number; latest?: number };
}

const QuickStats = () => {
  // Fetch real stats from API. The endpoint returns totalCountries /
  // totalIndicators / totalDataPoints / dataYearRange — older code used
  // shorter key names that no longer exist server-side, which is why every
  // value looked frozen.
  const { data: platformStats } = useQuery<PlatformStats | null>({
    queryKey: ['platform-stats'],
    queryFn: () => fetch(`${import.meta.env.VITE_API_URL || '/api'}/platform/stats`).then(r => r.ok ? r.json() : null).catch(() => null),
    staleTime: 60_000,
  });

  // Build a fresh array per render from the API, falling back to the seeded
  // defaults if the response is empty. We mutate a copy here, never the
  // module-level `statsData` (mutating that caused stale display when the
  // API was slow to respond).
  const baseYear = platformStats?.dataYearRange?.earliest ?? new Date().getFullYear() - 5;
  const liveStats = statsData.map((s) => ({ ...s }));
  if (platformStats) {
    const countries = platformStats.totalCountries ?? 54;
    const indicators = platformStats.totalIndicators ?? 59;
    const dataPoints = platformStats.totalDataPoints ?? 0;
    const withData = platformStats.countriesWithData ?? countries;
    liveStats[0] = {
      ...liveStats[0],
      title: 'Coverage',
      value: `${withData}/${countries}`,
      description: `Countries with live data · ${indicators} indicators tracked`,
      trend: 'Live',
    };
    if (dataPoints > 0) {
      liveStats[4] = {
        ...liveStats[4],
        title: 'Data Points',
        value: dataPoints >= 1000 ? `${(dataPoints / 1000).toFixed(dataPoints >= 10_000 ? 0 : 1)}K` : String(dataPoints),
        description: 'Indicator values across the platform',
        trend: 'Live',
      };
    }
  }

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
            const isPositive = stat.trend.startsWith('+');
            const trendClass = isLive
              ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
              : isPositive
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400';
            const trendLabel = isLive
              ? `Live · since ${baseYear}`
              : `${stat.trend} since ${baseYear}`;
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
