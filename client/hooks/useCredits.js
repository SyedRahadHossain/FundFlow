'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

/**
 * Returns { credits, loading, refresh }
 * refresh() re-fetches from /api/auth/me — call it after a purchase or contribution.
 */
export function useCredits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get('/api/auth/me');
      setCredits(res.data.credits ?? 0);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { credits, loading, refresh };
}
