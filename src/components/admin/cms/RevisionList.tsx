import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RotateCcw } from 'lucide-react';
import type { ContentEntryDetail } from '@/services/content';

type Revision = ContentEntryDetail['revisions'][number];

const ACTION_LABEL: Record<Revision['action'], string> = {
  SAVE_DRAFT: 'Saved draft',
  PUBLISH: 'Published',
  REVERT: 'Reverted',
  DISCARD_DRAFT: 'Discarded',
};

const ACTION_VARIANT: Record<Revision['action'], 'default' | 'secondary' | 'outline' | 'destructive'> = {
  SAVE_DRAFT: 'secondary',
  PUBLISH: 'default',
  REVERT: 'outline',
  DISCARD_DRAFT: 'destructive',
};

interface RevisionListProps {
  revisions: Revision[];
  onRevert: (revisionId: string) => void;
  loadingRevisionId?: string | null;
}

export const RevisionList: React.FC<RevisionListProps> = ({ revisions, onRevert, loadingRevisionId }) => {
  if (!revisions.length) {
    return (
      <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        No history yet. Revisions appear here after you save a draft or publish.
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[480px] pr-3">
      <ul className="space-y-3">
        {revisions.map((rev) => {
          const preview = rev.content
            ? rev.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140)
            : rev.imageUrl
              ? '[image]'
              : '[empty]';
          return (
            <li key={rev.id} className="rounded-md border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={ACTION_VARIANT[rev.action]}>{ACTION_LABEL[rev.action]}</Badge>
                    {rev.version > 0 ? (
                      <span className="text-xs text-muted-foreground">v{rev.version}</span>
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(rev.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-foreground/80 line-clamp-2">{preview}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onRevert(rev.id)}
                  disabled={loadingRevisionId === rev.id}
                >
                  <RotateCcw className="mr-1 h-3 w-3" />
                  {loadingRevisionId === rev.id ? '…' : 'Revert'}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </ScrollArea>
  );
};

export default RevisionList;
