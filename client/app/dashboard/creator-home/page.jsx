'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import StatCard from '@/components/StatCard';
import Icon from '@/components/ui/Icon';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';

const FIRST_VISIT_KEY = 'fundflow_creator_first_visit';

export default function CreatorHomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, active: 0, raised: 0, pendingContributions: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [firstVisit, setFirstVisit] = useState(false);

  const withdrawable = stats.raised >= 200 ? (stats.raised / 20).toFixed(2) : '0.00';

  useEffect(() => {
    // The first-visit panel is a reading of localStorage, so it is resolved
    // after the effect yields: the effect body itself never sets state.
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      const visited = localStorage.getItem(FIRST_VISIT_KEY);
      if (!visited && stats.total === 0) {
        setFirstVisit(true);
      }
    });
    return () => { cancelled = true; };
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
        setError(null);
      } catch (err) {
        setError(err);
        toast.error('Could not load your campaign stats. Please try again.');
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

  if (firstVisit) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">Welcome to FundFlow, Creator! <Icon name="goal" className="w-6 h-6 text-neutral-400" /></h2>
          <p className="text-neutral-500 text-sm mt-1">{user?.email}</p>
        </div>

        <div className="bg-surface rounded-2xl border border-neutral-200 p-8 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center mx-auto mb-6"><Icon name="launch" className="w-9 h-9 text-primary" /></div>
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
            <p className="text-[13px] text-neutral-500">
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
        <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">Creator Dashboard <Icon name="goal" className="w-6 h-6 text-neutral-400" /></h2>
        <p className="text-neutral-500 text-sm mt-1">{user?.email}</p>
      </div>

      {error && (
        <ErrorBanner message="We couldn’t load your dashboard." onRetry={retry} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon="campaigns" label="Total Campaigns" value={stats.total} color="primary" loading={loading} skeleton={loading} />
        <StatCard icon="launch" label="Active Campaigns" value={stats.active} color="success" loading={loading} skeleton={loading} />
        <StatCard
          icon="credits"
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
          <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center mb-3 group-hover:bg-primary-medium transition-colors"><Icon name="add" className="w-5 h-5" /></div>
          <h3 className="font-semibold text-neutral-900 group-hover:text-primary transition-colors">Add New Campaign</h3>
          <p className="text-sm text-neutral-500 mt-1">Launch a new campaign and start raising credits</p>
        </Link>
        <Link href="/dashboard/contributions-review"
          className="block bg-surface rounded-2xl border border-neutral-200 p-6 hover:shadow-md transition-shadow group relative">
          <div className="w-10 h-10 rounded-xl bg-success-light flex items-center justify-center mb-3 group-hover:bg-success transition-colors"><Icon name="approve" className="w-5 h-5" /></div>
          <h3 className="font-semibold text-neutral-900 group-hover:text-success transition-colors">Review Contributions</h3>
          <p className="text-sm text-neutral-500 mt-1">Approve or reject pending contributions</p>
          <p className="text-[13px] text-info-dark mt-2 flex items-center gap-1">
            <Icon name="info" className="w-3.5 h-3.5" />
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