'use client';

import { Button } from './Button';
import { cn } from '@/lib/utils';

/**
 * The load-failure banner.
 *
 * One component for the whole product: a failed request is never an empty
 * list, so every surface says so in the same words, with the same retry
 * affordance, in the same place. The banner is announced as an alert, so a
 * screen-reader user hears the failure without hunting for it.
 */
export function ErrorBanner({ message, onRetry, retryLabel = 'Retry', className }) {
  return (
    <div
      role="alert"
      className={cn(
        'mb-6 flex items-center justify-between gap-4 rounded-xl border border-error bg-error-light px-4 py-3 text-sm text-error',
        className
      )}
    >
      <span>{message}</span>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export default ErrorBanner;
