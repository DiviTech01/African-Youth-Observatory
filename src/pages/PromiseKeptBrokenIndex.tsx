import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Upload as UploadIcon, FileText, ChevronRight, CheckCircle2, AlertCircle, Eye, WifiOff, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCountries, useYouthIndexRankings } from '@/hooks/useData';
import CountryFlag from '@/components/CountryFlag';
import ScrollReveal from '@/components/ScrollReveal';
import { usePkpbUploads } from '@/hooks/usePkpbUploads';

// Slugify must match `usePkpbUploads`'s slug rule exactly (including stripping
// apostrophes/dots) or names like "Côte d'Ivoire" won't join with the doc list.
const slugify = (s: string) => s.toLowerCase().replace(/['.]/g, '').replace(/\s+/g, '-');

const TIER_COLOR = {
  Fulfilling: '#006B3F',
  Developing: '#C9942A',
  Critical: '#C0392B',
} as const;

const REGIONS = [
  { value: 'all', label: 'All regions' },
  { value: 'NORTH_AFRICA', label: 'North Africa' },
  { value: 'WEST_AFRICA', label: 'West Africa' },
  { value: 'EAST_AFRICA', label: 'East Africa' },
  { value: 'CENTRAL_AFRICA', label: 'Central Africa' },
  { value: 'SOUTHERN_AFRICA', label: 'Southern Africa' },
] as const;

const PromiseKeptBrokenIndex: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canUpload = user?.role === 'CONTRIBUTOR' || user?.role === 'ADMIN';
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState<string>('all');
  const [filter, setFilter] = useState<
    'all' | 'with-report' | 'no-report' | 'html-only' | 'pdf-only' | 'complete' | 'partial'
  >('all');

  const { data: countriesData, isLoading: countriesLoading, refetch: refetchCountries, isFetching: countriesFetching } = useCountries();
  const countries: any[] = useMemo(() => {
    if (!countriesData) return [];
    if (Array.isArray(countriesData)) return countriesData;
    if (Array.isArray((countriesData as any).data)) return (countriesData as any).data;
    return [];
  }, [countriesData]);

  // Single source of truth for "which countries have an uploaded PKPB report".
  // We deliberately match by *slug of country name* rather than by id because
  // `useCountries` returns the hardcoded `AFRICAN_COUNTRIES` list (iso2-keyed
  // ids like "bf", "ng") while the documents API returns Prisma cuid country
  // ids ("cmnj166v..."). The two id namespaces never overlap, so id-based
  // matching always reported zero. Country names match across both sources,
  // so slugifying the name on each side gives a stable join key.
  const pkpbUploads = usePkpbUploads();
  const docsLoading = pkpbUploads.isLoading;
  const docsError = pkpbUploads.isError;
  const refetchDocs = pkpbUploads.refetch;
  // `pkpbByCountry` is a name-slug → doc lookup. Callers pass `slugify(c.name)`.
  const pkpbByCountry = pkpbUploads.bySlug;

  // Real youth-index rankings (latest year). Replaces the parametric
  // AYEMI score that this page used to fabricate from a hardcoded meta
  // table. We index by country-name slug for the same reason the PKPB
  // lookup does — `useCountries` returns iso2-keyed ids while the API
  // returns Prisma cuids, so name-slug is the only stable join.
  const { data: rankingsData } = useYouthIndexRankings(2025);
  const rankingsByName = useMemo(() => {
    const m = new Map<string, { score: number; tier: string }>();
    const rows = Array.isArray(rankingsData) ? rankingsData : [];
    for (const r of rows as any[]) {
      const name = r.countryName ?? r.country?.name;
      const score = r.overallScore ?? r.indexScore ?? r.score;
      if (name && typeof score === 'number') {
        m.set(slugify(name), { score, tier: r.tier ?? '' });
      }
    }
    return m;
  }, [rankingsData]);

  // Score → tier-color helper. Three bands map to the existing PKPB palette.
  const scoreColor = (score: number): string => {
    if (score >= 67) return '#006B3F'; // Fulfilling
    if (score >= 34) return '#C9942A'; // Developing
    return '#C0392B';                  // Critical
  };
  const scoreTier = (score: number): string => {
    if (score >= 67) return 'Fulfilling';
    if (score >= 34) return 'Developing';
    return 'Critical';
  };

  const visible = useMemo(() => {
    let arr = countries;
    if (region !== 'all') arr = arr.filter((c) => c.region === region);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((c) => c.name.toLowerCase().includes(q) || c.isoCode3.toLowerCase().includes(q));
    }
    if (filter !== 'all') {
      arr = arr.filter((c) => {
        const status = pkpbByCountry.get(slugify(c.name));
        switch (filter) {
          case 'with-report': return !!status;
          case 'no-report':   return !status;
          case 'html-only':   return !!status && status.hasHtml && !status.hasPdf;
          case 'pdf-only':    return !!status && status.hasPdf && !status.hasHtml;
          case 'complete':    return !!status && status.hasHtml && status.hasPdf;
          case 'partial':     return !!status && (status.hasHtml !== status.hasPdf);
          default:            return true;
        }
      });
    }
    return arr;
  }, [countries, search, region, filter, pkpbByCountry]);

  const withReportCount = useMemo(
    () => countries.filter((c) => pkpbByCountry.has(slugify(c.name))).length,
    [countries, pkpbByCountry],
  );

  const isLoading = countriesLoading || docsLoading;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-[#D4A017]" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tighter bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40 bg-clip-text text-transparent">
              Promise Kept · Promise Broken
            </h1>
            <p className="text-xs text-[#A89070] mt-0.5">
              Country report cards — the AYEMI scorecard, broken commitments, and structural gaps.
              Pick a country to view its full PKPB report card.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              refetchDocs();
              refetchCountries();
            }}
            disabled={pkpbUploads.isLoading || countriesFetching}
            title="Refresh upload counts"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${pkpbUploads.isLoading || countriesFetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {canUpload && (
            <Link to="/dashboard/data-upload">
              <Button size="sm" className="gap-1.5">
                <UploadIcon className="h-4 w-4" /> Upload PKPB report
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* API-unreachable banner — explains why the "uploaded" badges may be
          missing instead of leaving the user to assume nothing's been uploaded. */}
      {docsError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/[0.06] p-3 flex items-start gap-3">
          <WifiOff className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-red-200">Couldn't reach the upload registry</p>
            <p className="text-[11px] text-red-300/70 mt-0.5 leading-relaxed">
              We can't tell which countries already have a PKPB report uploaded.
              The list below may show every country as awaiting until the API responds.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetchDocs()} className="h-7 text-[11px] border-red-500/40 text-red-200 hover:bg-red-500/10 hover:text-red-100">
            Retry
          </Button>
        </div>
      )}

      {/* Diagnostic strip — small text under the header that reflects what
          the upload registry hook is actually returning. Useful when the
          counts disagree with what an admin knows is on disk; surfaces
          whether the fetch is loading, errored, returned empty, or has
          countryless docs. */}
      <div className="text-[11px] text-gray-500 -mt-2">
        Upload registry:{' '}
        {pkpbUploads.isLoading ? (
          <span className="text-amber-400">loading…</span>
        ) : pkpbUploads.isError ? (
          <span className="text-red-400">fetch failed</span>
        ) : (
          <span>
            {pkpbUploads.docs.length} doc{pkpbUploads.docs.length === 1 ? '' : 's'} ·{' '}
            {pkpbUploads.count} distinct {pkpbUploads.count === 1 ? 'country' : 'countries'}
            {pkpbUploads.docs.length > 0 && pkpbUploads.count === 0 && (
              <span className="text-amber-400"> (docs have no countryId — check upload form)</span>
            )}
          </span>
        )}
      </div>

      {/* Stats — track HTML and PDF independently so contributors can see how
          many of the 108 potential uploads (54 countries × 2 formats) are
          actually on file. "Complete" means both formats are uploaded. */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-2xl p-4 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-gray-800/80">
          <p className="text-2xl font-bold tabular-nums leading-none text-[#D4A017]">{countries.length}</p>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-1">Countries</p>
          <p className="text-[10px] text-gray-600 mt-0.5">total in scope</p>
        </div>
        <div className="rounded-2xl p-4 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-gray-800/80">
          <p className="text-2xl font-bold tabular-nums leading-none text-emerald-400">
            {pkpbUploads.htmlCount}
            <span className="text-sm font-medium text-gray-500"> / {countries.length}</span>
          </p>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-1">HTML on file</p>
          <p className="text-[10px] text-gray-600 mt-0.5">animated render</p>
        </div>
        <div className="rounded-2xl p-4 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-gray-800/80">
          <p className="text-2xl font-bold tabular-nums leading-none text-sky-400">
            {pkpbUploads.pdfCount}
            <span className="text-sm font-medium text-gray-500"> / {countries.length}</span>
          </p>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-1">PDF on file</p>
          <p className="text-[10px] text-gray-600 mt-0.5">downloadable archive</p>
        </div>
        <div className="rounded-2xl p-4 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-gray-800/80">
          <p className="text-2xl font-bold tabular-nums leading-none text-violet-400">
            {pkpbUploads.completeCount}
            <span className="text-sm font-medium text-gray-500"> / {countries.length}</span>
          </p>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-1">Complete</p>
          <p className="text-[10px] text-gray-600 mt-0.5">HTML + PDF both</p>
        </div>
        <div className="rounded-2xl p-4 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-gray-800/80">
          <p className="text-2xl font-bold tabular-nums leading-none text-amber-400">{countries.length - withReportCount}</p>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-1">Awaiting</p>
          <p className="text-[10px] text-gray-600 mt-0.5">no upload yet</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <Input
            placeholder="Search country…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-white/[0.03] border-gray-800"
          />
        </div>
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger className="w-full sm:w-[170px] h-9 text-xs bg-white/[0.03] border-gray-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REGIONS.map((r) => (
              <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs bg-white/[0.03] border-gray-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All countries</SelectItem>
            <SelectItem value="with-report" className="text-xs">Any upload on file</SelectItem>
            <SelectItem value="complete" className="text-xs">Complete (HTML + PDF)</SelectItem>
            <SelectItem value="partial" className="text-xs">Partial (one format only)</SelectItem>
            <SelectItem value="html-only" className="text-xs">HTML only</SelectItem>
            <SelectItem value="pdf-only" className="text-xs">PDF only</SelectItem>
            <SelectItem value="no-report" className="text-xs">Awaiting upload</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Country grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-white/[0.03] border border-gray-800/60 animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-gray-800 bg-white/[0.02]">
          <FileText className="h-10 w-10 text-gray-500 mx-auto mb-3" />
          <p className="text-base font-medium text-gray-300">No countries match your filters</p>
          <p className="text-xs text-gray-500 mt-1">Clear the search or change the region/status filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map((c, idx) => {
            const slug = slugify(c.name);
            const status = pkpbByCountry.get(slug);
            const doc = status?.doc;
            const hasHtml = !!status?.hasHtml;
            const hasPdf = !!status?.hasPdf;
            // Real AYEMI score for this country from the YouthIndexScore table
            // (computed off uploaded indicator values). When the country has
            // no computed score yet — because no admin has uploaded the
            // indicators that feed the index — we render a "—" instead of a
            // synthesised number.
            const ranking = rankingsByName.get(slug);
            const tierColor = ranking ? scoreColor(ranking.score) : '#6B7280';

            // Format-specific status badge — emerald when on file, amber when
            // pending. Two side by side so a contributor can tell at a glance
            // exactly what's missing for any country.
            const formatBadge = (label: string, present: boolean) => (
              <Badge
                variant="outline"
                className={`text-[9px] px-1.5 py-0 h-4 gap-1 ${
                  present
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/[0.08] text-amber-500/80 border-amber-500/20'
                }`}
              >
                {present ? <CheckCircle2 className="h-2.5 w-2.5" /> : <AlertCircle className="h-2.5 w-2.5" />}
                {label} {present ? 'on file' : 'pending'}
              </Badge>
            );

            const cardBody = (
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <CountryFlag country={c.name} size="md" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-sm font-bold text-white truncate">{c.name}</h3>
                      {status && (
                        <ChevronRight className="h-3.5 w-3.5 text-gray-600 group-hover:text-[#D4A017] transition-colors flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                      {c.isoCode3} · {c.region?.replace(/_/g, ' ').toLowerCase()}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold tabular-nums"
                        style={{ background: tierColor + '20', color: tierColor }}
                      >
                        {ranking
                          ? `AYEMI ${ranking.score.toFixed(1)} · ${scoreTier(ranking.score)}`
                          : 'AYEMI —'}
                      </span>
                      {formatBadge('HTML', hasHtml)}
                      {formatBadge('PDF', hasPdf)}
                      {hasHtml && hasPdf && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1.5 py-0 h-4 gap-1 bg-violet-500/15 text-violet-300 border-violet-500/30"
                        >
                          Complete
                        </Badge>
                      )}
                    </div>
                    {/* Uploaded state: explicit "View report" CTA so the affordance
                        isn't only the chevron + clickable card — contributors specifically
                        asked for a visible button on countries that have a doc. */}
                    {doc && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 h-7 text-[11px] gap-1.5 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(`/dashboard/pkpb/${slug}`);
                        }}
                      >
                        <Eye className="h-3 w-3" /> View report
                      </Button>
                    )}
                    {/* Upload CTA: shown when at least one format is missing
                        (full empty OR partial), so a contributor can fill the
                        gap with a single click. The label adapts to what's
                        missing — saves a hop into the form to figure it out. */}
                    {canUpload && !(hasHtml && hasPdf) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 h-7 text-[11px] gap-1.5 border-[#D4A017]/40 text-[#D4A017] hover:bg-[#D4A017]/10 hover:text-[#D4A017]"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(
                            `/dashboard/data-upload?country=${encodeURIComponent(c.id)}&type=PKPB_REPORT`,
                          );
                        }}
                      >
                        <UploadIcon className="h-3 w-3" />
                        {!status
                          ? 'Upload report'
                          : !hasHtml
                          ? 'Add HTML'
                          : 'Add PDF'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            );

            // Cards link to the full report only when a document is uploaded.
            // Otherwise they're a static container with the upload CTA above.
            // Each card fades + slides in on scroll-into-view, with a tiny
            // per-index stagger so a long list doesn't all pop together.
            // Stagger caps at index 12 so very long lists stay fast.
            const revealIndex = Math.min(idx, 12);
            if (doc) {
              return (
                <ScrollReveal key={c.id} index={revealIndex}>
                  <Link to={`/dashboard/pkpb/${slug}`} className="group block">
                    <Card className="bg-white/[0.03] border-gray-800/80 rounded-xl overflow-hidden hover:border-[#D4A017]/40 hover:bg-white/[0.05] transition-all">
                      {cardBody}
                    </Card>
                  </Link>
                </ScrollReveal>
              );
            }
            return (
              <ScrollReveal key={c.id} index={revealIndex}>
                <Card
                  className="bg-white/[0.02] border-gray-800/60 rounded-xl overflow-hidden border-dashed group"
                >
                  {cardBody}
                </Card>
              </ScrollReveal>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PromiseKeptBrokenIndex;
