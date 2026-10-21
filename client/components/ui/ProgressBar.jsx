'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const ProgressBar = forwardRef(
  (
    {
      value = 0,
      max = 100,
      min = 0,
      label,
      showValue = true,
      variant = 'primary',
      size = 'md',
      animated = true,
      className,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
    const variants = {
      primary: 'bg-primary',
      secondary: 'bg-neutral-500',
      success: 'bg-success',
      warning: 'bg-warning',
      error: 'bg-error',
      accent: 'bg-accent',
    };

    const sizes = {
      sm: 'h-1',
      md: 'h-1.5',
      lg: 'h-2.5',
      xl: 'h-3',
    };

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {label && (
          <div className="flex justify-between text-[13px] font-medium text-neutral-600 mb-1.5">
            <span>{label}</span>
            {showValue && <span className="tabular-nums">{Math.round(percentage)}%</span>}
          </div>
        )}
        <div
          role="progressbar"
          aria-valuenow={Math.round(percentage)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={ariaLabel || label || `${Math.round(percentage)}% complete`}
          className={cn(
            'w-full bg-neutral-200 rounded-full overflow-hidden',
            sizes[size]
          )}
        >
          <div
            className={cn(
              'rounded-full transition-[width] duration-500 ease-out',
              variants[variant],
              animated && 'animate-slide-up'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';
