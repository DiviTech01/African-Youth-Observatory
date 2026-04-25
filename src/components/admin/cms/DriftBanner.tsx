import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cmsRegistry } from '@/cms/registry';
import { contentApi } from '@/services/content';
import { toast } from '@/hooks/use-toast';

interface DriftBannerProps {
  onSynced?: () => void;
}

type DriftState = {
  missing: string[];
  orphaned: string[];
  localCount: number;
  backendCount: number;
} | null;

export const DriftBanner: React.FC<DriftBannerProps> = ({ onSynced }) => {
  const [drift, setDrift] = useState<DriftState>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const check = async () => {
    setLoading(true);
    try {
      const keys = cmsRegistry.map((e) => e.key);
      const result = await contentApi.checkDrift(keys);
      setDrift(result);
    } catch (err) {
      // Swallow — the banner just won't render.
      setDrift(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    check();
  }, []);

  const sync = async () => {
    setSyncing(true);
    try {
      const res = await contentApi.syncRegistry(cmsRegistry);
      toast({
        title: 'Registry synced',
        description: `Created ${res.created} · updated ${res.updated} · total ${res.total}`,
      });
      await check();
      onSynced?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      toast({ title: 'Sync failed', description: message, variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  if (loading || !drift) return null;

  const { missing, orphaned } = drift;
  const inSync = missing.length === 0 && orphaned.length === 0;

  if (inSync) {
    return (
      <div className="flex items-center justify-between rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400">
        <span className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Registry and backend are in sync — {drift.localCount} entries tracked.
        </span>
        <Button size="sm" variant="ghost" className="h-7" onClick={check}>
          <RefreshCw className="mr-1 h-3 w-3" /> Recheck
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {missing.length > 0 ? (
        <div className="flex items-start justify-between gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs">
          <div className="flex items-start gap-2 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <div className="font-semibold">
                {missing.length} key{missing.length === 1 ? '' : 's'} declared in the frontend but not registered in the CMS.
              </div>
              <div className="mt-0.5 text-amber-700/80 dark:text-amber-300/80">
                Run "Sync now" so admins can edit them. The sync is idempotent — existing drafts and published content are never touched.
              </div>
              {missing.length <= 8 ? (
                <div className="mt-1 font-mono text-[10px] text-amber-800 dark:text-amber-200 break-all">
                  {missing.join(' · ')}
                </div>
              ) : (
                <div className="mt-1 font-mono text-[10px] text-amber-800 dark:text-amber-200 break-all">
                  {missing.slice(0, 6).join(' · ')} +{missing.length - 6} more
                </div>
              )}
            </div>
          </div>
          <Button size="sm" onClick={sync} disabled={syncing} className="shrink-0">
            <RefreshCw className={`mr-1 h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing…' : 'Sync now'}
          </Button>
        </div>
      ) : null}

      {orphaned.length > 0 ? (
        <div className="flex items-start gap-2 rounded-md border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-700 dark:text-sky-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <div className="font-semibold">
              {orphaned.length} key{orphaned.length === 1 ? '' : 's'} in the backend don't appear in the local registry.
            </div>
            <div className="mt-0.5 text-sky-700/80 dark:text-sky-300/80">
              These are probably from a past deploy. Safe to ignore, or delete individually from each entry.
            </div>
            {orphaned.length <= 8 ? (
              <div className="mt-1 font-mono text-[10px] text-sky-800 dark:text-sky-200 break-all">
                {orphaned.join(' · ')}
              </div>
            ) : (
              <div className="mt-1 font-mono text-[10px] text-sky-800 dark:text-sky-200 break-all">
                {orphaned.slice(0, 6).join(' · ')} +{orphaned.length - 6} more
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DriftBanner;
