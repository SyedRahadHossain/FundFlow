'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge, CategoryBadge, TopFundedBadge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';

const daysLeft = (d) => Math.max(0, Math.ceil((new Date(d) - new Date()) / 86400000));

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop';

/**
 * Reusable campaign card used on Explore and public Campaigns pages.
 * Props: campaign, href (link target), showBadge (top-funded badge index), variant
 */
export default function CampaignCard({
  campaign: c,
  href,
  showBadge,
  variant = 'default',
  onClick,
}) {
  const goal = Number(c.funding_goal);
  const percentFunded = Number.isFinite(goal) && goal > 0
    ? Math.min(100, Math.round(((c.amount_raised || 0) / goal) * 100))
    : 0;
  // No deadline in the payload means unknown, never "Ended" — a false Ended
  // badge on a live campaign destroys trust.
  const daysRemaining = c.deadline ? daysLeft(c.deadline) : null;
  const imageUrl = c.campaign_image_url || PLACEHOLDER_IMAGE;

  const variants = {
    default: 'h-44',
    compact: 'h-32',
    featured: 'h-56',
  };

  const contentPadding = {
    default: 'p-4',
    compact: 'p-3',
    featured: 'p-5',
  };

  return (
    <Card
      className="overflow-hidden group"
      padding="none"
      hover
      onClick={onClick}
    >
      <div className={cn(
        'relative overflow-hidden bg-neutral-100',
        variants[variant]
      )}>
        <Image
          src={imageUrl}
          alt={`${c.title} campaign image`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        />
        <div className="absolute top-2 right-2">
          <CategoryBadge category={c.category} />
        </div>
        {showBadge !== undefined && showBadge < 3 && (
          <TopFundedBadge rank={showBadge + 1} className="absolute top-2 left-2" />
        )}
        {daysRemaining !== null && daysRemaining <= 3 && daysRemaining > 0 && (
          <Badge variant="error" size="sm" className="absolute bottom-2 left-2" dot>
            {daysRemaining}d left
          </Badge>
        )}
        {daysRemaining === 0 && (
          <Badge variant="neutral" size="sm" className="absolute bottom-2 left-2">
            Ended
          </Badge>
        )}
      </div>

      <CardContent className={cn(contentPadding[variant], 'space-y-3')}>
        <h3 className="font-semibold text-neutral-900 line-clamp-2">{c.title}</h3>
        <p className="text-xs text-neutral-500">by {c.creator_name}</p>

        <ProgressBar
          value={percentFunded}
          size="md"
          variant="primary"
          label="Funded"
          showValue
          animated
        />

        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span className="font-medium text-accent tabular-nums">
            {(c.amount_raised || 0).toLocaleString()} credits raised
          </span>
          <span className="flex items-center gap-1 tabular-nums">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {daysRemaining !== null
              ? (daysRemaining > 0 ? `${daysRemaining}d left` : 'Ended')
              : '—'}
          </span>
        </div>

        <Button
          asChild
          variant="primary"
          width="full"
          size="md"
        >
          <Link href={href}>View Details</Link>
        </Button>
      </CardContent>
    </Card>
  );
}