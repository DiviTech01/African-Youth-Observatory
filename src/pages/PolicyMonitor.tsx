import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Shield, ChevronDown, ChevronUp, Download, CheckCircle, XCircle,
  Search, FileCheck2, Trophy, AlertTriangle, BookCheck, Calendar, Star,
} from 'lucide-react';
import CountryFlag from '@/components/CountryFlag';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api-client';

interface PolicyData {
  country: string;
  aycRatified: boolean;
  nationalYouthPolicy: boolean;
  policyYear: number | null;
  complianceScore: number;
  wpay: boolean;
  aycArticles: { article: string; status: 'compliant' | 'partial' | 'non-compliant' }[];
  timelineEvents: { year: number; event: string }[];
}

const policyData: PolicyData[] = [
  {
    country: 'Rwanda',
    aycRatified: true,
    nationalYouthPolicy: true,
    policyYear: 2020,
    complianceScore: 82,
    wpay: true,
    aycArticles: [
      { article: 'Art. 2 – Non-discrimination', status: 'compliant' },
      { article: 'Art. 10 – Education & Skills', status: 'compliant' },
      { article: 'Art. 15 – Employment', status: 'partial' },
      { article: 'Art. 16 – Health', status: 'compliant' },
    ],
    timelineEvents: [
      { year: 2007, event: 'First National Youth Policy' },
      { year: 2015, event: 'AYC Ratification' },
      { year: 2020, event: 'Revised Youth Policy adopted' },
    ],
  },
  {
    country: 'Kenya',
    aycRatified: true,
    nationalYouthPolicy: true,
    policyYear: 2019,
    complianceScore: 75,
    wpay: true,
    aycArticles: [
      { article: 'Art. 2 – Non-discrimination', status: 'compliant' },
      { article: 'Art. 10 – Education & Skills', status: 'compliant' },
      { article: 'Art. 15 – Employment', status: 'partial' },
      { article: 'Art. 16 – Health', status: 'partial' },
    ],
    timelineEvents: [
      { year: 2006, event: 'National Youth Policy launched' },
      { year: 2014, event: 'AYC Ratified' },
      { year: 2019, event: 'Updated Youth Policy' },
    ],
  },
  {
    country: 'South Africa',
    aycRatified: true,
    nationalYouthPolicy: true,
    policyYear: 2020,
    complianceScore: 78,
    wpay: true,
    aycArticles: [
      { article: 'Art. 2 – Non-discrimination', status: 'compliant' },
      { article: 'Art. 10 – Education & Skills', status: 'compliant' },
      { article: 'Art. 15 – Employment', status: 'partial' },
      { article: 'Art. 16 – Health', status: 'compliant' },
    ],
    timelineEvents: [
      { year: 2009, event: 'National Youth Policy adopted' },
      { year: 2016, event: 'AYC Ratification' },
      { year: 2020, event: 'Integrated Youth Dev. Strategy' },
    ],
  },
  {
    country: 'Ghana',
    aycRatified: true,
    nationalYouthPolicy: true,
    policyYear: 2022,
    complianceScore: 71,
    wpay: false,
    aycArticles: [
      { article: 'Art. 2 – Non-discrimination', status: 'compliant' },
      { article: 'Art. 10 – Education & Skills', status: 'partial' },
      { article: 'Art. 15 – Employment', status: 'partial' },
      { article: 'Art. 16 – Health', status: 'partial' },
    ],
    timelineEvents: [
      { year: 2010, event: 'National Youth Policy' },
      { year: 2017, event: 'AYC Ratified' },
      { year: 2022, event: 'Revised Youth Policy' },
    ],
  },
  {
    country: 'Nigeria',
    aycRatified: true,
    nationalYouthPolicy: true,
    policyYear: 2019,
    complianceScore: 58,
    wpay: false,
    aycArticles: [
      { article: 'Art. 2 – Non-discrimination', status: 'partial' },
      { article: 'Art. 10 – Education & Skills', status: 'partial' },
      { article: 'Art. 15 – Employment', status: 'non-compliant' },
      { article: 'Art. 16 – Health', status: 'partial' },
    ],
    timelineEvents: [
      { year: 2009, event: 'Second National Youth Policy' },
      { year: 2014, event: 'AYC Ratification' },
      { year: 2019, event: 'Revised Youth Policy' },
    ],
  },
  {
    country: 'Senegal',
    aycRatified: true,
    nationalYouthPolicy: true,
    policyYear: 2018,
    complianceScore: 66,
    wpay: true,
    aycArticles: [
      { article: 'Art. 2 – Non-discrimination', status: 'compliant' },
      { article: 'Art. 10 – Education & Skills', status: 'partial' },
      { article: 'Art. 15 – Employment', status: 'partial' },
      { article: 'Art. 16 – Health', status: 'compliant' },
    ],
    timelineEvents: [
      { year: 2006, event: 'Youth Policy Framework' },
      { year: 2013, event: 'AYC Ratified' },
      { year: 2018, event: 'Updated Youth Policy' },
    ],
  },
  {
    country: 'Ethiopia',
    aycRatified: true,
    nationalYouthPolicy: true,
    policyYear: 2017,
    complianceScore: 53,
    wpay: false,
    aycArticles: [
      { article: 'Art. 2 – Non-discrimination', status: 'partial' },
      { article: 'Art. 10 – Education & Skills', status: 'partial' },
      { article: 'Art. 15 – Employment', status: 'non-compliant' },
      { article: 'Art. 16 – Health', status: 'partial' },
    ],
    timelineEvents: [
      { year: 2004, event: 'National Youth Policy' },
      { year: 2012, event: 'AYC Ratified' },
      { year: 2017, event: 'Revised Youth Policy' },
    ],
  },
  {
    country: 'Tanzania',
    aycRatified: true,
    nationalYouthPolicy: true,
    policyYear: 2021,
    complianceScore: 64,
    wpay: false,
    aycArticles: [
      { article: 'Art. 2 – Non-discrimination', status: 'compliant' },
      { article: 'Art. 10 – Education & Skills', status: 'partial' },
      { article: 'Art. 15 – Employment', status: 'partial' },
      { article: 'Art. 16 – Health', status: 'partial' },
    ],
    timelineEvents: [
      { year: 2007, event: 'Youth Development Policy' },
      { year: 2016, event: 'AYC Ratified' },
      { year: 2021, event: 'Revised Youth Policy' },
    ],
  },
  {
    country: 'Morocco',
    aycRatified: false,
    nationalYouthPolicy: true,
    policyYear: 2021,
    complianceScore: 48,
    wpay: false,
    aycArticles: [
      { article: 'Art. 2 – Non-discrimination', status: 'partial' },
      { article: 'Art. 10 – Education & Skills', status: 'partial' },
      { article: 'Art. 15 – Employment', status: 'non-compliant' },
      { article: 'Art. 16 – Health', status: 'partial' },
    ],
    timelineEvents: [
      { year: 2014, event: 'National Youth Strategy' },
      { year: 2021, event: 'Updated Youth Strategy' },
    ],
  },
  {
    country: 'Egypt',
    aycRatified: false,
    nationalYouthPolicy: true,
    policyYear: 2016,
    complianceScore: 42,
    wpay: false,
    aycArticles: [
      { article: 'Art. 2 – Non-discrimination', status: 'non-compliant' },
      { article: 'Art. 10 – Education & Skills', status: 'partial' },
      { article: 'Art. 15 – Employment', status: 'non-compliant' },
      { article: 'Art. 16 – Health', status: 'partial' },
    ],
    timelineEvents: [
      { year: 2009, event: 'Youth Program launched' },
      { year: 2016, event: 'Youth Strategy 2016–2030' },
    ],
  },
  {
    country: 'Botswana',
    aycRatified: true,
    nationalYouthPolicy: true,
    policyYear: 2021,
    complianceScore: 74,
    wpay: true,
    aycArticles: [
      { article: 'Art. 2 – Non-discrimination', status: 'compliant' },
      { article: 'Art. 10 – Education & Skills', status: 'compliant' },
      { article: 'Art. 15 – Employment', status: 'partial' },
      { article: 'Art. 16 – Health', status: 'compliant' },
    ],
    timelineEvents: [
      { year: 2010, event: 'Revised National Youth Policy' },
      { year: 2015, event: 'AYC Ratified' },
      { year: 2021, event: 'Updated Youth Policy' },
    ],
  },
  {
    country: 'Mauritius',
    aycRatified: true,
    nationalYouthPolicy: true,
    policyYear: 2023,
    complianceScore: 86,
    wpay: true,
    aycArticles: [
      { article: 'Art. 2 – Non-discrimination', status: 'compliant' },
      { article: 'Art. 10 – Education & Skills', status: 'compliant' },
      { article: 'Art. 15 – Employment', status: 'compliant' },
      { article: 'Art. 16 – Health', status: 'compliant' },
    ],
    timelineEvents: [
      { year: 2005, event: 'First Youth Policy' },
      { year: 2013, event: 'AYC Ratified' },
      { year: 2023, event: 'New Youth Policy launched' },
    ],
  },
  {
    country: 'Cameroon',
    aycRatified: true,
    nationalYouthPolicy: false,
    policyYear: null,
    complianceScore: 38,
    wpay: false,
    aycArticles: [
      { article: 'Art. 2 – Non-discrimination', status: 'non-compliant' },
      { article: 'Art. 10 – Education & Skills', status: 'non-compliant' },
      { article: 'Art. 15 – Employment', status: 'non-compliant' },
      { article: 'Art. 16 – Health', status: 'partial' },
    ],
    timelineEvents: [
      { year: 2012, event: 'AYC Ratified' },
      { year: 2015, event: 'Draft Youth Policy (not adopted)' },
    ],
  },
  {
    country: 'Uganda',
    aycRatified: true,
    nationalYouthPolicy: true,
    policyYear: 2020,
    complianceScore: 62,
    wpay: false,
    aycArticles: [
      { article: 'Art. 2 – Non-discrimination', status: 'compliant' },
      { article: 'Art. 10 – Education & Skills', status: 'partial' },
      { article: 'Art. 15 – Employment', status: 'non-compliant' },
      { article: 'Art. 16 – Health', status: 'partial' },
    ],
    timelineEvents: [
      { year: 2001, event: 'National Youth Policy' },
      { year: 2016, event: 'AYC Ratified' },
      { year: 2020, event: 'Revised National Youth Policy' },
    ],
  },
  {
    country: 'DRC',
    aycRatified: false,
    nationalYouthPolicy: false,
    policyYear: null,
    complianceScore: 22,
    wpay: false,
    aycArticles: [
      { article: 'Art. 2 – Non-discrimination', status: 'non-compliant' },
      { article: 'Art. 10 – Education & Skills', status: 'non-compliant' },
      { article: 'Art. 15 – Employment', status: 'non-compliant' },
      { article: 'Art. 16 – Health', status: 'non-compliant' },
    ],
    timelineEvents: [
      { year: 2009, event: 'Youth Ministry established' },
    ],
  },
];

type Tier = 'high' | 'medium' | 'low';

const tierFor = (score: number): Tier => (score > 70 ? 'high' : score >= 50 ? 'medium' : 'low');

const TIER_ACCENT: Record<Tier, { hex: string; soft: string; ring: string; label: string }> = {
  high:   { hex: '#22C55E', soft: 'rgba(34,197,94,0.12)',  ring: 'rgba(34,197,94,0.35)',  label: 'High' },
  medium: { hex: '#F59E0B', soft: 'rgba(245,158,11,0.12)', ring: 'rgba(245,158,11,0.35)', label: 'Medium' },
  low:    { hex: '#EF4444', soft: 'rgba(239,68,68,0.12)',  ring: 'rgba(239,68,68,0.35)',  label: 'Low' },
};

const getArticleStatusBadge = (status: string) => {
  switch (status) {
    case 'compliant':
      return <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-[10px] uppercase tracking-wider">Compliant</Badge>;
    case 'partial':
      return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] uppercase tracking-wider">Partial</Badge>;
    case 'non-compliant':
      return <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px] uppercase tracking-wider">Non-compliant</Badge>;
    default:
      return null;
  }
};

/* Circular score gauge (SVG) */
const ScoreGauge: React.FC<{ score: number; size?: number }> = ({ score, size = 56 }) => {
  const tier = tierFor(score);
  const accent = TIER_ACCENT[tier].hex;
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-bold tabular-nums" style={{ fontSize: size * 0.32, color: accent }}>{score}</span>
      </div>
    </div>
  );
};

const PolicyMonitor = () => {
  const { t } = useLanguage();
  const { preferences } = useUserPreferences();
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | Tier>('all');
  const [sortBy, setSortBy] = useState<'score-desc' | 'score-asc' | 'name'>('score-desc');

  // Fetch real rankings from API
  const { data: apiRankings } = useQuery({
    queryKey: ['policy-rankings'],
    queryFn: () => api.policyMonitor.rankings(),
  });

  const activePolicyData = useMemo(() => {
    const apiData = (apiRankings as any)?.data || apiRankings;
    if (Array.isArray(apiData) && apiData.length > 0) {
      return apiData.map((r: any) => ({
        country: r.countryName || r.country?.name || 'Unknown',
        aycRatified: r.aycRatified ?? false,
        nationalYouthPolicy: r.yearAdopted !== null,
        policyYear: r.yearAdopted || null,
        complianceScore: r.complianceScore ?? 0,
        wpay: r.wpayCompliant ?? false,
        aycArticles: [],
        timelineEvents: [],
      })) as PolicyData[];
    }
    return policyData;
  }, [apiRankings]);

  const toggleExpand = (country: string) => {
    setExpandedCountry((prev) => (prev === country ? null : country));
  };

  const ratifiedCount = activePolicyData.filter((d) => d.aycRatified).length;
  const withPolicyCount = activePolicyData.filter((d) => d.nationalYouthPolicy).length;
  const avgScore =
    activePolicyData.length > 0
      ? Math.round(activePolicyData.reduce((sum, d) => sum + d.complianceScore, 0) / activePolicyData.length)
      : 0;
  const wpayCount = activePolicyData.filter((d) => d.wpay).length;

  // Tier breakdown for the distribution visualization
  const distribution = useMemo(() => {
    const high = activePolicyData.filter((d) => tierFor(d.complianceScore) === 'high').length;
    const medium = activePolicyData.filter((d) => tierFor(d.complianceScore) === 'medium').length;
    const low = activePolicyData.filter((d) => tierFor(d.complianceScore) === 'low').length;
    const total = activePolicyData.length || 1;
    return {
      high, medium, low, total,
      highPct: (high / total) * 100,
      mediumPct: (medium / total) * 100,
      lowPct: (low / total) * 100,
    };
  }, [activePolicyData]);

  // Search + filter + sort
  const visiblePolicyData = useMemo(() => {
    let arr = activePolicyData;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter((d) => d.country.toLowerCase().includes(q));
    }
    if (tierFilter !== 'all') {
      arr = arr.filter((d) => tierFor(d.complianceScore) === tierFilter);
    }
    arr = [...arr].sort((a, b) => {
      if (sortBy === 'score-desc') return b.complianceScore - a.complianceScore;
      if (sortBy === 'score-asc') return a.complianceScore - b.complianceScore;
      return a.country.localeCompare(b.country);
    });
    return arr;
  }, [activePolicyData, search, tierFilter, sortBy]);

  const topPerformer = useMemo(
    () => [...activePolicyData].sort((a, b) => b.complianceScore - a.complianceScore)[0],
    [activePolicyData],
  );

  return (
    <>
      <header className="relative pt-6 pb-3 md:pt-8 md:pb-4 overflow-hidden">
        <div className="absolute inset-0 opacity-30 w-full bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:6rem_5rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="relative z-10 container px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-8 w-8 text-primary" />
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tighter bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40 bg-clip-text text-transparent">{t('policy.title')}</h1>
              </div>
              <p className="text-sm sm:text-base text-[#A89070]">
                {t('policy.subtitle')}
              </p>
            </div>
            <Button variant="outline" className="gap-2 self-start">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export Report</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="pt-2 md:pt-3 pb-6 md:pb-8">
        <div className="container px-4 md:px-6">
          {/* Summary Cards — richer design with icons + accent bars */}
          <div className="grid gap-3 md:grid-cols-4 mb-5">
            {[
              { icon: FileCheck2, label: 'AYC Ratified', value: ratifiedCount, of: activePolicyData.length, accent: '#22C55E', sub: 'Charter signed & ratified' },
              { icon: BookCheck, label: 'National Youth Policy', value: withPolicyCount, of: activePolicyData.length, accent: '#3B82F6', sub: 'In-force national framework' },
              { icon: Trophy, label: 'Avg. Compliance', value: avgScore, of: 100, accent: avgScore > 70 ? '#22C55E' : avgScore >= 50 ? '#F59E0B' : '#EF4444', sub: 'Across tracked countries', isPercent: true },
              { icon: Star, label: 'WPAY Aligned', value: wpayCount, of: activePolicyData.length, accent: '#A855F7', sub: 'World Programme of Action for Youth' },
            ].map((s) => {
              const Icon = s.icon;
              const pct = (s.value / Math.max(s.of, 1)) * 100;
              return (
                <Card key={s.label} className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] border-gray-800/80 rounded-2xl overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ background: s.accent + '20', color: s.accent }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{s.label}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-bold tabular-nums" style={{ color: s.accent }}>
                        {s.value}{s.isPercent ? '%' : ''}
                      </span>
                      {!s.isPercent && (
                        <span className="text-sm text-gray-500 font-medium">/ {s.of}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">{s.sub}</p>
                    <div className="h-1 bg-white/[0.06] rounded-full mt-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, pct)}%`, background: s.accent }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Distribution + Top performer */}
          <div className="grid gap-3 md:grid-cols-3 mb-6">
            <Card className="md:col-span-2 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border-gray-800/80 rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Compliance Distribution</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Where each country sits in the framework</p>
                  </div>
                  <span className="text-xs text-gray-500 tabular-nums">{distribution.total} countries</span>
                </div>
                <div className="flex h-9 rounded-lg overflow-hidden border border-white/[0.06]">
                  <div className="flex items-center justify-center text-[11px] font-semibold text-white" style={{ width: `${distribution.highPct}%`, background: '#22C55E' }}>
                    {distribution.high > 0 && <span className="px-2 truncate">{distribution.high} High</span>}
                  </div>
                  <div className="flex items-center justify-center text-[11px] font-semibold text-white" style={{ width: `${distribution.mediumPct}%`, background: '#F59E0B' }}>
                    {distribution.medium > 0 && <span className="px-2 truncate">{distribution.medium} Medium</span>}
                  </div>
                  <div className="flex items-center justify-center text-[11px] font-semibold text-white" style={{ width: `${distribution.lowPct}%`, background: '#EF4444' }}>
                    {distribution.low > 0 && <span className="px-2 truncate">{distribution.low} Low</span>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {(['high','medium','low'] as Tier[]).map((t) => {
                    const accent = TIER_ACCENT[t];
                    const cnt = distribution[t];
                    const pct = distribution[(`${t}Pct`) as keyof typeof distribution] as number;
                    return (
                      <div key={t} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: accent.hex }} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-200 leading-tight">{accent.label}</p>
                          <p className="text-[10px] text-gray-500">{cnt} · {pct.toFixed(0)}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {topPerformer && (
              <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20 rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="h-4 w-4 text-emerald-400" />
                    <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">Top Performer</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ScoreGauge score={topPerformer.complianceScore} size={64} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <CountryFlag country={topPerformer.country} size="md" />
                        <h3 className="text-base font-bold text-white truncate">{topPerformer.country}</h3>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Policy adopted {topPerformer.policyYear ?? '—'} · {topPerformer.aycRatified ? 'AYC ratified' : 'AYC not ratified'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Filters bar */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
              <Input
                placeholder="Search country…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs bg-white/[0.03] border-gray-800"
              />
            </div>
            <Select value={tierFilter} onValueChange={(v) => setTierFilter(v as 'all' | Tier)}>
              <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs bg-white/[0.03] border-gray-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All tiers</SelectItem>
                <SelectItem value="high" className="text-xs">High (&gt;70%)</SelectItem>
                <SelectItem value="medium" className="text-xs">Medium (50–70%)</SelectItem>
                <SelectItem value="low" className="text-xs">Low (&lt;50%)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-full sm:w-[170px] h-9 text-xs bg-white/[0.03] border-gray-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score-desc" className="text-xs">Highest score</SelectItem>
                <SelectItem value="score-asc" className="text-xs">Lowest score</SelectItem>
                <SelectItem value="name" className="text-xs">A → Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Country card grid */}
          {visiblePolicyData.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-gray-800 bg-white/[0.02]">
              <AlertTriangle className="h-8 w-8 text-gray-500 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No countries match your filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {visiblePolicyData.map((item) => {
                const isMyCountry = preferences.myCountry && item.country.toLowerCase() === preferences.myCountry.toLowerCase();
                const tier = tierFor(item.complianceScore);
                const accent = TIER_ACCENT[tier];
                const isExpanded = expandedCountry === item.country;
                return (
                  <Card
                    key={item.country}
                    className={`bg-gradient-to-b from-white/[0.04] to-white/[0.01] border-gray-800/80 rounded-2xl overflow-hidden hover:border-gray-700 transition-all ${
                      isMyCountry ? 'ring-1 ring-[#D4A017]/40' : ''
                    } ${isExpanded ? 'md:col-span-2 xl:col-span-3' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <ScoreGauge score={item.complianceScore} size={56} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <CountryFlag country={item.country} size="sm" />
                            <h3 className="text-sm font-bold text-white truncate">{item.country}</h3>
                            {isMyCountry && (
                              <Badge className="bg-[#D4A017]/15 text-[#D4A017] border-[#D4A017]/30 text-[9px] px-1.5 py-0 h-4">YOU</Badge>
                            )}
                          </div>
                          <Badge
                            className="text-[9px] uppercase tracking-wider border"
                            style={{ background: accent.soft, color: accent.hex, borderColor: accent.ring }}
                          >
                            {accent.label} compliance
                          </Badge>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-[11px]">
                            <span className="inline-flex items-center gap-1 text-gray-400">
                              {item.aycRatified ? <CheckCircle className="h-3 w-3 text-emerald-400" /> : <XCircle className="h-3 w-3 text-red-400" />}
                              AYC
                            </span>
                            <span className="inline-flex items-center gap-1 text-gray-400">
                              {item.nationalYouthPolicy ? <CheckCircle className="h-3 w-3 text-emerald-400" /> : <XCircle className="h-3 w-3 text-red-400" />}
                              NYP
                            </span>
                            {item.policyYear && (
                              <span className="inline-flex items-center gap-1 text-gray-500">
                                <Calendar className="h-3 w-3" />
                                {item.policyYear}
                              </span>
                            )}
                            {item.wpay && (
                              <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[9px] px-1.5 py-0 h-4 uppercase tracking-wider">WPAY</Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(item.country)}
                          className="h-7 w-7 p-0 -mr-1 text-gray-400 hover:text-white"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>

                      {isExpanded && (item.aycArticles.length > 0 || item.timelineEvents.length > 0) && (
                        <div className="mt-4 pt-4 border-t border-white/[0.06] grid gap-5 md:grid-cols-2">
                          {item.aycArticles.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-xs uppercase tracking-wider text-gray-400 mb-3">AYC Article Compliance</h4>
                              <div className="space-y-1.5">
                                {item.aycArticles.map((art) => {
                                  const dot = art.status === 'compliant' ? '#22C55E' : art.status === 'partial' ? '#F59E0B' : '#EF4444';
                                  return (
                                    <div key={art.article} className="flex items-center justify-between py-1.5 px-2.5 rounded bg-white/[0.02] border border-white/[0.04]">
                                      <span className="inline-flex items-center gap-2 text-xs text-gray-300 min-w-0">
                                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dot }} />
                                        <span className="truncate">{art.article}</span>
                                      </span>
                                      {getArticleStatusBadge(art.status)}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {item.timelineEvents.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-xs uppercase tracking-wider text-gray-400 mb-3">Policy Timeline</h4>
                              <div className="relative pl-5 border-l-2 border-[#D4A017]/30 space-y-3">
                                {item.timelineEvents.map((evt, idx) => (
                                  <div key={idx} className="relative">
                                    <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-[#D4A017] border-[3px] border-background" />
                                    <p className="text-xs font-bold text-[#D4A017] tabular-nums">{evt.year}</p>
                                    <p className="text-[11px] text-gray-400 leading-snug mt-0.5">{evt.event}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Methodology — compact */}
          <div className="mt-6 p-4 bg-white/[0.02] border border-gray-800/60 rounded-xl flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#D4A017]" />
              <h3 className="font-semibold text-sm text-white">Scoring methodology</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed flex-1">
              Compliance scores are computed from alignment with African Youth Charter (AYC) articles,
              World Programme of Action for Youth (WPAY) indicators, and the currency of a national youth policy.
            </p>
            <div className="flex flex-wrap gap-3 text-[10px]">
              {(['high','medium','low'] as Tier[]).map((t) => {
                const a = TIER_ACCENT[t];
                return (
                  <span key={t} className="flex items-center gap-1.5 text-gray-400">
                    <span className="w-2 h-2 rounded-full" style={{ background: a.hex }} />
                    {t === 'high' ? '>70%' : t === 'medium' ? '50–70%' : '<50%'}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PolicyMonitor;
