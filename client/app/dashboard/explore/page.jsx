'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SkeletonList, EmptyState } from '@/components/ui/EmptyState';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
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

  const daysLeft = (deadline) => {
    const diff = new Date(deadline) - new Date();
    return Math.max(0, Math.ceil(diff / 86400000));
  };

  const pct = (raised, goal) => Math.min(100, Math.round((raised / goal) * 100));

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(c => (
            <Card key={c._id} className="overflow-hidden group hover:shadow-xl transition-all duration-300" padding="none">
              <div className="relative h-40 bg-neutral-100 overflow-hidden">
                <Image
                  src={c.campaign_image_url || 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop'}
                  alt={c.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <Badge variant="outline" className="absolute top-2 right-2 bg-surface/95 text-neutral-700">
                  {c.category}
                </Badge>
                {daysLeft(c.deadline) <= 3 && daysLeft(c.deadline) > 0 && (
                  <Badge variant="error" size="sm" className="absolute bottom-2 left-2" dot>
                    {daysLeft(c.deadline)}d left
                  </Badge>
                )}
              </div>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-neutral-900 line-clamp-2">{c.title}</h3>
                <p className="text-xs text-neutral-500">by {c.creator_name}</p>

                <ProgressBar
                  value={pct(c.amount_raised, c.funding_goal)}
                  size="md"
                  variant="primary"
                  label="Funded"
                  showValue
                  animated
                />

                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span className="font-medium text-neutral-700">
                    {(c.amount_raised || 0).toLocaleString()} credits raised
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {daysLeft(c.deadline) > 0 ? `${daysLeft(c.deadline)}d left` : 'Ended'}
                  </span>
                </div>

                <Button asChild variant="primary" width="full" size="sm">
                  <Link href={`/dashboard/explore/${c._id}`}>View Details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}