'use client';

import { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import { toQuery } from '@/lib/campaignFilters';
import { searchOutcome, SEARCH_RETRY_DELAY_MS } from '@/lib/searchRetry';

/**
 * The campaign search, as a hook.
 *
 * Both the public index and the supporter's explore screen ask the same
 * question, so they ask it the same way: one request, the search term
 * waiting for a pause in typing, and one automatic retry when the request
 * fails - a serverless function that is waking up answers with an error
 * that a second try does not.
 */
export function useCampaignSearch(filters, { limit = 12, initial = null } = {}) {
  const [results, setResults] = useState(
    initial && !initial.failed
      ? {
          campaigns: initial.campaigns || [],
          total: initial.total ?? 0,
          page: initial.page ?? 1,
          limit: initial.limit ?? limit,
          pages: initial.pages ?? 1,
          facets: initial.facets ?? { categories: [] },
        }
      : { campaigns: [], total: 0, page: 1, limit, pages: 1, facets: { categories: [] } }
  );
  const [loading, setLoading] = useState(!(initial && !initial.failed));
  const [error, setError] = useState(initial?.failed ?? false);
  const [reloadToken, setReloadToken] = useState(0);
  const failures = useRef(0);
  // When the server already delivered the first page, the first run of the
  // effect has nothing to ask for: those results are the ones for the
  // filters in hand.
  const primed = useRef(Boolean(initial && !initial.failed));

  useEffect(() => {
    let cancelled = false;
    let retryTimer = null;

    if (primed.current) {
      primed.current = false;
      return undefined;
    }

    // The search term waits for a pause in typing, so a sentence does not
    // become ten requests.
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/campaigns/search?${toQuery(filters)}`);
        if (cancelled) return;
        setResults({
          campaigns: res.data.campaigns || [],
          total: res.data.total ?? 0,
          page: res.data.page ?? 1,
          limit: res.data.limit ?? limit,
          pages: res.data.pages ?? 1,
          facets: res.data.facets ?? { categories: [] },
        });
        setError(false);
        failures.current = 0;
      } catch {
        if (cancelled) return;
        if (searchOutcome(failures.current) === 'retry') {
          failures.current += 1;
          retryTimer = setTimeout(() => {
            if (!cancelled) setReloadToken((token) => token + 1);
          }, SEARCH_RETRY_DELAY_MS);
        } else {
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, filters.q ? 300 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [filters, reloadToken, limit]);

  const retry = () => {
    failures.current = 0;
    setError(false);
    setReloadToken((token) => token + 1);
  };

  return { results, loading, error, retry };
}
