'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import StatCard from '@/components/StatCard';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

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
    { href: '/dashboard/campaign-approvals', emoji: '✅', label: 'Campaign Approvals', desc: 'Review pending campaigns', count: stats.pendingCampaigns },
    { href: '/dashboard/withdrawal-requests', emoji: '💸', label: 'Withdrawal Requests', desc: 'Process pending payouts', count: stats.pendingWithdrawals },
    { href: '/dashboard/manage-users', emoji: '👥', label: 'Manage Users', desc: 'Edit roles, remove users', count: null },
    { href: '/dashboard/reports', emoji: '🚩', label: 'Reports', desc: 'Handle flagged campaigns', count: null },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Admin Dashboard 🛡️</h2>
        <p className="text-neutral-500 text-sm mt-1">Platform overview</p>
      </div>

      {error && (
        <div role="alert" className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-error bg-error-light px-4 py-3 text-sm text-error">
          <span>We couldn’t load the platform stats.</span>
          <Button variant="ghost" size="sm" onClick={retry}>Retry</Button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard emoji="🙋" label="Total Supporters" value={stats.supporters.toLocaleString()} color="primary" loading={loading} skeleton={loading} />
        <StatCard emoji="🎯" label="Total Creators" value={stats.creators.toLocaleString()} color="success" loading={loading} skeleton={loading} />
        <StatCard
          emoji="💎"
          label="Credits in System"
          value={stats.totalCredits?.toLocaleString()}
          sub={`Held by users · Platform margin: ~${platformMargin} credits`}
          color="accent"
          loading={loading}
          skeleton={loading}
        />
        <StatCard
          emoji="💳"
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
            <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center text-xl mb-3 group-hover:bg-primary-medium transition-colors" aria-hidden="true">{l.emoji}</div>
            <h3 className="font-semibold text-neutral-900 group-hover:text-primary transition-colors">{l.label}</h3>
            <p className="text-sm text-neutral-500 mt-1">{l.desc}</p>
            {l.count !== null && l.count > 0 && (
              <span className="absolute top-4 right-4 w-5 h-5 rounded-full bg-warning text-white text-xs flex items-center justify-center font-bold">
                {l.count > 9 ? '9+' : l.count}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}