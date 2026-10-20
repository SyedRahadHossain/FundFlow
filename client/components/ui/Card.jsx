'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Card = forwardRef(
  ({ className, children, padding = 'md', hover = false, ...props }, ref) => {
    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-6',
      xl: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(
          // DESIGN.md: cards are the Large radius step (rounded-2xl, 24px),
          // resting shadow-sm, hover shadow-lg, 1px neutral-200 border.
          'bg-surface rounded-2xl border border-neutral-200 shadow-sm',
          'transition-shadow duration-200',
          hover && 'hover:shadow-lg',
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = forwardRef(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mb-4', className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold text-neutral-900', className)}
      {...props}
    >
      {children}
    </h3>
  )
);

CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('mt-1 text-sm text-neutral-500', className)}
      {...props}
    >
      {children}
    </p>
  )
);

CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mt-4 pt-4 border-t border-neutral-200 flex items-center gap-2', className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';

export const InteractiveCard = forwardRef(
  ({ className, children, onClick, href, padding = 'md', ...props }, ref) => {
    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-6',
      xl: 'p-8',
    };

    const Component = href ? 'a' : 'div';
    const isLink = !!href;

    return (
      <Component
        ref={ref}
        href={href}
        onClick={onClick}
        className={cn(
          'bg-surface rounded-2xl border border-neutral-200 shadow-sm',
          'transition-shadow duration-200',
          'hover:shadow-lg hover:border-primary-medium hover:-translate-y-0.5',
          'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2',
          isLink ? 'cursor-pointer' : '',
          paddings[padding],
          className
        )}
        {...(!isLink ? props : {})}
      >
        {children}
      </Component>
    );
  }
);

InteractiveCard.displayName = 'InteractiveCard';