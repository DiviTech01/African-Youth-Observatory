import React, { useEffect, useMemo, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Eye, Save, Trash2, Upload } from 'lucide-react';
import DOMPurify from 'dompurify';
import {
  contentApi,
  type ContentEntryDetail,
  type ContentStyles,
} from '@/services/content';
import { toast } from '@/hooks/use-toast';
import RichTextEditor from './RichTextEditor';
import StyleEditor from './StyleEditor';
import ImageUploader from './ImageUploader';
import RevisionList from './RevisionList';

interface EntryEditorProps {
  entryKey: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

type Draft = {
  content: string;
  styles: ContentStyles;
  imageUrl: string | null;
};

const stylesToCSS = (s: ContentStyles): React.CSSProperties => ({
  color: s.color,
  backgroundColor: s.backgroundColor,
  fontSize: s.fontSize,
  fontWeight: s.fontWeight as React.CSSProperties['fontWeight'],
  fontStyle: s.fontStyle,
  textAlign: s.textAlign as React.CSSProperties['textAlign'],
  letterSpacing: s.letterSpacing,
  lineHeight: s.lineHeight,
  textDecoration: s.textDecoration,
  textTransform: s.textTransform as React.CSSProperties['textTransform'],
});

export const EntryEditor: React.FC<EntryEditorProps> = ({
  entryKey,
  open,
  onOpenChange,
  onSaved,
}) => {
  const [entry, setEntry] = useState<ContentEntryDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [reverting, setReverting] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({ content: '', styles: {}, imageUrl: null });
  const [tab, setTab] = useState<'content' | 'style' | 'history'>('content');

  useEffect(() => {
    if (!entryKey || !open) return;
    let cancelled = false;
    setLoading(true);
    contentApi
      .getEntry(entryKey)
      .then((e) => {
        if (cancelled) return;
        setEntry(e);
        const source = e.draft ?? e.published ?? {
          content: e.defaultContent,
          styles: e.defaultStyles,
          imageUrl: null,
        };
        setDraft({
          content: source.content ?? '',
          styles: (source.styles as ContentStyles) ?? {},
          imageUrl: (source as { imageUrl?: string | null }).imageUrl ?? null,
        });
        setTab('content');
      })
      .catch((err: Error) => {
        toast({ title: 'Failed to load entry', description: err.message, variant: 'destructive' });
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [entryKey, open]);

  const refetch = async () => {
    if (!entryKey) return;
    const e = await contentApi.getEntry(entryKey);
    setEntry(e);
  };

  const saveDraft = async () => {
    if (!entryKey) return;
    setSaving(true);
    try {
      await contentApi.saveDraft(entryKey, {
        content: draft.content,
        styles: draft.styles,
        imageUrl: draft.imageUrl,
      });
      toast({ title: 'Draft saved' });
      await refetch();
      onSaved?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Save failed';
      toast({ title: 'Save failed', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!entryKey) return;
    setPublishing(true);
    try {
      await contentApi.saveDraft(entryKey, {
        content: draft.content,
        styles: draft.styles,
        imageUrl: draft.imageUrl,
      });
      await contentApi.publish(entryKey);
      toast({ title: 'Published' });
      await refetch();
      onSaved?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Publish failed';
      toast({ title: 'Publish failed', description: message, variant: 'destructive' });
    } finally {
      setPublishing(false);
    }
  };

  const discardDraft = async () => {
    if (!entryKey) return;
    if (!window.confirm('Discard the pending draft? The last published version will be kept.')) return;
    try {
      await contentApi.discardDraft(entryKey);
      toast({ title: 'Draft discarded' });
      await refetch();
      onSaved?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Discard failed';
      toast({ title: 'Discard failed', description: message, variant: 'destructive' });
    }
  };

  const revert = async (revisionId: string) => {
    if (!entryKey) return;
    setReverting(revisionId);
    try {
      await contentApi.revert(entryKey, revisionId);
      toast({ title: 'Loaded into draft — review and publish to apply.' });
      await refetch();
      const e = await contentApi.getEntry(entryKey);
      if (e.draft) {
        setDraft({
          content: e.draft.content,
          styles: (e.draft.styles as ContentStyles) ?? {},
          imageUrl: e.draft.imageUrl,
        });
      }
      setTab('content');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Revert failed';
      toast({ title: 'Revert failed', description: message, variant: 'destructive' });
    } finally {
      setReverting(null);
    }
  };

  const openPreview = () => {
    // Opens the home page in preview mode. Admins can navigate from there.
    const url = `/?cms_preview=1`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const previewHtml = useMemo(
    () => (entry?.contentType === 'RICH_TEXT' ? DOMPurify.sanitize(draft.content || '') : ''),
    [entry?.contentType, draft.content],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col gap-0 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate">{entryKey ?? 'Select an entry'}</SheetTitle>
              {entry && (
                <SheetDescription className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-medium">{entry.page}</span>
                  {entry.section ? <span>· {entry.section}</span> : null}
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {entry.contentType}
                  </Badge>
                  {entry.published ? (
                    <span>
                      v{entry.published.version} published{' '}
                      {new Date(entry.published.publishedAt).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-orange-500">Never published</span>
                  )}
                </SheetDescription>
              )}
              {entry?.description ? (
                <p className="mt-2 text-xs text-muted-foreground">{entry.description}</p>
              ) : null}
            </div>
            <Button type="button" size="sm" variant="ghost" onClick={openPreview} title="Preview drafts on site">
              <Eye className="mr-1 h-4 w-4" /> Preview
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </SheetHeader>

        {loading || !entry ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            {loading ? 'Loading…' : 'No entry selected.'}
          </div>
        ) : (
          <>
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="flex flex-1 flex-col overflow-hidden">
              <TabsList className="mx-6 mt-4 w-fit">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                <TabsContent value="content" className="mt-0 space-y-4">
                  {entry.contentType === 'TEXT' ? (
                    <Textarea
                      value={draft.content}
                      onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
                      placeholder={entry.defaultContent || 'Write the text…'}
                      rows={6}
                      className="font-normal"
                    />
                  ) : null}

                  {entry.contentType === 'RICH_TEXT' ? (
                    <>
                      <RichTextEditor
                        value={draft.content}
                        onChange={(html) => setDraft((d) => ({ ...d, content: html }))}
                        placeholder={entry.defaultContent}
                      />
                      <div>
                        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Preview
                        </div>
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none rounded-md border bg-muted/40 p-3"
                          style={stylesToCSS(draft.styles)}
                          dangerouslySetInnerHTML={{ __html: previewHtml }}
                        />
                      </div>
                    </>
                  ) : null}

                  {entry.contentType === 'IMAGE' ? (
                    <ImageUploader
                      value={draft.imageUrl}
                      onChange={(url) => setDraft((d) => ({ ...d, imageUrl: url }))}
                    />
                  ) : null}

                  {entry.defaultContent ? (
                    <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                      <span className="font-semibold">Original fallback:</span> {entry.defaultContent}
                    </div>
                  ) : null}
                </TabsContent>

                <TabsContent value="style" className="mt-0 space-y-4">
                  <StyleEditor
                    value={draft.styles}
                    onChange={(s) => setDraft((d) => ({ ...d, styles: s }))}
                  />
                  <Separator />
                  <div>
                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Preview
                    </div>
                    <div className="rounded-md border bg-muted/40 p-4">
                      {entry.contentType === 'RICH_TEXT' ? (
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none"
                          style={stylesToCSS(draft.styles)}
                          dangerouslySetInnerHTML={{ __html: previewHtml || draft.content }}
                        />
                      ) : entry.contentType === 'IMAGE' ? (
                        <img
                          src={draft.imageUrl ?? ''}
                          alt="Preview"
                          className="max-h-56 w-auto"
                          style={stylesToCSS(draft.styles)}
                        />
                      ) : (
                        <span style={stylesToCSS(draft.styles)}>
                          {draft.content || entry.defaultContent || 'Sample text'}
                        </span>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="mt-0">
                  <RevisionList
                    revisions={entry.revisions}
                    onRevert={revert}
                    loadingRevisionId={reverting}
                  />
                </TabsContent>
              </div>
            </Tabs>

            <SheetFooter className="flex flex-row items-center justify-between gap-2 border-t bg-muted/30 px-6 py-3">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={discardDraft}
                disabled={!entry.draft}
                title={entry.draft ? 'Discard pending draft' : 'No draft to discard'}
              >
                <Trash2 className="mr-1 h-4 w-4" /> Discard draft
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={saveDraft} disabled={saving || publishing}>
                  <Save className="mr-1 h-4 w-4" /> {saving ? 'Saving…' : 'Save draft'}
                </Button>
                <Button type="button" size="sm" onClick={publish} disabled={publishing || saving}>
                  <Upload className="mr-1 h-4 w-4" /> {publishing ? 'Publishing…' : 'Publish'}
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default EntryEditor;
