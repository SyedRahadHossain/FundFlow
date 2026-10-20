'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import AuthShell from '@/components/AuthShell';

/**
 * Forgot password.
 *
 * The answer never names an outcome: the same words go back whether the
 * address has an account or not, because telling the two apart turns this
 * screen into an account directory. The server sends the same generic
 * message; this page says the same thing in its own words.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      let msg = data?.error || (typeof data === 'string' ? data : null);
      if (!msg && status === 429) msg = 'Too many attempts. Please wait a few minutes and try again.';
      setError(msg || 'Could not send a reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthShell title="Check your inbox">
        <div role="status" aria-live="polite" className="text-center">
          <span className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center mx-auto mb-4">
            <Icon name="inbox" className="w-6 h-6" />
          </span>
          <p className="text-base text-neutral-700">
            If that address has an account, a reset link is on its way.
          </p>
          <p className="text-sm text-neutral-500 mt-2">
            The link is valid for one hour and can be used once.
          </p>

          <Button asChild variant="primary" width="full" className="mt-6">
            <Link href="/login">Back to sign in</Link>
          </Button>

          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-3 inline-flex items-center justify-center min-h-11 w-full text-sm font-medium text-primary hover:text-primary-hover hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Use a different address
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the address you use for FundFlow and we will send you a reset link."
    >
      {error && (
        <div
          role="alert"
          className="bg-error-light border border-error/20 text-error-hover text-sm rounded-lg px-4 py-3 mb-4"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError('');
          }}
          placeholder="jane@example.com"
          error={emailError}
        />

        <Button type="submit" width="full" loading={loading} loadingText="Sending link…">
          Send reset link
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-500 mt-4">
        Remembered it?{' '}
        <Link
          href="/login"
          className="text-primary hover:text-primary-hover hover:underline font-medium"
        >
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
