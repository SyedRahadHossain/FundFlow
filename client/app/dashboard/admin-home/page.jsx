'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import StatCard from '@/components/StatCard';
import Icon from '@/components/ui/Icon';
import Link from 'next/link';
import { ErrorBanner } from '@/components/ui/ErrorBanner';

export default function AdminHomePage() {
  const [stats, setStats] = useState({ supporters: 0, creators: 0, totalCredits: 0, payments: 0, totalVolume: 0, pendingCampaigns: 0, pendingWithdrawals: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const platformMargin = stats.totalCredits > 0 ? (stats.totalCredits * 0.5).toLocaleString() : '0'; // 50% margin from 10c-in/20c-out

  // Reloading is driven by a token so the loader can stay inside the effect:
  // the effect calls setState only after an await, never synchronously.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const [usersRes, paymentsRes, countsRes] = await Promise.all([
          api.get('/api/users/stats').catch(() => null),
          api.get('/api/payments/all').catch(() => null),
          api.get('/api/dashboard/counts').catch(() => null),
        ]);
        if (usersRes) setStats(s => ({ ...s, ...usersRes.data }));
        if (paymentsRes) setStats(s => ({ ...s, payments: paymentsRes.data.total || 0, totalVolume: paymentsRes.data.totalVolume || 0 }));
        if (countsRes) setStats(s => ({
          ...s,
          pendingCampaigns: countsRes.data.pendingCampaigns || 0,
          pendingWithdrawals: countsRes.data.pendingWithdrawals || 0,
        }));
        setError(null);
      } catch (err) {
        setError(err);
        toast.error('Could not load platform stats. Please try again.');
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

  const quickLinks = [
    { href: '/dashboard/campaign-approvals', icon: 'approve', label: 'Campaign Approvals', desc: 'Review pending campaigns', count: stats.pendingCampaigns },
    { href: '/dashboard/withdrawal-requests', icon: 'payouts', label: 'Withdrawal Requests', desc: 'Process pending payouts', count: stats.pendingWithdrawals },
    { href: '/dashboard/manage-users', icon: 'users', label: 'Manage Users', desc: 'Edit roles, remove users', count: null },
    { href: '/dashboard/reports', icon: 'reports', label: 'Reports', desc: 'Handle flagged campaigns', count: null },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">Admin Dashboard <Icon name="shield" className="w-6 h-6 text-neutral-400" /></h2>
        <p className="text-neutral-500 text-sm mt-1">Platform overview</p>
      </div>

      {error && (
        <ErrorBanner message="We couldn’t load the platform stats." onRetry={retry} />
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="supporters" label="Total Supporters" value={stats.supporters.toLocaleString()} color="primary" loading={loading} skeleton={loading} />
        <StatCard icon="creators" label="Total Creators" value={stats.creators.toLocaleString()} color="success" loading={loading} skeleton={loading} />
        <StatCard
          icon="credits"
          label="Credits in System"
          value={stats.totalCredits?.toLocaleString()}
          sub={`Held by users · Platform margin: ~${platformMargin} credits`}
          color="accent"
          tone="credit"
          loading={loading}
          skeleton={loading}
        />
        <StatCard
          icon="payments"
          label="Total Payments"
          value={stats.payments.toLocaleString()}
          sub={`$${stats.totalVolume.toLocaleString()} volume`}
          color="info"
          loading={loading}
          skeleton={loading}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickLinks.map(l => (
          <Link key={l.href} href={l.href}
            className="block bg-surface rounded-2xl border border-neutral-200 p-6 hover:shadow-md transition-shadow group relative">
            <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center mb-3 group-hover:bg-primary-medium transition-colors"><Icon name={l.icon} className="w-5 h-5" /></div>
            <h3 className="font-semibold text-neutral-900 group-hover:text-primary transition-colors">{l.label}</h3>
            <p className="text-sm text-neutral-500 mt-1">{l.desc}</p>
            {l.count !== null && l.count > 0 && (
              <span className="absolute top-4 right-4 min-w-5 h-5 px-1 rounded-full bg-warning-light text-warning-dark text-xs flex items-center justify-center font-bold tabular-nums ring-1 ring-warning/30">
                {l.count > 9 ? '9+' : l.count}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}