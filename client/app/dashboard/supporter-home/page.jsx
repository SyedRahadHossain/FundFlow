'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import StatCard from '@/components/StatCard';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function SupporterHomePage() {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, approvedAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reloading is driven by a token so the loader can stay inside the effect:
  // the effect calls setState only after an await, never synchronously.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const [contribRes, userRes] = await Promise.all([
          api.get('/api/contributions/mine?page=1&limit=1000'),
          api.get('/api/auth/me').catch(() => null),
        ]);
        const contribs = contribRes.data.contributions || [];
        setStats({
          total: contribRes.data.total || contribs.length,
          pending: contribs.filter(c => c.status === 'pending').length,
          approvedAmount: contribs
            .filter(c => c.status === 'approved')
            .reduce((s, c) => s + c.contribution_amount, 0),
        });
        if (userRes) await refreshUser();
        setError(null);
      } catch (err) {
        setError(err);
        toast.error('Could not load your contribution stats. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [refreshUser, reloadToken]);

  const retry = () => {
    setLoading(true);
    setReloadToken(t => t + 1);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Welcome back 👋</h2>
        <p className="text-neutral-500 text-sm mt-1">{user?.email}</p>
      </div>

      {error && (
        <div role="alert" className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-error bg-error-light px-4 py-3 text-sm text-error">
          <span>We couldn’t load your dashboard.</span>
          <Button variant="ghost" size="sm" onClick={retry}>Retry</Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard emoji="🤝" label="Total Contributions" value={stats.total} color="primary" loading={loading} skeleton={loading} />
        <StatCard emoji="⏳" label="Pending Approvals" value={stats.pending} color="warning" loading={loading} skeleton={loading} />
        <StatCard emoji="💎" label="Credits Contributed" value={stats.approvedAmount.toLocaleString()} sub="approved only" color="accent" loading={loading} skeleton={loading} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/dashboard/explore"
          className="block bg-surface rounded-2xl border border-neutral-200 p-6 hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center text-xl mb-3 group-hover:bg-primary-medium transition-colors" aria-hidden="true">🔍</div>
          <h3 className="font-semibold text-neutral-900 group-hover:text-primary transition-colors">Explore Campaigns</h3>
          <p className="text-sm text-neutral-500 mt-1">Find and support projects you believe in</p>
        </Link>
        <Link href="/dashboard/purchase-credit"
          className="block bg-surface rounded-2xl border border-neutral-200 p-6 hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center text-xl mb-3 group-hover:bg-accent transition-colors" aria-hidden="true">💳</div>
          <h3 className="font-semibold text-neutral-900 group-hover:text-accent transition-colors">Purchase Credits</h3>
          <p className="text-sm text-neutral-500 mt-1">Top up your credit balance to contribute</p>
        </Link>
      </div>
    </div>
  );
}