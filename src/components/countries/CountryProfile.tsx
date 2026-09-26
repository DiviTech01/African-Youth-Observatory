
import React, { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const REPORTS_API = `${API_BASE}/country-reports`;

interface RealCountryReport {
  country: string;
  iso3: string;
  slug?: string;
  lastDataYear: number | null;
  indicatorCount?: number;
  hasRealData: boolean;
  real: {
    literacyPct?: number;
    tertiaryGerPct?: number;
    secondaryCompletionPct?: number;
    internetAccessPct?: number;
    informalEmploymentPct?: number;
    bankedPct?: number;
    youthBulgePct?: number;
    urbanPopPct?: number;
    totalPopMillions?: number;
    totalYouthMillions?: number;
    hivYouthSharePct?: number;
    hivWomen?: string;
    artCount?: string;
    ayemiScore?: number;
    ayemiTier?: string;
  };
  // Real, display-ready indicator cards computed server-side (topic/value/label
  // /compare/trend/severity). Drives the Statistics tab — no fabrication.
  indicators?: Array<{
    topic: string;
    value: string;
    label?: string;
    compare?: string;
    trend?: 'up' | 'down' | 'flat' | string;
    severity?: string;
    barPct?: number;
  }>;
}

interface CountryTimeseries {
  country: string;
  iso3: string;
  yearRange: { min: number | null; max: number | null };
  population: Array<{
    year: number;
    population: number | null;
    youth: number | null;
    male: number | null;
    female: number | null;
  }>;
  education: Array<{
    year: number;
    literacy: number | null;
    secondaryEnrollment: number | null;
    tertiaryEnrollment: number | null;
  }>;
  employment: Array<{
    year: number;
    employmentRate: number | null;
    formalSector: number | null;
    informalSector: number | null;
  }>;
  health: Array<{
    indicator: string;
    value: number | null;
    year: number | null;
    benchmark: number | null;
  }>;
  entrepreneurship: Array<{
    metric: string;
    value: number | null;
    year: number | null;
  }>;
}
import {
  Download,
  ExternalLink,
  Users,
  GraduationCap,
  Heart,
  Briefcase,
  Rocket,
  TrendingUp,
  Globe,
  Scale,
  Megaphone,
  Sparkles,
  Send,
  Loader2,
  Inbox,
} from 'lucide-react';
import { motion } from 'framer-motion';
import CountryFlag from '@/components/CountryFlag';
import { getCountryMeta } from '@/lib/country-flags';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CountryProfileProps {
  country: string;
}

// ── Honest-data helpers ──────────────────────────────────────────────────────
// This page renders ONLY what the API returns. There is no parametric/seeded
// fallback: a missing value shows the em-dash, and a series with no real values
// shows a "No data yet" state instead of an invented chart.
const DASH = '—';
const pct = (v?: number | null, digits = 1) =>
  v == null || Number.isNaN(v) ? DASH : `${Number(v).toFixed(digits)}%`;
const millions = (v?: number | null) => (v == null || Number.isNaN(v) ? DASH : `${v}M`);

/** Last non-null value of `key` across a year-ordered series. */
function latestOf<T extends Record<string, unknown>>(rows: T[], key: keyof T): number | null {
  for (let i = rows.length - 1; i >= 0; i--) {
    const v = rows[i]?.[key];
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
  }
  return null;
}

/** Build chart-ready series straight from the API timeseries — no fabrication.
 *  Missing cells stay null (charts render gaps), missing series stay empty so
 *  the UI can show an honest empty state. */
function buildSeries(timeseries?: CountryTimeseries | null) {
  return {
    populationData: (timeseries?.population ?? []).map((p) => ({
      year: `${p.year}`,
      population: p.population,
      youth: p.youth,
      male: p.male,
      female: p.female,
    })),
    educationData: (timeseries?.education ?? []).map((e) => ({
      year: `${e.year}`,
      literacy: e.literacy,
      secondaryEnrollment: e.secondaryEnrollment,
      tertiaryEnrollment: e.tertiaryEnrollment,
    })),
    employmentData: (timeseries?.employment ?? []).map((e) => ({
      year: `${e.year}`,
      employmentRate: e.employmentRate,
      formalSector: e.formalSector,
      informalSector: e.informalSector,
    })),
    healthData: (timeseries?.health ?? []).map((h) => ({
      indicator: h.indicator,
      value: h.value,
      benchmark: h.benchmark,
    })),
    entrepreneurshipData: (timeseries?.entrepreneurship ?? []).map((e) => ({
      metric: e.metric,
      value: e.value,
    })),
  };
}

const chartColors = {
  c1: 'hsl(var(--chart-1))',
  c2: 'hsl(var(--chart-2))',
  c3: 'hsl(var(--chart-3))',
  c4: 'hsl(var(--chart-4))',
  c5: 'hsl(var(--chart-5))',
};

const tooltipStyle = {
  borderRadius: '8px',
  fontSize: '12px',
  border: '1px solid hsl(var(--border))',
  backgroundColor: 'hsl(var(--popover))',
  color: 'hsl(var(--popover-foreground))',
};

/* Stat card with framer-motion fade-in */
function StatCard({
  label,
  value,
  sub,
  delay = 0,
}: {
  label: string;
  value: string;
  sub?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="border rounded-lg p-3 sm:p-4 bg-card shadow-sm hover:shadow-md transition-shadow min-w-0"
    >
      <p className="text-xs sm:text-sm text-muted-foreground truncate">{label}</p>
      <p className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1 tabular-nums">{value}</p>
      {sub && <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">{sub}</p>}
    </motion.div>
  );
}

/* A single key/value row in the "Key Statistics" lists. */
function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <li className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium tabular-nums">{value}</span>
    </li>
  );
}

/* Honest empty state shown wherever the database has no values yet. */
function NoData({ height = 240, message = 'No data reported yet' }: { height?: number; message?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border border-dashed text-center px-4"
      style={{ height }}
    >
      <Inbox className="h-7 w-7 text-muted-foreground/60 mb-2" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <p className="text-xs text-muted-foreground/70 mt-1">
        Values appear here once a contributor uploads them.
      </p>
    </div>
  );
}

const CountryProfile = ({ country }: CountryProfileProps) => {
  // Everything below is sourced from /api/country-reports/:slug (latest-value
  // overlay + display-ready indicator cards) and …/timeseries (year series).
  // Nothing is synthesised — missing numbers render as "—".
  const slug = country.toLowerCase().replace(/\s+/g, '-');

  const { data: realReport, isLoading: realLoading } = useQuery<RealCountryReport | null>({
    queryKey: ['country-profile-real', slug],
    queryFn: async () => {
      const res = await fetch(`${REPORTS_API}/${encodeURIComponent(slug)}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

  const { data: timeseries, isLoading: tsLoading } = useQuery<CountryTimeseries | null>({
    queryKey: ['country-profile-timeseries', slug],
    queryFn: async () => {
      const res = await fetch(`${REPORTS_API}/${encodeURIComponent(slug)}/timeseries`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

  const overrides = realReport?.real;
  const indicators = realReport?.indicators ?? [];
  const loading = realLoading || tsLoading;

  const data = useMemo(() => buildSeries(timeseries), [timeseries]);

  // ── Derived "latest" display values (real or em-dash) ──────────────────────
  const totalYouth =
    overrides?.totalYouthMillions ?? latestOf(data.populationData, 'youth') ?? latestOf(data.populationData, 'population');
  const youthPctVal = overrides?.youthBulgePct ?? null;
  const urbanPctVal = overrides?.urbanPopPct ?? null;
  const lastPopRow = [...data.populationData].reverse().find((d) => d.male != null && d.female != null);
  const genderRatio =
    lastPopRow && lastPopRow.female ? Math.round(((lastPopRow.male as number) / (lastPopRow.female as number)) * 100) : null;

  const literacyLatest = overrides?.literacyPct ?? latestOf(data.educationData, 'literacy');
  const secondaryLatest = latestOf(data.educationData, 'secondaryEnrollment');
  const tertiaryLatest = overrides?.tertiaryGerPct ?? latestOf(data.educationData, 'tertiaryEnrollment');
  const employmentLatest = latestOf(data.employmentData, 'employmentRate');

  // Which sections actually have any real values to show.
  const hasGender = data.populationData.some((d) => d.male != null || d.female != null);
  const hasYouthTotal = data.populationData.some((d) => d.youth != null || d.population != null);
  const hasPopulation = hasGender || hasYouthTotal;
  const hasEducation = data.educationData.some(
    (d) => d.literacy != null || d.secondaryEnrollment != null || d.tertiaryEnrollment != null,
  );
  const hasEmployment = data.employmentData.some(
    (d) => d.employmentRate != null || d.formalSector != null || d.informalSector != null,
  );
  const hasHealth = data.healthData.some((d) => d.value != null);
  const hasEntrepreneurship = data.entrepreneurshipData.some((d) => d.value != null);

  const popYears = data.populationData.filter((d) => d.youth != null || d.population != null || d.male != null);
  const popRangeLabel =
    popYears.length > 0 ? `${popYears[0].year}–${popYears[popYears.length - 1].year}` : null;

  const overviewTrend = useMemo(() => {
    // Combine the real education + employment series by year for the overview line.
    const byYear = new Map<string, { year: string; education: number | null; employment: number | null }>();
    data.educationData.forEach((d) => byYear.set(d.year, { year: d.year, education: d.literacy, employment: null }));
    data.employmentData.forEach((d) => {
      const row = byYear.get(d.year) ?? { year: d.year, education: null, employment: null };
      row.employment = d.employmentRate;
      byYear.set(d.year, row);
    });
    return [...byYear.values()].sort((a, b) => Number(a.year) - Number(b.year));
  }, [data.educationData, data.employmentData]);
  const hasOverviewTrend = overviewTrend.some((d) => d.education != null || d.employment != null);

  return (
    <div className="container px-2 sm:px-4 md:px-6 py-4 sm:py-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6"
      >
        <div>
          <div className="flex items-center gap-3">
            <CountryFlag country={country} size="xl" />
            <h1 className="text-3xl font-bold">{country}</h1>
          </div>
          {(() => {
            const meta = getCountryMeta(country);
            return meta ? (
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span>{meta.capital}</span>
                <span className="text-border">|</span>
                <div className="flex items-center gap-1.5">
                  {meta.languages.map((lang) => (
                    <Badge key={lang} variant="secondary" className="text-xs px-1.5 py-0">
                      {lang}
                    </Badge>
                  ))}
                </div>
                <span className="text-border">|</span>
                <span>{meta.currency}</span>
              </div>
            ) : null;
          })()}
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">Youth Profile Overview</p>
            {realReport?.lastDataYear != null && (
              <Badge variant="outline" className="text-[10px]">Latest data: {realReport.lastDataYear}</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-4 w-4" />
            Download Profile
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <ExternalLink className="h-4 w-4" />
            Share
          </Button>
        </div>
      </motion.div>

      {/* No-data banner when the country has nothing uploaded at all. */}
      {!loading && !realReport?.hasRealData && !hasPopulation && (
        <Card className="mb-6 border-dashed">
          <CardContent className="p-6 flex items-start gap-3">
            <Inbox className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <h2 className="font-semibold">No data uploaded for {country} yet</h2>
              <p className="text-sm text-muted-foreground mt-1">
                This profile only shows values contributors have uploaded to the African Youth Database.
                None are on file for {country} so far, so the charts and figures below appear empty.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Demographic overview card */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-1 md:col-span-3">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-4">Demographic Overview</h2>
                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="Total Youth Population" value={millions(totalYouth)} sub="Ages 15-35" delay={0} />
                  <StatCard label="Youth as % of Population" value={pct(youthPctVal)} sub="Share aged 15-35" delay={0.1} />
                  <StatCard label="Urban Youth" value={pct(urbanPctVal)} sub="Share in urban areas" delay={0.2} />
                  <StatCard
                    label="Gender Ratio"
                    value={genderRatio != null ? `${genderRatio}:100` : DASH}
                    sub="Males to females"
                    delay={0.3}
                  />
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex-1"
              >
                <div className="h-[240px] rounded-lg overflow-hidden">
                  {hasPopulation ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.populationData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} unit="M" />
                        <Tooltip contentStyle={tooltipStyle} />
                        {hasGender ? (
                          <>
                            <Bar dataKey="male" name="Male" stackId="a" fill={chartColors.c1} radius={[0, 0, 0, 0]} />
                            <Bar dataKey="female" name="Female" stackId="a" fill={chartColors.c2} radius={[4, 4, 0, 0]} />
                          </>
                        ) : (
                          <Bar dataKey="youth" name="Youth (15-35)" fill={chartColors.c1} radius={[4, 4, 0, 0]} />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <NoData message="No population data reported yet" />
                  )}
                </div>
                {hasPopulation && popRangeLabel && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    {hasGender ? 'Youth population by gender' : 'Youth population (15-35)'} for {country}, {popRangeLabel}
                  </p>
                )}
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="flex overflow-x-auto h-auto gap-1 mb-6 w-full max-w-full pb-1 no-scrollbar">
          <TabsTrigger value="overview" className="gap-1.5">
            <Globe className="h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="population" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Population
          </TabsTrigger>
          <TabsTrigger value="education" className="gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" />
            Education
          </TabsTrigger>
          <TabsTrigger value="health" className="gap-1.5">
            <Heart className="h-3.5 w-3.5" />
            Health
          </TabsTrigger>
          <TabsTrigger value="employment" className="gap-1.5">
            <Briefcase className="h-3.5 w-3.5" />
            Employment
          </TabsTrigger>
          <TabsTrigger value="entrepreneurship" className="gap-1.5">
            <Rocket className="h-3.5 w-3.5" />
            Entrepreneurship
          </TabsTrigger>
          <TabsTrigger value="statistics" className="gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="legal" className="gap-1.5">
            <Scale className="h-3.5 w-3.5" />
            Legal &amp; Policy
          </TabsTrigger>
          <TabsTrigger value="youth-action" className="gap-1.5">
            <Megaphone className="h-3.5 w-3.5" />
            Youth In Action
          </TabsTrigger>
        </TabsList>

        {/* ───── Overview Tab ───── */}
        <TabsContent value="overview" className="space-y-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">Country Snapshot</h3>
                <p className="text-muted-foreground mb-6">
                  {overrides?.ayemiScore != null ? (
                    <>
                      {country} has an African Youth Index score of{' '}
                      <span className="font-medium text-foreground">{overrides.ayemiScore}</span>
                      {overrides.ayemiTier ? ` (${overrides.ayemiTier})` : ''}. The figures below are drawn
                      directly from data uploaded to the African Youth Database; where a value hasn&apos;t been
                      reported yet it shows as &ldquo;{DASH}&rdquo;.
                    </>
                  ) : (
                    <>
                      The figures below are drawn directly from data uploaded to the African Youth Database for{' '}
                      {country}. Where a value hasn&apos;t been reported yet it shows as &ldquo;{DASH}&rdquo;.
                    </>
                  )}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Youth Population" value={millions(totalYouth)} sub="Ages 15-35" delay={0} />
                  <StatCard label="Literacy Rate" value={pct(literacyLatest)} sub="Youth 15-35" delay={0.1} />
                  <StatCard label="Employment Rate" value={pct(employmentLatest)} sub="Labour force participation" delay={0.2} />
                  <StatCard
                    label="Internet Access"
                    value={pct(overrides?.internetAccessPct)}
                    sub="Households"
                    delay={0.3}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">Education &amp; Employment Trends</h3>
              <div className="h-[300px]">
                {hasOverviewTrend ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={overviewTrend} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                      <Line type="monotone" dataKey="education" name="Youth Literacy" stroke={chartColors.c1} strokeWidth={2} dot={false} connectNulls />
                      <Line type="monotone" dataKey="employment" name="Employment Rate" stroke={chartColors.c2} strokeWidth={2} dot={false} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <NoData height={300} message="No education or employment trend data reported yet" />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ───── Population Tab ───── */}
        <TabsContent value="population" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">Youth Population Trends</h3>
              <div className="h-[320px] mb-4">
                {hasPopulation ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.populationData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} unit="M" />
                      <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => [`${val}M`, undefined]} />
                      <Legend />
                      {hasGender ? (
                        <>
                          <Bar dataKey="male" name="Male" fill={chartColors.c1} radius={[0, 0, 0, 0]} stackId="pop" />
                          <Bar dataKey="female" name="Female" fill={chartColors.c2} radius={[4, 4, 0, 0]} stackId="pop" />
                        </>
                      ) : (
                        <Bar dataKey="youth" name="Youth (15-35)" fill={chartColors.c1} radius={[4, 4, 0, 0]} />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <NoData height={320} message="No population data reported yet" />
                )}
              </div>

              <div>
                <h4 className="font-medium mb-2">Key Statistics</h4>
                <ul className="space-y-2 text-sm max-w-md">
                  <StatRow label="Total youth population (15-35)" value={millions(totalYouth)} />
                  <StatRow label="Youth as % of population" value={pct(youthPctVal)} />
                  <StatRow label="Urban youth share" value={pct(urbanPctVal)} />
                  <StatRow label="Gender ratio (M:F)" value={genderRatio != null ? `${genderRatio}:100` : DASH} />
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ───── Education Tab ───── */}
        <TabsContent value="education" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">Education Indicators</h3>
              <div className="h-[320px] mb-4">
                {hasEducation ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.educationData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                      <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => [`${val}%`, undefined]} />
                      <Legend />
                      <Line type="monotone" dataKey="literacy" name="Literacy Rate" stroke={chartColors.c1} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                      <Line type="monotone" dataKey="secondaryEnrollment" name="Secondary Enrollment" stroke={chartColors.c2} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                      <Line type="monotone" dataKey="tertiaryEnrollment" name="Tertiary Enrollment" stroke={chartColors.c3} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <NoData height={320} message="No education data reported yet" />
                )}
              </div>

              <div>
                <h4 className="font-medium mb-2">Key Statistics</h4>
                <ul className="space-y-2 text-sm max-w-md">
                  <StatRow label="Youth literacy rate" value={pct(literacyLatest)} />
                  <StatRow label="Secondary enrollment" value={pct(secondaryLatest)} />
                  <StatRow label="Tertiary enrollment" value={pct(tertiaryLatest)} />
                  <StatRow label="Secondary completion" value={pct(overrides?.secondaryCompletionPct)} />
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ───── Health Tab ───── */}
        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">Health Indicators</h3>
              <div className="h-[320px] mb-4">
                {hasHealth ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.healthData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 100]} />
                      <YAxis dataKey="indicator" type="category" tick={{ fontSize: 11 }} width={120} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                      <Bar dataKey="value" name={country} fill={chartColors.c1} radius={[0, 4, 4, 0]} />
                      <Bar dataKey="benchmark" name="AU Benchmark" fill={chartColors.c4} radius={[0, 4, 4, 0]} opacity={0.6} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <NoData height={320} message="No health data reported yet" />
                )}
              </div>

              {hasHealth && (
                <div>
                  <h4 className="font-medium mb-2">Key Statistics</h4>
                  <ul className="space-y-2 text-sm max-w-md">
                    {data.healthData.map((h) => (
                      <StatRow key={h.indicator} label={h.indicator} value={h.value == null ? DASH : `${h.value}`} />
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ───── Employment Tab ───── */}
        <TabsContent value="employment" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">Employment Trends</h3>
              <div className="h-[320px] mb-4">
                {hasEmployment ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.employmentData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradFormal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColors.c1} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={chartColors.c1} stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="gradInformal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColors.c3} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={chartColors.c3} stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} unit="%" />
                      <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => [`${val}%`, undefined]} />
                      <Legend />
                      <Area type="monotone" dataKey="formalSector" name="Formal Sector" stroke={chartColors.c1} fill="url(#gradFormal)" strokeWidth={2} connectNulls />
                      <Area type="monotone" dataKey="informalSector" name="Informal Sector" stroke={chartColors.c3} fill="url(#gradInformal)" strokeWidth={2} connectNulls />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <NoData height={320} message="No employment data reported yet" />
                )}
              </div>

              <div>
                <h4 className="font-medium mb-2">Key Statistics</h4>
                <ul className="space-y-2 text-sm max-w-md">
                  <StatRow label="Labour force participation" value={pct(employmentLatest)} />
                  <StatRow
                    label="Youth unemployment rate"
                    value={employmentLatest == null ? DASH : pct(100 - employmentLatest)}
                  />
                  <StatRow label="Informal employment" value={pct(overrides?.informalEmploymentPct)} />
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ───── Entrepreneurship Tab ───── */}
        <TabsContent value="entrepreneurship" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">Entrepreneurship Metrics</h3>
              <div className="h-[320px] mb-4">
                {hasEntrepreneurship ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.entrepreneurshipData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="metric" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 11 }} unit="%" />
                      <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => [`${val}%`, undefined]} />
                      <Bar dataKey="value" name="Rate (%)" fill={chartColors.c5} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <NoData height={320} message="No entrepreneurship data reported yet" />
                )}
              </div>

              {(hasEntrepreneurship || overrides?.bankedPct != null) && (
                <div>
                  <h4 className="font-medium mb-2">Key Statistics</h4>
                  <ul className="space-y-2 text-sm max-w-md">
                    {data.entrepreneurshipData.map((e) => (
                      <StatRow key={e.metric} label={e.metric} value={e.value == null ? DASH : `${e.value}`} />
                    ))}
                    <StatRow label="Banked population" value={pct(overrides?.bankedPct)} />
                    <StatRow label="Internet access (households)" value={pct(overrides?.internetAccessPct)} />
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ───── Statistics Tab — real indicator cards from the API ───── */}
        <TabsContent value="statistics" className="space-y-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Indicator Snapshot</h3>
                  {realReport?.lastDataYear != null && <Badge variant="secondary">{realReport.lastDataYear} data</Badge>}
                </div>
                <p className="text-muted-foreground mb-6">
                  Every indicator on file for {country}
                  {typeof realReport?.indicatorCount === 'number' ? ` (${realReport.indicatorCount} reported)` : ''}, straight
                  from the African Youth Database.
                </p>
                {indicators.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {indicators.map((ind, i) => (
                      <StatCard
                        key={`${ind.topic}-${i}`}
                        label={ind.topic}
                        value={ind.value ?? DASH}
                        sub={ind.label || ind.compare}
                        delay={Math.min(i * 0.03, 0.3)}
                      />
                    ))}
                  </div>
                ) : (
                  <NoData message={`No indicators reported for ${country} yet`} />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ───── Legal & Policy Tab — real Policy Monitor data ───── */}
        <TabsContent value="legal" className="space-y-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <PolicyTab country={country} />
          </motion.div>
        </TabsContent>

        {/* ───── Youth In Action Tab ───── */}
        <TabsContent value="youth-action" className="space-y-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">Youth In Action</h3>
                <NoData
                  message={`Youth-led initiatives for ${country} haven't been documented here yet`}
                />
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  This space will highlight verified youth-led organisations and initiatives once they&apos;re
                  contributed — we don&apos;t show invented spotlights.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* AI Chat — Ask about this country */}
      <CountryAiChat country={country} />
    </div>
  );
};

// ── Legal & Policy tab ───────────────────────────────────────────────────────
// Renders the real Youth Policy Monitor record for the country — AYC composite
// score, national youth policy, AU-charter alignment, the component breakdown,
// and recommendations — all from /api/policy-monitor. No placeholder values.
interface PolicyComponents {
  aycRatification?: number;
  nationalYouthPolicy?: number;
  policyCurrency?: number;
  wpayCompliance?: number;
  policyStatus?: number;
  youthIndexPerformance?: number;
  dataAvailability?: number;
  aycPolicyIndex?: number;
}
interface PolicyRankingEntry {
  countryId: string;
  countryName: string;
  policyName?: string | null;
  aycRatified?: boolean;
  aycRatifiedYear?: number | null;
  wpayCompliant?: boolean;
  yearAdopted?: number | null;
  yearRevised?: number | null;
  status?: string | null;
  complianceScore?: number;
  tier?: string | null;
  components?: PolicyComponents;
}

const POLICY_COMPONENT_LABELS: [keyof PolicyComponents, string][] = [
  ['aycRatification', 'AYC ratification'],
  ['nationalYouthPolicy', 'National youth policy'],
  ['policyCurrency', 'Policy currency'],
  ['wpayCompliance', 'WPAY compliance'],
  ['policyStatus', 'Policy status'],
  ['youthIndexPerformance', 'Youth Index performance'],
  ['dataAvailability', 'Data availability'],
  ['aycPolicyIndex', 'AYC policy index'],
];

const policyTierClass = (tier?: string | null) => {
  switch ((tier ?? '').toUpperCase()) {
    case 'EXEMPLARY':
    case 'STRONG':
      return 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30';
    case 'MODERATE':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30';
    case 'WEAK':
      return 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

function PolicyTab({ country }: { country: string }) {
  // Fold accents so "Côte d'Ivoire" (profile) matches "Cote d'Ivoire" (API).
  const norm = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const { data: rankings, isLoading } = useQuery<PolicyRankingEntry[]>({
    queryKey: ['policy-rankings'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/policy-monitor/rankings`);
      if (!res.ok) return [];
      const j = await res.json();
      return Array.isArray(j) ? j : (j.data ?? []);
    },
    staleTime: 10 * 60 * 1000,
  });

  const entry = useMemo(
    () => (rankings ?? []).find((e) => norm(e.countryName) === norm(country)) ?? null,
    [rankings, country],
  );

  // Recommendations live on the per-country detail endpoint only.
  const { data: detail } = useQuery<{ compliance?: { recommendations?: string[] } } | null>({
    queryKey: ['policy-detail', entry?.countryId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/policy-monitor/${entry!.countryId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!entry?.countryId,
    staleTime: 10 * 60 * 1000,
  });
  const recommendations = detail?.compliance?.recommendations ?? [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4">Legal &amp; Policy Framework</h3>
          <div className="flex items-center justify-center h-[200px]">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!entry) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4">Legal &amp; Policy Framework</h3>
          <NoData message={`No youth policy record on file for ${country} yet`} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
          <h3 className="text-xl font-bold">Legal &amp; Policy Framework</h3>
          <div className="flex items-center gap-2">
            {entry.tier && (
              <Badge variant="outline" className={policyTierClass(entry.tier)}>
                {entry.tier}
              </Badge>
            )}
            {typeof entry.complianceScore === 'number' && (
              <span className="text-sm text-muted-foreground">
                AYC Policy Index: <span className="font-bold text-foreground tabular-nums">{entry.complianceScore.toFixed(1)}</span>/100
              </span>
            )}
          </div>
        </div>
        <p className="text-muted-foreground text-sm mb-6">
          {country}&apos;s youth policy standing from the African Youth Charter Composite Policy Index.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium">National Youth Policy</h4>
            <div className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm">{entry.policyName || 'No national youth policy on record'}</p>
                {entry.status && (
                  <Badge variant={entry.status === 'active' ? 'secondary' : 'outline'} className="shrink-0 capitalize">
                    {entry.status}
                  </Badge>
                )}
              </div>
              <ul className="space-y-1.5 text-sm mt-3">
                <StatRow label="Year adopted" value={entry.yearAdopted ?? DASH} />
                <StatRow label="Year revised" value={entry.yearRevised ?? DASH} />
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">AU Charter Alignment</h4>
            <ul className="space-y-2 text-sm rounded-lg border p-3">
              <li className="flex justify-between gap-3 items-center">
                <span className="text-muted-foreground">African Youth Charter ratified:</span>
                <Badge variant={entry.aycRatified ? 'secondary' : 'outline'}>
                  {entry.aycRatified ? `Ratified${entry.aycRatifiedYear ? ` (${entry.aycRatifiedYear})` : ''}` : 'Not ratified'}
                </Badge>
              </li>
              <li className="flex justify-between gap-3 items-center">
                <span className="text-muted-foreground">WPAY compliant:</span>
                <Badge variant={entry.wpayCompliant ? 'secondary' : 'outline'}>
                  {entry.wpayCompliant ? 'Yes' : 'No'}
                </Badge>
              </li>
            </ul>
          </div>
        </div>

        {entry.components && (
          <div className="mt-6">
            <h4 className="font-medium mb-3">Composite Index Components</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
              {POLICY_COMPONENT_LABELS.map(([key, label]) => {
                const v = entry.components?.[key];
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium tabular-nums">{typeof v === 'number' ? `${Math.round(v)}` : DASH}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${typeof v === 'number' ? Math.max(0, Math.min(100, v)) : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium mb-2">Recommendations</h4>
            <ul className="space-y-2 text-sm">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-muted-foreground">
                  <Scale className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CountryAiChat({ country }: { country: string }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<'ai' | 'rule-based' | null>(null);

  const handleAsk = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    setAnswer('');
    setSource(null);

    const apiBase = (import.meta as any).env?.VITE_API_URL || '/api';
    const fullQuestion = `About ${country}: ${question.trim()}`;

    // Try the AI chat endpoint first, then NLQ, then fallback
    let success = false;

    // Attempt 1: AI chat endpoint
    try {
      const res = await fetch(`${apiBase}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: fullQuestion, context: `Country: ${country}` }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnswer(data.answer || 'No answer available.');
        setSource(data.source || 'ai');
        success = true;
      }
    } catch { /* try next */ }

    // Attempt 2: NLQ endpoint
    if (!success) {
      try {
        const res = await fetch(`${apiBase}/nlq/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: fullQuestion, countryId: country }),
        });
        if (res.ok) {
          const data = await res.json();
          setAnswer(data.answer || 'No answer available.');
          setSource(data.source || 'rule-based');
          success = true;
        }
      } catch { /* try next */ }
    }

    // Attempt 3: Honest fallback — qualitative guidance only, no invented numbers.
    if (!success) {
      const q = question.trim().toLowerCase();
      let fallbackAnswer = `Here's how to find what you're looking for about ${country}:\n\n`;

      if (q.includes('challenge') || q.includes('problem') || q.includes('issue')) {
        fallbackAnswer += `Open the Education, Health, Employment and Entrepreneurship tabs above — each shows the indicators reported for ${country}. Anything not yet uploaded appears as "—" rather than an estimate.`;
      } else if (q.includes('employment') || q.includes('job') || q.includes('work')) {
        fallbackAnswer += `See the Employment tab for ${country}'s labour-force participation and formal/informal split, drawn from uploaded data. Gaps show as "—".`;
      } else if (q.includes('education') || q.includes('school') || q.includes('literacy')) {
        fallbackAnswer += `The Education tab shows ${country}'s literacy and enrollment series where reported. The Statistics tab lists every indicator on file.`;
      } else {
        fallbackAnswer += `Use the tabs above to explore ${country}'s population, education, health, employment and entrepreneurship indicators. The Statistics tab lists everything currently on file — values that haven't been reported show as "—".`;
      }

      setAnswer(fallbackAnswer);
      setSource('rule-based');
    }

    setLoading(false);
  }, [question, loading, country]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="mt-6"
    >
      <Card>
        <CardContent className="pt-5 pb-4 px-3 sm:px-5">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            Ask about {country}
          </h3>
          <form onSubmit={handleAsk} className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={`e.g., "What are ${country}'s biggest challenges?"`}
              className="flex-1 rounded-lg border bg-background/60 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-w-0"
              disabled={loading}
            />
            <Button type="submit" size="sm" disabled={loading || !question.trim()} className="gap-1.5 shrink-0">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="hidden sm:inline">Ask</span>
            </Button>
          </form>
          {answer && (
            <div className="mt-4">
              {source && (
                <Badge variant="secondary" className="text-xs mb-2">
                  {source === 'ai' ? 'AI-powered' : 'Based on platform data'}
                </Badge>
              )}
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {answer}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default CountryProfile;
