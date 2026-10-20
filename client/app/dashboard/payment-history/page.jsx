'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import Icon from '@/components/ui/Icon';

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Reloading is driven by a token so the loader can stay inside the effect:
  // the effect calls setState only after an await, never synchronously.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/api/payments/mine');
        setPayments(res.data);
        setError(false);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [reloadToken]);

  const retry = () => {
    setError(false);
    setLoading(true);
    setReloadToken(t => t + 1);
  };

  const total = payments.reduce((s, p) => s + p.credits, 0);

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Payment History</h2>
          <p className="text-neutral-500 text-sm mt-1">All your credit purchases</p>
        </div>
        {!error && payments.length > 0 && (
          <div className="text-right">
            <p className="text-[13px] text-neutral-500">Total purchased</p>
            <p className="font-bold text-accent text-lg tabular-nums inline-flex items-center gap-1"><Icon name="credits" className="w-5 h-5" />{total.toLocaleString()} credits</p>
          </div>
        )}
      </div>

      {error && (
        <ErrorBanner message="We couldn’t load your purchase history." onRetry={retry} />
      )}

      {!error && (
        <div className="bg-surface rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-neutral-50 animate-pulse rounded-xl" />)}
            </div>
          ) : payments.length === 0 ? (
            <EmptyState variant="payments" role="supporter" />
          ) : (
            <>
              {/* Table — desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-500 text-[13px] uppercase tracking-wide">
                    <tr>
                      <th className="px-5 py-3 text-left">Date</th>
                      <th className="px-5 py-3 text-right">Credits</th>
                      <th className="px-5 py-3 text-right">Amount Paid</th>
                      <th className="px-5 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {payments.map(p => (
                      <tr key={p._id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-5 py-3.5 text-neutral-500">{new Date(p.date).toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-accent tabular-nums">+<span className="inline-flex items-center gap-1 justify-end align-middle"><Icon name="credits" className="w-4 h-4" />{p.credits.toLocaleString()}</span></td>
                        <td className="px-5 py-3.5 text-right font-medium text-neutral-700 tabular-nums">${p.amount}</td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status="completed" size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards — mobile */}
              <div className="sm:hidden divide-y divide-neutral-200">
                {payments.map(p => (
                  <div key={p._id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-neutral-500">{new Date(p.date).toLocaleString()}</p>
                      <StatusBadge status="completed" size="sm" />
                    </div>
                    <div className="mt-1 flex items-baseline justify-between gap-3">
                      <p className="text-sm font-semibold text-accent tabular-nums">
                        +<span className="inline-flex items-center gap-1 align-middle"><Icon name="credits" className="w-4 h-4" />{p.credits.toLocaleString()}</span>
                      </p>
                      <p className="text-sm font-medium text-neutral-700 tabular-nums">${p.amount}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
