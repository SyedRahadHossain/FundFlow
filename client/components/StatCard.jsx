'use client';

export default function StatCard({ emoji, label, value, sub, color = 'primary', loading = false, skeleton = false }) {
  const colorStyles = {
    primary: 'bg-primary-light text-primary-dark',
    success: 'bg-success-light text-success',
    warning: 'bg-warning-light text-warning-dark',
    error: 'bg-error-light text-error',
    info: 'bg-info-light text-info',
    accent: 'bg-accent-light text-accent',
  };

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
    <span className="text-2xl font-bold text-neutral-900 tabular-nums animate-pulse" aria-busy="true" aria-label="Loading">
      {'\u2026'}
    </span>
  ) : (
    <span className="text-2xl font-bold text-neutral-900 tabular-nums" aria-live="polite">
      {value ?? '\u2014'}
    </span>
  );

  return (
    <div className="bg-surface rounded-2xl border border-neutral-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${colorStyles[color] || colorStyles.primary}`}
        aria-hidden="true"
      >
        {emoji}
      </div>
      <div>
        <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide">{label}</p>
        {displayValue}
        {sub && <p className="text-xs text-neutral-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}