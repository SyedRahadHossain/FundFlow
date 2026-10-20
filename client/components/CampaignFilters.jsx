'use client';

import { useState } from 'react';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { CATEGORIES, DEADLINE_OPTIONS, SORT_OPTIONS, countActiveFilters } from '@/lib/campaignFilters';

/**
 * The campaign filters.
 *
 * Two tiers, because six controls in a row is a row nobody reads. The first
 * tier is what a reader reaches for: the search term and the category. The
 * second tier — deadline, sort and the goal range — sits under a rule on the
 * desktop, and behind a disclosure on a phone, where six stacked controls
 * would push the first result off the screen.
 *
 * The counts beside the categories come from the same aggregation that
 * produced the rows, so the reader can see where the matches are before
 * choosing one.
 */
export default function CampaignFilters({ filters, onChange, categoryCounts = {} }) {
  const [expanded, setExpanded] = useState(false);
  const active = countActiveFilters(filters);

  // Every change starts again at the first page: page three of the old
  // result set is not page three of the new one.
  const set = (patch) => onChange({ ...filters, ...patch, page: 1 });

  const categoryOptions = CATEGORIES.map((category) => {
    const count = categoryCounts[category];
    return { value: category, label: count === undefined ? category : `${category} (${count})` };
  });

  const extrasClass = expanded
    ? 'flex flex-col lg:flex-row lg:items-end gap-3 pt-4 mt-4 border-t border-neutral-200'
    : 'hidden lg:flex lg:flex-row lg:items-end gap-3 pt-4 mt-4 border-t border-neutral-200';

  return (
    <div className="mb-6">
      {/* First tier: what a reader reaches for */}
      <div className="flex flex-col lg:flex-row gap-3">
        <Input
          type="text"
          aria-label="Search campaigns"
          value={filters.q}
          onChange={(e) => set({ q: e.target.value })}
          placeholder="Search campaigns or creators…"
          leftIcon={<Icon name="explore" className="w-4 h-4" />}
          className="flex-1 min-w-0"
        />

        <Select
          aria-label="Filter by category"
          value={filters.category}
          onChange={(e) => set({ category: e.target.value })}
          options={categoryOptions}
          className="w-full lg:w-52"
        />

        {/* On a phone the rest of the filters live behind this. */}
        <Button
          variant="secondary"
          onClick={() => setExpanded((open) => !open)}
          className="lg:hidden w-full"
          aria-expanded={expanded}
          rightIcon={<Icon name={expanded ? 'chevronDown' : 'chevronRight'} className="w-4 h-4" />}
        >
          {active > 0 ? `More filters (${active})` : 'More filters'}
        </Button>
      </div>

      {/* Second tier: deadline, sort, goal range */}
      <div className={extrasClass}>
        <Select
          aria-label="Filter by deadline"
          value={filters.deadline}
          onChange={(e) => set({ deadline: e.target.value })}
          options={DEADLINE_OPTIONS}
          className="w-full lg:w-52"
        />

        <Select
          aria-label="Sort campaigns"
          value={filters.sort}
          onChange={(e) => set({ sort: e.target.value })}
          options={SORT_OPTIONS}
          className="w-full lg:w-52"
        />

        <div className="flex items-end gap-3 w-full lg:w-auto">
          <Input
            type="number"
            inputMode="numeric"
            min="1"
            aria-label="Minimum funding goal in credits"
            value={filters.minGoal}
            onChange={(e) => set({ minGoal: e.target.value.replace(/\D/g, '') })}
            placeholder="Goal from"
            className="w-full lg:w-36"
          />
          <Input
            type="number"
            inputMode="numeric"
            min="1"
            aria-label="Maximum funding goal in credits"
            value={filters.maxGoal}
            onChange={(e) => set({ maxGoal: e.target.value.replace(/\D/g, '') })}
            placeholder="Goal to"
            className="w-full lg:w-36"
          />
          <span className="text-[13px] text-neutral-500 pb-3 shrink-0">credits</span>
        </div>

        {active > 0 && (
          <button
            type="button"
            onClick={() => onChange({ ...filters, q: '', category: 'All', deadline: 'any', sort: 'newest', minGoal: '', maxGoal: '', page: 1 })}
            className="text-sm text-neutral-600 hover:text-neutral-900 underline underline-offset-4 pb-3 shrink-0 lg:ml-auto"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
