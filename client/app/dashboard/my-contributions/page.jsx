'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SkeletonTable, EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

const STATUS_CONFIG = {
  pending: { variant: 'warning', label: 'Pending', icon: '⏳' },
  approved: { variant: 'success', label: 'Approved', icon: '✅' },
  rejected: { variant: 'error', label: 'Rejected', icon: '❌' },
  refunded: { variant: 'info', label: 'Refunded', icon: '↩️' },
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
        }
      } catch {
        if (mounted) {
          setContributions([]);
          setTotalPages(1);
          setTotal(0);
          setLoadedKey(requestKey);
        }
      }
    };
    fetchContributions();
    return () => { mounted = false; };
  }, [page, status, requestKey]);

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
        >
          {FILTERS.map(f => {
            const active = status === f.value;
            return (
              <button
                key={f.value || 'all'}
                role="tab"
                aria-selected={active}
                onClick={() => { setStatus(f.value); setPage(1); }}
                className={
                  'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors min-h-[36px] ' +
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

      <Card className="overflow-hidden">
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
                <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3 text-left">Campaign</th>
                    <th className="px-5 py-3 text-left">Creator</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-left">Date</th>
                    <th className="px-5 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {contributions.map(c => {
                    const statusConfig = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
                    return (
                      <tr key={c._id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-neutral-800">{c.campaign_title}</td>
                        <td className="px-5 py-3.5 text-neutral-500">{c.creator_name}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-primary">💎 {c.contribution_amount.toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-neutral-400">{new Date(c.date).toLocaleDateString()}</td>
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
            <div className="sm:hidden divide-y divide-neutral-100">
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
                    <p className="text-xs text-neutral-400">{c.creator_name} · {new Date(c.date).toLocaleDateString()}</p>
                    <p className="text-sm font-bold text-primary mt-1">💎 {c.contribution_amount.toLocaleString()} credits</p>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-100">
                <p className="text-xs text-neutral-400">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    ← Prev
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next →
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}