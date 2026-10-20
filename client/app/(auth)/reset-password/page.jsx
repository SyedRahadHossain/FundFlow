'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import AuthShell from '@/components/AuthShell';

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

function validate(form) {
  const errors = {};
  if (!form.password) {
    errors.password = 'Enter a new password';
  } else if (form.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  } else if (form.password.length > MAX_PASSWORD_LENGTH) {
    errors.password = `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer`;
  }
  if (!form.confirm) {
    errors.confirm = 'Confirm your new password';
  } else if (form.confirm !== form.password) {
    errors.confirm = 'Passwords do not match';
  }
  return errors;
}

/**
 * Reset password.
 *
 * The token arrives in the query string. Four states, and none of them is a
 * dead end: the form, a link that never carried a token, a link the server
 * no longer accepts, and the success state that points at sign-in. Every
 * failure offers the way forward — request a new link.
 */
function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState(token ? 'form' : 'missing');

  const update = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const found = validate(form);
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, password: form.password });
      setState('done');
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      const details = Array.isArray(data?.details) ? data.details : [];

      // A rejected password is a field problem; a rejected token is not.
      const passwordProblem = details.find((d) => /password/i.test(d));
      if (passwordProblem) {
        setErrors({ password: passwordProblem });
      } else if (status === 400) {
        setState('invalid');
      } else {
        let msg = data?.error || (typeof data === 'string' ? data : null);
        if (!msg && status === 429) msg = 'Too many attempts. Please wait a few minutes and try again.';
        setError(msg || 'Could not update your password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (state === 'missing') {
    return (
      <AuthShell title="This link is incomplete">
        <div role="status" className="text-center">
          <span className="w-12 h-12 rounded-full bg-warning-light text-warning-dark flex items-center justify-center mx-auto mb-4">
            <Icon name="warning" className="w-6 h-6" />
          </span>
          <p className="text-base text-neutral-700">
            This page needs the link from your email. Request a new one and open it on this device.
          </p>
          <Button asChild variant="primary" width="full" className="mt-6">
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
          <p className="text-center text-sm text-neutral-500 mt-2">
            <Link
              href="/login"
              className="text-primary hover:text-primary-hover hover:underline font-medium"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </AuthShell>
    );
  }

  if (state === 'invalid') {
    return (
      <AuthShell title="This reset link is no longer valid">
        <div role="alert" className="text-center">
          <span className="w-12 h-12 rounded-full bg-error-light text-error flex items-center justify-center mx-auto mb-4">
            <Icon name="warning" className="w-6 h-6" />
          </span>
          <p className="text-base text-neutral-700">
            Reset links expire after an hour and can only be used once. Request a new one and try again.
          </p>
          <Button asChild variant="primary" width="full" className="mt-6">
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
          <p className="text-center text-sm text-neutral-500 mt-2">
            <Link
              href="/login"
              className="text-primary hover:text-primary-hover hover:underline font-medium"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </AuthShell>
    );
  }

  if (state === 'done') {
    return (
      <AuthShell title="Your password is updated">
        <div role="status" aria-live="polite" className="text-center">
          <span className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center mx-auto mb-4">
            <Icon name="approve" className="w-6 h-6" />
          </span>
          <p className="text-base text-neutral-700">
            Sign in with your new password.
          </p>
          <Button asChild variant="primary" width="full" className="mt-6">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Pick something you have not used here before."
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
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={update('password')}
          placeholder={`Minimum ${MIN_PASSWORD_LENGTH} characters`}
          error={errors.password}
        />

        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          value={form.confirm}
          onChange={update('confirm')}
          placeholder="Type it once more"
          error={errors.confirm}
        />

        <Button type="submit" width="full" loading={loading} loadingText="Updating password…">
          Update password
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-500 mt-4">
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

export default function ResetPasswordPage() {
  // The token comes from the query string, so the page reads it in the
  // browser. The boundary keeps the frame while that happens.
  return (
    <Suspense
      fallback={
        <AuthShell title="Choose a new password">
          <p role="status" className="text-sm text-neutral-500">
            Loading…
          </p>
        </AuthShell>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
