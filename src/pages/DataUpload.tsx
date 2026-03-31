import React, { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Upload, FileSpreadsheet, AlertTriangle, CheckCircle, Download,
  Clock, Database, BarChart3, FileText, Trash2, Eye, X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const API = '/api/data-upload';
const token = () => localStorage.getItem('ayd_token');
const authHeaders = (): Record<string, string> => {
  const t = token();
  return t ? { Authorization: `Bearer ${t}` } : {};
};
const fetchAuth = (url: string) =>
  fetch(url, { headers: authHeaders() }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

// ── Upload Tab ───────────────────────────────────────────────────────────────

function UploadTab() {
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');
  const [countryColumn, setCountryColumn] = useState('Country');
  const [countryFormat, setCountryFormat] = useState<'name' | 'iso2' | 'iso3'>('name');
  const [year, setYear] = useState(2024);
  const [ageGroup, setAgeGroup] = useState('15-24');
  const [jobId, setJobId] = useState<string | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<any>(null);

  // Fetch indicators for mapping
  const { data: indicators } = useQuery({
    queryKey: ['upload-indicators'],
    queryFn: () => fetchAuth(`${API}/indicators`),
  });

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleUpload = async () => {
    if (!file || !source) return;
    setUploading(true);
    setPreview(null);
    setCommitResult(null);

    try {
      const config = {
        countryColumn,
        countryFormat,
        mappings: [], // Auto-mapping will be done server-side in a future iteration
        source,
        notes: notes || undefined,
        year,
      };

      const formData = new FormData();
      formData.append('file', file);
      formData.append('config', JSON.stringify(config));

      const res = await fetch(`${API}/file`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Upload failed');
      }

      const job = await res.json();
      setJobId(job.id);
      setPreview(job);
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCommit = async () => {
    if (!jobId) return;
    setCommitting(true);
    try {
      const res = await fetch(`${API}/commit/${jobId}`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Commit failed');
      const result = await res.json();
      setCommitResult(result);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* File drop zone */}
      <Card className="bg-white/[0.03] border-gray-800 border-dashed rounded-2xl">
        <CardContent
          className="p-8 text-center cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-[#D4A017]" />
              <div className="text-left">
                <p className="font-semibold">{file.name}</p>
                <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); setCommitResult(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <Upload className="h-12 w-12 text-gray-500 mx-auto mb-3" />
              <p className="text-lg font-medium">Drop CSV or XLSX file here</p>
              <p className="text-sm text-gray-400 mt-1">or click to browse (max 10MB)</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Config */}
      {file && !commitResult && (
        <Card className="bg-white/[0.03] border-gray-800 rounded-2xl">
          <CardHeader><CardTitle className="text-base">Import Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Source Attribution *</Label>
                <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g., AYIMS/AU Commission" />
              </div>
              <div className="space-y-2">
                <Label>Country Column Name</Label>
                <Input value={countryColumn} onChange={(e) => setCountryColumn(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Country Format</Label>
                <Select value={countryFormat} onValueChange={(v: any) => setCountryFormat(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Country Name</SelectItem>
                    <SelectItem value="iso2">ISO 2-Letter</SelectItem>
                    <SelectItem value="iso3">ISO 3-Letter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data Year</Label>
                <Input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value) || 2024)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Age Group</Label>
                <Select value={ageGroup} onValueChange={setAgeGroup}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15-24">15-24 (UN definition)</SelectItem>
                    <SelectItem value="15-35">15-35 (AU definition)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional context..." />
              </div>
            </div>
            <Button onClick={handleUpload} disabled={!source || uploading} className="gap-2">
              {uploading ? <Clock className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              {uploading ? 'Parsing...' : 'Preview Import'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {preview && !commitResult && (
        <Card className="bg-white/[0.03] border-gray-800 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#D4A017]" />
              Preview — {preview.summary?.valuesTotal || 0} values ready
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white/[0.05] rounded-lg text-center">
                <p className="text-2xl font-bold text-[#D4A017]">{preview.summary?.validRows || 0}</p>
                <p className="text-xs text-gray-400">Valid Rows</p>
              </div>
              <div className="p-3 bg-white/[0.05] rounded-lg text-center">
                <p className="text-2xl font-bold">{preview.summary?.countriesMatched || 0}</p>
                <p className="text-xs text-gray-400">Countries Matched</p>
              </div>
              <div className="p-3 bg-white/[0.05] rounded-lg text-center">
                <p className="text-2xl font-bold">{preview.summary?.indicatorsMapped || 0}</p>
                <p className="text-xs text-gray-400">Indicators</p>
              </div>
              <div className="p-3 bg-white/[0.05] rounded-lg text-center">
                <p className="text-2xl font-bold">{preview.summary?.valuesTotal || 0}</p>
                <p className="text-xs text-gray-400">Total Values</p>
              </div>
            </div>

            {/* Errors & Warnings */}
            {preview.errors?.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" /> {preview.errors.length} issues found
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {preview.errors.slice(0, 20).map((err: any, i: number) => (
                    <p key={i} className={`text-xs px-2 py-1 rounded ${err.severity === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      Row {err.row}: {err.message}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Unmatched countries */}
            {preview.summary?.countriesUnmatched?.length > 0 && (
              <div className="text-sm">
                <p className="text-red-400 font-medium mb-1">Unmatched countries:</p>
                <p className="text-gray-400">{preview.summary.countriesUnmatched.join(', ')}</p>
              </div>
            )}

            {/* Mapped preview table */}
            {preview.preview?.mappedPreview?.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left py-2 px-2">Country</th>
                      <th className="text-left py-2 px-2">Indicator</th>
                      <th className="text-left py-2 px-2">Year</th>
                      <th className="text-right py-2 px-2">Value</th>
                      <th className="text-left py-2 px-2">Gender</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.preview.mappedPreview.slice(0, 10).map((row: any, i: number) => (
                      <tr key={i} className="border-b border-gray-800/50">
                        <td className="py-1.5 px-2">{row.country}</td>
                        <td className="py-1.5 px-2 text-gray-400">{row.indicator}</td>
                        <td className="py-1.5 px-2">{row.year}</td>
                        <td className="py-1.5 px-2 text-right font-mono">{row.value}</td>
                        <td className="py-1.5 px-2">
                          <Badge variant="secondary" className="text-[10px]">{row.gender}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Button onClick={handleCommit} disabled={committing || !preview.summary?.valuesTotal} className="gap-2">
              {committing ? <Clock className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              {committing ? 'Importing...' : `Commit ${preview.summary?.valuesTotal || 0} Values to Database`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Commit result */}
      {commitResult && (
        <Card className="bg-green-500/5 border-green-500/30 rounded-2xl">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-xl font-bold">Import Complete</p>
            <p className="text-gray-400 mt-1">
              {commitResult.inserted} values inserted, {commitResult.skipped} skipped, {commitResult.errors} errors
            </p>
            <p className="text-xs text-gray-500 mt-2">Duration: {commitResult.duration}ms</p>
            <Button variant="outline" className="mt-4" onClick={() => { setFile(null); setPreview(null); setCommitResult(null); setJobId(null); }}>
              Upload Another File
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Needs Tab ────────────────────────────────────────────────────────────────

function NeedsTab() {
  const { data: needs, isLoading } = useQuery({
    queryKey: ['data-needs'],
    queryFn: () => fetchAuth(`${API}/needed`),
  });

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      {/* Summary */}
      {needs?.summary && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-red-500/5 border-red-500/20 rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{needs.summary.byPriority.high}</p>
              <p className="text-xs text-gray-400">High Priority Gaps</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-500/5 border-amber-500/20 rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-400">{needs.summary.byPriority.medium}</p>
              <p className="text-xs text-gray-400">Medium Priority</p>
            </CardContent>
          </Card>
          <Card className="bg-green-500/5 border-green-500/20 rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{needs.summary.byPriority.low}</p>
              <p className="text-xs text-gray-400">Low Priority</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* By theme */}
      {needs?.byTheme?.map((theme: any) => (
        <Card key={theme.slug} className="bg-white/[0.03] border-gray-800 rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{theme.theme}</CardTitle>
              <Badge variant={theme.completeness < 0.3 ? 'destructive' : theme.completeness < 0.7 ? 'secondary' : 'default'}>
                {Math.round(theme.completeness * 100)}% complete
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {theme.missingIndicators?.length > 0 ? (
              <div className="space-y-2">
                {theme.missingIndicators.slice(0, 5).map((ind: any) => (
                  <div key={ind.slug} className="flex items-center justify-between text-sm py-1 border-b border-gray-800/50 last:border-0">
                    <div>
                      <p className="font-medium">{ind.name}</p>
                      <p className="text-xs text-gray-500">{ind.countriesMissing} countries missing</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${ind.priority === 'high' ? 'text-red-400 border-red-400/30' : ind.priority === 'medium' ? 'text-amber-400 border-amber-400/30' : 'text-green-400 border-green-400/30'}`}>
                      {ind.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">All indicators have good coverage</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Templates Tab ────────────────────────────────────────────────────────────

function TemplatesTab() {
  const { data: templates, isLoading } = useQuery({
    queryKey: ['upload-templates'],
    queryFn: () => fetchAuth(`${API}/templates`),
  });

  const handleDownload = (slug: string, name: string) => {
    const t = token();
    const headers: Record<string, string> = {};
    if (t) headers['Authorization'] = `Bearer ${t}`;
    fetch(`${API}/templates/${slug}`, { headers })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${slug}-template.csv`;
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  if (isLoading) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(i => <Skeleton key={i} className="h-40" />)}</div>;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {(templates || []).map((t: any) => (
        <Card key={t.slug} className={`bg-white/[0.03] border-gray-800 rounded-2xl ${t.slug === 'full-ayims' ? 'border-[#D4A017]/40' : ''}`}>
          <CardContent className="p-5 flex flex-col h-full">
            <div className="flex items-start justify-between mb-2">
              <FileText className="h-6 w-6 text-[#D4A017]" />
              {t.slug === 'full-ayims' && <Badge className="bg-[#D4A017]/15 text-[#D4A017] border-[#D4A017]/30 text-[10px]">Recommended</Badge>}
            </div>
            <h3 className="font-semibold text-sm mb-1">{t.name}</h3>
            <p className="text-xs text-gray-400 mb-3 flex-grow">{t.description || `${t.indicatorCount} indicators`}</p>
            <p className="text-[10px] text-gray-500 mb-3">{t.columns?.slice(0, 5).join(', ')}{t.columns?.length > 5 ? '...' : ''}</p>
            <Button variant="outline" size="sm" className="w-full gap-1" onClick={() => handleDownload(t.slug, t.name)}>
              <Download className="h-3 w-3" /> Download CSV
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── History Tab ──────────────────────────────────────────────────────────────

function HistoryTab() {
  const { data: history, isLoading } = useQuery({
    queryKey: ['upload-history'],
    queryFn: () => fetchAuth(`${API}/history`),
    refetchInterval: 30000,
  });

  if (isLoading) return <Skeleton className="h-60 w-full" />;

  if (!history?.length) {
    return (
      <div className="text-center py-16 text-gray-500">
        <Clock className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="text-lg font-medium">No uploads yet</p>
        <p className="text-sm mt-1">Your upload history will appear here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left py-3 px-2">Date</th>
            <th className="text-left py-3 px-2">File</th>
            <th className="text-left py-3 px-2">Source</th>
            <th className="text-center py-3 px-2">Status</th>
            <th className="text-right py-3 px-2">Values</th>
            <th className="text-right py-3 px-2">Countries</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h: any) => (
            <tr key={h.id} className="border-b border-gray-800/50 hover:bg-white/[0.03]">
              <td className="py-2 px-2 text-gray-400">{new Date(h.uploadedAt).toLocaleDateString()}</td>
              <td className="py-2 px-2 font-medium">{h.fileName}</td>
              <td className="py-2 px-2 text-gray-400">{h.source}</td>
              <td className="py-2 px-2 text-center">
                <Badge variant={h.status === 'committed' ? 'default' : h.status === 'preview' ? 'secondary' : 'destructive'} className="text-[10px]">
                  {h.status}
                </Badge>
              </td>
              <td className="py-2 px-2 text-right font-mono">{h.valuesInserted ?? h.valuesTotal ?? '—'}</td>
              <td className="py-2 px-2 text-right">{h.countriesCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

const DataUpload = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <div className="relative py-8 md:py-12 overflow-hidden">
        <div className="absolute inset-0 opacity-30 w-full bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:6rem_5rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="h-8 w-8 text-[#D4A017]" />
            <h1 className="text-3xl font-semibold tracking-tighter bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40 bg-clip-text text-transparent">
              Data Upload
            </h1>
          </div>
          <p className="text-[#A89070]">
            Upload CSV or Excel files to import youth data into the platform.
          </p>
        </div>
      </div>

      <div className="container px-4 md:px-6 pb-12">
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="bg-white/[0.05] border border-gray-800">
            <TabsTrigger value="upload" className="gap-1.5"><Upload className="h-3.5 w-3.5" /> Upload</TabsTrigger>
            <TabsTrigger value="needed" className="gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> What's Needed</TabsTrigger>
            <TabsTrigger value="templates" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Templates</TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5"><Clock className="h-3.5 w-3.5" /> History</TabsTrigger>
          </TabsList>

          <TabsContent value="upload"><UploadTab /></TabsContent>
          <TabsContent value="needed"><NeedsTab /></TabsContent>
          <TabsContent value="templates"><TemplatesTab /></TabsContent>
          <TabsContent value="history"><HistoryTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DataUpload;
