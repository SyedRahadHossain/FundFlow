'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

/**
 * Shared campaign detail body used by the public route (/campaigns/[id]) and
 * the dashboard route (/dashboard/explore/[id]).
 * Props: mode = 'public' | 'dashboard'
 *  - public: back link goes to /campaigns, signed-out visitors get a
 *    sign-in call to action instead of the contribute form, and the report
 *    action only appears for signed-in supporters.
 *  - dashboard: back link uses history, contribute/report always available.
 */
export default function CampaignDetail({ mode = 'dashboard' }) {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/api/campaigns/${id}`)
      .then(res => setCampaign(res.data))
      .catch(() => toast.error('Campaign not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleContribute = async (e) => {
    e.preventDefault();
    const amt = parseInt(amount);
    if (!amt || amt < (campaign?.minimum_contribution || 1)) {
      toast.error(`Minimum contribution is ${campaign?.minimum_contribution} credits`);
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/contributions', { campaign_id: id, contribution_amount: amt });
      toast.success('Contribution submitted! Awaiting creator approval.');
      setAmount('');
      router.push('/dashboard/my-contributions');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Contribution failed');
    } finally {
      setSubmitting(false);
    }
  };

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    setReporting(true);
    try {
      await api.post('/api/reports', {
        campaign_id: id,
        campaign_title: campaign.title,
        reason: reportReason,
      });
      toast.success('Report submitted — Admin will review shortly');
      setReportOpen(false);
      setReportReason('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Report failed');
    } finally {
      setReporting(false);
    }
  };

  const goal = Number(campaign?.funding_goal);
  const pct = campaign && Number.isFinite(goal) && goal > 0
    ? Math.min(100, Math.round((campaign.amount_raised / goal) * 100))
    : 0;
  const daysLeft = campaign?.deadline
    ? Math.max(0, Math.ceil((new Date(campaign.deadline) - new Date()) / 86400000))
    : null;

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-4 animate-pulse" role="status" aria-label="Loading campaign">
      <div className="h-64 bg-neutral-100 rounded-2xl" />
      <div className="h-8 bg-neutral-100 rounded w-2/3" />
      <div className="h-4 bg-neutral-100 rounded w-full" />
    </div>
  );

  if (!campaign) return (
    <div className="text-center py-20 text-neutral-500" role="status">
      <span className="text-5xl block mb-3" aria-hidden="true">😕</span>
      Campaign not found
      <div className="mt-4">
        <Button asChild variant="secondary" size="sm">
          <Link href="/campaigns">Back to campaigns</Link>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      {mode === 'dashboard' ? (
        <button onClick={() => router.back()} className="text-sm text-accent hover:underline mb-5 flex items-center gap-1">
          ← Back to campaigns
        </button>
      ) : (
        <Link href="/campaigns" className="text-sm text-accent hover:underline mb-5 flex items-center gap-1">
          ← All campaigns
        </Link>
      )}

      {/* Cover image */}
      <div className="h-64 sm:h-80 bg-accent-light rounded-2xl overflow-hidden mb-6">
        {campaign.campaign_image_url
          ? <img src={campaign.campaign_image_url} alt={campaign.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-6xl" aria-hidden="true">🎯</div>
        }
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          <div>
            <span className="text-xs bg-accent-light text-accent-hover font-semibold px-3 py-1 rounded-full">{campaign.category}</span>
            <h1 className="text-2xl font-bold text-neutral-900 mt-3">{campaign.title}</h1>
            <p className="text-sm text-neutral-500 mt-1">by {campaign.creator_name}</p>
          </div>

          {/* Progress */}
          <div className="bg-surface rounded-2xl border border-neutral-100 p-5">
            <div className="flex justify-between text-sm font-semibold text-neutral-700 mb-2">
              <span>💎 {(campaign.amount_raised || 0).toLocaleString()} credits raised</span>
              <span>{pct}%</span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2 mb-3">
              <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-neutral-500">
              <span>Goal: 💎 {Number.isFinite(goal) ? goal.toLocaleString() : '—'}</span>
              <span>⏰ {daysLeft !== null ? `${daysLeft} days left` : 'Deadline unknown'}</span>
            </div>
          </div>

          {/* Story */}
          <div className="bg-surface rounded-2xl border border-neutral-100 p-5">
            <h2 className="font-semibold text-neutral-900 mb-3">Campaign Story</h2>
            <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">{campaign.story}</p>
          </div>

          {/* Rewards */}
          <div className="bg-surface rounded-2xl border border-neutral-100 p-5">
            <h2 className="font-semibold text-neutral-900 mb-2">🎁 Reward Info</h2>
            <p className="text-sm text-neutral-600">{campaign.reward_info}</p>
          </div>

          {/* Creator updates */}
          {(campaign.updates || []).length > 0 && (
            <div className="bg-surface rounded-2xl border border-neutral-100 p-5">
              <h2 className="font-semibold text-neutral-900 mb-4">
                📣 Creator Updates
                <span className="text-xs font-normal text-neutral-500 ml-2">
                  {campaign.updates.length} posted
                </span>
              </h2>
              <ol className="space-y-5">
                {[...campaign.updates].reverse().map((u, i) => (
                  <li key={i} className="border-l-2 border-primary/30 pl-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-semibold text-neutral-900 text-sm">{u.title}</h3>
                      <time className="text-xs text-neutral-500" dateTime={new Date(u.posted).toISOString()}>
                        {new Date(u.posted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </time>
                    </div>
                    <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line mt-1.5">{u.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Report */}
          {user && (
            <button onClick={() => setReportOpen(true)}
              className="text-xs text-neutral-500 hover:text-error transition-colors flex items-center gap-1">
              🚩 Report this campaign
            </button>
          )}
        </div>

        {/* Contribution form */}
        <div className="lg:col-span-1">
          <div className="bg-surface rounded-2xl border border-neutral-100 p-5 sticky top-4">
            <h2 className="font-semibold text-neutral-900 mb-4">Contribute Credits</h2>
            <p className="text-xs text-neutral-500 mb-4">
              Minimum contribution: <strong className="text-accent-hover">{campaign.minimum_contribution} credits</strong>
            </p>
            {!user ? (
              <div className="space-y-3">
                <Button asChild variant="primary" width="full">
                  <Link href={`/login?next=/campaigns/${id}`}>Sign in to contribute</Link>
                </Button>
                <p className="text-xs text-neutral-500 text-center">
                  Your credits stay refundable if the creator rejects your contribution.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContribute} className="space-y-4">
                <Input
                  label="Amount (credits)"
                  type="number"
                  min={campaign.minimum_contribution}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder={`Min ${campaign.minimum_contribution}`}
                  required
                />
                {daysLeft === 0 ? (
                  <p className="text-error text-xs text-center" role="alert">This campaign has ended</p>
                ) : (
                  <Button type="submit" width="full" loading={submitting} loadingText="Submitting…">
                    💎 Contribute Now
                  </Button>
                )}
              </form>
            )}
            <p className="text-xs text-neutral-500 text-center mt-3">
              Your credits will be deducted immediately and held until the creator reviews your contribution.
            </p>
          </div>
        </div>
      </div>
      {/* Report modal */}
      {reportOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md p-6" role="dialog" aria-modal="true" aria-labelledby="report-title">
            <h3 id="report-title" className="font-bold text-neutral-900 mb-1">Report Campaign</h3>
            <p className="text-sm text-neutral-500 mb-4">Describe why this campaign seems fraudulent or violates platform rules.</p>
            <Textarea
              aria-label="Report reason"
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              rows={4}
              placeholder="Explain the issue…"
              className="mb-4"
            />
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setReportOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReport}
                loading={reporting}
                loadingText="Sending…"
                disabled={!reportReason.trim()}
                className="flex-1"
              >
                🚩 Submit Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
