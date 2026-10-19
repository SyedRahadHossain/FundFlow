'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Select } from '@/components/ui/Input';

export default function ContributionsReviewPage() {
  const [campaigns, setCampaigns]         = useState([]);
  const [contributions, setContributions] = useState([]);
  const [selectedCampaign, setSelected]   = useState('all');
  const [viewModal, setViewModal]         = useState(null);
  const [loading, setLoading]             = useState(true);
  const [acting, setActing]               = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const campsRes = await api.get('/api/campaigns/mine');
        const camps = campsRes.data || [];
        setCampaigns(camps);

        // Fetch pending contributions for all campaigns
        const allContribs = [];
        await Promise.all(
          camps.map(async (c) => {
            try {
              const r = await api.get(`/api/contributions/campaign/${c._id}`);
              allContribs.push(...(r.data || []));
            } catch { /* skip */ }
          })
        );
        setContributions(allContribs);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = selectedCampaign === 'all'
    ? contributions
    : contributions.filter(c => c.campaign_id === selectedCampaign);

  const act = async (id, action) => {
    setActing(id + action);
    try {
      await api.patch(`/api/contributions/${id}/${action}`);
      toast.success(action === 'approve' ? 'Contribution approved ✅' : 'Contribution rejected ❌');
      setContributions(cs => cs.filter(c => c._id !== id));
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
        <p className="text-neutral-500 text-sm mt-1">{contributions.length} pending contribution{contributions.length !== 1 ? 's' : ''}</p>
      </div>

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

      <div className="bg-surface rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-neutral-50 animate-pulse rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-neutral-400">
            <span className="text-5xl block mb-3">✅</span>
            <p>No pending contributions.</p>
          </div>
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
                      <td className="px-5 py-3.5 text-right font-semibold text-accent">💎 {c.contribution_amount?.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-neutral-400">{new Date(c.date).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setViewModal(c)}
                            className="text-xs border border-neutral-200 text-neutral-600 hover:bg-neutral-50 px-2.5 py-1.5 rounded-lg transition-colors">
                            👁 View
                          </button>
                          <button onClick={() => act(c._id, 'approve')} disabled={!!acting}
                            className="text-xs bg-success-light border border-success/20 text-success-dark hover:bg-success-light px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                            ✅ Approve
                          </button>
                          <button onClick={() => act(c._id, 'reject')} disabled={!!acting}
                            className="text-xs bg-error-light border border-error/20 text-error-hover hover:bg-error-light px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50">
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
                      <p className="text-xs text-neutral-400 mt-0.5">{c.campaign_title}</p>
                    </div>
                    <p className="font-bold text-accent text-sm">💎 {c.contribution_amount?.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => setViewModal(c)}
                      className="flex-1 text-xs border border-neutral-200 text-neutral-600 py-1.5 rounded-lg">👁 View</button>
                    <button onClick={() => act(c._id, 'approve')} disabled={!!acting}
                      className="flex-1 text-xs bg-success-light border border-success/20 text-success-dark py-1.5 rounded-lg disabled:opacity-50">✅ Approve</button>
                    <button onClick={() => act(c._id, 'reject')} disabled={!!acting}
                      className="flex-1 text-xs bg-error-light border border-error/20 text-error-hover py-1.5 rounded-lg disabled:opacity-50">❌ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* View modal */}
      {viewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <h3 className="font-bold text-neutral-900">Contribution Details</h3>
              <button onClick={() => setViewModal(null)} className="text-neutral-400 hover:text-neutral-600 text-xl">×</button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-neutral-500">Supporter</span><span className="font-medium">{viewModal.supporter_name}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Email</span><span className="font-medium text-xs">{viewModal.supporter_email}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Campaign</span><span className="font-medium">{viewModal.campaign_title}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Amount</span><span className="font-bold text-accent">💎 {viewModal.contribution_amount?.toLocaleString()} credits</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Date</span><span>{new Date(viewModal.date).toLocaleString()}</span></div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => act(viewModal._id, 'approve')} disabled={!!acting}
                className="flex-1 bg-success hover:bg-success-dark disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
                ✅ Approve
              </button>
              <button onClick={() => act(viewModal._id, 'reject')} disabled={!!acting}
                className="flex-1 bg-error hover:bg-error-hover disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
                ❌ Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
