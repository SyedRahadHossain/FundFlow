'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const PAYMENT_SYSTEMS = ['Stripe', 'Bkash', 'Rocket', 'Nagad'];
const MIN_CREDITS = 200;

export default function WithdrawalsPage() {
  const [campaigns, setCampaigns]     = useState([]);
  const [totalRaised, setTotalRaised] = useState(0);
  const [loading, setLoading]         = useState(true);
  const [form, setForm]               = useState({ withdrawal_credit: '', payment_system: 'Stripe', account_number: '' });
  const [submitting, setSubmitting]   = useState(false);
  const [errors, setErrors]           = useState({});
  const [error, setError]             = useState(false);

  // Reloading is driven by a token so the loader can stay inside the effect:
  // the effect calls setState only after an await, never synchronously.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    api.get('/api/campaigns/mine')
      .then(res => {
        const camps = res.data || [];
        setCampaigns(camps);
        setTotalRaised(camps.filter(c => c.status === 'approved').reduce((s, c) => s + (c.amount_raised || 0), 0));
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [reloadToken]);

  const retry = () => {
    setError(false);
    setLoading(true);
    setReloadToken(t => t + 1);
  };

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const credits = parseInt(form.withdrawal_credit) || 0;
  const dollarAmount = (credits / 20).toFixed(2);

  const validate = () => {
    const e = {};
    if (!credits || credits < MIN_CREDITS)    e.withdrawal_credit = `Minimum ${MIN_CREDITS} credits`;
    if (credits > totalRaised)                e.withdrawal_credit = `Cannot exceed ${totalRaised} raised credits`;
    if (!form.account_number.trim())          e.account_number    = 'Account number required';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      await api.post('/api/withdrawals', {
        withdrawal_credit: credits,
        withdrawal_amount: parseFloat(dollarAmount),
        payment_system: form.payment_system,
        account_number: form.account_number,
      });
      toast.success('Withdrawal request submitted!');
      setForm({ withdrawal_credit: '', payment_system: 'Stripe', account_number: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Withdrawal failed');
    } finally {
      setSubmitting(false);
    }
  };

  const canWithdraw = totalRaised >= MIN_CREDITS;

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Withdrawals</h2>
        <p className="text-neutral-500 text-sm mt-1">Withdraw your earned credits as cash</p>
      </div>

      {/* Load failure — same alert/retry affordance as the other dashboard homes */}
      {error && (
        <div role="alert" className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-error bg-error-light px-4 py-3 text-sm text-error">
          <span>We couldn’t load your withdrawal data.</span>
          <Button variant="ghost" size="sm" onClick={retry}>Retry</Button>
        </div>
      )}

      {/* Balance summary */}
      {!error && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-surface rounded-2xl border border-neutral-100 p-5 text-center shadow-sm">
            <p className="text-xs text-neutral-500 mb-1">Total Raised Credits</p>
            <p className="text-2xl font-bold text-accent tabular-nums">{loading ? '…' : totalRaised.toLocaleString()}</p>
            <p className="text-xs text-neutral-500 mt-1">💎 credits</p>
          </div>
          <div className="bg-surface rounded-2xl border border-neutral-100 p-5 text-center shadow-sm">
            <p className="text-xs text-neutral-500 mb-1">Equivalent Value</p>
            <p className="text-2xl font-bold text-neutral-900 tabular-nums">${loading ? '…' : (totalRaised / 20).toFixed(2)}</p>
            <p className="text-xs text-neutral-500 mt-1">at 20 credits = $1</p>
          </div>
        </div>
      )}

      {!error && (!loading && !canWithdraw ? (
        <div className="bg-warning-light border border-warning/20 rounded-2xl p-6 text-center">
          <span className="text-4xl block mb-3">💰</span>
          <p className="font-semibold text-warning-dark">Insufficient Credits</p>
          <p className="text-sm text-warning-dark mt-1">You need at least <strong>{MIN_CREDITS}</strong> raised credits to withdraw. You currently have <strong>{totalRaised}</strong>.</p>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-neutral-100 p-6 shadow-sm">
          <h3 className="font-semibold text-neutral-900 mb-4">Request Withdrawal</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Credits to Withdraw"
              type="number"
              min={MIN_CREDITS}
              max={totalRaised}
              value={form.withdrawal_credit}
              onChange={e => set('withdrawal_credit', e.target.value)}
              placeholder={`${MIN_CREDITS} – ${totalRaised}`}
              error={errors.withdrawal_credit}
            />

            {/* Auto-calculated dollar amount */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Withdrawal Amount (auto-calculated)</label>
              <div className="w-full border border-neutral-200 bg-neutral-50 rounded-lg px-4 py-2.5 text-sm text-neutral-900 font-semibold tabular-nums">
                ${credits > 0 ? dollarAmount : '0.00'}
              </div>
              <p className="text-xs text-neutral-500 mt-1.5">20 credits = $1</p>
            </div>

            <Select
              label="Payment Method"
              value={form.payment_system}
              onChange={e => set('payment_system', e.target.value)}
              options={PAYMENT_SYSTEMS.map(p => ({ value: p, label: p }))}
            />

            <Input
              label="Account Number / ID"
              value={form.account_number}
              onChange={e => set('account_number', e.target.value)}
              placeholder="Your account or phone number"
              error={errors.account_number}
            />

            <Button type="submit" width="full" size="lg" loading={submitting} loadingText="Submitting…" disabled={!canWithdraw}>
              💸 Request Withdrawal
            </Button>
          </form>
        </div>
      ))}
    </div>
  );
}
