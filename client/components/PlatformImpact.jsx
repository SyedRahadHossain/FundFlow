'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

/**
 * Platform Impact — the live count.
 *
 * PRODUCT.md forbids fabricated benchmark metrics, so every value here comes
 * from `GET /api/stats`. When the platform genuinely has no activity the
 * section renders nothing rather than a wall of zeros — the page must never
 * imply traction that does not exist.
 *
 * The band keeps its own dark field in both themes (`--field-impact`, a brand
 * surface, not product chrome), and the credit figure carries the field's own
 * credit tint because a credit is teal everywhere, while the other three
 * counts stay white ink.
 *
 * The band reads as a statement. The credits raised hold the left column as
 * the total — display size, in the field's credit tint — and the other three
 * counts sit opposite it as ruled line items with right-aligned tabular
 * values, the way a ledger sheet records a figure and the rows that break it
 * down. One total, not four tiles of the same size. There is no count-up: the
 * ledger path above is the page's one authored moment, four concurrent
 * counters would be a second one, and the markup's default state is the
 * settled state — the same trick the ledger path uses so a page with no script
 * still shows the whole mechanism.
 *
 * The statement's rules live in `globals.css` under `.impact-*`: they are the
 * band's own layout, not markup, so the section keeps one class per part.
 */

/**
 * A count and its name, in the number the platform actually reports: one
 * live campaign, two supporters.
 */
function plural(count, one, many) {
  return count === 1 ? one : many;
}

export default function PlatformImpact({ initialStats }) {
  // The counters are read on the server and handed in, so the band is in the
  // HTML on the first paint. A failed server read falls back to the browser.
  const [stats, setStats] = useState(initialStats || null);

  useEffect(() => {
    if (initialStats) return;
    let cancelled = false;
    api.get('/api/stats')
      .then(res => { if (!cancelled) setStats(res.data); })
      .catch(() => { if (!cancelled) setStats(null); });
    return () => { cancelled = true; };
  }, [initialStats]);

  const hasActivity = stats && (
    stats.campaigns_live + stats.campaigns_raised + stats.credits_raised + stats.supporters > 0
  );
  if (!hasActivity) return null;

  // The credit figure leads: it is the platform's own throughput, and it is
  // the one count the field has a tint for.
  const facts = [
    {
      value: stats.credits_raised,
      label: plural(stats.credits_raised, 'credit raised', 'credits raised'),
      lead: true,
    },
    {
      value: stats.campaigns_live,
      label: plural(stats.campaigns_live, 'live campaign', 'live campaigns'),
    },
    {
      value: stats.supporters,
      label: plural(stats.supporters, 'supporter', 'supporters'),
    },
    {
      value: stats.campaigns_raised,
      label: plural(stats.campaigns_raised, 'goal reached', 'goals reached'),
    },
  ];

  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundImage: 'var(--field-impact)' }}
      aria-labelledby="impact-heading"
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
        {/* The masthead: the section's name and the promise that holds it up,
            paired on one baseline at the two ends of the sheet. */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-16 lg:items-end">
          <h2
            id="impact-heading"
            className="text-3xl sm:text-4xl font-bold tracking-tight text-white text-balance"
          >
            Platform Impact
          </h2>
          <p className="text-lg text-field-muted">
            Every figure below is the platform&rsquo;s live count, read from the
            database when this page loaded.
          </p>
        </div>

        {/* The statement: the platform's total holds the left column, the other
            three counts sit opposite it as ruled line items with right-aligned
            tabular values. A figure and the rows that break it down. */}
        <ul role="list" className="impact-statement">
          {facts.map((fact) => (
            <li key={fact.label} className={fact.lead ? 'impact-total' : 'impact-row'}>
              {fact.lead ? (
                <>
                  <span className="impact-total-figure tabular-nums tracking-tight text-field-credit">
                    {fact.value.toLocaleString()}
                  </span>
                  <span className="impact-total-label text-field-muted">{fact.label}</span>
                </>
              ) : (
                <>
                  <span className="impact-row-label text-field-muted">{fact.label}</span>
                  <span className="impact-row-value tabular-nums text-white">
                    {fact.value.toLocaleString()}
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>

        {/* The sheet's last band. The counts are exact, zeros included, so the
            band closes on what the numbers are rather than on another number. */}
        <p className="impact-note text-field-muted">
          Nothing is estimated or rounded up, and a zero here is a real count.
        </p>
      </div>
    </section>
  );
}
