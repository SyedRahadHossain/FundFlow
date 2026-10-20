'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import Icon from '@/components/ui/Icon';

export default function MyCampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState(null); // campaign being edited
  const [editForm, setEditForm]   = useState({ title: '', story: '', reward_info: '' });
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(null);
  const [posting, setPosting]     = useState(null); // campaign getting a new update
  const [postForm, setPostForm]   = useState({ title: '', body: '' });
  const [postingBusy, setPostingBusy] = useState(false);
  const [error, setError]             = useState(false);
  const [confirming, setConfirming]   = useState(null); // campaign pending delete

  // Reloading is driven by a token so the loader can stay inside the effect:
  // the effect calls setState only after an await, never synchronously.
  const [reloadToken, setReloadToken] = useState(0);

  const load = () => {
    api.get('/api/campaigns/mine')
      .then(res => { setCampaigns(res.data || []); setError(false); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [reloadToken]);

  const retry = () => {
    setError(false);
    setLoading(true);
    setReloadToken(t => t + 1);
  };

  const openEdit = (c) => {
    setEditing(c);
    setEditForm({ title: c.title, story: c.story, reward_info: c.reward_info });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/api/campaigns/${editing._id}`, editForm);
      toast.success('Campaign updated');
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save the campaign changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const openPostUpdate = (c) => {
    setPosting(c);
    setPostForm({ title: '', body: '' });
  };

  const handlePostUpdate = async (e) => {
    e.preventDefault();
    setPostingBusy(true);
    try {
      await api.post(`/api/campaigns/${posting._id}/updates`, postForm);
      toast.success('Update posted to your backers');
      setPosting(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not post the update. Please try again.');
    } finally {
      setPostingBusy(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await api.delete(`/api/campaigns/${id}`);
      toast.success('Campaign deleted — supporters refunded');
      setCampaigns(cs => cs.filter(c => c._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not delete the campaign. Please try again.');
    } finally {
      setDeleting(null);
      setConfirming(null);
    }
  };

  const daysLeft = (d) => Math.max(0, Math.ceil((new Date(d) - new Date()) / 86400000));

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">My Campaigns</h2>
          {!error && (
            <p className="text-neutral-500 text-sm mt-1">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</p>
          )}
        </div>
        <Button asChild variant="primary" leftIcon={<Icon name="add" />}>
          <Link href="/dashboard/add-campaign">New Campaign</Link>
        </Button>
      </div>

      {/* Load failure — same alert/retry affordance as the other dashboard homes */}
      {error && (
        <ErrorBanner message="We couldn’t load your campaigns." onRetry={retry} />
      )}

      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-neutral-100 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {!loading && !error && campaigns.length === 0 && (
        <EmptyState variant="campaigns" role="creator" />
      )}

      {!loading && !error && campaigns.length > 0 && (
        <div className="bg-surface rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
          {/* Table — desktop. Sorted by deadline descending server-side. */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-500 text-[13px] uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left">Campaign</th>
                  <th className="px-5 py-3 text-left">Category</th>
                  <th className="px-5 py-3 text-right">Raised</th>
                  <th className="px-5 py-3 text-right">Goal</th>
                  <th className="px-5 py-3 text-right">Deadline</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {campaigns.map(c => (
                  <tr key={c._id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-accent-light flex-shrink-0 relative">
                          {c.campaign_image_url
                            ? <Image src={c.campaign_image_url} alt="" fill sizes="40px" className="object-cover" />
                            : <div className="w-full h-full flex items-center justify-center" aria-hidden="true"><Icon name="image" className="w-5 h-5 text-neutral-400" /></div>}
                        </div>
                        <span className="font-medium text-neutral-800 truncate max-w-[14rem]" title={c.title}>{c.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-neutral-500">{c.category}</td>
                    <td className="px-5 py-3.5 text-right text-accent font-medium tabular-nums"><span className="inline-flex items-center gap-1 justify-end align-middle"><Icon name="credits" className="w-4 h-4" />{(c.amount_raised || 0).toLocaleString()}</span></td>
                    <td className="px-5 py-3.5 text-right text-neutral-500 tabular-nums">{c.funding_goal?.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right text-neutral-500 whitespace-nowrap">
                      {new Date(c.deadline).toLocaleDateString()}
                      <span className="block text-[13px] text-neutral-500">{daysLeft(c.deadline)}d left</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<Icon name="edit" />}
                          onClick={() => openEdit(c)}
                          className="border border-accent/20 text-accent! hover:bg-accent-light!"
                        >
                          Update
                        </Button>
                        {c.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            leftIcon={<Icon name="announce" />}
                            onClick={() => openPostUpdate(c)}
                            title={`Post a progress update (${(c.updates || []).length} posted)`}
                            className="border border-primary/20 text-primary hover:bg-primary-light"
                          >
                            Post Update{ (c.updates || []).length > 0 ? ` (${c.updates.length})` : '' }
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<Icon name="delete" />}
                          onClick={() => setConfirming(c)}
                          disabled={deleting === c._id}
                          className="border border-error/20 text-error! hover:bg-error-light!"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards — mobile */}
          <div className="sm:hidden divide-y divide-neutral-200">
            {campaigns.map(c => (
              <div key={c._id} className="p-4">
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-accent-light flex-shrink-0 relative">
                    {c.campaign_image_url
                      ? <Image src={c.campaign_image_url} alt="" fill sizes="56px" className="object-cover" />
                      : <div className="w-full h-full flex items-center justify-center" aria-hidden="true"><Icon name="image" className="w-6 h-6 text-neutral-400" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-neutral-900 truncate">{c.title}</h3>
                      <StatusBadge status={c.status} size="sm" className="flex-shrink-0" />
                    </div>
                    <p className="text-[13px] text-neutral-500 mt-1 flex items-center gap-1">{c.category} · <Icon name="calendar" className="w-4 h-4" />{daysLeft(c.deadline)}d left</p>
                    <div className="flex items-center gap-4 mt-2 text-[13px] text-neutral-500">
                      <span className="text-accent tabular-nums inline-flex items-center gap-1 align-middle"><Icon name="credits" className="w-4 h-4" />{(c.amount_raised || 0).toLocaleString()} raised</span>
                      <span className="tabular-nums">{c.funding_goal?.toLocaleString()} goal</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-200">
                  <Button
                    variant="ghost"
                    leftIcon={<Icon name="edit" />}
                    onClick={() => openEdit(c)}
                    className="flex-1 border border-accent/20 text-accent! hover:bg-accent-light!"
                  >
                    Update
                  </Button>
                  {c.status === 'approved' && (
                    <Button
                      variant="ghost"
                      leftIcon={<Icon name="announce" />}
                      onClick={() => openPostUpdate(c)}
                      title={`Post a progress update (${(c.updates || []).length} posted)`}
                      className="flex-1 border border-primary/20 text-primary hover:bg-primary-light"
                    >
                      Post Update{ (c.updates || []).length > 0 ? ` (${c.updates.length})` : '' }
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    leftIcon={<Icon name="delete" />}
                    onClick={() => setConfirming(c)}
                    disabled={deleting === c._id}
                    className="flex-1 border border-error/20 text-error! hover:bg-error-light!"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Update Modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Update Campaign"
        size="lg"
        closeOnOverlayClick={false}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Title"
            value={editForm.title}
            onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
            required
          />
          <Textarea
            label="Story"
            rows={4}
            value={editForm.story}
            onChange={e => setEditForm(f => ({ ...f, story: e.target.value }))}
            required
          />
          <Textarea
            label="Reward Info"
            rows={3}
            value={editForm.reward_info}
            onChange={e => setEditForm(f => ({ ...f, reward_info: e.target.value }))}
            required
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={saving} loadingText="Saving…" className="flex-1">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
      {/* Post Update Modal */}
      <Modal
        open={!!posting}
        onClose={() => setPosting(null)}
        title="Post Campaign Update"
        size="lg"
        closeOnOverlayClick={false}
      >
        <form onSubmit={handlePostUpdate} className="space-y-4">
          <p className="text-[13px] text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2">
            {posting ? <>This posts to <strong>{posting.title}</strong> and is visible to everyone viewing the campaign.</> : null}
          </p>
          <Input
            label="Update title"
            placeholder="Prototype boards arrived"
            value={postForm.title}
            onChange={e => setPostForm(f => ({ ...f, title: e.target.value }))}
            required
          />
          <Textarea
            label="What's new?"
            rows={5}
            placeholder="Share progress, a milestone hit, or what the funding enabled…"
            value={postForm.body}
            onChange={e => setPostForm(f => ({ ...f, body: e.target.value }))}
            required
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setPosting(null)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={postingBusy} loadingText="Posting…" className="flex-1">
              Post Update
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirming}
        onClose={() => setConfirming(null)}
        onConfirm={() => handleDelete(confirming._id)}
        title="Delete campaign?"
        description={`"${confirming?.title}" will be removed. All approved supporters will be refunded. This cannot be undone.`}
        confirmText="Delete campaign"
        cancelText="Cancel"
        loading={deleting === confirming?._id}
      />
    </div>
  );
}
