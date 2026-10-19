'use client';

import { useEffect, useState, useMemo } from 'react';
import { SkeletonList, EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import CampaignCard from '@/components/CampaignCard';
import api from '@/lib/api';

export default function ExploreCampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  const categories = ['All', 'Technology', 'Art & Design', 'Community', 'Health', 'Music', 'Education', 'Environment', 'Gaming', 'Other'];

  useEffect(() => {
    let mounted = true;
    api.get('/api/campaigns?status=approved&active=true')
      .then(res => { if (mounted) { setCampaigns(res.data); setLoading(false); } })
      .catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    let result = campaigns;
    if (category !== 'All') result = result.filter(c => c.category === category);
    if (search.trim()) result = result.filter(c =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.creator_name?.toLowerCase().includes(search.toLowerCase())
    );
    return result;
  }, [search, category, campaigns]);

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">Explore Campaigns</h2>
          <p className="text-neutral-500 text-sm mt-1">Browse live campaigns and support what inspires you</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Input
            type="text"
            aria-label="Search campaigns or creators"
            placeholder="Search campaigns or creators…"
            className="flex-1"
            disabled
          />
          <Select className="w-full sm:w-56" options={categories.map(c => ({ value: c, label: c }))} disabled />
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input
          type="text"
          aria-label="Search campaigns or creators"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search campaigns or creators…"
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

      {filtered.length === 0 && (
        <EmptyState
          variant="search"
          action={
            <Button variant="secondary" onClick={() => { setSearch(''); setCategory('All'); }}>
              Clear filters
            </Button>
          }
        />
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(c => (
            <CampaignCard key={c._id} campaign={c} href={`/dashboard/explore/${c._id}`} />
          ))}
        </div>
      )}
    </div>
  );
}