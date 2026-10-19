'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

const PACKAGES = [
  { credits: 100,  price: 10,  emoji: '💎',     label: 'Starter', popular: false },
  { credits: 300,  price: 25,  emoji: '💎💎',   label: 'Popular', popular: true  },
  { credits: 800,  price: 60,  emoji: '💎💎💎', label: 'Pro',     popular: false },
  { credits: 1500, price: 110, emoji: '👑',     label: 'Mega',    popular: false },
];

function PurchaseCreditInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(null);

  useEffect(() => {
    // Credits are granted only by the verified Stripe webhook. Returning from
    // checkout just refetches the balance; it never claims credits itself.
    if (searchParams.get('purchase') === 'success') {
      toast.success('Payment received — credits are added once Stripe confirms.');
      refreshUser();
      router.replace('/dashboard/purchase-credit');
    } else if (searchParams.get('purchase') === 'cancelled') {
      toast.error('Checkout cancelled — no charge was made.');
      router.replace('/dashboard/purchase-credit');
    }
  }, [searchParams, router, refreshUser]);

  const handleBuy = async (pkg) => {
    setLoading(pkg.credits);
    try {
      const res = await api.post('/api/stripe/create-checkout-session', {
        credits: pkg.credits,
      });
      // eslint-disable-next-line react-hooks/immutability -- Stripe checkout requires full page redirect
      window.location.href = res.data.url;
      return;
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        'Could not start checkout. Please try again in a moment.';
      toast.error(msg);
      setLoading(null);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900">Purchase Credits</h2>
        <p className="text-neutral-500 text-sm mt-1">Top up your balance to contribute to campaigns you love</p>
        <p className="text-xs text-neutral-500 mt-1">Rate: 10 credits = $1</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {PACKAGES.map(pkg => (
          <div
            key={pkg.credits}
            className={`relative bg-surface rounded-2xl border p-6 flex flex-col items-center text-center transition-shadow hover:shadow-md ${
              pkg.popular ? 'border-accent shadow-sm' : 'border-neutral-200'
            }`}
          >
            {pkg.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
                Most Popular
              </span>
            )}
            <span className="text-4xl mb-3" aria-hidden="true">{pkg.emoji}</span>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">{pkg.label}</p>
            <p className="text-3xl font-extrabold text-accent tabular-nums mb-1">
              {pkg.credits.toLocaleString()}
              <span className="text-base font-medium text-neutral-500 ml-1">credits</span>
            </p>
            <p className="text-xl font-bold text-neutral-900 tabular-nums mb-5">${pkg.price}</p>
            <Button
              onClick={() => handleBuy(pkg)}
              disabled={loading === pkg.credits}
              loading={loading === pkg.credits}
              loadingText="Redirecting…"
              width="full"
              className={
                pkg.popular
                  ? ''
                  : 'bg-primary-light text-primary-dark hover:bg-primary-medium'
              }
            >
              Buy {pkg.credits} credits
            </Button>
          </div>
        ))}
      </div>

      <p className="text-xs text-center text-neutral-500 mt-6">
        Payments processed securely via Stripe. Credits are non-refundable once purchased.
      </p>
    </div>
  );
}

export default function PurchaseCreditPage() {
  return (
    <Suspense fallback={<div className="text-neutral-500 text-sm p-4">Loading…</div>}>
      <PurchaseCreditInner />
    </Suspense>
  );
}
