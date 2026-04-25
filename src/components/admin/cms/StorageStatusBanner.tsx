import React, { useEffect, useState } from 'react';
import { AlertTriangle, CloudOff, CheckCircle2 } from 'lucide-react';
import { contentApi } from '@/services/content';

type Health = Awaited<ReturnType<typeof contentApi.storageHealth>> | null;

export const StorageStatusBanner: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const [health, setHealth] = useState<Health>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentApi
      .storageHealth()
      .then((h) => setHealth(h))
      .catch(() => setHealth(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !health) return null;

  if (!health.configured) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
        <CloudOff className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <div className="font-semibold">Image uploads disabled — Cloudflare R2 not configured.</div>
          <div className="mt-0.5 text-amber-700/80 dark:text-amber-300/80">
            Set these env vars on Render and redeploy:{' '}
            <span className="font-mono text-[10px]">
              {(health.missingVars ?? []).join(', ') || 'R2_*'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!health.reachable) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <div className="font-semibold">R2 configured but bucket unreachable.</div>
          <div className="mt-0.5 break-all">
            Bucket: <span className="font-mono">{health.bucket}</span>
          </div>
          {health.reason ? <div className="mt-0.5 text-red-700/80 dark:text-red-300/80">{health.reason}</div> : null}
          <div className="mt-0.5 text-red-700/80 dark:text-red-300/80">
            Check that the API token has Object Read &amp; Write on this bucket, and that the bucket name matches.
          </div>
        </div>
      </div>
    );
  }

  if (compact) return null;

  return (
    <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-300">
      <CheckCircle2 className="h-3.5 w-3.5" />
      <span>
        R2 bucket <span className="font-mono">{health.bucket}</span> reachable — uploads go to{' '}
        <span className="font-mono">{health.publicUrl}</span>
      </span>
    </div>
  );
};

export default StorageStatusBanner;
