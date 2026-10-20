'use client';

import Icon from '@/components/ui/Icon';

export default function StatCard({ icon, label, value, sub, color = 'primary', tone = 'ink', loading = false, skeleton = false }) {
  const colorStyles = {
    primary: 'bg-primary-light text-primary-dark',
    success: 'bg-success-light text-success',
    warning: 'bg-warning-light text-warning-dark',
    error: 'bg-error-light text-error',
    info: 'bg-info-light text-info',
    accent: 'bg-accent-light text-accent',
  };

  // The Credit Color Rule: a credit figure is teal wherever it appears; money
  // figures stay ink. Ink is the default, so no other call site needs a prop.
  const valueTone = tone === 'credit' ? 'text-accent' : 'text-neutral-900';

  if (skeleton) {
    return (
      <div className="bg-surface rounded-2xl border border-neutral-200 p-5 flex items-center gap-4 shadow-sm animate-pulse">
        <div className="w-12 h-12 rounded-2xl bg-neutral-200 flex-shrink-0" aria-hidden="true" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-3/4 bg-neutral-200 rounded" />
          <div className="h-6 w-1/2 bg-neutral-200 rounded" />
          {sub && <div className="h-3 w-1/3 bg-neutral-200 rounded" />}
        </div>
      </div>
    );
  }

  const displayValue = loading ? (
    <span
      className={`text-2xl font-bold tabular-nums animate-pulse ${valueTone}`}
      aria-busy="true"
      aria-label="Loading"
    >
      {'\u2026'}
    </span>
  ) : (
    <span className={`text-2xl font-bold tabular-nums ${valueTone}`} aria-live="polite">
      {value ?? '\u2014'}
    </span>
  );

  return (
    <div className="bg-surface rounded-2xl border border-neutral-200 p-5 flex items-center gap-4 shadow-sm">
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${colorStyles[color] || colorStyles.primary}`}
      >
        <Icon name={icon} className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[13px] text-neutral-500 font-medium uppercase tracking-wide">{label}</p>
        {displayValue}
        {sub && <p className="text-[13px] text-neutral-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}