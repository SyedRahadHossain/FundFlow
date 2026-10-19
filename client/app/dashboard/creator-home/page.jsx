'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import StatCard from '@/components/StatCard';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

const FIRST_VISIT_KEY = 'fundflow_creator_first_visit';

export default function CreatorHomePage() {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState({ total: 0, active: 0, raised: 0, pendingContributions: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [firstVisit, setFirstVisit] = useState(false);

  const withdrawable = stats.raised >= 200 ? (stats.raised / 20).toFixed(2) : '0.00';

  useEffect(() => {
    const visited = localStorage.getItem(FIRST_VISIT_KEY);
    if (!visited && stats.total === 0) {
      setFirstVisit(true);
    }
  }, [stats.total]);

  const markVisited = () => {
    localStorage.setItem(FIRST_VISIT_KEY, 'true');
    setFirstVisit(false);
  };

  // Reloading is driven by a token so the loader can stay inside the effect:
  // the effect calls setState only after an await, never synchronously.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const [campaignsRes, countsRes] = await Promise.all([
          api.get('/api/campaigns/mine'),
          api.get('/api/dashboard/counts'),
        ]);
        const campaigns = campaignsRes.data || [];
        const pendingContributions = countsRes.data.pendingContributions || 0;
        const now = new Date();
        setStats({
          total:  campaigns.length,
          active: campaigns.filter(c => c.status === 'approved' && new Date(c.deadline) > now).length,
          raised: campaigns.reduce((s, c) => s + (c.amount_raised || 0), 0),
          pendingContributions,
        });
        await refreshUser();
        setError(null);
      } catch (err) {
        setError(err);
        toast.error('Could not load your campaign stats. Please try again.');
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

  if (firstVisit) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">Welcome to FundFlow, Creator! <span aria-hidden="true">🎯</span></h2>
          <p className="text-neutral-500 text-sm mt-1">{user?.email}</p>
        </div>

        <div className="bg-surface rounded-2xl border border-neutral-200 p-8 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center text-4xl mx-auto mb-6" aria-hidden="true">🚀</div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-3">Start your first campaign</h3>
          <p className="text-neutral-500 mb-6 max-w-md mx-auto">
            Launch a campaign and let supporters back your vision with credits. 
            Campaigns need Admin approval before going live, and you control every contribution.
          </p>
          <div className="space-y-3">
            <Button asChild size="lg" width="full" className="font-semibold">
              <Link href="/dashboard/add-campaign" onClick={markVisited}>
                Create Your First Campaign
              </Link>
            </Button>
            <p className="text-xs text-neutral-500">
              Need 200+ credits raised (=$10) to withdraw · 20 credits = $1 withdrawal
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Creator Dashboard <span aria-hidden="true">🎯</span></h2>
        <p className="text-neutral-500 text-sm mt-1">{user?.email}</p>
      </div>

      {error && (
        <div role="alert" className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-error bg-error-light px-4 py-3 text-sm text-error">
          <span>We couldn’t load your dashboard.</span>
          <Button variant="ghost" size="sm" onClick={retry}>Retry</Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard emoji="📋" label="Total Campaigns" value={stats.total} color="primary" loading={loading} skeleton={loading} />
        <StatCard emoji="🚀" label="Active Campaigns" value={stats.active} color="success" loading={loading} skeleton={loading} />
        <StatCard
          emoji="💎"
          label="Total Credits Raised"
          value={stats.raised.toLocaleString()}
          sub={`Withdrawable: $${withdrawable} (${Math.floor(stats.raised / 20) * 20} credits ÷ 20)`}
          color="accent"
          tone="credit"
          loading={loading}
          skeleton={loading}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/dashboard/add-campaign"
          className="block bg-surface rounded-2xl border border-neutral-200 p-6 hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center text-xl mb-3 group-hover:bg-primary-medium transition-colors" aria-hidden="true">➕</div>
          <h3 className="font-semibold text-neutral-900 group-hover:text-primary transition-colors">Add New Campaign</h3>
          <p className="text-sm text-neutral-500 mt-1">Launch a new campaign and start raising credits</p>
        </Link>
        <Link href="/dashboard/contributions-review"
          className="block bg-surface rounded-2xl border border-neutral-200 p-6 hover:shadow-md transition-shadow group relative">
          <div className="w-10 h-10 rounded-xl bg-success-light flex items-center justify-center text-xl mb-3 group-hover:bg-success transition-colors" aria-hidden="true">✅</div>
          <h3 className="font-semibold text-neutral-900 group-hover:text-success transition-colors">Review Contributions</h3>
          <p className="text-sm text-neutral-500 mt-1">Approve or reject pending contributions</p>
          <p className="text-xs text-info-dark mt-2 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Rejection = instant credit refund to supporter
          </p>
          {stats.pendingContributions > 0 && (
            <span className="absolute top-4 right-4 min-w-5 h-5 px-1 rounded-full bg-warning-light text-warning-dark text-xs flex items-center justify-center font-bold tabular-nums ring-1 ring-warning/30">
              {stats.pendingContributions > 9 ? '9+' : stats.pendingContributions}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}