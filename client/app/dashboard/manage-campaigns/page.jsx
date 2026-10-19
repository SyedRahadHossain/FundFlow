'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { StatusBadge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ManageCampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('all');
  const [deleting, setDeleting]   = useState(null);
  const [error, setError]         = useState(false);

  // Reloading is driven by a token so the loader can stay inside the effect:
  // the effect calls setState only after an await, never synchronously.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    api.get('/api/campaigns')
      .then(res => { setCampaigns(res.data || []); setError(false); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [reloadToken]);

  const retry = () => {
    setError(false);
    setLoading(true);
    setReloadToken(t => t + 1);
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete campaign "${title}"?`)) return;
    setDeleting(id);
    try {
      await api.delete(`/api/campaigns/${id}`);
      toast.success('Campaign deleted');
      setCampaigns(cs => cs.filter(c => c._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = campaigns.filter(c => {
    const matchSearch = !search.trim() ||
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.creator_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Manage Campaigns</h2>
        {!error && (
          <p className="text-neutral-500 text-sm mt-1">{campaigns.length} total campaigns</p>
        )}
      </div>

      {/* Load failure — same alert/retry affordance as the other dashboard homes */}
      {error && (
        <div role="alert" className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-error bg-error-light px-4 py-3 text-sm text-error">
          <span>We couldn’t load campaigns.</span>
          <Button variant="ghost" size="sm" onClick={retry}>Retry</Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <Input
          type="text"
          aria-label="Search campaigns by title or creator"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search title or creator…"
          className="flex-1"
        />
        <Select
          aria-label="Filter by status"
          className="w-full sm:w-48"
          value={statusFilter}
          onChange={e => setStatus(e.target.value)}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
          ]}
        />
      </div>

      {!error && (
        <div className="bg-surface rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-neutral-50 animate-pulse rounded-xl" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-neutral-500">
              <span className="text-5xl block mb-3">📋</span>
              <p>No campaigns found.</p>
            </div>
          ) : (
            <>
              {/* Table — desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-5 py-3 text-left">Campaign</th>
                      <th className="px-5 py-3 text-left">Creator</th>
                      <th className="px-5 py-3 text-left">Category</th>
                      <th className="px-5 py-3 text-right">Raised</th>
                      <th className="px-5 py-3 text-right">Goal</th>
                      <th className="px-5 py-3 text-left">Status</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filtered.map(c => (
                      <tr key={c._id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-accent-light flex-shrink-0">
                              {c.campaign_image_url
                                ? <img src={c.campaign_image_url} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center">🎯</div>}
                            </div>
                            <span className="font-medium text-neutral-800 truncate max-w-[16rem]" title={c.title}>{c.title}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-neutral-500">{c.creator_name}</td>
                        <td className="px-5 py-3.5 text-neutral-500">{c.category}</td>
                        <td className="px-5 py-3.5 text-right text-accent font-medium tabular-nums">💎 {(c.amount_raised || 0).toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-right text-neutral-500 tabular-nums">{c.funding_goal?.toLocaleString()}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={c.status} size="sm" /></td>
                        <td className="px-5 py-3.5 text-right">
                          <button onClick={() => handleDelete(c._id, c.title)} disabled={deleting === c._id}
                            className="text-xs bg-error-light border border-error/20 text-error-hover hover:bg-error/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 font-medium">
                            {deleting === c._id ? '…' : '🗑️ Delete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards — mobile */}
              <div className="sm:hidden divide-y divide-neutral-50">
                {filtered.map(c => (
                  <div key={c._id} className="p-4 flex gap-3 items-start">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-accent-light flex-shrink-0">
                      {c.campaign_image_url
                        ? <img src={c.campaign_image_url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center">🎯</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-neutral-900 truncate">{c.title}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">by {c.creator_name} · {c.category}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <StatusBadge status={c.status} size="sm" className="text-xs" />
                        <span className="text-xs text-accent tabular-nums">💎 {(c.amount_raised || 0).toLocaleString()} raised</span>
                        <span className="text-xs text-neutral-500">🎯 {c.funding_goal?.toLocaleString()} goal</span>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(c._id, c.title)} disabled={deleting === c._id}
                      className="flex-shrink-0 text-xs bg-error-light border border-error/20 text-error-hover hover:bg-error/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 font-medium">
                      {deleting === c._id ? '…' : '🗑️ Delete'}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
