'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import Icon from '@/components/ui/Icon';

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
      toast.success(status === 'approved' ? 'Campaign approved' : 'Campaign rejected');
      setCampaigns(cs => cs.filter(c => c._id !== id));
      setPreview(null);
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
        (status === 'approved'
          ? 'Could not approve the campaign. Please try again.'
          : 'Could not reject the campaign. Please try again.')
      );
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
        <ErrorBanner message="We couldn’t load campaign approvals." onRetry={retry} />
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
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-accent-light flex-shrink-0 relative">
                    {c.campaign_image_url
                      ? <Image src={c.campaign_image_url} alt={c.title} fill sizes="64px" className="object-cover" />
                      : <div className="w-full h-full flex items-center justify-center" aria-hidden="true"><Icon name="image" className="w-6 h-6 text-neutral-400" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 truncate">{c.title}</p>
                    <p className="text-[13px] text-neutral-500 mt-0.5">
                      by {c.creator_name} · {c.category} · Goal: <span className="text-accent font-semibold tabular-nums inline-flex items-center gap-1 align-middle"><Icon name="credits" className="w-4 h-4" />{c.funding_goal?.toLocaleString()}</span>
                    </p>
                    <p className="text-[13px] text-neutral-500 mt-1 line-clamp-2">{c.story}</p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Button size="sm" variant="secondary" onClick={() => setPreview(c)} leftIcon={<Icon name="eye" />}>
                      Review
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Icon name="approve" />}
                      onClick={() => act(c._id, 'approved')}
                      disabled={!!acting}
                      className="bg-success-light! border border-success/20 text-success-dark hover:bg-success/20"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Icon name="reject" />}
                      onClick={() => act(c._id, 'rejected')}
                      disabled={!!acting}
                      className="bg-error-light! border border-error/20 text-error-hover! hover:bg-error/20!"
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
                leftIcon={<Icon name="approve" />}
                className="flex-1 bg-success-light! border border-success/20 text-success-dark hover:bg-success/20"
                onClick={() => act(preview._id, 'approved')}
                disabled={!!acting}
              >
                Approve
              </Button>
              <Button
                variant="destructive"
                leftIcon={<Icon name="reject" />}
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
              <div className="relative -mx-5 -mt-5 h-48 w-[calc(100%_+_2.5rem)]">
                <Image src={preview.campaign_image_url} alt={preview.title} fill sizes="(max-width: 640px) 100vw, 420px" className="object-cover" />
              </div>
            )}
            <div className="space-y-3 text-sm">
              <div><p className="text-[13px] text-neutral-500 mb-0.5">Title</p><p className="font-semibold text-neutral-900">{preview.title}</p></div>
              <div><p className="text-[13px] text-neutral-500 mb-0.5">Creator</p><p>{preview.creator_name} ({preview.creator_email})</p></div>
              <div><p className="text-[13px] text-neutral-500 mb-0.5">Category</p><p>{preview.category}</p></div>
              <div><p className="text-[13px] text-neutral-500 mb-0.5">Funding Goal</p><p className="text-accent font-semibold tabular-nums inline-flex items-center gap-1 align-middle"><Icon name="credits" className="w-4 h-4" />{preview.funding_goal?.toLocaleString()} credits</p></div>
              <div><p className="text-[13px] text-neutral-500 mb-0.5">Min Contribution</p><p className="text-accent font-semibold tabular-nums inline-flex items-center gap-1 align-middle"><Icon name="credits" className="w-4 h-4" />{preview.minimum_contribution?.toLocaleString()} credits</p></div>
              <div><p className="text-[13px] text-neutral-500 mb-0.5">Deadline</p><p>{new Date(preview.deadline).toLocaleDateString()}</p></div>
              <div><p className="text-[13px] text-neutral-500 mb-0.5">Story</p><p className="text-neutral-600 leading-relaxed">{preview.story}</p></div>
              <div><p className="text-[13px] text-neutral-500 mb-0.5">Reward Info</p><p className="text-neutral-600">{preview.reward_info}</p></div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
