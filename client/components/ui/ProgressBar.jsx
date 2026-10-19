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
          <div className="flex justify-between text-xs font-medium text-neutral-600 mb-1.5">
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
              'rounded-full transition-all duration-500 ease-out',
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

export const CircularProgress = forwardRef(
  (
    {
      value = 0,
      max = 100,
      size = 48,
      strokeWidth = 4,
      variant = 'primary',
      showValue = true,
      label,
      className,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    const variants = {
      primary: 'stroke-primary',
      secondary: 'stroke-neutral-500',
      success: 'stroke-success',
      warning: 'stroke-warning',
      error: 'stroke-error',
    };

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex items-center justify-center', className)}
        style={{ width: size, height: size }}
        {...props}
      >
        <svg className="transform -rotate-90" width={size} height={size} aria-hidden="true">
          <circle
            className="stroke-neutral-200"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className={cn(
              'transition-all duration-500 ease-out',
              variants[variant],
              'stroke-linecap-round'
            )}
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        {(showValue || label) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
            {showValue && (
              <span className="font-bold text-neutral-900" style={{ fontSize: size * 0.18 }}>
                {Math.round(percentage)}%
              </span>
            )}
            {label && <span className="text-xs text-neutral-500 mt-0.5">{label}</span>}
          </div>
        )}
      </div>
    );
  }
);

CircularProgress.displayName = 'CircularProgress';