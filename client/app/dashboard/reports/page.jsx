'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ReportsPage() {
  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState(null);
  const [error, setError]       = useState(false);
  const [confirming, setConfirming] = useState(null); // { reportId, campaignId, title } pending delete

  // Reloading is driven by a token so the loader can stay inside the effect:
  // the effect calls setState only after an await, never synchronously.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    api.get('/api/reports')
      .then(res => { setReports(res.data || []); setError(false); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [reloadToken]);

  const retry = () => {
    setError(false);
    setLoading(true);
    setReloadToken(t => t + 1);
  };

  const deleteCampaign = async (reportId, campaignId) => {
    setActing(reportId);
    try {
      await api.delete(`/api/reports/${campaignId}/campaign`);
      toast.success('Campaign deleted');
      setReports(rs => rs.filter(r => r._id !== reportId));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally {
      setActing(null);
      setConfirming(null);
    }
  };

  const suspend = async (reportId, campaignId) => {
    setActing(reportId + 'suspend');
    try {
      await api.patch(`/api/campaigns/${campaignId}/status`, { status: 'rejected' });
      toast.success('Campaign suspended (rejected)');
      setReports(rs => rs.filter(r => r._id !== reportId));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally {
      setActing(null);
    }
  };

  const dismiss = async (reportId) => {
    setActing(reportId + 'dismiss');
    try {
      await api.delete(`/api/reports/${reportId}`);
      toast.success('Report dismissed');
      setReports(rs => rs.filter(r => r._id !== reportId));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally {
      setActing(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Reports</h2>
        {!error && (
          <p className="text-neutral-500 text-sm mt-1">{reports.length} report{reports.length !== 1 ? 's' : ''} pending review</p>
        )}
      </div>

      {/* Load failure — same alert/retry affordance as the other dashboard homes */}
      {error && (
        <div role="alert" className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-error bg-error-light px-4 py-3 text-sm text-error">
          <span>We couldn’t load reports.</span>
          <Button variant="ghost" size="sm" onClick={retry}>Retry</Button>
        </div>
      )}

      {!error && (
        <div className="bg-surface rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-neutral-50 animate-pulse rounded-xl" />)}</div>
          ) : reports.length === 0 ? (
            <EmptyState
              variant="reports"
              role="admin"
              subtitle="No reports — platform looks clean!"
            />
          ) : (
            <div className="divide-y divide-neutral-200">
              {reports.map(r => (
                <div key={r._id} className="p-5">
                  <div className="flex gap-3 items-start mb-4">
                    <span className="text-2xl flex-shrink-0" aria-hidden="true">🚩</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-neutral-900">{r.campaign_title}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Reported by <span className="font-medium text-neutral-600">{r.reporter_name || r.reporter_email}</span> on {new Date(r.date).toLocaleDateString()}
                      </p>
                      <div className="mt-2 bg-error-light border border-error-light rounded-xl px-4 py-3">
                        <p className="text-xs text-neutral-500 font-medium mb-0.5">Reason</p>
                        <p className="text-sm text-neutral-700">{r.reason}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon="⚠️"
                      onClick={() => suspend(r._id, r.campaign_id)}
                      disabled={!!acting}
                      className="bg-warning-light border border-warning/20 text-warning-dark hover:bg-warning/25"
                    >
                      Suspend Campaign
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon="🗑️"
                      onClick={() => setConfirming({ reportId: r._id, campaignId: r.campaign_id, title: r.campaign_title })}
                      disabled={!!acting}
                      className="bg-error-light border border-error/20 text-error-hover hover:bg-error/20"
                    >
                      Delete Campaign
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon="✓"
                      onClick={() => dismiss(r._id)}
                      disabled={!!acting}
                      className="bg-neutral-50 border border-neutral-200 text-neutral-600 hover:bg-neutral-200"
                    >
                      Dismiss Report
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!confirming}
        onClose={() => setConfirming(null)}
        onConfirm={() => deleteCampaign(confirming.reportId, confirming.campaignId)}
        title="Delete campaign?"
        description={`This will permanently remove "${confirming?.title}" from the platform. This cannot be undone.`}
        confirmText="Delete campaign"
        cancelText="Cancel"
        loading={acting === confirming?.reportId}
      />
    </div>
  );
}
