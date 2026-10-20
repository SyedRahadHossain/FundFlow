'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SkeletonTable, EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import Icon from '@/components/ui/Icon';
import api from '@/lib/api';

const STATUS_CONFIG = {
  pending: { variant: 'warning', label: 'Pending' },
  approved: { variant: 'success', label: 'Approved' },
  rejected: { variant: 'error', label: 'Rejected' },
  refunded: { variant: 'info', label: 'Refunded' },
};

// "Approved" is a required standalone view in the assessment brief, so it gets
// its own tab rather than a separate route duplicating this table.
const FILTERS = [
  { value: '', label: 'All' },
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
];

export default function MyContributionsPage() {
  const [contributions, setContributions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  // Loading is derived from whether the displayed rows match the requested
  // filter. Deriving it avoids a synchronous setState when the filter changes.
  const requestKey = `${page}|${status}`;
  const [loadedKey, setLoadedKey] = useState(null);
  const loading = loadedKey !== requestKey;
  // A failed load is not an empty list. The error keeps its own state so the
  // table can say so instead of showing zero rows for a broken request.
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const LIMIT = 10;

  useEffect(() => {
    let mounted = true;
    const fetchContributions = async () => {
      const qs = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (status) qs.set('status', status);
      try {
        const res = await api.get(`/api/contributions/mine?${qs}`);
        if (mounted) {
          setContributions(res.data.contributions || []);
          setTotalPages(res.data.totalPages || 1);
          setTotal(res.data.total || 0);
          setLoadedKey(requestKey);
          setError(null);
        }
      } catch {
        if (mounted) {
          setContributions([]);
          setTotalPages(1);
          setTotal(0);
          setLoadedKey(requestKey);
          setError(new Error('load failed'));
        }
      }
    };
    fetchContributions();
    return () => { mounted = false; };
  }, [page, status, requestKey, reloadToken]);

  const retry = () => {
    setError(null);
    setLoadedKey(null);
    setReloadToken(t => t + 1);
  };

  const activeTab = FILTERS.find(f => f.value === status) || FILTERS[0];
  const tabId = (value) => `contributions-tab-${value || 'all'}`;

  // The filters are tabs, so they answer to the tab keyboard pattern: arrows
  // move between them, Home and End jump to the ends, and only the active tab
  // is in the tab order.
  const onTabKeyDown = (e) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const index = FILTERS.indexOf(activeTab);
    let next = index;
    if (e.key === 'ArrowRight') next = (index + 1) % FILTERS.length;
    if (e.key === 'ArrowLeft') next = (index - 1 + FILTERS.length) % FILTERS.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = FILTERS.length - 1;
    const target = FILTERS[next];
    setStatus(target.value);
    setPage(1);
    document.getElementById(tabId(target.value))?.focus();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">My Contributions</h2>
          <p className="text-neutral-500 text-sm mt-1">{total} contribution{total !== 1 ? 's' : ''} total</p>
        </div>

        <div
          role="tablist"
          aria-label="Filter contributions by status"
          className="flex gap-1 bg-neutral-100 rounded-xl p-1"
          onKeyDown={onTabKeyDown}
        >
          {FILTERS.map(f => {
            const active = status === f.value;
            return (
              <button
                key={f.value || 'all'}
                id={tabId(f.value)}
                role="tab"
                aria-selected={active}
                aria-controls="contributions-panel"
                tabIndex={active ? 0 : -1}
                onClick={() => { setStatus(f.value); setPage(1); }}
                className={
                  'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors min-h-11 min-w-11 ' +
                  (active
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700')
                }
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Load failure — the same alert/retry affordance as the other dashboards */}
      {error && (
        <ErrorBanner message="We couldn’t load your contributions." onRetry={retry} />
      )}

      <Card className="overflow-hidden">
        <div
          id="contributions-panel"
          role="tabpanel"
          aria-labelledby={tabId(activeTab.value)}
          tabIndex={-1}
        >
        {loading ? (
          <SkeletonTable rows={5} columns={5} />
        ) : contributions.length === 0 ? (
          <EmptyState
            variant="contributions"
            role="supporter"
            action={
              <Button asChild variant="primary">
                <Link href="/dashboard/explore">Explore Campaigns</Link>
              </Button>
            }
          />
        ) : (
          <>
            {/* Table — desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-neutral-500 text-[13px] uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3 text-left">Campaign</th>
                    <th className="px-5 py-3 text-left">Creator</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-left">Date</th>
                    <th className="px-5 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {contributions.map(c => {
                    const statusConfig = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
                    return (
                      <tr key={c._id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-neutral-800">{c.campaign_title}</td>
                        <td className="px-5 py-3.5 text-neutral-500">{c.creator_name}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-accent tabular-nums"><span className="inline-flex items-center gap-1 justify-end align-middle"><Icon name="credits" className="w-4 h-4" />{c.contribution_amount.toLocaleString()}</span></td>
                        <td className="px-5 py-3.5 text-neutral-500">{new Date(c.date).toLocaleDateString()}</td>
                        <td className="px-5 py-3.5">
                          <Badge variant={statusConfig.variant} size="sm" dot>
                            {statusConfig.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Cards — mobile */}
            <div className="sm:hidden divide-y divide-neutral-200">
              {contributions.map(c => {
                const statusConfig = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
                return (
                  <div key={c._id} className="px-4 py-3">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium text-neutral-800 text-sm">{c.campaign_title}</p>
                      <Badge variant={statusConfig.variant} size="sm" dot className="ml-2">
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <p className="text-[13px] text-neutral-500">{c.creator_name} · {new Date(c.date).toLocaleDateString()}</p>
                    <p className="text-sm font-bold text-accent tabular-nums mt-1 inline-flex items-center gap-1 align-middle"><Icon name="credits" className="w-4 h-4" />{c.contribution_amount.toLocaleString()} credits</p>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-200">
                <p className="text-[13px] text-neutral-500">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    leftIcon={<Icon name="chevronLeft" />}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    rightIcon={<Icon name="chevronRight" />}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </Card>
    </div>
  );
}