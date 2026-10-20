'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SkeletonCampaignList, EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import api from '@/lib/api';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop';

const daysLeft = (d) => Math.max(0, Math.ceil((new Date(d) - new Date()) / 86400000));

const FOCUS = 'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg';

/**
 * Top Funded Campaigns.
 *
 * The section is a ranking, and it now looks like one: the leader is the
 * section's single large thing — its picture, its title at display scale, its
 * credits raised as a figure — and the campaigns below it stack on a rail
 * with a node per rank, the same device the ledger path below uses for the
 * three steps of the credit economy. The ranking is the page's own grammar
 * turned up, not a new visual idea.
 *
 * The list is the leaderboard, so the ranking device replaces the old badge
 * that used to mark the top three. The API returns the top six by credits
 * raised, so the order on screen is the order of the data.
 *
 * Loading, error, empty and loaded all sit inside the same frame, so the
 * section does not change shape when the data lands.
 */
export default function TopFundedCampaigns({ initialCampaigns, initialFailed }) {
  // The ranking is read on the server and handed in, so the section is in the
  // HTML on the first paint. The browser only fetches when that read failed.
  const [campaigns, setCampaigns] = useState(initialCampaigns || []);
  const [loading, setLoading] = useState(!initialCampaigns);
  const [error, setError] = useState(initialFailed ? new Error('Failed to load campaigns') : null);
  const [needsFetch, setNeedsFetch] = useState(Boolean(initialFailed));
  // Bumping this re-runs the effect below. The fetch itself lives in the effect
  // so `setLoading(true)` is never called synchronously from an effect body
  // (react-hooks/set-state-in-effect).
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!needsFetch) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/api/campaigns/top-funded');
        if (cancelled) return;
        setCampaigns(res.data);
        setError(null);
        setNeedsFetch(false);
      } catch (err) {
        if (cancelled) return;
        setError(err.message || 'Failed to load campaigns');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [needsFetch, reloadToken]);

  const retry = () => {
    setError(null);
    setLoading(true);
    setReloadToken(t => t + 1);
    setNeedsFetch(true);
  };

  const isYoung = campaigns.length > 0 && campaigns.length < 3;

  return (
    <section className="py-20 bg-canvas" aria-label="Top funded campaigns">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:gap-16">
          <header className="self-start">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 text-balance">
              Top Funded Campaigns
            </h2>
            <p className="text-base text-neutral-700 mt-3 max-w-[34ch]">
              Ranked by credits raised, updated live.
            </p>
          </header>

          <div className="mt-10 lg:mt-0">
            {loading && <SkeletonCampaignList items={3} />}

            {!loading && error && (
              <Card className="max-w-md animate-scale-in">
                <div className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-error-light flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">Unable to load campaigns</h3>
                  <p className="text-base text-neutral-600 mb-4">{error}</p>
                  <Button variant="primary" onClick={retry}>
                    Try again
                  </Button>
                </div>
              </Card>
            )}

            {!loading && !error && campaigns.length === 0 && (
              <EmptyState
                variant="campaigns"
                role="creator"
                action={
                  <Button asChild variant="primary">
                    <Link href="/register">Create a campaign</Link>
                  </Button>
                }
              />
            )}

            {!loading && !error && campaigns.length > 0 && (
              <>
                <ol role="list" className="space-y-0">
                  {campaigns.map((c, i) => {
                    const goal = Number(c.funding_goal);
                    const percentFunded = Number.isFinite(goal) && goal > 0
                      ? Math.min(100, Math.round(((c.amount_raised || 0) / goal) * 100))
                      : 0;
                    const remaining = c.deadline ? daysLeft(c.deadline) : null;
                    const raised = (c.amount_raised || 0).toLocaleString();
                    const isLeader = i === 0;

                    return (
                      <li
                        key={c._id}
                        className="relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-5 pb-12 last:pb-0"
                      >
                        {/* The rail: the same device as the ledger path below,
                            one node per rank. The leader's node is filled; the
                            rest are the same ring the ledger uses for a step
                            it has not reached. */}
                        {i < campaigns.length - 1 && (
                          <span
                            aria-hidden="true"
                            className="absolute left-[22px] top-12 bottom-0 w-0.5 bg-neutral-200"
                          />
                        )}

                        <span
                          aria-hidden="true"
                          className={`mt-1 flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold tabular-nums ${
                            isLeader
                              ? 'bg-accent text-white'
                              // A 1px border, not a ring: a ring is a resting
                              // shadow, and nothing on this page casts one.
                              : 'bg-surface text-neutral-700 border border-neutral-300'
                          }`}
                        >
                          {i + 1}
                        </span>

                        {isLeader ? (
                          /* The leader: the section's one large thing, and one
                             link — the same action the rows offer, at the
                             scale the ranking deserves. */
                          <Link
                            href={`/campaigns/${c._id}`}
                            className="group block rounded-2xl border border-neutral-200 p-4 sm:p-6 transition-colors hover:border-primary-medium focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2"
                            aria-label={`${c.title}, ${raised} credits raised`}
                          >
                            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 group-hover:text-primary transition-colors text-balance line-clamp-2">
                              {c.title}
                            </h3>
                            <p className="mt-2 text-base text-neutral-600">by {c.creator_name}</p>

                            <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_11rem] lg:items-center">
                              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                                <Image
                                  src={c.campaign_image_url || PLACEHOLDER_IMAGE}
                                  alt={`${c.title} campaign image`}
                                  fill
                                  priority
                                  sizes="(max-width: 1024px) 100vw, 520px"
                                  className="object-cover transition-transform duration-300 [@media(hover:hover)]:group-hover:scale-105"
                                />
                              </div>

                              <div className="lg:text-right">
                                <p className="text-4xl font-extrabold tracking-tight text-accent tabular-nums">
                                  {raised}
                                </p>
                                <p className="mt-1 text-sm text-neutral-600">credits raised</p>
                                <div className="mt-5">
                                  <ProgressBar
                                    value={percentFunded}
                                    size="md"
                                    variant="primary"
                                    label="Funded"
                                    showValue
                                    animated
                                  />
                                </div>
                                <p className="mt-4 text-sm text-neutral-600 tabular-nums">
                                  {remaining !== null
                                    ? `${remaining} days left`
                                    : 'No deadline'}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ) : (
                          /* The rest of the ladder: one compact row each. */
                          <Link
                            href={`/campaigns/${c._id}`}
                            className={`group grid gap-x-5 gap-y-3 sm:grid-cols-[96px_minmax(0,1fr)_11rem] sm:items-center hover:bg-neutral-100 p-4 -m-4 lg:pr-10 ${FOCUS}`}
                            aria-label={`${c.title}, ${raised} credits raised`}
                          >
                            <div className="relative aspect-[4/3] w-24 sm:w-full overflow-hidden bg-neutral-100">
                              <Image
                                src={c.campaign_image_url || PLACEHOLDER_IMAGE}
                                alt={`${c.title} campaign image`}
                                fill
                                sizes="(max-width: 640px) 96px, 96px"
                                className="object-cover transition-transform duration-300 [@media(hover:hover)]:group-hover:scale-105"
                              />
                            </div>

                            <div className="min-w-0">
                              <h3 className="text-xl font-semibold text-neutral-900 group-hover:text-primary transition-colors line-clamp-2">
                                {c.title}
                              </h3>
                              <p className="mt-1 text-sm text-neutral-600 truncate">by {c.creator_name}</p>
                            </div>

                            <div className="sm:w-44 sm:text-right">
                              <span className="text-base font-semibold text-accent tabular-nums">
                                {raised} credits raised
                              </span>
                              <div className="mt-3">
                                <ProgressBar
                                  value={percentFunded}
                                  size="sm"
                                  variant="primary"
                                  label="Funded"
                                  showValue
                                  animated
                                />
                              </div>
                              <span className="mt-3 block text-sm text-neutral-600 tabular-nums">
                                {remaining !== null
                                  ? `${remaining} days left`
                                  : 'No deadline'}
                              </span>
                            </div>
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ol>

                {/* The section closes with its action, the way a
                    leaderboard does — after the ranking, not above it. */}
                <div className="mt-12 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  {isYoung ? (
                    <p className="text-base text-neutral-700 max-w-[52ch]">
                      {campaigns.length === 1
                        ? 'One campaign is live. Every campaign is reviewed by an admin before it goes live.'
                        : 'Two campaigns are live. Every campaign is reviewed by an admin before it goes live.'}
                    </p>
                  ) : (
                    <p className="text-base text-neutral-600">
                      {campaigns.length} campaigns, ranked by credits raised.
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 sm:justify-end">
                    <Link
                      href="/campaigns"
                      className={`inline-flex items-center min-h-11 text-base text-primary hover:underline font-medium rounded-sm ${FOCUS}`}
                    >
                      View all campaigns
                    </Link>
                    {isYoung && (
                      <Button asChild variant="primary" className="shrink-0">
                        <Link href="/register">Create a campaign</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
