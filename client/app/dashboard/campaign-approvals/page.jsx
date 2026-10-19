'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Modal } from '@/components/ui/Modal';

export default function CampaignApprovalsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [acting, setActing]       = useState(null);
  const [preview, setPreview]     = useState(null);

  useEffect(() => {
    api.get('/api/campaigns?status=pending')
      .then(res => setCampaigns(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const act = async (id, status) => {
    setActing(id + status);
    try {
      await api.patch(`/api/campaigns/${id}/status`, { status });
      toast.success(`Campaign ${status}`);
      setCampaigns(cs => cs.filter(c => c._id !== id));
      setPreview(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally {
      setActing(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Campaign Approvals</h2>
        <p className="text-neutral-500 text-sm mt-1">{campaigns.length} pending campaign{campaigns.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="bg-surface rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-neutral-50 animate-pulse rounded-xl" />)}</div>
        ) : campaigns.length === 0 ? (
          <div className="py-20 text-center text-neutral-500">
            <span className="text-5xl block mb-3">✅</span>
            <p>No pending campaigns — all clear!</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-50">
            {campaigns.map(c => (
              <div key={c._id} className="p-4 sm:p-5 flex gap-4 items-start hover:bg-neutral-50 transition-colors">
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-accent-light flex-shrink-0">
                  {c.campaign_image_url
                    ? <img src={c.campaign_image_url} alt={c.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl">🎯</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 truncate">{c.title}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">by {c.creator_name} · {c.category} · Goal: 💎{c.funding_goal?.toLocaleString()}</p>
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{c.story}</p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={() => setPreview(c)}
                    className="text-xs border border-neutral-200 text-neutral-600 hover:bg-neutral-100 px-3 py-1.5 rounded-lg transition-colors">
                    👁 Review
                  </button>
                  <button onClick={() => act(c._id, 'approved')} disabled={!!acting}
                    className="text-xs bg-success-light border border-success/20 text-success-dark hover:bg-success-light px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                    ✅ Approve
                  </button>
                  <button onClick={() => act(c._id, 'rejected')} disabled={!!acting}
                    className="text-xs bg-error-light border border-error/20 text-error-hover hover:bg-error-light px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                    ❌ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview modal */}
      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title="Review Campaign"
        size="lg"
        closeOnOverlayClick={false}
        className="max-h-[90vh] overflow-y-auto"
        footer={
          preview ? (
            <>
              <button onClick={() => act(preview._id, 'approved')} disabled={!!acting}
                className="flex-1 bg-success hover:bg-success-dark disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
                ✅ Approve
              </button>
              <button onClick={() => act(preview._id, 'rejected')} disabled={!!acting}
                className="flex-1 bg-error hover:bg-error-hover disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
                ❌ Reject
              </button>
            </>
          ) : null
        }
      >
        {preview && (
          <>
            {preview.campaign_image_url && (
              <img src={preview.campaign_image_url} alt={preview.title} className="block w-[calc(100%_+_2.5rem)] h-48 object-cover -mx-5 -mt-5" />
            )}
            <div className="space-y-3 text-sm">
              <div><p className="text-xs text-neutral-500 mb-0.5">Title</p><p className="font-semibold text-neutral-900">{preview.title}</p></div>
              <div><p className="text-xs text-neutral-500 mb-0.5">Creator</p><p>{preview.creator_name} ({preview.creator_email})</p></div>
              <div><p className="text-xs text-neutral-500 mb-0.5">Category</p><p>{preview.category}</p></div>
              <div><p className="text-xs text-neutral-500 mb-0.5">Funding Goal</p><p>💎 {preview.funding_goal?.toLocaleString()} credits</p></div>
              <div><p className="text-xs text-neutral-500 mb-0.5">Min Contribution</p><p>💎 {preview.minimum_contribution?.toLocaleString()} credits</p></div>
              <div><p className="text-xs text-neutral-500 mb-0.5">Deadline</p><p>{new Date(preview.deadline).toLocaleDateString()}</p></div>
              <div><p className="text-xs text-neutral-500 mb-0.5">Story</p><p className="text-neutral-600 leading-relaxed">{preview.story}</p></div>
              <div><p className="text-xs text-neutral-500 mb-0.5">Reward Info</p><p className="text-neutral-600">{preview.reward_info}</p></div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
