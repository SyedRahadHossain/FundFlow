'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

/**
 * Generic data fetching hook.
 * Usage: const { data, loading, error, refetch } = useApi('/api/campaigns/mine');
 *
 * Loading is derived from the request key rather than a separate flag, so the
 * effect never has to set state synchronously: every write to state happens
 * after the request resolves.
 */
export function useApi(url, options = {}) {
  const { skip = false, defaultData = null } = options;

  // Captured once, so a caller passing an inline default does not restart the
  // request on every render.
  const [fallback] = useState(defaultData);

  const [state, setState] = useState({ key: null, data: fallback, error: null });
  const [reloadToken, setReloadToken] = useState(0);

  const requestKey = `${url}|${skip}|${reloadToken}`;
  const loading = !skip && state.key !== requestKey;

  useEffect(() => {
    if (!url || skip) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(url);
        if (cancelled) return;
        setState({ key: requestKey, data: res.data, error: null });
      } catch (err) {
        if (cancelled) return;
        setState({
          key: requestKey,
          data: fallback,
          error: err.response?.data?.error || err.message || 'Request failed',
        });
      }
    })();
    return () => { cancelled = true; };
  }, [url, skip, requestKey, fallback]);

  const refetch = useCallback(() => setReloadToken(t => t + 1), []);

  return {
    data: state.data,
    loading,
    error: state.error,
    refetch,
  };
}
