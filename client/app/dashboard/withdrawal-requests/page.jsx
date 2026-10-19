'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';

export default function WithdrawalRequestsPage() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [approving, setApproving]     = useState(null);
  const [error, setError]             = useState(false);
  const [confirming, setConfirming]   = useState(null); // withdrawal pending approval

  // Reloading is driven by a token so the loader can stay inside the effect:
  // the effect calls setState only after an await, never synchronously.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/api/withdrawals');
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

  const approve = async (w) => {
    setApproving(w._id);
    try {
      await api.patch(`/api/withdrawals/${w._id}/approve`);
      toast.success('Withdrawal approved — creator notified ✅');
      setWithdrawals(ws => ws.filter(x => x._id !== w._id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally {
      setApproving(null);
      setConfirming(null);
    }
  };

  const ApproveButton = ({ w, className = '' }) => (
    <Button
      size="sm"
      variant="ghost"
      leftIcon="💳"
      onClick={() => setConfirming(w)}
      disabled={approving === w._id}
      className={`min-h-11 bg-success-light border border-success/20 text-success-dark hover:bg-success/20 ${className}`}
    >
      Payment Success
    </Button>
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Withdrawal Requests</h2>
        {!error && (
          <p className="text-neutral-500 text-sm mt-1">{withdrawals.length} pending request{withdrawals.length !== 1 ? 's' : ''}</p>
        )}
      </div>

      {error && (
        <div role="alert" className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-error bg-error-light px-4 py-3 text-sm text-error">
          <span>We couldn’t load withdrawal requests.</span>
          <Button variant="ghost" size="sm" onClick={retry}>Retry</Button>
        </div>
      )}

      {!error && (
        <div className="bg-surface rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-neutral-50 animate-pulse rounded-xl" />)}</div>
          ) : withdrawals.length === 0 ? (
            <EmptyState variant="withdrawals" role="admin" />
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-5 py-3 text-left">Creator</th>
                      <th className="px-5 py-3 text-right">Credits</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                      <th className="px-5 py-3 text-left">Method</th>
                      <th className="px-5 py-3 text-left">Account</th>
                      <th className="px-5 py-3 text-left">Date</th>
                      <th className="px-5 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {withdrawals.map(w => (
                      <tr key={w._id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-neutral-800">{w.creator_name}</p>
                          <p className="text-xs text-neutral-500">{w.creator_email}</p>
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-accent tabular-nums"><span aria-hidden="true">💎 </span>{w.withdrawal_credit?.toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-neutral-800 tabular-nums">${w.withdrawal_amount?.toFixed(2)}</td>
                        <td className="px-5 py-3.5 text-neutral-500">{w.payment_system}</td>
                        <td className="px-5 py-3.5 text-neutral-500 text-xs">{w.account_number}</td>
                        <td className="px-5 py-3.5 text-neutral-500">{new Date(w.withdraw_date).toLocaleDateString()}</td>
                        <td className="px-5 py-3.5 text-center">
                          <ApproveButton w={w} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="sm:hidden divide-y divide-neutral-200">
                {withdrawals.map(w => (
                  <div key={w._id} className="px-4 py-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-neutral-800">{w.creator_name}</p>
                        <p className="text-xs text-neutral-500">{w.payment_system} · {w.account_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-neutral-800 tabular-nums">${w.withdrawal_amount?.toFixed(2)}</p>
                        <p className="text-xs text-accent tabular-nums"><span aria-hidden="true">💎 </span>{w.withdrawal_credit?.toLocaleString()}</p>
                      </div>
                    </div>
                    <ApproveButton w={w} className="w-full mt-2" />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!confirming}
        onClose={() => setConfirming(null)}
        onConfirm={() => approve(confirming)}
        title="Approve withdrawal?"
        description={
          confirming
            ? `Approve withdrawal of $${confirming.withdrawal_amount?.toFixed(2)} (${confirming.withdrawal_credit?.toLocaleString()} credits) for "${confirming.creator_name}"? This cannot be undone — the payout is marked paid and the creator's raised credits are reduced.`
            : ''
        }
        confirmText="Approve payout"
        cancelText="Cancel"
        loading={!!approving}
      />
    </div>
  );
}
