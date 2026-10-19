import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Shield, Search, Pencil, Loader2, ExternalLink, Save } from 'lucide-react';
import CountryFlag from '@/components/CountryFlag';
import { useToast } from '@/hooks/use-toast';
import { authHeader } from '@/lib/supabase-token';

// ─── Country policy editor (admin) ────────────────────────────────────────────
// Sets each country's status on the Protocol to the Agreement Establishing the
// AfCFTA on Women and Youth in Trade (AU Assembly, Feb 2024), plus a note and
// a source URL for provenance. Reads the public rankings and writes through
// PATCH /policy-monitor/:countryId (ADMIN), which recomputes that country's
// compliance score. Every country starts UNKNOWN ("Not yet assessed"); only
// set SIGNED / RATIFIED when you can cite a source.

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const POLICY_API = `${API_BASE}/policy-monitor`;

const STATUSES = ['UNKNOWN', 'NOT_SIGNED', 'SIGNED', 'RATIFIED'] as const;
type AfcftaStatus = (typeof STATUSES)[number];

const STATUS_LABELS: Record<AfcftaStatus, string> = {
  UNKNOWN: 'Not yet assessed',
  NOT_SIGNED: 'Not signed',
  SIGNED: 'Signed',
  RATIFIED: 'Ratified',
};

const STATUS_ACCENT: Record<AfcftaStatus, string> = {
  UNKNOWN: '#6B7280',
  NOT_SIGNED: '#EF4444',
  SIGNED: '#F59E0B',
  RATIFIED: '#22C55E',
};

interface PolicyRow {
  countryId: string;
  countryName: string;
  iso3Code: string;
  region: string;
  complianceScore: number;
  afcftaProtocolStatus: AfcftaStatus;
  afcftaProtocolNote: string | null;
  afcftaProtocolSourceUrl: string | null;
}

const PolicyManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | AfcftaStatus>('all');
  const [editing, setEditing] = useState<PolicyRow | null>(null);
  const [draft, setDraft] = useState<{ status: AfcftaStatus; note: string; sourceUrl: string }>({
    status: 'UNKNOWN', note: '', sourceUrl: '',
  });
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery<PolicyRow[]>({
    queryKey: ['admin-policy-rows'],
    queryFn: async () => {
      const res = await fetch(`${POLICY_API}/rankings`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return (json?.data ?? []) as PolicyRow[];
    },
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const rows = data ?? [];

  const visibleRows = useMemo(() => {
    let arr = rows;
    if (filterStatus !== 'all') arr = arr.filter((r) => (r.afcftaProtocolStatus ?? 'UNKNOWN') === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((r) => r.countryName.toLowerCase().includes(q) || (r.region ?? '').toLowerCase().includes(q));
    }
    return [...arr].sort((a, b) => a.countryName.localeCompare(b.countryName));
  }, [rows, search, filterStatus]);

  const counts = useMemo(() => {
    const c: Record<AfcftaStatus, number> = { UNKNOWN: 0, NOT_SIGNED: 0, SIGNED: 0, RATIFIED: 0 };
    rows.forEach((r) => { c[r.afcftaProtocolStatus ?? 'UNKNOWN']++; });
    return c;
  }, [rows]);

  const openEditor = (r: PolicyRow) => {
    setEditing(r);
    setDraft({
      status: r.afcftaProtocolStatus ?? 'UNKNOWN',
      note: r.afcftaProtocolNote ?? '',
      sourceUrl: r.afcftaProtocolSourceUrl ?? '',
    });
  };

  const needsSource = (draft.status === 'SIGNED' || draft.status === 'RATIFIED') && !draft.sourceUrl.trim();

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`${POLICY_API}/${editing.countryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({
          afcftaProtocolStatus: draft.status,
          afcftaProtocolNote: draft.note.trim(),
          afcftaProtocolSourceUrl: draft.sourceUrl.trim(),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
        throw new Error(msg || `HTTP ${res.status}`);
      }
      toast({ title: 'Policy record updated', description: `${editing.countryName}: ${STATUS_LABELS[draft.status]}` });
      queryClient.invalidateQueries({ queryKey: ['admin-policy-rows'] });
      queryClient.invalidateQueries({ queryKey: ['policy-rankings'] });
      setEditing(null);
    } catch (e: any) {
      toast({ title: 'Update failed', description: e?.message || 'Try again', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-[#D4A017]" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tighter bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40 bg-clip-text text-transparent">
              Country Policies
            </h1>
            <p className="text-xs text-[#A89070] mt-0.5">
              AfCFTA Protocol on Women and Youth in Trade status per country. Shown on the Policy Monitor and country profiles, and counted in the compliance score (unassessed countries are excluded from that component).
            </p>
          </div>
        </div>
        <Link to="/policy-monitor">
          <Button size="sm" variant="outline" className="gap-1.5 self-start">
            <ExternalLink className="h-4 w-4" /> View Policy Monitor
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['RATIFIED', 'SIGNED', 'NOT_SIGNED', 'UNKNOWN'] as AfcftaStatus[]).map((s) => (
          <div key={s} className="rounded-2xl p-4 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-gray-800/80">
            <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: STATUS_ACCENT[s] }}>{counts[s]}</p>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-1">{STATUS_LABELS[s]}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <Input
            placeholder="Search countries…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-white/[0.03] border-gray-800"
          />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as 'all' | AfcftaStatus)}>
          <SelectTrigger className="w-full sm:w-[210px] h-9 text-xs bg-white/[0.03] border-gray-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="text-xs">{STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </div>
      ) : visibleRows.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-gray-800 bg-white/[0.02]">
          <Shield className="h-10 w-10 text-gray-500 mx-auto mb-3" />
          <p className="text-base font-medium text-gray-300">
            {rows.length === 0 ? 'No country policy records yet' : 'No countries match your filters'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {rows.length === 0 ? 'Import the policies database from the Data Upload page first.' : 'Try clearing the search or status filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleRows.map((r) => {
            const status = r.afcftaProtocolStatus ?? 'UNKNOWN';
            const accent = STATUS_ACCENT[status];
            return (
              <Card key={r.countryId} className="bg-white/[0.03] border-gray-800/80 rounded-xl overflow-hidden hover:border-gray-700 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <CountryFlag country={r.countryName} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-bold text-white">{r.countryName}</h3>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">{r.region}</span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider" style={{ background: accent + '20', color: accent }}>
                          {STATUS_LABELS[status]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {r.afcftaProtocolNote || <span className="italic text-gray-600">No note</span>}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-gray-500">
                        <span className="tabular-nums">Score {r.complianceScore}</span>
                        {r.afcftaProtocolSourceUrl && (
                          <>
                            <span className="text-gray-700">·</span>
                            <a href={r.afcftaProtocolSourceUrl} target="_blank" rel="noopener noreferrer" className="truncate text-[#D4A017] hover:underline">
                              Source
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 self-start" onClick={() => openEditor(r)} title="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Editor */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="bg-black/95 border-gray-800">
          <DialogHeader>
            <DialogTitle>{editing?.countryName}: AfCFTA Women &amp; Youth Protocol</DialogTitle>
            <DialogDescription>
              Protocol to the Agreement Establishing the AfCFTA on Women and Youth in Trade. Ratified scores 100, signed 50, not signed 0; "Not yet assessed" is left out of the score.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={draft.status} onValueChange={(v) => setDraft((d) => ({ ...d, status: v as AfcftaStatus }))}>
                <SelectTrigger className="h-9 text-xs bg-white/[0.03] border-gray-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Source URL</Label>
              <Input
                placeholder="https://…"
                value={draft.sourceUrl}
                onChange={(e) => setDraft((d) => ({ ...d, sourceUrl: e.target.value }))}
                className="h-9 text-xs bg-white/[0.03] border-gray-800"
              />
              {needsSource && (
                <p className="text-[11px] text-amber-400">Add a source for a signed or ratified status.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Note</Label>
              <Textarea
                placeholder="e.g. Signed 12 Feb 2025; instrument deposited …"
                value={draft.note}
                onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
                className="text-xs bg-white/[0.03] border-gray-800 min-h-[80px]"
                maxLength={1000}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving || needsSource} className="gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PolicyManager;
