'use client';

import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

const variants = {
  primary: 'bg-primary hover:bg-primary-hover text-white shadow-sm',
  secondary: 'border border-neutral-300 bg-surface hover:bg-neutral-50 text-neutral-700',
  destructive: 'bg-error hover:bg-error-hover text-white shadow-sm',
  outline: 'border border-neutral-300 bg-transparent hover:bg-neutral-50 text-neutral-700',
  ghost: 'bg-transparent hover:bg-neutral-100 text-neutral-700',
  link: 'bg-transparent text-primary hover:text-primary-hover underline-offset-2 hover:underline',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
  xl: 'px-8 py-4 text-lg gap-3',
};

const widths = {
  auto: '',
  full: 'w-full',
};

export const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      width = 'auto',
      loading = false,
      loadingText = 'Loading...',
      disabled = false,
      leftIcon,
      rightIcon,
      className,
      type = 'button',
      asChild = false,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const Comp = asChild ? 'span' : 'button';

    // For asChild, we render a span that wraps the child (which should be a Link or similar)
    // The actual click handling is delegated to the child
    if (asChild) {
      return (
        <span
          ref={ref}
          className={cn(
            'inline-flex items-center justify-center font-semibold rounded-xl',
            'transition-all duration-150 ease-out',
            'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'active:scale-[0.98]',
            variants[variant],
            sizes[size],
            widths[width],
            className
          )}
          {...props}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>{loadingText}</span>
            </>
          ) : (
            <>
              {leftIcon && <span aria-hidden="true">{leftIcon}</span>}
              {children}
              {rightIcon && <span aria-hidden="true">{rightIcon}</span>}
            </>
          )}
        </span>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading}
        aria-disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-xl',
          'transition-all duration-150 ease-out',
          'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-[0.98]',
          variants[variant],
          sizes[size],
          widths[width],
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>{loadingText}</span>
          </>
        ) : (
          <>
            {leftIcon && <span aria-hidden="true">{leftIcon}</span>}
            {children}
            {rightIcon && <span aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';