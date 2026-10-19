'use client';

import { cn } from '@/lib/utils';
import { Button } from './Button';

const emptyStates = {
  default: {
    emoji: '📭',
    title: 'Nothing here yet',
    subtitle: 'Get started by creating your first item',
  },
  campaigns: {
    creator: {
      emoji: '🚀',
      title: 'No campaigns yet',
      subtitle: 'Create your first campaign to start raising funds',
      actionText: 'Create Campaign',
      actionHref: '/dashboard/add-campaign',
    },
    supporter: {
      emoji: '🔍',
      title: 'No campaigns found',
      subtitle: 'Try adjusting your filters or search terms',
    },
    admin: {
      emoji: '📋',
      title: 'No campaigns to review',
      subtitle: 'Campaigns awaiting approval will appear here',
    },
  },
  contributions: {
    creator: {
      emoji: '💎',
      title: 'No contributions yet',
      subtitle: 'Approved contributions will appear here for review',
    },
    supporter: {
      emoji: '💎',
      title: 'You haven\'t backed any campaigns yet',
      subtitle: 'Discover projects you believe in and make an impact',
      actionText: 'Explore Campaigns',
      actionHref: '/dashboard/explore',
    },
  },
  withdrawals: {
    creator: {
      emoji: '💰',
      title: 'No withdrawal requests',
      subtitle: 'Request a withdrawal once you\'ve raised 200+ credits ($10+)',
      actionText: 'Request Withdrawal',
      actionHref: '/dashboard/withdrawals/new',
    },
    admin: {
      emoji: '💰',
      title: 'No withdrawal requests',
      subtitle: 'Pending withdrawal requests will appear here for review',
    },
  },
  payments: {
    creator: {
      emoji: '📄',
      title: 'No payment history',
      subtitle: 'Your payment records will appear here',
    },
    supporter: {
      emoji: '📄',
      title: 'No purchases yet',
      subtitle: 'Your credit purchases will appear here',
      actionText: 'Purchase Credits',
      actionHref: '/dashboard/purchase-credit',
    },
  },
  users: {
    admin: {
      emoji: '👥',
      title: 'No users found',
      subtitle: 'Users matching your criteria will appear here',
    },
  },
  reports: {
    admin: {
      emoji: '🚩',
      title: 'No reports',
      subtitle: 'Reported content will appear here for review',
    },
  },
  notifications: {
    default: {
      emoji: '🔔',
      title: 'No notifications yet',
      subtitle: 'You\'ll see updates about your campaigns and contributions here',
    },
  },
  search: {
    default: {
      emoji: '🔍',
      title: 'No results found',
      subtitle: 'Try a different search term or filter',
    },
  },
};

export function EmptyState({
  variant = 'default',
  role = 'default',
  emoji,
  title,
  subtitle,
  action,
  className,
  illustration,
}) {
  const config = emptyStates[variant]?.[role] || emptyStates[variant]?.default || emptyStates.default;

  const finalEmoji = emoji || config.emoji;
  const finalTitle = title || config.title;
  const finalSubtitle = subtitle || config.subtitle;
  const finalAction = action || (config.actionText && config.actionHref ? (
    <Button variant="primary" asChild>
      <a href={config.actionHref}>{config.actionText}</a>
    </Button>
  ) : null);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-4',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {illustration ? (
        <div className="mb-6" aria-hidden="true">{illustration}</div>
      ) : (
        <span className="text-6xl mb-4" aria-hidden="true">{finalEmoji}</span>
      )}
      <h3 className="text-lg font-semibold text-neutral-900 mb-1">{finalTitle}</h3>
      {finalSubtitle && (
        <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-6">{finalSubtitle}</p>
      )}
      {finalAction && (
        <div className="mt-2">{finalAction}</div>
      )}
    </div>
  );
}

export function SkeletonCard({ className }) {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="h-40 w-full bg-neutral-200 rounded-t-2xl" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-neutral-200 rounded w-3/4" />
        <div className="h-4 bg-neutral-200 rounded w-1/2" />
        <div className="h-4 bg-neutral-200 rounded w-full mt-2" />
        <div className="h-4 bg-neutral-200 rounded w-2/3" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4, className }) {
  return (
    <div className={cn('bg-surface rounded-2xl border border-neutral-100 overflow-hidden', className)}>
      <div className="bg-neutral-50 px-5 py-3 border-b border-neutral-100 animate-pulse">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 bg-neutral-200 rounded" style={{ width: i === 0 ? '120px' : '80px' }} />
          ))}
        </div>
      </div>
      <div className="divide-y divide-neutral-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-5 py-4 animate-pulse">
            <div className="flex gap-4">
              {Array.from({ length: columns }).map((_, j) => (
                <div key={j} className="h-4 bg-neutral-200 rounded flex-1" style={{ width: j === 0 ? '120px' : '80px' }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({ items = 3, className }) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-surface rounded-2xl border border-neutral-100 p-5 animate-pulse">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-xl bg-neutral-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-neutral-200 rounded w-3/4" />
              <div className="h-3 bg-neutral-200 rounded w-1/2" />
              <div className="h-3 bg-neutral-200 rounded w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LoadingOverlay({ message = 'Loading...', className }) {
  return (
    <div className={cn('fixed inset-0 z-50 flex items-center justify-center bg-surface/80 backdrop-blur-sm', className)}>
      <div className="flex flex-col items-center gap-4 p-6 bg-surface rounded-2xl shadow-lg border border-neutral-100">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-neutral-700">{message}</p>
      </div>
    </div>
  );
}

export function InlineLoading({ size = 'md', className }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-6 h-6 border-3',
  };
  return (
    <div
      className={cn('relative inline-block', sizes[size], className)}
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="absolute inset-0 border-current border-t-transparent rounded-full animate-spin" />
    </div>
  );
}