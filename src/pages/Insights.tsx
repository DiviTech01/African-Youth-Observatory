import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sparkles, TrendingUp, TrendingDown, Minus, AlertTriangle,
  Lightbulb, BarChart3, ArrowUpRight, ChevronDown, Globe, Activity,
} from 'lucide-react';
import CountryFlag from '@/components/CountryFlag';
import { useLanguage } from '@/contexts/LanguageContext';

// ── Types ─────────────────────────────────────────────────────────────────────

type Severity = 'info' | 'warning' | 'critical' | 'positive';
type InsightType = 'trend' | 'anomaly' | 'comparison' | 'recommendation';
type TrendDirection = 'up' | 'down' | 'flat';

interface Insight {
  id: string;
  severity: Severity;
  type: InsightType;
  title: string;
  summary: string;
  detail: string;
  trendDirection: TrendDirection;
  country: string;
  indicator: string;
  generatedAt: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<Severity, { bg: string; text: string; border: string }> = {
  info:     { bg: 'bg-blue-500/10',   text: 'text-blue-600 dark:text-blue-400',     border: 'border-blue-500/20' },
  warning:  { bg: 'bg-amber-500/10',  text: 'text-amber-600 dark:text-amber-400',   border: 'border-amber-500/20' },
  critical: { bg: 'bg-red-500/10',    text: 'text-red-600 dark:text-red-400',       border: 'border-red-500/20' },
  positive: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
};

const TYPE_STYLES: Record<InsightType, { bg: string; text: string; icon: React.ElementType }> = {
  trend:          { bg: 'bg-violet-500/10',  text: 'text-violet-600 dark:text-violet-400',  icon: TrendingUp },
  anomaly:        { bg: 'bg-orange-500/10',  text: 'text-orange-600 dark:text-orange-400',  icon: AlertTriangle },
  comparison:     { bg: 'bg-sky-500/10',     text: 'text-sky-600 dark:text-sky-400',        icon: BarChart3 },
  recommendation: { bg: 'bg-teal-500/10',    text: 'text-teal-600 dark:text-teal-400',      icon: Lightbulb },
};

const TREND_ICONS: Record<TrendDirection, { icon: React.ElementType; color: string }> = {
  up:   { icon: TrendingUp,   color: 'text-emerald-500' },
  down: { icon: TrendingDown,  color: 'text-red-500' },
  flat: { icon: Minus,         color: 'text-gray-400' },
};

const FILTER_TYPES: { label: string; value: InsightType | 'all' }[] = [
  { label: 'All',             value: 'all' },
  { label: 'Trends',          value: 'trend' },
  { label: 'Anomalies',       value: 'anomaly' },
  { label: 'Recommendations', value: 'recommendation' },
];

const COUNTRIES = [
  'All Countries', 'Nigeria', 'Kenya', 'South Africa', 'Ghana', 'Ethiopia',
  'Tanzania', 'Rwanda', 'Senegal', 'Egypt', 'Morocco',
];

// ── Mock Data ─────────────────────────────────────────────────────────────────

const INSIGHTS: Insight[] = [
  {
    id: '1',
    severity: 'positive',
    type: 'trend',
    title: "Rwanda's education enrollment surged 12% in 2023",
    summary:
      'Secondary school enrollment among youth aged 15-19 in Rwanda increased by 12.3% year-over-year, the highest growth rate in East Africa. Government investment in school infrastructure and teacher training programs appear to be driving this improvement.',
    detail:
      "Rwanda's Ministry of Education invested $240M in school construction and teacher recruitment in 2022-2023, adding 1,200 classrooms and 4,500 trained teachers to the system. The enrollment jump is particularly notable in rural areas, where access has historically lagged urban centers by 25-30 percentage points. STEM-focused curriculum reforms introduced in 2022 have also attracted higher enrollment in technical secondary tracks. The gender gap in enrollment narrowed from 8% to 3%, signaling more equitable access. If this trajectory holds, Rwanda is on track to achieve 95% secondary enrollment by 2027, ahead of its AU Agenda 2063 targets.",
    trendDirection: 'up',
    country: 'Rwanda',
    indicator: 'Secondary Enrollment Rate',
    generatedAt: '2026-03-27T14:23:00Z',
  },
  {
    id: '2',
    severity: 'warning',
    type: 'anomaly',
    title: 'Nigeria youth unemployment exceeds regional average by 8%',
    summary:
      "Youth unemployment in Nigeria reached 42.5% in Q4 2025, surpassing the West African regional average of 34.2% by over 8 percentage points. This divergence has widened from 3% in 2022, suggesting structural factors beyond cyclical economic conditions.",
    detail:
      "The unemployment spike is concentrated in the 18-24 age bracket, particularly among university graduates in non-technical fields. Northern states report rates as high as 55%, while Lagos and the South-West hover around 28%. Key structural drivers include: (1) a mismatch between higher education curricula and labor market demand, (2) contraction of the informal sector due to regulatory changes, and (3) currency devaluation reducing purchasing power and business investment. The manufacturing sector, which employs 18% of youth workers, contracted by 6% in 2025. Policy recommendations include expanding vocational training partnerships with the private sector and incentivizing youth entrepreneurship through microfinance programs.",
    trendDirection: 'up',
    country: 'Nigeria',
    indicator: 'Youth Unemployment Rate',
    generatedAt: '2026-03-26T09:15:00Z',
  },
  {
    id: '3',
    severity: 'info',
    type: 'comparison',
    title: 'Kenya shows strong correlation between STEM enrollment and startup formation',
    summary:
      "Analysis reveals a 0.87 correlation coefficient between STEM program enrollment rates and new startup registrations among 20-30 year-olds in Kenya over 2018-2025. This is the highest such correlation observed across all tracked African nations.",
    detail:
      "Kenya's tech ecosystem has grown in parallel with increased STEM education investment. Universities producing STEM graduates grew from 12 to 23 between 2018-2025. Nairobi's 'Silicon Savannah' now hosts over 400 active tech startups, with 68% founded by individuals under 30. The correlation is strongest in computer science and engineering disciplines (r=0.92) and weaker but still significant in natural sciences (r=0.71). Comparative analysis shows that South Africa (r=0.64) and Nigeria (r=0.58) have lower correlations, suggesting Kenya's ecosystem support structures (incubators, angel networks, government tech parks) play an amplifying role. Mobile money penetration (94%) also reduces barriers for young entrepreneurs.",
    trendDirection: 'up',
    country: 'Kenya',
    indicator: 'STEM Enrollment Rate',
    generatedAt: '2026-03-25T11:40:00Z',
  },
  {
    id: '4',
    severity: 'critical',
    type: 'recommendation',
    title: 'South Africa needs urgent investment in youth mental health services',
    summary:
      "Youth mental health indicators in South Africa have deteriorated significantly: anxiety and depression prevalence among 15-24 year-olds rose 34% since 2021. Current mental health infrastructure serves only 12% of affected youth, creating a critical service gap.",
    detail:
      "South Africa has 0.28 psychiatrists per 100,000 people versus the WHO-recommended minimum of 1.0. Among youth specifically, wait times for mental health services average 14 weeks in urban areas and over 6 months in rural provinces. The crisis is linked to high unemployment (63% among 15-24), gender-based violence exposure, and substance abuse. Suicide rates among youth aged 15-19 increased 22% between 2022 and 2025. Recommended interventions: (1) train 5,000 community health workers in basic mental health first aid by 2027, (2) deploy digital therapy platforms targeting youth through existing mobile infrastructure, (3) integrate mental health screening into school and university health programs, (4) establish a national youth mental health hotline with 24/7 coverage. Estimated cost: $180M over 3 years.",
    trendDirection: 'down',
    country: 'South Africa',
    indicator: 'Health Access Index',
    generatedAt: '2026-03-27T08:05:00Z',
  },
  {
    id: '5',
    severity: 'positive',
    type: 'trend',
    title: "Ghana's digital literacy rate among youth climbed to 71%",
    summary:
      "Digital literacy among Ghanaian youth aged 15-24 reached 71.2% in 2025, up from 54% in 2022. The government's 'Youth in Digital Economy' initiative and expanded internet infrastructure are key contributors.",
    detail:
      "Ghana's National Communications Authority reports that 4G coverage expanded from 62% to 89% of the population between 2022 and 2025. The government distributed 200,000 subsidized tablets to secondary schools, and partnered with tech companies to provide free coding bootcamps in all 16 regions. Female digital literacy improved at a faster rate (22% gain) than male (14% gain), narrowing the gender digital divide. The Accra Digital Centre, opened in 2024, has trained 15,000 youth in web development, data analytics, and cybersecurity. Private sector hiring of digitally-skilled youth increased 40% year-over-year, with fintech and e-commerce leading demand.",
    trendDirection: 'up',
    country: 'Ghana',
    indicator: 'Digital Inclusion Score',
    generatedAt: '2026-03-24T16:30:00Z',
  },
  {
    id: '6',
    severity: 'warning',
    type: 'anomaly',
    title: "Ethiopia's NEET rate spiked unexpectedly in Northern regions",
    summary:
      "The Not in Education, Employment, or Training (NEET) rate for youth in Ethiopia's Tigray and Amhara regions jumped to 48% in late 2025, a 15-point increase from the previous year, diverging sharply from the national downward trend.",
    detail:
      "While Ethiopia's national NEET rate has been declining (from 32% to 26% between 2021-2025), the Northern regions experienced a dramatic reversal. Contributing factors include: disruption to educational institutions during the conflict recovery period, displacement of over 2 million youth, and slow reconstruction of vocational training facilities. In contrast, Addis Ababa's NEET rate fell to 18%, the lowest in a decade, driven by the expanding industrial park system and services sector. The regional disparity highlights the need for targeted recovery programs. The World Bank has approved a $150M grant for Northern Ethiopia youth re-integration, but disbursement has been slow, with only 23% of funds reaching beneficiaries by Q1 2026.",
    trendDirection: 'up',
    country: 'Ethiopia',
    indicator: 'NEET Rate',
    generatedAt: '2026-03-26T13:20:00Z',
  },
  {
    id: '7',
    severity: 'info',
    type: 'comparison',
    title: 'Senegal leads West Africa in civic participation among youth',
    summary:
      "Senegal's youth civic participation index score of 72.4 significantly outpaces the West African average of 51.8. Voter registration among 18-24 year-olds reached 78%, the highest in the sub-region.",
    detail:
      "Senegal's strong civic engagement is attributed to several factors: a vibrant civil society ecosystem with over 3,000 youth-led organizations, mandatory civic education in secondary schools since 2019, and a mobile-first voter registration system launched in 2023 that simplified the process for young voters. Comparative analysis across West Africa shows that Nigeria (44.2), Ghana (58.1), and Cote d'Ivoire (47.6) lag behind, primarily due to lower trust in institutions and fewer youth-targeted civic engagement programs. Senegal's 'Y'en a Marre' movement, which began as a youth protest in 2011, has evolved into an institutional force promoting accountability and democratic participation.",
    trendDirection: 'up',
    country: 'Senegal',
    indicator: 'Civic Participation Index',
    generatedAt: '2026-03-23T10:45:00Z',
  },
  {
    id: '8',
    severity: 'positive',
    type: 'recommendation',
    title: 'Tanzania should scale its successful apprenticeship model nationally',
    summary:
      "Tanzania's pilot apprenticeship program in Dar es Salaam reduced youth unemployment by 18% among participants. Data strongly supports expanding this model to all 31 regions as a cost-effective employment intervention.",
    detail:
      "The Dar es Salaam Youth Apprenticeship Program (DYAP), launched in 2023, placed 12,000 youth aged 18-25 in 6-month structured apprenticeships across manufacturing, hospitality, and technology sectors. Follow-up data shows 72% of participants secured formal employment within 3 months of completion, versus 31% in a control group. The program costs approximately $850 per participant, yielding an estimated $4,200 in economic value per placement through tax revenue and reduced social welfare costs. Key success factors include: employer co-investment (40% of training costs), mentorship pairing, and a competency-based certification recognized by the National Council for Technical Education. Scaling to all regions would require an estimated $45M over 3 years and could reduce national youth unemployment by 5-7 percentage points.",
    trendDirection: 'up',
    country: 'Tanzania',
    indicator: 'Youth Unemployment Rate',
    generatedAt: '2026-03-27T07:10:00Z',
  },
  {
    id: '9',
    severity: 'warning',
    type: 'trend',
    title: "Egypt's youth brain drain accelerated in 2025",
    summary:
      "Emigration among Egyptian youth with tertiary education rose 28% in 2025, with 43,000 skilled young professionals relocating abroad. The healthcare and engineering sectors are most affected, with 15% of medical graduates leaving within 2 years of qualification.",
    detail:
      "Egypt faces a growing challenge retaining its educated youth workforce. The primary pull factors include higher salaries in the Gulf states (3-5x Egyptian wages for equivalent roles) and European Union blue card programs targeting STEM talent. Push factors include limited career advancement opportunities, currency instability reducing real wages, and housing affordability constraints for young professionals in Cairo and Alexandria. The economic cost of this brain drain is estimated at $2.1B annually in lost human capital investment. Government responses so far (tax incentives for returning professionals, mandatory service periods after subsidized education) have shown limited effectiveness. More promising approaches include remote work facilitation policies that allow diaspora talent to contribute to the Egyptian economy while living abroad, and creating special economic zones with competitive compensation structures.",
    trendDirection: 'down',
    country: 'Egypt',
    indicator: 'Skilled Employment Share',
    generatedAt: '2026-03-25T15:55:00Z',
  },
  {
    id: '10',
    severity: 'info',
    type: 'trend',
    title: "Morocco's youth literacy rate nears universal coverage at 96%",
    summary:
      "Morocco achieved a youth literacy rate of 96.1% in 2025, up from 87% in 2018. The country is on track to reach functional universal youth literacy by 2027, driven by expanded rural education access and adult literacy campaigns targeting young women.",
    detail:
      "Morocco's literacy gains are the result of sustained investment in education infrastructure, particularly in rural and semi-urban areas. The national literacy program 'Mahara' trained 120,000 young adults in reading and digital skills since 2020. Female youth literacy rose from 79% to 94%, narrowing the gender gap to just 4 percentage points. Regional disparities persist but are shrinking: the Draa-Tafilalet region improved from 71% to 88%, the fastest gain nationally. Morocco's approach of integrating literacy programs with vocational skills (agricultural technology, financial literacy, digital tools) has been cited as a best practice by UNESCO and is being studied for replication in other North African and Sahelian countries.",
    trendDirection: 'up',
    country: 'Morocco',
    indicator: 'Youth Literacy Rate',
    generatedAt: '2026-03-22T12:00:00Z',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

const Insights: React.FC = () => {
  const { t } = useLanguage();
  const [typeFilter, setTypeFilter] = useState<InsightType | 'all'>('all');
  const [countryFilter, setCountryFilter] = useState('All Countries');

  const filtered = INSIGHTS.filter((insight) => {
    const matchesType = typeFilter === 'all' || insight.type === typeFilter;
    const matchesCountry = countryFilter === 'All Countries' || insight.country === countryFilter;
    return matchesType && matchesCountry;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="relative py-8 md:py-12 overflow-hidden">
        <div className="absolute inset-0 opacity-30 w-full bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:6rem_5rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tighter bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40 bg-clip-text text-transparent">
                {t('insights.title')}
              </h1>
            </div>
            <p className="text-[#A89070] max-w-2xl">
              {t('insights.subtitle')}
            </p>
          </motion.div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* ── Filters ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          {/* Type filter tabs */}
          <div className="flex flex-wrap gap-2">
            {FILTER_TYPES.map((ft) => (
              <Button
                key={ft.value}
                variant={typeFilter === ft.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter(ft.value)}
                className="rounded-full"
              >
                {ft.label}
              </Button>
            ))}
          </div>

          {/* Country dropdown */}
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-[200px]">
              <Globe className="mr-2 h-4 w-4 text-gray-400" />
              <SelectValue placeholder="Filter by country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* ── Results count ───────────────────────────────────────── */}
        <p className="mb-4 text-sm text-gray-400">
          Showing {filtered.length} insight{filtered.length !== 1 ? 's' : ''}
        </p>

        {/* ── Insight Cards Grid ──────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Activity className="h-12 w-12 text-gray-400/40 mb-4" />
            <p className="text-gray-400">No insights match the current filters.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {filtered.map((insight, index) => {
              const sev = SEVERITY_STYLES[insight.severity];
              const typ = TYPE_STYLES[insight.type];
              const trend = TREND_ICONS[insight.trendDirection];
              const TypeIcon = typ.icon;
              const TrendIcon = trend.icon;

              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.06 }}
                >
                  <Card className={`border ${sev.border} bg-white/[0.03] border-gray-800 rounded-2xl hover:shadow-md transition-shadow h-full`}>
                    <CardContent className="p-5 flex flex-col gap-3 h-full">

                      {/* Badges row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`${sev.bg} ${sev.text} border-0 capitalize`}>
                          {insight.severity}
                        </Badge>
                        <Badge className={`${typ.bg} ${typ.text} border-0 capitalize`}>
                          <TypeIcon className="mr-1 h-3 w-3" />
                          {insight.type}
                        </Badge>
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-foreground leading-snug">
                        {insight.title}
                      </h3>

                      {/* Summary */}
                      <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">
                        {insight.summary}
                      </p>

                      {/* Trend + meta */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-400 mt-auto pt-2">
                        <span className={`flex items-center gap-1 font-medium ${trend.color}`}>
                          <TrendIcon className="h-3.5 w-3.5" />
                          {insight.trendDirection === 'up'
                            ? 'Trending up'
                            : insight.trendDirection === 'down'
                              ? 'Trending down'
                              : 'Stable'}
                        </span>
                        <span className="flex items-center gap-1">
                          <CountryFlag country={insight.country} size="xs" />
                          {insight.country}
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          {insight.indicator}
                        </span>
                      </div>

                      {/* Footer: timestamp + expand */}
                      <div className="flex items-center justify-between border-t border-gray-800/50 pt-3 mt-1">
                        <span className="text-[11px] text-gray-400">
                          Generated {formatDate(insight.generatedAt)}
                        </span>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-1 text-xs">
                              Expand <ChevronDown className="h-3.5 w-3.5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-black/95 border-gray-800">
                            <DialogHeader>
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <Badge className={`${sev.bg} ${sev.text} border-0 capitalize`}>
                                  {insight.severity}
                                </Badge>
                                <Badge className={`${typ.bg} ${typ.text} border-0 capitalize`}>
                                  <TypeIcon className="mr-1 h-3 w-3" />
                                  {insight.type}
                                </Badge>
                              </div>
                              <DialogTitle className="text-lg leading-snug">
                                {insight.title}
                              </DialogTitle>
                              <DialogDescription className="sr-only">
                                Detailed insight analysis
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 mt-2">
                              {/* Summary */}
                              <div>
                                <h4 className="text-sm font-medium text-foreground mb-1">Summary</h4>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                  {insight.summary}
                                </p>
                              </div>

                              {/* Full detail */}
                              <div>
                                <h4 className="text-sm font-medium text-foreground mb-1">Detailed Analysis</h4>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                  {insight.detail}
                                </p>
                              </div>

                              {/* Meta grid */}
                              <div className="grid grid-cols-2 gap-3 rounded-lg border border-gray-800 p-4 text-sm">
                                <div>
                                  <span className="text-gray-400">Country</span>
                                  <p className="font-medium text-foreground">{insight.country}</p>
                                </div>
                                <div>
                                  <span className="text-gray-400">Indicator</span>
                                  <p className="font-medium text-foreground">{insight.indicator}</p>
                                </div>
                                <div>
                                  <span className="text-gray-400">Trend</span>
                                  <p className={`font-medium flex items-center gap-1 ${trend.color}`}>
                                    <TrendIcon className="h-4 w-4" />
                                    {insight.trendDirection === 'up'
                                      ? 'Trending up'
                                      : insight.trendDirection === 'down'
                                        ? 'Trending down'
                                        : 'Stable'}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-400">Generated</span>
                                  <p className="font-medium text-foreground">
                                    {formatDate(insight.generatedAt)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>

                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Insights;
