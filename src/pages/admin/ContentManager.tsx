import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import {
  Search,
  FileText,
  Image as ImageIcon,
  AlignLeft,
  Eye,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import {
  contentApi,
  type ContentEntryRow,
  type ContentType,
  type PageTreeNode,
} from '@/services/content';
import EntryEditor from '@/components/admin/cms/EntryEditor';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | 'published' | 'draft' | 'new';

const STATUS_BADGE: Record<ContentEntryRow['status'], { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  published: { label: 'Published', variant: 'default' },
  draft: { label: 'Draft', variant: 'secondary' },
  new: { label: 'New', variant: 'outline' },
};

const TYPE_ICON: Record<ContentType, React.ReactNode> = {
  TEXT: <AlignLeft className="h-3.5 w-3.5" />,
  RICH_TEXT: <FileText className="h-3.5 w-3.5" />,
  IMAGE: <ImageIcon className="h-3.5 w-3.5" />,
};

const ContentManager: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Filters
  const [search, setSearch] = useState('');
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [contentType, setContentType] = useState<ContentType | 'ALL'>('ALL');
  const [status, setStatus] = useState<StatusFilter>('all');

  // Data
  const [tree, setTree] = useState<PageTreeNode[]>([]);
  const [rows, setRows] = useState<ContentEntryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [treeLoading, setTreeLoading] = useState(false);

  // Drawer
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  const loadTree = async () => {
    setTreeLoading(true);
    try {
      const data = await contentApi.listPages();
      setTree(data);
    } catch {
      setTree([]);
    } finally {
      setTreeLoading(false);
    }
  };

  const loadEntries = async () => {
    setLoading(true);
    try {
      const res = await contentApi.listEntries({
        search: search || undefined,
        page: selectedPage ?? undefined,
        section: selectedSection ?? undefined,
        contentType: contentType === 'ALL' ? undefined : contentType,
        status,
        pageSize: 500,
      });
      setRows(res.data);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const t = setTimeout(loadEntries, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, search, selectedPage, selectedSection, contentType, status]);

  const openEntry = (key: string) => {
    setSelectedKey(key);
    setEditorOpen(true);
  };

  const onEditorSaved = () => {
    loadEntries();
  };

  const counts = useMemo(() => {
    const byStatus = { published: 0, draft: 0, new: 0 } as Record<ContentEntryRow['status'], number>;
    rows.forEach((r) => (byStatus[r.status] = (byStatus[r.status] ?? 0) + 1));
    return byStatus;
  }, [rows]);

  if (authLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  }
  if (!user) {
    return <Navigate to="/auth/signin" replace />;
  }
  if (!isAdmin) {
    return (
      <div className="mx-auto mt-16 max-w-lg rounded-md border p-6 text-center">
        <h2 className="text-lg font-semibold">Admins only</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You need an ADMIN role to manage site content.
        </p>
        <Button className="mt-4" variant="outline" onClick={() => navigate('/')}>
          Back to home
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden">
      {/* Left: page tree */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-muted/30 md:flex">
        <div className="border-b px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Layers className="h-4 w-4" /> Pages
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {tree.reduce((n, p) => n + p.total, 0)} entries total
          </p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            <button
              type="button"
              onClick={() => {
                setSelectedPage(null);
                setSelectedSection(null);
              }}
              className={cn(
                'mb-1 flex w-full items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent',
                !selectedPage && 'bg-accent font-medium',
              )}
            >
              <span>All pages</span>
              <span className="text-xs text-muted-foreground">{tree.reduce((n, p) => n + p.total, 0)}</span>
            </button>
            {treeLoading ? (
              <div className="px-2 py-4 text-xs text-muted-foreground">Loading…</div>
            ) : (
              tree.map((p) => (
                <div key={p.page} className="mb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPage(p.page);
                      setSelectedSection(null);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent',
                      selectedPage === p.page && !selectedSection && 'bg-accent font-medium',
                    )}
                  >
                    <span className="truncate">{p.page}</span>
                    <span className="text-xs text-muted-foreground">{p.total}</span>
                  </button>
                  {selectedPage === p.page && Object.keys(p.sections).length > 1 ? (
                    <div className="ml-3 mt-0.5 border-l pl-2">
                      {Object.entries(p.sections).map(([sec, count]) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() =>
                            setSelectedSection(sec === '_default' ? null : sec)
                          }
                          className={cn(
                            'flex w-full items-center justify-between rounded px-2 py-1 text-xs hover:bg-accent',
                            (selectedSection === sec || (sec === '_default' && !selectedSection)) &&
                              'bg-accent font-medium',
                          )}
                        >
                          <span className="flex items-center gap-1 truncate">
                            <ChevronRight className="h-3 w-3" />
                            {sec === '_default' ? '(root)' : sec}
                          </span>
                          <span className="text-xs text-muted-foreground">{count}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold">Content Manager</h1>
              <p className="text-xs text-muted-foreground">
                Edit every piece of site content. Changes go through draft → publish.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/?cms_preview=1', '_blank', 'noopener,noreferrer')}
            >
              <Eye className="mr-1 h-4 w-4" /> Preview drafts
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search key, content, or description…"
                className="pl-9"
              />
            </div>
            <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType | 'ALL')}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All types</SelectItem>
                <SelectItem value="TEXT">Text</SelectItem>
                <SelectItem value="RICH_TEXT">Rich text</SelectItem>
                <SelectItem value="IMAGE">Image</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Drafts pending</SelectItem>
                <SelectItem value="new">Never published</SelectItem>
              </SelectContent>
            </Select>
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <span>Published {counts.published}</span>
              <Separator orientation="vertical" className="h-4" />
              <span>Drafts {counts.draft}</span>
              <Separator orientation="vertical" className="h-4" />
              <span>New {counts.new}</span>
            </div>
          </div>
        </header>

        <ScrollArea className="flex-1">
          <div className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Key</TableHead>
                  <TableHead>Page</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Preview</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      No entries. Run the frontend refactor sweep to register keys, or adjust your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => {
                    const badge = STATUS_BADGE[r.status];
                    const preview = r.imageUrl
                      ? '[image]'
                      : (r.draftContent ?? r.currentContent).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                    return (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => openEntry(r.key)}
                      >
                        <TableCell className="font-mono text-xs">
                          <div className="font-medium">{r.key}</div>
                          {r.description ? (
                            <div className="mt-0.5 text-[11px] font-sans text-muted-foreground line-clamp-1">
                              {r.description}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{r.page}</div>
                          {r.section ? <div className="text-xs text-muted-foreground">{r.section}</div> : null}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono">
                            {TYPE_ICON[r.contentType]}
                            {r.contentType}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[320px] text-sm text-muted-foreground">
                          <span className="line-clamp-2">{preview || '—'}</span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </main>

      <EntryEditor
        entryKey={selectedKey}
        open={editorOpen}
        onOpenChange={(o) => {
          setEditorOpen(o);
          if (!o) setSelectedKey(null);
        }}
        onSaved={onEditorSaved}
      />
    </div>
  );
};

export default ContentManager;
