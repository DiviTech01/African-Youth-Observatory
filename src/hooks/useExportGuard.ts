// ============================================
// USE EXPORT GUARD
// Wraps any export/download action so that
// unauthenticated users see the invite modal
// instead of the action proceeding.
// ============================================

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type Action = 'download' | 'export';

interface UseExportGuardReturn {
  /** Call this instead of running the export/download directly */
  guard: (fn: () => void | Promise<void>, action?: Action) => void;
  /** Pass to GuestInviteModal */
  inviteOpen: boolean;
  setInviteOpen: (open: boolean) => void;
  inviteAction: Action;
}

export function useExportGuard(): UseExportGuardReturn {
  const { isAuthenticated } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteAction, setInviteAction] = useState<Action>('export');

  const guard = useCallback(
    (fn: () => void | Promise<void>, action: Action = 'export') => {
      if (isAuthenticated) {
        void fn();
      } else {
        setInviteAction(action);
        setInviteOpen(true);
      }
    },
    [isAuthenticated],
  );

  return { guard, inviteOpen, setInviteOpen, inviteAction };
}
