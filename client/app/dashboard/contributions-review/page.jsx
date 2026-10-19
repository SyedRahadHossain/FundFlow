'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ContributionsReviewPage() {
  const [campaigns, setCampaigns]         = useState([]);
  const [contributions, setContributions] = useState([]);
  const [selectedCampaign, setSelected]   = useState('all');
  const [viewModal, setViewModal]         = useState(null);
  const [loading, setLoading]             = useState(true);
  const [acting, setActing]               = useState(null);
  const [error, setError]                 = useState(null);

  // Reloading is driven by a token so the loader can stay inside the effect:
  // the effect calls setState only after an await, never synchronously.
  const [reloadToken, setReloadToken]     = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const campsRes = await api.get('/api/campaigns/mine');
        const camps = campsRes.data || [];
        setCampaigns(camps);

        // Fetch pending contributions for all campaigns
        const allContribs = [];
        let failed = 0;
        await Promise.all(
          camps.map(async (c) => {
            try {
              const r = await api.get(`/api/contributions/campaign/${c._id}`);
              allContribs.push(...(r.data || []));
            } catch { failed += 1; }
          })
        );
        // Every campaign fetch failed: that is a broken feed, not an empty queue
        if (camps.length > 0 && failed === camps.length) throw new Error('contributions failed to load');
        setContributions(allContribs);
        setError(null);
      } catch {
        setError(new Error('load failed'));
        toast.error('Could not load contributions to review. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [reloadToken]);

  const retry = () => {
    setError(null);
    setLoading(true);
    setReloadToken(t => t + 1);
  };

  const filtered = selectedCampaign === 'all'
    ? contributions
    : contributions.filter(c => c.campaign_id === selectedCampaign);

  const act = async (c, action) => {
    const confirmMessage = action === 'approve'
      ? `Approve contribution of ${c.contribution_amount?.toLocaleString()} credits from "${c.supporter_name}"?`
      : `Reject contribution from "${c.supporter_name}"? Their credits will be refunded.`;
    if (!window.confirm(confirmMessage)) return;
    setActing(c._id + action);
    try {
      await api.patch(`/api/contributions/${c._id}/${action}`);
      toast.success(action === 'approve' ? 'Contribution approved ✅' : 'Contribution rejected ❌');
      setContributions(cs => cs.filter(x => x._id !== c._id));
      setViewModal(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally {
      setActing(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Contributions to Review</h2>
        {!error && (
          <p className="text-neutral-500 text-sm mt-1">{contributions.length} pending contribution{contributions.length !== 1 ? 's' : ''}</p>
        )}
      </div>

      {/* Load failure — same alert/retry affordance as the other dashboard homes */}
      {error && (
        <div role="alert" className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-error bg-error-light px-4 py-3 text-sm text-error">
          <span>We couldn’t load contributions to review.</span>
          <Button variant="ghost" size="sm" onClick={retry}>Retry</Button>
        </div>
      )}

      {/* Campaign filter */}
      {campaigns.length > 0 && (
        <div className="mb-4">
          <Select
            aria-label="Filter by campaign"
            className="w-full sm:w-72"
            value={selectedCampaign}
            onChange={e => setSelected(e.target.value)}
            options={[
              { value: 'all', label: 'All Campaigns' },
              ...campaigns.map(c => ({ value: c._id, label: c.title })),
            ]}
          />
        </div>
      )}

      {!error && (
        <div className="bg-surface rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-neutral-50 animate-pulse rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              variant="contributions"
              role="creator"
              subtitle={contributions.length > 0
                ? 'No pending contributions match the selected campaign.'
                : 'Pending supporter contributions will appear here for review.'}
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-5 py-3 text-left">Supporter</th>
                      <th className="px-5 py-3 text-left">Campaign</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                      <th className="px-5 py-3 text-left">Date</th>
                      <th className="px-5 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {filtered.map(c => (
                      <tr key={c._id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-neutral-800">{c.supporter_name}</td>
                        <td className="px-5 py-3.5 text-neutral-500 max-w-[160px] truncate">{c.campaign_title}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-accent tabular-nums">💎 {c.contribution_amount?.toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-neutral-500">{new Date(c.date).toLocaleDateString()}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => setViewModal(c)}
                              className="text-xs border border-neutral-200 text-neutral-600 hover:bg-neutral-200 px-2.5 py-1.5 rounded-lg transition-colors">
                              👁 View
                            </button>
                            <button onClick={() => act(c, 'approve')} disabled={!!acting}
                              aria-label={`Approve contribution from ${c.supporter_name}`}
                              className="min-h-11 text-xs bg-success-light border border-success/20 text-success-dark hover:bg-success/20 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                              ✅ Approve
                            </button>
                            <button onClick={() => act(c, 'reject')} disabled={!!acting}
                              aria-label={`Reject contribution from ${c.supporter_name}`}
                              className="min-h-11 text-xs bg-error-light border border-error/20 text-error-hover hover:bg-error/20 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                              ❌ Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-neutral-50">
                {filtered.map(c => (
                  <div key={c._id} className="px-4 py-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-neutral-800 text-sm">{c.supporter_name}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{c.campaign_title}</p>
                      </div>
                      <p className="font-bold text-accent text-sm tabular-nums">💎 {c.contribution_amount?.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => setViewModal(c)}
                        className="flex-1 text-xs border border-neutral-200 text-neutral-600 py-1.5 rounded-lg">👁 View</button>
                      <button onClick={() => act(c, 'approve')} disabled={!!acting}
                        aria-label={`Approve contribution from ${c.supporter_name}`}
                        className="min-h-11 flex-1 text-xs bg-success-light border border-success/20 text-success-dark hover:bg-success/20 py-1.5 rounded-lg disabled:opacity-50">✅ Approve</button>
                      <button onClick={() => act(c, 'reject')} disabled={!!acting}
                        aria-label={`Reject contribution from ${c.supporter_name}`}
                        className="min-h-11 flex-1 text-xs bg-error-light border border-error/20 text-error-hover hover:bg-error/20 py-1.5 rounded-lg disabled:opacity-50">❌ Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* View modal */}
      {viewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <h3 className="font-bold text-neutral-900">Contribution Details</h3>
              <button onClick={() => setViewModal(null)} className="text-neutral-500 hover:text-neutral-600 text-xl">×</button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-neutral-500">Supporter</span><span className="font-medium">{viewModal.supporter_name}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Email</span><span className="font-medium text-xs">{viewModal.supporter_email}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Campaign</span><span className="font-medium">{viewModal.campaign_title}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Amount</span><span className="font-bold text-accent">💎 {viewModal.contribution_amount?.toLocaleString()} credits</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Date</span><span>{new Date(viewModal.date).toLocaleString()}</span></div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => act(viewModal, 'approve')} disabled={!!acting}
                aria-label={`Approve contribution from ${viewModal.supporter_name}`}
                className="min-h-11 flex-1 bg-success hover:bg-success-dark disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
                ✅ Approve
              </button>
              <button onClick={() => act(viewModal, 'reject')} disabled={!!acting}
                aria-label={`Reject contribution from ${viewModal.supporter_name}`}
                className="min-h-11 flex-1 bg-error hover:bg-error-hover disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
                ❌ Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
