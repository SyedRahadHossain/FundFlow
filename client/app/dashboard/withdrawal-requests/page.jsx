'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function WithdrawalRequestsPage() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [approving, setApproving]     = useState(null);

  useEffect(() => {
    api.get('/api/withdrawals')
      .then(res => setWithdrawals(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const approve = async (w) => {
    // The approve route pays out and decrements amount_raised, and there is no
    // matching reject route, so this cannot be undone from the UI once sent.
    const confirmMessage =
      `Approve withdrawal of $${w.withdrawal_amount?.toFixed(2)} ` +
      `(${w.withdrawal_credit?.toLocaleString()} credits) for "${w.creator_name}"?\n\n` +
      `This cannot be undone — the payout is marked paid and the creator's raised credits are reduced.`;
    if (!window.confirm(confirmMessage)) return;
    setApproving(w._id);
    try {
      await api.patch(`/api/withdrawals/${w._id}/approve`);
      toast.success('Withdrawal approved — creator notified ✅');
      setWithdrawals(ws => ws.filter(x => x._id !== w._id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally {
      setApproving(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Withdrawal Requests</h2>
        <p className="text-neutral-500 text-sm mt-1">{withdrawals.length} pending request{withdrawals.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="bg-surface rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-neutral-50 animate-pulse rounded-xl" />)}</div>
        ) : withdrawals.length === 0 ? (
          <div className="py-20 text-center text-neutral-500">
            <span className="text-5xl block mb-3">💸</span>
            <p>No pending withdrawal requests.</p>
          </div>
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
                <tbody className="divide-y divide-neutral-50">
                  {withdrawals.map(w => (
                    <tr key={w._id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-neutral-800">{w.creator_name}</p>
                        <p className="text-xs text-neutral-500">{w.creator_email}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-accent">💎 {w.withdrawal_credit?.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-neutral-800">${w.withdrawal_amount?.toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-neutral-500">{w.payment_system}</td>
                      <td className="px-5 py-3.5 text-neutral-500 text-xs">{w.account_number}</td>
                      <td className="px-5 py-3.5 text-neutral-500">{new Date(w.withdraw_date).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5 text-center">
                        <button onClick={() => approve(w)} disabled={approving === w._id}
                          className="text-xs bg-success-light border border-success/20 text-success-dark hover:bg-success-light px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 font-medium">
                          {approving === w._id ? '…' : '💳 Payment Success'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="sm:hidden divide-y divide-neutral-50">
              {withdrawals.map(w => (
                <div key={w._id} className="px-4 py-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-neutral-800">{w.creator_name}</p>
                      <p className="text-xs text-neutral-500">{w.payment_system} · {w.account_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-neutral-800">${w.withdrawal_amount?.toFixed(2)}</p>
                      <p className="text-xs text-accent">💎 {w.withdrawal_credit?.toLocaleString()}</p>
                    </div>
                  </div>
                  <button onClick={() => approve(w)} disabled={approving === w._id}
                    className="w-full mt-2 text-sm bg-success hover:bg-success-dark disabled:opacity-60 text-white font-semibold py-2 rounded-lg transition-colors">
                    {approving === w._id ? 'Processing…' : '💳 Mark Payment Success'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
