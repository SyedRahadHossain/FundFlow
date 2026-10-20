'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/lib/api';
import { Input, Select } from '@/components/ui/Input';
import { SkeletonCard, EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import CampaignCard from '@/components/CampaignCard';

/**
 * The campaign index.
 *
 * The list itself is rendered on the server and handed in as a prop, so the
 * page arrives with its campaigns in the HTML instead of a skeleton and a
 * request. The filters still run in the browser over that list.
 */
export default function CampaignsBrowser({ initialCampaigns, initialFailed }) {
  const [campaigns, setCampaigns] = useState(initialCampaigns || []);
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('All');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(initialFailed);
  // The server delivered the list; the browser only fetches when that read
  // failed and the reader asks for another try.
  const [needsFetch, setNeedsFetch] = useState(initialFailed);

  // Reloading is driven by a token so the loader can stay inside the effect:
  // the effect calls setState only after an await, never synchronously.
  const [reloadToken, setReloadToken] = useState(0);

  const categories = ['All','Technology','Art & Design','Community','Health','Music','Education','Environment','Gaming','Other'];

  useEffect(() => {
    if (!needsFetch) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/api/campaigns?status=approved&active=true');
        if (cancelled) return;
        setCampaigns(res.data || []);
        setError(false);
        setNeedsFetch(false);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [needsFetch, reloadToken]);

  const retry = () => {
    setError(false);
    setLoading(true);
    setReloadToken(t => t + 1);
    setNeedsFetch(true);
  };

  const filtered = campaigns.filter(c => {
    const matchCat = category === 'All' || c.category === category;
    const matchSearch = !search.trim() || c.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main id="main-content" className="flex-1 bg-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Explore Campaigns</h1>
          <p className="text-neutral-500 mb-6">Discover projects that need your support</p>

          {/* Load failure — same alert/retry affordance as the other dashboards */}
          {error && (
            <ErrorBanner message="We couldn’t load campaigns." onRetry={retry} />
          )}

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <Input
              type="text"
              aria-label="Search campaigns"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search campaigns…"
              className="flex-1"
            />
            <Select
              aria-label="Filter by category"
              className="w-full sm:w-56"
              value={category}
              onChange={e => setCategory(e.target.value)}
              options={categories.map(c => ({ value: c, label: c }))}
            />
          </div>

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-surface rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                  <SkeletonCard />
                </div>
              ))}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <EmptyState
              variant="search"
              subtitle={search || category !== 'All'
                ? 'Try a different search term or category.'
                : 'No campaigns are live right now — check back soon.'}
            />
          )}

          {!loading && !error && filtered.length > 0 && (
            <>
              <h2 className="sr-only">Campaign results</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(c => (
                  <CampaignCard key={c._id} campaign={c} href={`/campaigns/${c._id}`} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
