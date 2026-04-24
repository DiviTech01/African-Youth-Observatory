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
    link: '/explore?theme=population'
  },
  {
    slug: 'education',
    title: 'Education',
    value: '63%',
    description: 'Secondary enrollment rate',
    trend: '+5.7%',
    glowColor: 'blue' as const,
    icon: GraduationCap,
    link: '/explore?theme=education'
  },
  {
    slug: 'health',
    title: 'Health',
    value: '72%',
    description: 'Access to healthcare',
    trend: '+3.1%',
    glowColor: 'purple' as const,
    icon: Heart,
    link: '/explore?theme=health'
  },
  {
    slug: 'employment',
    title: 'Employment',
    value: '42%',
    description: 'Youth labor participation',
    trend: '-1.2%',
    glowColor: 'orange' as const,
    icon: Briefcase,
    link: '/explore?theme=employment'
  },
  {
    slug: 'entrepreneurship',
    title: 'Entrepreneurship',
    value: '18%',
    description: 'Youth-led businesses',
    trend: '+4.5%',
    glowColor: 'green' as const,
    icon: BookOpen,
    link: '/explore?theme=entrepreneurship'
  }
];

const QuickStats = () => {
  // Fetch real stats from API
  const { data: platformStats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => fetch(`${import.meta.env.VITE_API_URL || '/api'}/platform/stats`).then(r => r.ok ? r.json() : null).catch(() => null),
    staleTime: 60000,
  });

  // Override first stat with real data if available
  if (platformStats) {
    const countries = platformStats.countries || 54;
    const indicators = platformStats.indicators || 59;
    const dataPoints = platformStats.indicatorValues || 0;
    statsData[0] = { ...statsData[0], value: `${countries}`, description: `Countries · ${indicators} indicators` };
    if (dataPoints > 0) {
      statsData[4] = { ...statsData[4], value: dataPoints > 1000 ? `${(dataPoints/1000).toFixed(0)}K` : String(dataPoints), description: 'Data points collected', title: 'Data Points' };
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
          {statsData.map((stat, index) => (
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
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      stat.trend.startsWith('+')
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {stat.trend} since 2020
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
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickStats;
