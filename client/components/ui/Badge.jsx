'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const variants = {
  default: 'bg-neutral-100 text-neutral-700',
  primary: 'bg-primary-light text-primary-dark',
  secondary: 'bg-neutral-100 text-neutral-700',
  success: 'bg-success-light text-success-dark',
  warning: 'bg-warning-light text-warning-dark',
  error: 'bg-error-light text-error-hover',
  info: 'bg-info-light text-info-dark',
  outline: 'border border-neutral-300 bg-transparent text-neutral-700',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
  lg: 'px-3 py-1.5 text-sm gap-2',
};

export const Badge = forwardRef(
  (
    {
      children,
      variant = 'default',
      size = 'md',
      className,
      dot = false,
      dotColor,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full',
          'transition-colors duration-150',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full flex-shrink-0',
              dotColor || (variant === 'success' ? 'bg-success' : variant === 'warning' ? 'bg-warning' : variant === 'error' ? 'bg-error' : 'bg-primary')
            )}
            aria-hidden="true"
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export const StatusBadge = ({ status, children, ...props }) => {
  const statusConfig = {
    pending: { label: 'Pending', variant: 'warning', dot: true },
    approved: { label: 'Approved', variant: 'success', dot: true },
    active: { label: 'Active', variant: 'success', dot: true },
    rejected: { label: 'Rejected', variant: 'error', dot: true },
    completed: { label: 'Completed', variant: 'primary', dot: true },
    draft: { label: 'Draft', variant: 'secondary', dot: true },
    refunded: { label: 'Refunded', variant: 'neutral', dot: true },
    ended: { label: 'Ended', variant: 'neutral', dot: true },
  };

  const config = statusConfig[status] || { label: status, variant: 'default' };
  return <Badge variant={config.variant} dot={config.dot} {...props}>{children ?? config.label}</Badge>;
};

export const CategoryBadge = ({ category, ...props }) => (
  <Badge variant="outline" size="sm" className="font-semibold" {...props}>
    {/* The category is a name, not a label: it is the only place the category
        appears on the card, so it reads at 13px rather than the badge's 12px. */}
    <span className="text-[13px]">{category}</span>
  </Badge>
);

export const TopFundedBadge = ({ rank, ...props }) => (
  <Badge variant="warning" size="sm" className="font-bold" {...props}>
    #{rank} Top Funded
  </Badge>
);