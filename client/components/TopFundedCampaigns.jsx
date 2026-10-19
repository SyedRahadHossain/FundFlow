'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SkeletonList, EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import CampaignCard from './CampaignCard';
import api from '@/lib/api';

export default function TopFundedCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Bumping this re-runs the effect below. The fetch itself lives in the effect
  // so `setLoading(true)` is never called synchronously from an effect body
  // (react-hooks/set-state-in-effect).
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/api/campaigns/top-funded');
        if (!mounted) return;
        setCampaigns(res.data);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Failed to load campaigns');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [reloadToken]);

  const retry = () => {
    setError(null);
    setLoading(true);
    setReloadToken(t => t + 1);
  };

  if (loading) {
    return (
      <section className="py-20 bg-surface" aria-label="Top funded campaigns loading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-6 mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">Top Funded Campaigns</h2>
              <p className="text-neutral-500 mt-2 max-w-[52ch]">The campaigns our community believes in most — ranked by credits raised, updated live.</p>
            </div>
          </div>
          <SkeletonList items={6} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-surface" aria-label="Top funded campaigns error">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="max-w-md mx-auto">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-error-light flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Unable to load campaigns</h3>
              <p className="text-sm text-neutral-500 mb-4">{error}</p>
              <Button variant="primary" onClick={retry}>
                Try again
              </Button>
            </div>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-surface" aria-label="Top funded campaigns">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 text-balance">Top Funded Campaigns</h2>
            <p className="text-neutral-500 mt-2 max-w-[52ch]">The campaigns our community believes in most — ranked by credits raised, updated live.</p>
          </div>
          <Link href="/campaigns" className="text-sm text-primary hover:underline font-medium hidden sm:block whitespace-nowrap">
            View all campaigns
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <EmptyState
            variant="campaigns"
            role="creator"
            action={
              <Button asChild variant="primary">
                <Link href="/register">Create Campaign</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((c, i) => (
              <CampaignCard
                key={c._id}
                campaign={c}
                href={`/campaigns/${c._id}`}
                showBadge={i < 3 ? i : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}