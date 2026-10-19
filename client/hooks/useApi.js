'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

/**
 * Generic data fetching hook.
 * Usage: const { data, loading, error, refetch } = useApi('/api/campaigns/mine');
 */
export function useApi(url, options = {}) {
  const { skip = false, defaultData = null } = options;
  const [data, setData]       = useState(defaultData);
  const [loading, setLoading] = useState(!skip);
  const [error, setError]     = useState(null);

  const fetch = useCallback(async () => {
    if (!url || skip) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(url);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }, [url, skip]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
