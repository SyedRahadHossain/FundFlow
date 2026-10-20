'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import StatCard from '@/components/StatCard';
import Icon from '@/components/ui/Icon';
import Link from 'next/link';
import { ErrorBanner } from '@/components/ui/ErrorBanner';

export default function SupporterHomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, approvedAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reloading is driven by a token so the loader can stay inside the effect:
  // the effect calls setState only after an await, never synchronously.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        // The three numbers come from one aggregated query. This used to pull
        // up to a thousand contribution rows to add them up in the browser.
        const res = await api.get('/api/contributions/stats');
        setStats({
          total: res.data.total || 0,
          pending: res.data.pending || 0,
          approvedAmount: res.data.approvedAmount || 0,
        });
        setError(null);
      } catch (err) {
        setError(err);
        toast.error('Could not load your contribution stats. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [reloadToken]);

  const retry = () => {
    setLoading(true);
    setReloadToken(t => t + 1);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">Welcome back <Icon name="wave" className="w-6 h-6 text-neutral-400" /></h2>
        <p className="text-neutral-500 text-sm mt-1">{user?.email}</p>
      </div>

      {error && (
        <ErrorBanner message="We couldn’t load your dashboard." onRetry={retry} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon="contributions" label="Total Contributions" value={stats.total} color="primary" loading={loading} skeleton={loading} />
        <StatCard icon="pending" label="Pending Approvals" value={stats.pending} color="warning" loading={loading} skeleton={loading} />
        <StatCard icon="credits" label="Credits Contributed" value={stats.approvedAmount.toLocaleString()} sub="approved only" color="accent" tone="credit" loading={loading} skeleton={loading} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/dashboard/explore"
          className="block bg-surface rounded-2xl border border-neutral-200 p-6 hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center mb-3 group-hover:bg-primary-medium transition-colors"><Icon name="explore" className="w-5 h-5" /></div>
          <h3 className="font-semibold text-neutral-900 group-hover:text-primary transition-colors">Explore Campaigns</h3>
          <p className="text-sm text-neutral-500 mt-1">Find and support projects you believe in</p>
        </Link>
        <Link href="/dashboard/purchase-credit"
          className="block bg-surface rounded-2xl border border-neutral-200 p-6 hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center mb-3 group-hover:bg-accent transition-colors"><Icon name="credits" className="w-5 h-5" /></div>
          <h3 className="font-semibold text-neutral-900 group-hover:text-accent transition-colors">Purchase Credits</h3>
          <p className="text-sm text-neutral-500 mt-1">Top up your credit balance to contribute</p>
        </Link>
      </div>
    </div>
  );
}