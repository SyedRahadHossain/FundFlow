'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { StatusBadge } from '@/components/ui/Badge';

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/payments/mine')
      .then(res => setPayments(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = payments.reduce((s, p) => s + p.credits, 0);

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Payment History</h2>
          <p className="text-neutral-500 text-sm mt-1">All your credit purchases</p>
        </div>
        {payments.length > 0 && (
          <div className="text-right">
            <p className="text-xs text-neutral-400">Total purchased</p>
            <p className="font-bold text-accent text-lg">💎 {total.toLocaleString()} credits</p>
          </div>
        )}
      </div>

      <div className="bg-surface rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-neutral-50 animate-pulse rounded-xl" />)}
          </div>
        ) : payments.length === 0 ? (
          <div className="py-20 text-center text-neutral-400">
            <span className="text-5xl block mb-3">💳</span>
            <p>No purchases yet.</p>
            <a href="/dashboard/purchase-credit" className="text-sm text-accent hover:underline mt-1 block">Buy your first credits →</a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-right">Credits</th>
                  <th className="px-5 py-3 text-right">Amount Paid</th>
                  <th className="px-5 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {payments.map(p => (
                  <tr key={p._id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-5 py-3.5 text-neutral-500">{new Date(p.date).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-accent">+💎 {p.credits.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-neutral-700">${p.amount}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status="completed" size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
