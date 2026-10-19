'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default function CreatorPaymentHistoryPage() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(false);

  // Reloading is driven by a token so the loader can stay inside the effect:
  // the effect calls setState only after an await, never synchronously.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/api/withdrawals/mine');
        setWithdrawals(res.data || []);
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

  const totalPaid = withdrawals.filter(w => w.status === 'approved').reduce((s, w) => s + w.withdrawal_amount, 0);

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Payment History</h2>
          <p className="text-neutral-500 text-sm mt-1">All your withdrawal requests</p>
        </div>
        {!error && withdrawals.length > 0 && (
          <div className="text-right">
            <p className="text-xs text-neutral-500">Total paid out</p>
            <p className="font-bold text-neutral-900 text-lg tabular-nums">${totalPaid.toFixed(2)}</p>
          </div>
        )}
      </div>

      {error && (
        <div role="alert" className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-error bg-error-light px-4 py-3 text-sm text-error">
          <span>We couldn’t load your withdrawal history.</span>
          <Button variant="ghost" size="sm" onClick={retry}>Retry</Button>
        </div>
      )}

      {!error && (
        <div className="bg-surface rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-neutral-50 animate-pulse rounded-xl" />)}
            </div>
          ) : withdrawals.length === 0 ? (
            <EmptyState
              variant="withdrawals"
              role="creator"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3 text-left">Date</th>
                    <th className="px-5 py-3 text-right">Credits</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-left">Method</th>
                    <th className="px-5 py-3 text-left">Account</th>
                    <th className="px-5 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {withdrawals.map(w => (
                    <tr key={w._id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-5 py-3.5 text-neutral-500">{new Date(w.withdraw_date).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-accent tabular-nums"><span aria-hidden="true">💎 </span>{w.withdrawal_credit.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-neutral-800 tabular-nums">${w.withdrawal_amount.toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-neutral-500">{w.payment_system}</td>
                      <td className="px-5 py-3.5 text-neutral-500 text-xs">{w.account_number}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={w.status === 'approved' ? 'approved' : 'pending'} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
