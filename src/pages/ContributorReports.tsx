import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  FileText, Upload as UploadIcon, Search, Download, Calendar, Tag, Trash2, ExternalLink, Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { authHeader } from '@/lib/supabase-token';
import { usePkpbUploads } from '@/hooks/usePkpbUploads';
import { useCountries } from '@/hooks/useData';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const DOCS_API = `${API_BASE}/documents`;

const DOC_TYPES = ['PKPB_REPORT', 'COUNTRY_REPORT', 'POLICY_DOCUMENT', 'RESEARCH_PAPER', 'OTHER'] as const;
type DocType = (typeof DOC_TYPES)[number];

const TYPE_LABELS: Record<DocType, string> = {
  PKPB_REPORT: 'Promise Kept · Promise Broken',
  COUNTRY_REPORT: 'Country Report',
  POLICY_DOCUMENT: 'Policy Document',
  RESEARCH_PAPER: 'Research Paper',
  OTHER: 'Other',
};

const TYPE_ACCENT: Record<DocType, string> = {
  PKPB_REPORT: '#D4A017',
  COUNTRY_REPORT: '#3B82F6',
  POLICY_DOCUMENT: '#A855F7',
  RESEARCH_PAPER: '#22C55E',
  OTHER: '#6B7280',
};

interface DocumentRecord {
  id: string;
  type: DocType;
  title: string;
  description?: string | null;
  country?: { id: string; name: string; isoCode3: string } | null;
  originalFilename: string;
  fileSize: number;
  source?: string | null;
  edition?: string | null;
  year?: number | null;
  uploadedById?: string | null;
  createdAt: string;
}

const fmtBytes = (n: number) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, '-');

const ContributorReports: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | DocType>('all');
  const [confirmDelete, setConfirmDelete] = useState<DocumentRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Always pull fresh data when this route is visited — the previous default
  // behavior could surface a cached "0 uploads" state if the API had been
  // unreachable on the first mount.
  const { data: docs, isLoading } = useQuery<DocumentRecord[]>({
    queryKey: ['contributor-documents'],
    queryFn: async () => {
      const res = await fetch(`${DOCS_API}?limit=500`, { headers: authHeader() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    refetchInterval: 30000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 0,
    retry: 2,
  });

  const all = docs ?? [];

  const visible = useMemo(() => {
    let arr = all;
    if (filterType !== 'all') arr = arr.filter((d) => d.type === filterType);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q) ||
          d.country?.name.toLowerCase().includes(q) ||
          d.source?.toLowerCase().includes(q),
      );
    }
    return arr;
  }, [all, search, filterType]);

  const totalSize = useMemo(() => all.reduce((s, d) => s + d.fileSize, 0), [all]);
  const myCount = user ? all.filter((d) => d.uploadedById === user.id).length : 0;

  // PKPB country coverage — shared with the PKPB index page via the
  // `usePkpbUploads` hook so the two pages always agree on the counts. The
  // upload form invalidates the same query key on success, so a fresh
  // upload bumps the right cell up and "Awaiting" down here too. We track
  // HTML and PDF separately so contributors can see the actual format-level
  // progress across the 54 × 2 potential uploads.
  const pkpbUploads = usePkpbUploads();
  const { data: countriesData } = useCountries();
  const totalCountries = useMemo(() => {
    if (!countriesData) return 0;
    if (Array.isArray(countriesData)) return countriesData.length;
    if (Array.isArray((countriesData as any).data)) return (countriesData as any).data.length;
    return 0;
  }, [countriesData]);
  const coveredCountries = pkpbUploads.count;
  const awaitingCountries = Math.max(0, totalCountries - coveredCountries);
  const htmlCountries = pkpbUploads.htmlCount;
  const pdfCountries = pkpbUploads.pdfCount;
  const completeCountries = pkpbUploads.completeCount;

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`${DOCS_API}/${confirmDelete.id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({ title: 'Document deleted', description: confirmDelete.title });
      queryClient.invalidateQueries({ queryKey: ['contributor-documents'] });
      setConfirmDelete(null);
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message ?? 'Try again.', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-[#D4A017]" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tighter bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40 bg-clip-text text-transparent">
              Reports & Files
            </h1>
            <p className="text-xs text-[#A89070] mt-0.5">
              Browse all uploaded reports and documents. Use the Contributor Hub to add new ones.
            </p>
          </div>
        </div>
        <Link to="/dashboard/data-upload">
          <Button size="sm" className="gap-1.5 self-start">
            <UploadIcon className="h-4 w-4" /> New upload
          </Button>
        </Link>
      </div>

      {/* Stats — country counts come from the shared `usePkpbUploads` hook so
          they stay in lockstep with the PKPB index page and refresh the moment
          a new PKPB upload completes (DataUpload invalidates the same key).
          HTML and PDF are tracked independently because the rendered country
          page needs HTML for the animated render and PDF for download —
          contributors need to see exactly which format is missing per
          country, not a single rolled-up "uploaded" count. */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total documents', value: all.length.toString(), accent: '#D4A017', sub: 'every uploaded file' },
          {
            label: 'HTML on file',
            value: `${htmlCountries}${totalCountries ? ` / ${totalCountries}` : ''}`,
            accent: '#22C55E',
            sub: 'animated render',
          },
          {
            label: 'PDF on file',
            value: `${pdfCountries}${totalCountries ? ` / ${totalCountries}` : ''}`,
            accent: '#0EA5E9',
            sub: 'downloadable archive',
          },
          {
            label: 'Complete',
            value: `${completeCountries}${totalCountries ? ` / ${totalCountries}` : ''}`,
            accent: '#A855F7',
            sub: 'HTML + PDF both',
          },
          {
            label: 'Awaiting',
            value: awaitingCountries.toString(),
            accent: '#F59E0B',
            sub: 'no upload yet',
          },
          { label: 'My uploads', value: myCount.toString(), accent: '#3B82F6', sub: 'this account' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-4 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-gray-800/80">
            <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: s.accent }}>{s.value}</p>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-1">{s.label}</p>
            <p className="text-[10px] text-gray-600 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <Input
            placeholder="Search title, country, source…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-white/[0.03] border-gray-800"
          />
        </div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v as 'all' | DocType)}>
          <SelectTrigger className="w-full sm:w-[220px] h-9 text-xs bg-white/[0.03] border-gray-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All types</SelectItem>
            {DOC_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="text-xs">{TYPE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-gray-800 bg-white/[0.02]">
          <FileText className="h-10 w-10 text-gray-500 mx-auto mb-3" />
          <p className="text-base font-medium text-gray-300">
            {all.length === 0 ? 'No reports uploaded yet' : 'No reports match your filters'}
          </p>
          <p className="text-xs text-gray-500 mt-1 mb-4">
            {all.length === 0
              ? 'Drop a PDF or DOCX in the Contributor Hub to start.'
              : 'Try clearing the search or type filter.'}
          </p>
          {all.length === 0 && (
            <Link to="/dashboard/data-upload">
              <Button size="sm" className="gap-1.5">
                <UploadIcon className="h-3.5 w-3.5" /> Upload your first report
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((d) => {
            const accent = TYPE_ACCENT[d.type];
            const countrySlug = d.country?.name ? slugify(d.country.name) : null;
            const canDelete = isAdmin;
            return (
              <Card key={d.id} className="bg-white/[0.03] border-gray-800/80 rounded-xl overflow-hidden hover:border-gray-700 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-start gap-3">
                    {/* Type icon medallion */}
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: accent + '20', color: accent }}
                    >
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider"
                          style={{ background: accent + '20', color: accent }}
                        >
                          {TYPE_LABELS[d.type]}
                        </span>
                        {d.country && (
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider">{d.country.name}</span>
                        )}
                        {d.edition && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">{d.edition}</Badge>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-white truncate">{d.title}</h3>
                      {d.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{d.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-gray-500">
                        {d.year && (
                          <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {d.year}</span>
                        )}
                        {d.source && (
                          <span className="inline-flex items-center gap-1"><Tag className="h-3 w-3" /> {d.source}</span>
                        )}
                        <span className="text-gray-700">·</span>
                        <span className="tabular-nums">{fmtBytes(d.fileSize)}</span>
                        <span className="text-gray-700">·</span>
                        <span className="truncate text-gray-600">{d.originalFilename}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 self-start">
                      {d.type === 'PKPB_REPORT' && countrySlug && (
                        <Link to={`/dashboard/pkpb/${countrySlug}`} title="View PKPB page">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      )}
                      <a href={`${DOCS_API}/${d.id}/download`} target="_blank" rel="noopener noreferrer" title="Download">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => setConfirmDelete(d)}
                          title="Delete (admin)"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="bg-black/95 border-gray-800">
          <DialogHeader>
            <DialogTitle>Delete this document?</DialogTitle>
            <DialogDescription>
              "{confirmDelete?.title}" will be removed permanently — both the database record and the file in storage.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting} className="gap-1.5">
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContributorReports;
