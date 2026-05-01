import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Upload as UploadIcon, FileText, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authHeader } from '@/lib/supabase-token';
import { useCountries } from '@/hooks/useData';
import { getCountryReport } from '@/data/countryReports';
import CountryFlag from '@/components/CountryFlag';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const DOCS_API = `${API_BASE}/documents`;

interface PkpbDoc {
  id: string;
  countryId: string | null;
  country?: { id: string; name: string; isoCode3: string } | null;
  title: string;
  edition?: string | null;
  year?: number | null;
  createdAt: string;
}

const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, '-');

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
  const [filter, setFilter] = useState<'all' | 'with-report' | 'no-report'>('all');

  const { data: countriesData, isLoading: countriesLoading } = useCountries();
  const countries: any[] = useMemo(() => {
    if (!countriesData) return [];
    if (Array.isArray(countriesData)) return countriesData;
    if (Array.isArray((countriesData as any).data)) return (countriesData as any).data;
    return [];
  }, [countriesData]);

  // PKPB documents — group by countryId for fast lookup.
  const { data: pkpbDocs, isLoading: docsLoading } = useQuery<PkpbDoc[]>({
    queryKey: ['pkpb-index'],
    queryFn: async () => {
      const res = await fetch(`${DOCS_API}?type=PKPB_REPORT&limit=500`, { headers: authHeader() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    refetchInterval: 60000,
  });

  const pkpbByCountry = useMemo(() => {
    const m = new Map<string, PkpbDoc>();
    for (const d of pkpbDocs ?? []) {
      if (!d.countryId) continue;
      // Keep newest per country (results come back sorted desc by year/createdAt).
      if (!m.has(d.countryId)) m.set(d.countryId, d);
    }
    return m;
  }, [pkpbDocs]);

  const visible = useMemo(() => {
    let arr = countries;
    if (region !== 'all') arr = arr.filter((c) => c.region === region);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((c) => c.name.toLowerCase().includes(q) || c.isoCode3.toLowerCase().includes(q));
    }
    if (filter === 'with-report') arr = arr.filter((c) => pkpbByCountry.has(c.id));
    if (filter === 'no-report') arr = arr.filter((c) => !pkpbByCountry.has(c.id));
    return arr;
  }, [countries, search, region, filter, pkpbByCountry]);

  const withReportCount = useMemo(
    () => countries.filter((c) => pkpbByCountry.has(c.id)).length,
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
        <Link to="/dashboard/data-upload">
          <Button size="sm" className="gap-1.5 self-start">
            <UploadIcon className="h-4 w-4" /> Upload PKPB report
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="rounded-2xl p-4 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-gray-800/80">
          <p className="text-2xl font-bold tabular-nums leading-none text-[#D4A017]">{countries.length}</p>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-1">Countries</p>
        </div>
        <div className="rounded-2xl p-4 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-gray-800/80">
          <p className="text-2xl font-bold tabular-nums leading-none text-emerald-400">{withReportCount}</p>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-1">With uploaded report</p>
        </div>
        <div className="rounded-2xl p-4 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-gray-800/80">
          <p className="text-2xl font-bold tabular-nums leading-none text-amber-400">{countries.length - withReportCount}</p>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-1">Awaiting upload</p>
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
            <SelectItem value="with-report" className="text-xs">With uploaded report</SelectItem>
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
          {visible.map((c) => {
            const slug = slugify(c.name);
            const doc = pkpbByCountry.get(c.id);
            // Local fallback data so we can show AYEMI score even when no upload exists.
            const localReport = getCountryReport(c.name);
            const tierColor = localReport ? TIER_COLOR[localReport.ayemiTier] : '#6B7280';

            const cardBody = (
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <CountryFlag country={c.name} size="md" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-sm font-bold text-white truncate">{c.name}</h3>
                      {doc && (
                        <ChevronRight className="h-3.5 w-3.5 text-gray-600 group-hover:text-[#D4A017] transition-colors flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                      {c.isoCode3} · {c.region?.replace(/_/g, ' ').toLowerCase()}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {localReport && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold tabular-nums"
                          style={{ background: tierColor + '20', color: tierColor }}
                        >
                          AYEMI {localReport.ayemiScore}% · {localReport.ayemiTier}
                        </span>
                      )}
                      {doc ? (
                        <Badge
                          className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[9px] px-1.5 py-0 h-4 gap-1"
                          variant="outline"
                        >
                          <CheckCircle2 className="h-2.5 w-2.5" /> Uploaded {doc.year ?? new Date(doc.createdAt).getFullYear()}
                        </Badge>
                      ) : (
                        <Badge
                          className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[9px] px-1.5 py-0 h-4 gap-1"
                          variant="outline"
                        >
                          <AlertCircle className="h-2.5 w-2.5" /> Awaiting upload
                        </Badge>
                      )}
                    </div>
                    {/* Awaiting state: show direct upload CTA for users who can upload. */}
                    {!doc && canUpload && (
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
                        <UploadIcon className="h-3 w-3" /> Upload report
                      </Button>
                    )}
                    {/* Awaiting + read-only: invite the user to view what would render once uploaded. */}
                    {!doc && !canUpload && localReport && (
                      <Link
                        to={`/dashboard/pkpb/${slug}`}
                        className="inline-block mt-3 text-[11px] text-gray-400 hover:text-[#D4A017] transition-colors"
                      >
                        View placeholder report card →
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            );

            // Cards link to the full report only when a document is uploaded.
            // Otherwise they're a static container with the upload CTA above.
            if (doc) {
              return (
                <Link key={c.id} to={`/dashboard/pkpb/${slug}`} className="group block">
                  <Card className="bg-white/[0.03] border-gray-800/80 rounded-xl overflow-hidden hover:border-[#D4A017]/40 hover:bg-white/[0.05] transition-all">
                    {cardBody}
                  </Card>
                </Link>
              );
            }
            return (
              <Card
                key={c.id}
                className="bg-white/[0.02] border-gray-800/60 rounded-xl overflow-hidden border-dashed group"
              >
                {cardBody}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PromiseKeptBrokenIndex;
