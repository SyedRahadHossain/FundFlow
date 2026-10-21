'use client';

import Image from 'next/image';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorFromName(name) {
  if (!name) return 0;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

// Decorative avatar palette. Ten visually distinct combinations built only from
// design tokens, so the hash spreads across the set without leaving the system.
const bgColors = [
  'bg-primary-light text-primary-dark',
  'bg-accent-light text-accent-hover',
  'bg-success-light text-success-dark',
  'bg-warning-light text-warning-dark',
  'bg-info-light text-info-dark',
  'bg-error-light text-error-hover',
  'bg-primary-medium text-primary-dark',
  'bg-accent-light text-accent',
  'bg-accent text-white',
  'bg-primary text-white',
];

// The dimensions and shapes live at module scope rather than being rebuilt
// on every render.
const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-20 h-20 text-2xl',
};

const sizePx = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
  '2xl': 80,
};

const shapes = {
  circle: 'rounded-full',
  square: 'rounded-xl',
  rounded: 'rounded-lg',
};

const statusSizes = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-3.5 h-3.5',
  '2xl': 'w-4 h-4',
};

const statusPositions = {
  'bottom-right': 'bottom-0 right-0',
  'bottom-left': 'bottom-0 left-0',
  'top-right': 'top-0 right-0',
  'top-left': 'top-0 left-0',
};

export const Avatar = forwardRef(
  (
    {
      src,
      alt,
      name,
      size = 'md',
      shape = 'circle',
      className,
      status,
      statusPosition = 'bottom-right',
      ...props
    },
    ref
  ) => {
    const hasImage = src && !src.startsWith('data:');
    const colorIndex = getColorFromName(name || '') % bgColors.length;

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex shrink-0', className)}
        {...props}
      >
        {hasImage ? (
          <Image
            src={src}
            alt={alt || name || 'Avatar'}
            width={sizePx[size]}
            height={sizePx[size]}
            className={cn(sizes[size], shapes[shape], 'object-cover')}
          />
        ) : (
          <div
            className={cn(
              sizes[size],
              shapes[shape],
              'flex items-center justify-center font-semibold select-none',
              bgColors[colorIndex]
            )}
            aria-label={name || 'User avatar'}
          >
            {name ? getInitials(name) : '?'}
          </div>
        )}
        {status && (
          <span
            className={cn(
              'absolute border-2 border-white rounded-full',
              statusSizes[size],
              statusPositions[statusPosition]
            )}
            aria-label={status}
          >
            <span
              className={cn(
                'w-full h-full rounded-full',
                status === 'online' && 'bg-success',
                status === 'offline' && 'bg-neutral-400',
                status === 'busy' && 'bg-error',
                status === 'away' && 'bg-warning',
              )}
            />
          </span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';
