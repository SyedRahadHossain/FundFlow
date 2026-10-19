'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

const STATUS_STYLE = {
  pending:  'bg-warning-light text-warning-dark border border-warning/20',
  approved: 'bg-success-light text-success-dark border border-success/20',
  rejected: 'bg-error-light text-error-hover border border-error/20',
};

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

  const load = () => {
    api.get('/api/campaigns/mine')
      .then(res => setCampaigns(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

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
      toast.error(err.response?.data?.error || 'Update failed');
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
      toast.error(err.response?.data?.error || 'Post failed');
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
      toast.error(err.response?.data?.error || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const daysLeft = (d) => Math.max(0, Math.ceil((new Date(d) - new Date()) / 86400000));

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">My Campaigns</h2>
          <p className="text-neutral-500 text-sm mt-1">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</p>
        </div>
        <a href="/dashboard/add-campaign"
          className="bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          + New Campaign
        </a>
      </div>

      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-neutral-100 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {!loading && campaigns.length === 0 && (
        <div className="py-20 text-center text-neutral-500">
          <span className="text-5xl block mb-3">📋</span>
          <p>No campaigns yet.</p>
          <a href="/dashboard/add-campaign" className="text-accent hover:underline text-sm mt-1 block">Create your first campaign →</a>
        </div>
      )}

      {!loading && campaigns.length > 0 && (
        <div className="bg-surface rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
          {/* Table — desktop. Sorted by deadline descending server-side. */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide">
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
              <tbody className="divide-y divide-neutral-100">
                {campaigns.map(c => (
                  <tr key={c._id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-accent-light flex-shrink-0">
                          {c.campaign_image_url
                            ? <img src={c.campaign_image_url} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center">🎯</div>}
                        </div>
                        <span className="font-medium text-neutral-800 truncate max-w-[14rem]" title={c.title}>{c.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-neutral-500">{c.category}</td>
                    <td className="px-5 py-3.5 text-right text-accent font-medium">💎 {(c.amount_raised || 0).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right text-neutral-500">{c.funding_goal?.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right text-neutral-500 whitespace-nowrap">
                      {new Date(c.deadline).toLocaleDateString()}
                      <span className="block text-xs text-neutral-500">{daysLeft(c.deadline)}d left</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-block ${STATUS_STYLE[c.status]}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(c)}
                          className="text-xs border border-accent/20 text-accent hover:bg-accent-light font-medium px-3 py-1.5 rounded-lg transition-colors">
                          ✏️ Update
                        </button>
                        {c.status === 'approved' && (
                          <button onClick={() => openPostUpdate(c)}
                            title={`Post a progress update (${(c.updates || []).length} posted)`}
                            className="text-xs border border-primary/20 text-primary hover:bg-primary-light font-medium px-3 py-1.5 rounded-lg transition-colors">
                            📣 Post Update{ (c.updates || []).length > 0 ? ` (${c.updates.length})` : '' }
                          </button>
                        )}
                        <button
                          onClick={() => { if (window.confirm(`Delete "${c.title}"? All approved supporters will be refunded.`)) handleDelete(c._id); }}
                          disabled={deleting === c._id}
                          className="text-xs border border-error/20 text-error hover:bg-error-light font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                          {deleting === c._id ? '…' : '🗑️ Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards — mobile */}
          <div className="sm:hidden divide-y divide-neutral-50">
            {campaigns.map(c => (
              <div key={c._id} className="p-4">
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-accent-light flex-shrink-0">
                    {c.campaign_image_url
                      ? <img src={c.campaign_image_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xl">🎯</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-neutral-900 truncate">{c.title}</h3>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_STYLE[c.status]}`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">{c.category} · ⏰ {daysLeft(c.deadline)}d left</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                      <span>💎 {(c.amount_raised || 0).toLocaleString()} raised</span>
                      <span>🎯 {c.funding_goal?.toLocaleString()} goal</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-50">
                  <button onClick={() => openEdit(c)}
                    className="flex-1 text-sm border border-accent/20 text-accent hover:bg-accent-light font-medium py-2 rounded-lg transition-colors">
                    ✏️ Update
                  </button>
                  {c.status === 'approved' && (
                    <button onClick={() => openPostUpdate(c)}
                      title={`Post a progress update (${(c.updates || []).length} posted)`}
                      className="flex-1 text-sm border border-primary/20 text-primary hover:bg-primary-light font-medium py-2 rounded-lg transition-colors">
                      📣 Post Update{ (c.updates || []).length > 0 ? ` (${c.updates.length})` : '' }
                    </button>
                  )}
                  <button
                    onClick={() => { if (window.confirm(`Delete "${c.title}"? All approved supporters will be refunded.`)) handleDelete(c._id); }}
                    disabled={deleting === c._id}
                    className="flex-1 text-sm border border-error/20 text-error hover:bg-error-light font-medium py-2 rounded-lg transition-colors disabled:opacity-50">
                    {deleting === c._id ? 'Deleting…' : '🗑️ Delete'}
                  </button>
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
          <p className="text-xs text-neutral-500 bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2">
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
    </div>
  );
}
