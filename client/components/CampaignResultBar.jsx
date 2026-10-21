'use client';

import { Button } from '@/components/ui/Button';

/**
 * The line under the filters: how many campaigns matched, and the pages
 * they sit on.
 *
 * The count is the honest one — the size of the whole filtered set, not the
 * size of the page in front of the reader. "18 campaigns" on page three
 * means eighteen, not six.
 */
export default function CampaignResultBar({ total = 0, page = 1, pages = 1, onPageChange, filtered = false, local = false }) {
  const atStart = page <= 1;
  const atEnd = page >= pages;

  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <p className="text-sm text-neutral-600">
        <span className="font-semibold text-neutral-900 tabular-nums">{total.toLocaleString()}</span>{' '}
        {total === 1 ? 'campaign' : 'campaigns'}
        {filtered && <span className="text-neutral-500"> match your filters</span>}
        {local && (
          <span className="text-neutral-500"> — filtered in the browser, the search service is unreachable</span>
        )}
      </p>

      {pages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={atStart}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page of campaigns"
          >
            Previous
          </Button>
          <span className="text-sm text-neutral-600 tabular-nums">
            Page {page} of {pages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={atEnd}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page of campaigns"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
