'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function ReportsPage() {
  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState(null);

  useEffect(() => {
    api.get('/api/reports')
      .then(res => setReports(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const deleteCampaign = async (reportId, campaignId, title) => {
    if (!window.confirm(`Delete campaign "${title}"? This will remove it from the platform.`)) return;
    setActing(reportId);
    try {
      await api.delete(`/api/reports/${campaignId}/campaign`);
      toast.success('Campaign deleted');
      setReports(rs => rs.filter(r => r._id !== reportId));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally {
      setActing(null);
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

  const dismiss = (reportId) => {
    setReports(rs => rs.filter(r => r._id !== reportId));
    toast.success('Report dismissed');
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Reports</h2>
        <p className="text-neutral-500 text-sm mt-1">{reports.length} report{reports.length !== 1 ? 's' : ''} pending review</p>
      </div>

      <div className="bg-surface rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-neutral-50 animate-pulse rounded-xl" />)}</div>
        ) : reports.length === 0 ? (
          <div className="py-20 text-center text-neutral-500">
            <span className="text-5xl block mb-3">🚩</span>
            <p>No reports — platform looks clean!</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-50">
            {reports.map(r => (
              <div key={r._id} className="p-5">
                <div className="flex gap-3 items-start mb-4">
                  <span className="text-2xl flex-shrink-0">🚩</span>
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
                  <button
                    onClick={() => suspend(r._id, r.campaign_id)}
                    disabled={!!acting}
                    className="text-xs bg-warning-light border border-warning/20 text-warning-dark hover:bg-warning-light px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 font-medium"
                  >
                    ⚠️ Suspend Campaign
                  </button>
                  <button
                    onClick={() => deleteCampaign(r._id, r.campaign_id, r.campaign_title)}
                    disabled={!!acting}
                    className="text-xs bg-error-light border border-error/20 text-error-hover hover:bg-error-light px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 font-medium"
                  >
                    🗑️ Delete Campaign
                  </button>
                  <button
                    onClick={() => dismiss(r._id)}
                    disabled={!!acting}
                    className="text-xs bg-neutral-50 border border-neutral-200 text-neutral-600 hover:bg-neutral-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 font-medium"
                  >
                    ✓ Dismiss Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
