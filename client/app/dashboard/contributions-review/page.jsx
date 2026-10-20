'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import Icon from '@/components/ui/Icon';

export default function ContributionsReviewPage() {
  const [campaigns, setCampaigns]         = useState([]);
  const [contributions, setContributions] = useState([]);
  const [selectedCampaign, setSelected]   = useState('all');
  const [viewModal, setViewModal]         = useState(null);
  const [loading, setLoading]             = useState(true);
  const [acting, setActing]               = useState(null);
  const [error, setError]                 = useState(null);
  const [confirming, setConfirming]       = useState(null); // { contribution, action }

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
    setActing(c._id + action);
    try {
      await api.patch(`/api/contributions/${c._id}/${action}`);
      toast.success(action === 'approve' ? 'Contribution approved' : 'Contribution rejected');
      setContributions(cs => cs.filter(x => x._id !== c._id));
      setViewModal(null);
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
        (action === 'approve'
          ? 'Could not approve the contribution. Please try again.'
          : 'Could not reject the contribution. Please try again.')
      );
    } finally {
      setActing(null);
      setConfirming(null);
    }
  };

  const confirmApprove = (c) => setConfirming({
    contribution: c,
    action: 'approve',
    title: 'Approve contribution?',
    description: `Approve contribution of ${c.contribution_amount?.toLocaleString()} credits from "${c.supporter_name}"?`,
  });

  const confirmReject = (c) => setConfirming({
    contribution: c,
    action: 'reject',
    title: 'Reject contribution?',
    description: `Reject contribution from "${c.supporter_name}"? Their credits will be refunded.`,
  });

  const ViewActions = ({ c, fullWidth }) => (
    <div className={fullWidth ? 'flex gap-3' : 'flex items-center justify-center gap-2'}>
      <Button
        size="sm"
        variant="ghost"
        leftIcon={<Icon name="approve" />}
        onClick={() => confirmApprove(c)}
        disabled={!!acting}
        aria-label={`Approve contribution from ${c.supporter_name}`}
        className={`min-h-11 bg-success-light! border border-success/20 text-success-dark hover:bg-success/20 ${fullWidth ? 'flex-1' : ''}`}
      >
        Approve
      </Button>
      <Button
        size="sm"
        variant="ghost"
        leftIcon={<Icon name="reject" />}
        onClick={() => confirmReject(c)}
        disabled={!!acting}
        aria-label={`Reject contribution from ${c.supporter_name}`}
        className={`min-h-11 bg-error-light! border border-error/20 text-error-hover! hover:bg-error/20! ${fullWidth ? 'flex-1' : ''}`}
      >
        Reject
      </Button>
    </div>
  );

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
        <ErrorBanner message="We couldn’t load contributions to review." onRetry={retry} />
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
        <div className="bg-surface rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
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
                  <thead className="bg-neutral-50 text-neutral-500 text-[13px] uppercase tracking-wide">
                    <tr>
                      <th className="px-5 py-3 text-left">Supporter</th>
                      <th className="px-5 py-3 text-left">Campaign</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                      <th className="px-5 py-3 text-left">Date</th>
                      <th className="px-5 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filtered.map(c => (
                      <tr key={c._id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-neutral-800">{c.supporter_name}</td>
                        <td className="px-5 py-3.5 text-neutral-500 max-w-[160px] truncate">{c.campaign_title}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-accent tabular-nums"><span className="inline-flex items-center gap-1 justify-end align-middle"><Icon name="credits" className="w-4 h-4" />{c.contribution_amount?.toLocaleString()}</span></td>
                        <td className="px-5 py-3.5 text-neutral-500">{new Date(c.date).toLocaleDateString()}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              leftIcon={<Icon name="eye" />}
                              onClick={() => setViewModal(c)}
                              className="border border-neutral-200 text-neutral-600! hover:bg-neutral-200"
                            >
                              Details
                            </Button>
                            <ViewActions c={c} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-neutral-200">
                {filtered.map(c => (
                  <div key={c._id} className="px-4 py-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-neutral-800 text-sm">{c.supporter_name}</p>
                        <p className="text-[13px] text-neutral-500 mt-0.5">{c.campaign_title}</p>
                      </div>
                      <p className="font-bold text-accent text-sm tabular-nums inline-flex items-center gap-1 align-middle"><Icon name="credits" className="w-4 h-4" />{c.contribution_amount?.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Icon name="eye" />}
                        onClick={() => setViewModal(c)}
                        className="flex-1 min-h-11 border border-neutral-200 text-neutral-600! hover:bg-neutral-200"
                      >
                        Details
                      </Button>
                      <ViewActions c={c} fullWidth />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* View modal */}
      <Modal
        open={!!viewModal}
        onClose={() => setViewModal(null)}
        title="Contribution Details"
        size="md"
        footer={
          viewModal ? (
            <div className="flex gap-3 w-full">
              <Button
                variant="primary"
                leftIcon={<Icon name="approve" />}
                onClick={() => confirmApprove(viewModal)}
                disabled={!!acting}
                aria-label={`Approve contribution from ${viewModal.supporter_name}`}
                className="flex-1 min-h-11 bg-success hover:bg-success-dark"
              >
                Approve
              </Button>
              <Button
                variant="destructive"
                leftIcon={<Icon name="reject" />}
                onClick={() => confirmReject(viewModal)}
                disabled={!!acting}
                aria-label={`Reject contribution from ${viewModal.supporter_name}`}
                className="flex-1 min-h-11"
              >
                Reject
              </Button>
            </div>
          ) : null
        }
      >
        {viewModal && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-neutral-500">Supporter</span><span className="font-medium">{viewModal.supporter_name}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Email</span><span className="font-medium text-[13px]">{viewModal.supporter_email}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Campaign</span><span className="font-medium">{viewModal.campaign_title}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Amount</span><span className="font-bold text-accent tabular-nums inline-flex items-center gap-1 align-middle"><Icon name="credits" className="w-4 h-4" />{viewModal.contribution_amount?.toLocaleString()} credits</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Date</span><span>{new Date(viewModal.date).toLocaleString()}</span></div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirming}
        onClose={() => setConfirming(null)}
        onConfirm={() => act(confirming.contribution, confirming.action)}
        title={confirming?.title || 'Confirm'}
        description={confirming?.description}
        confirmText={confirming?.action === 'approve' ? 'Approve' : 'Reject'}
        cancelText="Cancel"
        variant={confirming?.action === 'approve' ? 'primary' : 'destructive'}
        loading={!!acting}
      />
    </div>
  );
}
