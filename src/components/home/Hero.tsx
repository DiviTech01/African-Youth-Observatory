import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, TrendingUp, Globe, Database } from 'lucide-react';

const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';

interface HeroPlatformStats {
  totalCountries?: number;
  totalIndicators?: number;
  totalDataPoints?: number;
}

const Hero = () => {
  // Real headline numbers from /platform/stats. We deliberately don't ship
  // a hardcoded fallback — until the API responds, the tile shows "—" so
  // visitors never see a fabricated count.
  const { data: stats } = useQuery<HeroPlatformStats | null>({
    queryKey: ['hero-platform-stats'],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/platform/stats`);
      return r.ok ? r.json() : null;
    },
    staleTime: 60_000,
  });
  const fmt = (v: number | undefined): string => {
    if (v == null) return '—';
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 10_000) return `${(v / 1000).toFixed(0)}K`;
    if (v >= 1000) return v.toLocaleString();
    return String(v);
  };
  return (
    <section className="py-10 sm:py-16 md:py-24 gradient-hero">
      <div className="container px-4 md:px-6">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
          <div className="flex flex-col justify-center space-y-6 text-center lg:text-left">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
                Africa's Youth Data Intelligence Platform
              </div>
              <h1 className="text-3xl font-display font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                African Youth Observatory
              </h1>
              <p className="max-w-[600px] text-muted-foreground text-base sm:text-lg md:text-xl mx-auto lg:mx-0">
                Powering policy, research, innovation, and investment decisions with trusted, 
                accessible youth data across all 54 African countries.
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md mx-auto lg:mx-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search countries, indicators, themes..."
                className="pl-10 pr-4 py-6 text-base rounded-full border-2 focus:border-primary"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Link to="/explore">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  <Database className="h-4 w-4" />
                  Explore Data
                </Button>
              </Link>
              <Link to="/youth-index">
                <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Youth Index
                </Button>
              </Link>
              <Link to="/compare">
                <Button variant="ghost" size="lg" className="w-full sm:w-auto gap-2">
                  Compare Countries
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Live platform stats — real counts from the database. Each
                tile shows "—" until the API resolves; we never display a
                fabricated number. */}
            <div className="grid grid-cols-3 gap-4 pt-4 max-w-md mx-auto lg:mx-0">
              <div className="text-center lg:text-left">
                <p className="text-2xl sm:text-3xl font-bold text-primary tabular-nums">{fmt(stats?.totalCountries)}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Countries</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="text-2xl sm:text-3xl font-bold text-primary tabular-nums">{fmt(stats?.totalIndicators)}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Indicators</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="text-2xl sm:text-3xl font-bold text-primary tabular-nums">{fmt(stats?.totalDataPoints)}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Data Points</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center order-first lg:order-last">
            <div className="relative w-full max-w-[300px] sm:max-w-[400px] md:max-w-[450px] aspect-square">
              <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse-gentle"></div>
              <div className="absolute inset-4 rounded-full bg-primary/5 flex items-center justify-center">
                <Globe className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 text-primary/60" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
