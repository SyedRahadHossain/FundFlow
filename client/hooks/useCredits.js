'use client';

import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

/**
 * Returns { credits, loading, refresh }
 *
 * The balance lives in the auth context, which already fetched it once for
 * the whole app. This hook used to issue its own /api/auth/me request, which
 * meant a third copy of the same payload on every dashboard entry.
 * refresh() re-reads the profile from the server — call it after a purchase
 * or a contribution.
 */
export function useCredits() {
  const { user, refreshUser } = useAuth();
  const credits = user?.credits ?? null;
  const loading = user?.credits === undefined;

  const refresh = useCallback(async () => {
    await refreshUser();
  }, [refreshUser]);

  return { credits, loading, refresh };
}
