'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SkeletonCard, EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import CampaignCard from '@/components/CampaignCard';
import CampaignFilters from '@/components/CampaignFilters';
import CampaignResultBar from '@/components/CampaignResultBar';
import { useCampaignSearch } from '@/hooks/useCampaignSearch';
import { DEFAULT_FILTERS, toQuery, hasActiveFilters } from '@/lib/campaignFilters';

/**
 * The campaign index.
 *
 * The first page of results is read on the server and handed in as a prop,
 * so the page arrives with its campaigns in the HTML instead of a skeleton
 * and a request. The filters then run on the server too: the browser asks
 * the API for the rows that match, and the answer is the whole filtered
 * set, not a guess made over the list that happened to arrive.
 */
export default function CampaignsBrowser({ initialResults, initialFilters = DEFAULT_FILTERS }) {
  const [filters, setFilters] = useState(initialFilters);
  const { results, loading, error, retry } = useCampaignSearch(filters, { initial: initialResults });

  const applyFilters = (next) => {
    setFilters(next);
    // The address bar follows the filters, so a reader can send the view
    // they are looking at to someone else.
    const query = toQuery(next);
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
  };

  const categoryCounts = Object.fromEntries(
    (results.facets?.categories || []).map((c) => [c.value, c.count])
  );

  const campaigns = results.campaigns || [];

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

          <CampaignFilters
            filters={filters}
            onChange={applyFilters}
            categoryCounts={categoryCounts}
          />

          <CampaignResultBar
            total={results.total ?? 0}
            page={results.page ?? 1}
            pages={results.pages ?? 1}
            filtered={hasActiveFilters(filters)}
            onPageChange={(page) => applyFilters({ ...filters, page })}
          />

          {loading && campaigns.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-surface rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                  <SkeletonCard />
                </div>
              ))}
            </div>
          )}

          {!loading && !error && campaigns.length === 0 && (
            <EmptyState
              variant="search"
              subtitle={hasActiveFilters(filters)
                ? 'No campaigns match these filters. Try a different search or clear them.'
                : 'No campaigns are live right now — check back soon.'}
            />
          )}

          {!error && campaigns.length > 0 && (
            <>
              <h2 className="sr-only">Campaign results</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((c) => (
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
