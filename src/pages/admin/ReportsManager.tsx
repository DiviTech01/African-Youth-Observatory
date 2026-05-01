import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  FileText, Plus, Upload, Search, Pencil, Trash2, Star, Download, Eye, X, Save, Loader2, Calendar, Tag, Filter,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  type AdminReport, type ReportFile, type ReportType,
  getAdminReports, upsertAdminReport, deleteAdminReport,
  fileToDataUrl, downloadDataUrl, bytesToReadable, inferFormat,
} from '@/services/adminContent';

const REPORT_TYPES: ReportType[] = ['Country Report', 'Thematic Report', 'Regional Report'];
const CATEGORIES = ['Annual Report', 'Thematic Brief', 'Dashboard Report', 'Comparative Study', 'Special Report', 'Technical Report'];
const THEMES = ['General', 'Population', 'Education', 'Health', 'Employment', 'Entrepreneurship', 'Civic Engagement', 'Innovation', 'Agriculture', 'Gender'];

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const TYPE_ACCENT: Record<ReportType, string> = {
  'Country Report': '#3B82F6',
  'Thematic Report': '#A855F7',
  'Regional Report': '#F59E0B',
};

const ReportsManager: React.FC = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState<AdminReport[]>(() => getAdminReports());
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | ReportType>('all');
  const [editing, setEditing] = useState<AdminReport | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<AdminReport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState<Omit<AdminReport, 'id' | 'createdAt' | 'updatedAt' | 'downloads'>>({
    title: '',
    description: '',
    category: CATEGORIES[0],
    type: 'Thematic Report',
    theme: 'General',
    year: new Date().getFullYear(),
    date: new Date().toISOString().slice(0, 10),
    featured: false,
    files: [],
  });
  const [saving, setSaving] = useState(false);

  const visibleReports = useMemo(() => {
    let arr = reports;
    if (filterType !== 'all') arr = arr.filter((r) => r.type === filterType);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((r) => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
    }
    return [...arr].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [reports, search, filterType]);

  const totalSize = useMemo(
    () => reports.reduce((sum, r) => sum + r.files.reduce((s, f) => s + f.size, 0), 0),
    [reports],
  );

  const openNew = () => {
    setEditing(null);
    setForm({
      title: '',
      description: '',
      category: CATEGORIES[0],
      type: 'Thematic Report',
      theme: 'General',
      year: new Date().getFullYear(),
      date: new Date().toISOString().slice(0, 10),
      featured: false,
      files: [],
    });
    setDialogOpen(true);
  };

  const openEdit = (r: AdminReport) => {
    setEditing(r);
    setForm({
      title: r.title,
      description: r.description,
      category: r.category,
      type: r.type,
      theme: r.theme,
      year: r.year,
      date: r.date,
      featured: r.featured,
      files: r.files,
    });
    setDialogOpen(true);
  };

  const handleFilePicked = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newFiles: ReportFile[] = [];
    for (const file of Array.from(files)) {
      // localStorage 5MB hard cap — warn but allow up to ~3MB to be safe
      if (file.size > 3 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: `${file.name} is ${bytesToReadable(file.size)}. localStorage limits files to ~3MB. Use a hosted URL for large files.`,
          variant: 'destructive',
        });
        continue;
      }
      try {
        const dataUrl = await fileToDataUrl(file);
        newFiles.push({ name: file.name, type: file.type || 'application/octet-stream', size: file.size, dataUrl });
      } catch {
        toast({ title: 'Read failed', description: `Could not read ${file.name}`, variant: 'destructive' });
      }
    }
    if (newFiles.length > 0) {
      setForm((f) => ({ ...f, files: [...f.files, ...newFiles] }));
      toast({ title: `${newFiles.length} file${newFiles.length === 1 ? '' : 's'} attached` });
    }
  };

  const removeFormFile = (name: string) => {
    setForm((f) => ({ ...f, files: f.files.filter((fl) => fl.name !== name) }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Title required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const record: AdminReport = {
        id: editing?.id || uid(),
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        downloads: editing?.downloads ?? 0,
        createdAt: editing?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      };
      const next = upsertAdminReport(record);
      setReports(next);
      toast({ title: editing ? 'Report updated' : 'Report uploaded', description: form.title });
      setDialogOpen(false);
      setEditing(null);
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Try again', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (r: AdminReport) => {
    setConfirmDelete(r);
  };
  const confirmDeleteNow = () => {
    if (!confirmDelete) return;
    const next = deleteAdminReport(confirmDelete.id);
    setReports(next);
    toast({ title: 'Report deleted', description: confirmDelete.title });
    setConfirmDelete(null);
  };

  const handleDownload = (r: AdminReport, file: ReportFile) => {
    downloadDataUrl(file.dataUrl, file.name);
    toast({ title: 'Downloaded', description: file.name });
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-[#D4A017]" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tighter bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40 bg-clip-text text-transparent">
              Reports & Documents
            </h1>
            <p className="text-xs text-[#A89070] mt-0.5">
              Upload PDFs, Excel files, and briefs. They appear on the public Reports page automatically.
            </p>
          </div>
        </div>
        <Button onClick={openNew} size="sm" className="gap-1.5 self-start">
          <Plus className="h-4 w-4" /> New report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Reports', value: reports.length.toString(), accent: '#D4A017' },
          { label: 'Featured', value: reports.filter((r) => r.featured).length.toString(), accent: '#22C55E' },
          { label: 'Total downloads', value: reports.reduce((s, r) => s + r.downloads, 0).toLocaleString(), accent: '#3B82F6' },
          { label: 'Storage used', value: bytesToReadable(totalSize), accent: '#A855F7' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-4 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-gray-800/80">
            <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: s.accent }}>{s.value}</p>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <Input
            placeholder="Search reports…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-white/[0.03] border-gray-800"
          />
        </div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v as 'all' | ReportType)}>
          <SelectTrigger className="w-full sm:w-[170px] h-9 text-xs bg-white/[0.03] border-gray-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All types</SelectItem>
            {REPORT_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {visibleReports.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-gray-800 bg-white/[0.02]">
          <FileText className="h-10 w-10 text-gray-500 mx-auto mb-3" />
          <p className="text-base font-medium text-gray-300">
            {reports.length === 0 ? 'No reports uploaded yet' : 'No reports match your filters'}
          </p>
          <p className="text-xs text-gray-500 mt-1 mb-4">
            {reports.length === 0
              ? 'Upload PDFs, briefs, or data sheets — they\'ll appear on the public Reports page.'
              : 'Try clearing the search or type filter.'}
          </p>
          {reports.length === 0 && (
            <Button onClick={openNew} size="sm" className="gap-1.5">
              <Upload className="h-3.5 w-3.5" /> Upload your first report
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {visibleReports.map((r) => {
            const accent = TYPE_ACCENT[r.type];
            return (
              <Card key={r.id} className="bg-white/[0.03] border-gray-800/80 rounded-xl overflow-hidden hover:border-gray-700 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-start gap-3">
                    {/* Type icon medallion */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: accent + '20', color: accent }}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider" style={{ background: accent + '20', color: accent }}>
                          {r.type.replace(' Report', '')}
                        </span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">{r.category}</span>
                        {r.featured && (
                          <Badge className="bg-[#D4A017]/15 text-[#D4A017] border-[#D4A017]/30 text-[9px] px-1.5 py-0 h-4 gap-1">
                            <Star className="h-2.5 w-2.5 fill-[#D4A017]" /> Featured
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-white">{r.title}</h3>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{r.description || <span className="italic text-gray-600">No description</span>}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-gray-500">
                        <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {r.year}</span>
                        <span className="inline-flex items-center gap-1"><Tag className="h-3 w-3" /> {r.theme}</span>
                        <span className="inline-flex items-center gap-1 tabular-nums"><Download className="h-3 w-3" /> {r.downloads.toLocaleString()}</span>
                        <span className="text-gray-700">·</span>
                        <span className="tabular-nums">{r.files.length} file{r.files.length === 1 ? '' : 's'}</span>
                      </div>
                      {r.files.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {r.files.map((f) => (
                            <button
                              key={f.name}
                              onClick={() => handleDownload(r, f)}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium bg-white/[0.04] border border-gray-800 hover:bg-white/[0.08] hover:border-gray-700 transition-colors text-gray-300"
                              title={`Download ${f.name}`}
                            >
                              <Download className="h-3 w-3" />
                              {inferFormat(f.name)}
                              <span className="text-gray-600">({bytesToReadable(f.size)})</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 self-start">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)} title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => handleDelete(r)} title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto bg-black/95 border-gray-800">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit report' : 'Upload new report'}</DialogTitle>
            <DialogDescription className="text-xs">
              The report will appear on the public Reports page once saved. Supported file types: PDF, XLSX, DOCX, CSV.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. African Youth Index 2025" className="text-sm bg-white/[0.04] border-gray-800" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="One- or two-sentence summary that shows on the report card." className="text-sm bg-white/[0.04] border-gray-800" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ReportType })}>
                  <SelectTrigger className="h-9 text-xs bg-white/[0.04] border-gray-800"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map((t) => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-9 text-xs bg-white/[0.04] border-gray-800"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Theme</Label>
                <Select value={form.theme} onValueChange={(v) => setForm({ ...form, theme: v })}>
                  <SelectTrigger className="h-9 text-xs bg-white/[0.04] border-gray-800"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {THEMES.map((t) => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Year</Label>
                <Input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || new Date().getFullYear() })}
                  className="h-9 text-sm bg-white/[0.04] border-gray-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-gray-800">
              <div>
                <Label className="text-xs">Featured</Label>
                <p className="text-[11px] text-gray-500 mt-0.5">Promote to the Featured Publications section.</p>
              </div>
              <Switch checked={form.featured} onCheckedChange={(c) => setForm({ ...form, featured: c })} />
            </div>

            {/* File upload */}
            <div className="space-y-2">
              <Label className="text-xs">Files</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.docx,.csv,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                multiple
                className="hidden"
                onChange={(e) => { handleFilePicked(e.target.files); e.target.value = ''; }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-6 rounded-lg border border-dashed border-gray-700 bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#D4A017]/40 transition-colors text-center"
              >
                <Upload className="h-5 w-5 text-gray-500 mx-auto mb-1.5" />
                <p className="text-xs font-medium text-gray-300">Click to attach files</p>
                <p className="text-[11px] text-gray-500 mt-0.5">PDF, XLSX, DOCX, CSV — up to 3MB each</p>
              </button>
              {form.files.length > 0 && (
                <div className="space-y-1.5">
                  {form.files.map((f) => (
                    <div key={f.name} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-gray-800">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-xs truncate">{f.name}</span>
                        <span className="text-[10px] text-gray-500 tabular-nums flex-shrink-0">{bytesToReadable(f.size)}</span>
                      </div>
                      <button onClick={() => removeFormFile(f.name)} className="text-gray-400 hover:text-red-400 transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {editing ? 'Save changes' : 'Publish report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="bg-black/95 border-gray-800">
          <DialogHeader>
            <DialogTitle>Delete this report?</DialogTitle>
            <DialogDescription>
              "{confirmDelete?.title}" and its {confirmDelete?.files.length ?? 0} attached file(s) will be removed permanently.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={confirmDeleteNow} className="gap-1.5">
              <Trash2 className="h-3.5 w-3.5" /> Delete report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsManager;
