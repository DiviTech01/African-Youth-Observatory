import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, ChevronDown, ChevronUp, Download, CheckCircle, XCircle } from 'lucide-react';
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

const getScoreColor = (score: number) => {
  if (score > 70) return 'bg-green-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
};

const getScoreTextColor = (score: number) => {
  if (score > 70) return 'text-green-600 dark:text-green-400';
  if (score >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
};

const getArticleStatusBadge = (status: string) => {
  switch (status) {
    case 'compliant':
      return <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 text-xs">Compliant</Badge>;
    case 'partial':
      return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs">Partial</Badge>;
    case 'non-compliant':
      return <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30 text-xs">Non-compliant</Badge>;
    default:
      return null;
  }
};

const PolicyMonitor = () => {
  const { t } = useLanguage();
  const { preferences } = useUserPreferences();
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);

  // Fetch real rankings from API
  const { data: apiRankings, isError } = useQuery({
    queryKey: ['policy-rankings'],
    queryFn: () => api.policyMonitor.rankings(),
  });

  // Use API data or fallback to mock
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
    setExpandedCountry(prev => (prev === country ? null : country));
  };

  const ratifiedCount = activePolicyData.filter(d => d.aycRatified).length;
  const withPolicyCount = activePolicyData.filter(d => d.nationalYouthPolicy).length;
  const avgScore = activePolicyData.length > 0 ? Math.round(activePolicyData.reduce((sum, d) => sum + d.complianceScore, 0) / activePolicyData.length) : 0;

  return (
    <>
      <header className="relative py-8 md:py-12 overflow-hidden">
        <div className="absolute inset-0 opacity-30 w-full bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:6rem_5rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="relative z-10 container px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-semibold tracking-tighter bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40 bg-clip-text text-transparent">{t('policy.title')}</h1>
              </div>
              <p className="text-[#A89070]">
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

      <div className="py-6 md:py-8">
        <div className="container px-4 md:px-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card className="bg-white/[0.03] border-gray-800 rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-primary">{ratifiedCount}/{activePolicyData.length}</p>
                <p className="text-sm text-gray-400 mt-1">AYC Ratified</p>
              </CardContent>
            </Card>
            <Card className="bg-white/[0.03] border-gray-800 rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-primary">{withPolicyCount}/{activePolicyData.length}</p>
                <p className="text-sm text-gray-400 mt-1">National Youth Policy</p>
              </CardContent>
            </Card>
            <Card className="bg-white/[0.03] border-gray-800 rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className={`text-3xl font-bold ${getScoreTextColor(avgScore)}`}>{avgScore}%</p>
                <p className="text-sm text-gray-400 mt-1">Avg. Compliance Score</p>
              </CardContent>
            </Card>
            <Card className="bg-white/[0.03] border-gray-800 rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-primary">{activePolicyData.filter(d => d.wpay).length}</p>
                <p className="text-sm text-gray-400 mt-1">WPAY Aligned</p>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Score Table */}
          <Card className="mb-8 bg-white/[0.03] border-gray-800 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Compliance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800/50">
                      <th className="text-left py-3 px-2 text-xs font-medium text-gray-400">Country</th>
                      <th className="text-center py-3 px-2 text-xs font-medium text-gray-400">AYC Ratified</th>
                      <th className="text-center py-3 px-2 text-xs font-medium text-gray-400">Nat. Youth Policy</th>
                      <th className="text-center py-3 px-2 text-xs font-medium text-gray-400">Policy Year</th>
                      <th className="text-left py-3 px-2 text-xs font-medium text-gray-400 min-w-[200px]">Compliance Score</th>
                      <th className="text-center py-3 px-2 text-xs font-medium text-gray-400">WPAY</th>
                      <th className="text-center py-3 px-2 text-xs font-medium text-gray-400">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePolicyData.map((item) => {
                      const isMyCountry = preferences.myCountry && item.country.toLowerCase() === preferences.myCountry.toLowerCase();
                      return (
                      <React.Fragment key={item.country}>
                        <tr className={`border-b border-gray-800/50 hover:bg-white/[0.04] transition-colors ${isMyCountry ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}>
                          <td className="py-3 px-2 font-medium">
                            <span className="inline-flex items-center gap-2">
                              <CountryFlag country={item.country} size="sm" />
                              {item.country}
                              {isMyCountry && <Badge className="ml-1 bg-primary/15 text-primary border-primary/30 text-[10px] px-1.5 py-0">Your Country</Badge>}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            {item.aycRatified ? (
                              <CheckCircle className="h-5 w-5 text-green-500 inline-block" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-400 inline-block" />
                            )}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {item.nationalYouthPolicy ? (
                              <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30">Yes</Badge>
                            ) : (
                              <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30">No</Badge>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center text-sm text-gray-400">
                            {item.policyYear ?? '—'}
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-grow h-3 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${getScoreColor(item.complianceScore)}`}
                                  style={{ width: `${item.complianceScore}%` }}
                                />
                              </div>
                              <span className={`text-sm font-bold min-w-[36px] text-right ${getScoreTextColor(item.complianceScore)}`}>
                                {item.complianceScore}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center">
                            {item.wpay ? (
                              <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 text-xs">WPAY</Badge>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpand(item.country)}
                              className="h-8 w-8 p-0"
                            >
                              {expandedCountry === item.country ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </td>
                        </tr>
                        {expandedCountry === item.country && (
                          <tr className="bg-white/[0.03]">
                            <td colSpan={7} className="p-4">
                              <div className="grid gap-6 md:grid-cols-2">
                                {/* AYC Article Breakdown */}
                                <div>
                                  <h4 className="font-semibold text-sm mb-3">AYC Article Compliance</h4>
                                  <div className="space-y-2">
                                    {item.aycArticles.map((art) => (
                                      <div key={art.article} className="flex items-center justify-between py-1 px-2 rounded bg-background">
                                        <span className="text-sm">{art.article}</span>
                                        {getArticleStatusBadge(art.status)}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                {/* Policy Timeline */}
                                <div>
                                  <h4 className="font-semibold text-sm mb-3">Policy Timeline</h4>
                                  <div className="relative pl-4 border-l-2 border-primary/30 space-y-4">
                                    {item.timelineEvents.map((evt, idx) => (
                                      <div key={idx} className="relative">
                                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                                        <p className="text-xs font-bold text-primary">{evt.year}</p>
                                        <p className="text-sm text-gray-400">{evt.event}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Legend / Methodology Note */}
          <div className="p-4 bg-white/[0.03] border border-gray-800 rounded-lg">
            <h3 className="font-bold mb-2">Scoring Methodology</h3>
            <p className="text-sm text-gray-400 mb-3">
              Compliance scores are calculated based on alignment with the African Youth Charter (AYC) articles,
              the World Programme of Action for Youth (WPAY) indicators, and the existence and currency of a
              national youth policy framework.
            </p>
            <div className="flex flex-wrap gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
                High compliance (&gt;70%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full bg-amber-500" />
                Moderate compliance (50–70%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
                Low compliance (&lt;50%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PolicyMonitor;
