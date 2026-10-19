'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/lib/api';
import { Input, Select } from '@/components/ui/Input';
import CampaignCard from '@/components/CampaignCard';

export default function PublicCampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('All');
  const [loading, setLoading]     = useState(true);

  const categories = ['All','Technology','Art & Design','Community','Health','Music','Education','Environment','Gaming','Other'];

  useEffect(() => {
    api.get('/api/campaigns?status=approved&active=true')
      .then(res => setCampaigns(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = campaigns.filter(c => {
    const matchCat = category === 'All' || c.category === category;
    const matchSearch = !search.trim() || c.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main id="main-content" className="flex-1 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Explore Campaigns</h1>
          <p className="text-neutral-500 mb-6">Discover projects that need your support</p>

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
              {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-neutral-100 rounded-2xl animate-pulse" />)}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="py-20 text-center text-neutral-500">
              <span className="text-5xl block mb-3">🔍</span>
              <p>No campaigns found.</p>
            </div>
          )}

          {!loading && filtered.length > 0 && (
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
