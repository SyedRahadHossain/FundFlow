'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default function CampaignApprovalsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [acting, setActing]       = useState(null);
  const [preview, setPreview]     = useState(null);
  const [error, setError]         = useState(false);

  // Reloading is driven by a token so the loader can stay inside the effect:
  // the effect calls setState only after an await, never synchronously.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/api/campaigns?status=pending');
        setCampaigns(res.data || []);
        setError(false);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [reloadToken]);

  const retry = () => {
    setError(false);
    setLoading(true);
    setReloadToken(t => t + 1);
  };

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
        {!error && (
          <p className="text-neutral-500 text-sm mt-1">{campaigns.length} pending campaign{campaigns.length !== 1 ? 's' : ''}</p>
        )}
      </div>

      {error && (
        <div role="alert" className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-error bg-error-light px-4 py-3 text-sm text-error">
          <span>We couldn’t load campaign approvals.</span>
          <Button variant="ghost" size="sm" onClick={retry}>Retry</Button>
        </div>
      )}

      {!error && (
        <div className="bg-surface rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-neutral-50 animate-pulse rounded-xl" />)}</div>
          ) : campaigns.length === 0 ? (
            <EmptyState variant="campaigns" role="admin" />
          ) : (
            <div className="divide-y divide-neutral-200">
              {campaigns.map(c => (
                <div key={c._id} className="p-4 sm:p-5 flex gap-4 items-start hover:bg-neutral-50 transition-colors">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-accent-light flex-shrink-0">
                    {c.campaign_image_url
                      ? <img src={c.campaign_image_url} alt={c.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl" aria-hidden="true">🎯</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 truncate">{c.title}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      by {c.creator_name} · {c.category} · Goal: <span className="text-accent font-semibold tabular-nums"><span aria-hidden="true">💎</span>{c.funding_goal?.toLocaleString()}</span>
                    </p>
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{c.story}</p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Button size="sm" variant="secondary" onClick={() => setPreview(c)} leftIcon="👁">
                      Review
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon="✅"
                      onClick={() => act(c._id, 'approved')}
                      disabled={!!acting}
                      className="bg-success-light border border-success/20 text-success-dark hover:bg-success/20"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon="❌"
                      onClick={() => act(c._id, 'rejected')}
                      disabled={!!acting}
                      className="bg-error-light border border-error/20 text-error-hover hover:bg-error/20"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
              <Button
                variant="ghost"
                leftIcon="✅"
                className="flex-1 bg-success-light border border-success/20 text-success-dark hover:bg-success/20"
                onClick={() => act(preview._id, 'approved')}
                disabled={!!acting}
              >
                Approve
              </Button>
              <Button
                variant="destructive"
                leftIcon="❌"
                className="flex-1"
                onClick={() => act(preview._id, 'rejected')}
                disabled={!!acting}
              >
                Reject
              </Button>
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
              <div><p className="text-xs text-neutral-500 mb-0.5">Funding Goal</p><p className="text-accent font-semibold tabular-nums"><span aria-hidden="true">💎 </span>{preview.funding_goal?.toLocaleString()} credits</p></div>
              <div><p className="text-xs text-neutral-500 mb-0.5">Min Contribution</p><p className="text-accent font-semibold tabular-nums"><span aria-hidden="true">💎 </span>{preview.minimum_contribution?.toLocaleString()} credits</p></div>
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
