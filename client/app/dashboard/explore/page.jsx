'use client';

import { useState } from 'react';
import { SkeletonList, EmptyState } from '@/components/ui/EmptyState';
import CampaignCard from '@/components/CampaignCard';
import CampaignFilters from '@/components/CampaignFilters';
import CampaignResultBar from '@/components/CampaignResultBar';
import { useCampaignSearch } from '@/hooks/useCampaignSearch';
import { DEFAULT_FILTERS, hasActiveFilters } from '@/lib/campaignFilters';

/**
 * The supporter's own explore screen.
 *
 * The same filters as the public index, and the same server-side endpoint,
 * because the two surfaces answer the same question. A reader who learns
 * the filters on one of them should not have to learn them again.
 */
export default function ExploreCampaignsPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const { results, loading, error, retry } = useCampaignSearch(filters);

  const categoryCounts = Object.fromEntries(
    (results.facets?.categories || []).map((c) => [c.value, c.count])
  );

  const campaigns = results.campaigns || [];

  if (loading && campaigns.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">Explore Campaigns</h2>
          <p className="text-neutral-500 text-sm mt-1">Browse live campaigns and support what inspires you</p>
        </div>
        <SkeletonList items={6} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Explore Campaigns</h2>
        <p className="text-neutral-500 text-sm mt-1">Browse live campaigns and support what inspires you</p>
      </div>

      <CampaignFilters
        filters={filters}
        onChange={setFilters}
        categoryCounts={categoryCounts}
      />

      {error && (
        <p role="alert" className="text-sm text-error mb-4">
          We couldn’t load campaigns.
          <button
            type="button"
            onClick={retry}
            className="ml-2 underline underline-offset-4"
          >
            Try again
          </button>
        </p>
      )}

      <CampaignResultBar
        total={results.total ?? 0}
        page={results.page ?? 1}
        pages={results.pages ?? 1}
        filtered={hasActiveFilters(filters)}
        local={results.local}
        onPageChange={(page) => setFilters({ ...filters, page })}
      />

      {!error && campaigns.length === 0 && (
        <EmptyState
          variant="search"
          subtitle={hasActiveFilters(filters)
            ? 'No campaigns match these filters. Try a different search or clear them.'
            : 'No campaigns are live right now — check back soon.'}
        />
      )}

      {!error && campaigns.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((c) => (
            <CampaignCard key={c._id} campaign={c} href={`/dashboard/explore/${c._id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
