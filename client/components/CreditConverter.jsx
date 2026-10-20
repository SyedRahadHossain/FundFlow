'use client';

import { useState } from 'react';

/**
 * The credit converter.
 *
 * The platform's own mechanic, live: move the credits and read what the
 * supporter pays, what the creator withdraws, and what the platform keeps.
 * 10 credits = $1 in, 20 credits = $1 out — the asymmetry is the business
 * model, so it is the one thing the first screen shows.
 *
 * This is a fragment of the product, not a picture of one, so its root is
 * marked `data-ui`: it keeps the app's own surface, border and radius.
 * Without JavaScript it still reads the default amount.
 */
const CREDITS_IN_PER_DOLLAR = 10;
const CREDITS_OUT_PER_DOLLAR = 20;

const usd = (n) =>
  n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

export default function CreditConverter() {
  const [credits, setCredits] = useState(1000);

  const paid = credits / CREDITS_IN_PER_DOLLAR;
  const withdrawn = credits / CREDITS_OUT_PER_DOLLAR;
  const fillPercent = ((credits - 100) / (10000 - 100)) * 100;

  return (
    <div data-ui className="bg-surface rounded-2xl p-6 sm:p-7 shadow-2xl">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-neutral-500">Credits</span>
        <span className="text-3xl font-extrabold tracking-tight text-neutral-900 tabular-nums">
          {credits.toLocaleString()}
        </span>
      </div>

      <input
        type="range"
        min={100}
        max={10000}
        step={100}
        value={credits}
        onChange={(e) => setCredits(Number(e.target.value))}
        aria-label="Credits"
        aria-valuetext={`${credits.toLocaleString()} credits`}
        style={{ '--credit-fill': `${fillPercent}%` }}
        className="credit-range mt-2"
      />

      {/* A tone step, not a rule: the readouts sit in their own surface. */}
      <dl className="mt-6 space-y-2.5 bg-neutral-50 rounded-xl p-4">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-sm text-neutral-600">The supporter pays</dt>
          <dd className="text-lg font-semibold text-neutral-900 tabular-nums">{usd(paid)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-sm text-neutral-600">The creator withdraws</dt>
          <dd className="text-lg font-semibold text-neutral-900 tabular-nums">{usd(withdrawn)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-sm text-neutral-600">The platform keeps</dt>
          <dd className="text-lg font-bold text-neutral-900 tabular-nums">{usd(paid - withdrawn)}</dd>
        </div>
      </dl>

      <p className="mt-5 text-[13px] text-neutral-500">
        10 credits = $1 in · 20 credits = $1 out
      </p>
    </div>
  );
}
