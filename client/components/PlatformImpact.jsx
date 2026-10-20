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
 * One figure owns the band. The credits raised lead the readout at display
 * size and the other three facts sit beside it on the same baseline as quiet
 * phrases, so the section reads as one line of live account rather than four
 * tiles of the same size. There is no count-up: the ledger path above is the
 * page's one authored moment, four concurrent counters would be a second one,
 * and the markup's default state is the settled state — the same trick the
 * ledger path uses so a page with no script still shows the whole mechanism.
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
      className="relative py-20 sm:py-24 overflow-hidden"
      style={{ backgroundImage: 'var(--field-impact)' }}
      aria-labelledby="impact-heading"
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

        {/* The readout: one line of live facts on a shared baseline. The credit
            figure leads at display size, the other three read as quiet
            phrases beside it rather than tiles of their own. */}
        <ul
          role="list"
          className="mt-12 sm:mt-16 flex flex-wrap items-baseline justify-between gap-x-8 sm:gap-x-12 gap-y-4"
        >
          {facts.map((fact) => (
            <li key={fact.label} className="flex items-baseline gap-2 sm:gap-3">
              <span
                className={`font-extrabold tabular-nums tracking-tight ${
                  fact.lead ? 'text-5xl sm:text-6xl text-field-credit' : 'text-2xl text-white'
                }`}
              >
                {fact.value.toLocaleString()}
              </span>
              <span
                className={`text-field-muted ${fact.lead ? 'text-xl' : 'text-base'}`}
              >
                {fact.label}
              </span>
            </li>
          ))}
        </ul>

        {/* The sheet's last band. The counts are exact, zeros included, so the
            band closes on what the numbers are rather than on another number. */}
        <p className="mt-12 sm:mt-14 text-base text-field-muted max-w-[60ch]">
          Nothing is estimated or rounded up, and a zero here is a real count.
        </p>
      </div>
    </section>
  );
}
