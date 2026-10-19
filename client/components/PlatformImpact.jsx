'use client';

import { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';

/**
 * Live platform numbers.
 *
 * PRODUCT.md forbids fabricated benchmark metrics, so every value here comes
 * from `GET /api/stats`. When the platform genuinely has no activity the
 * section renders nothing rather than a wall of zeros — the page must never
 * imply traction that does not exist.
 *
 * Three craft decisions: the band keeps its own dark field in both themes
 * (`--field-impact`, a brand surface, not product chrome); each figure counts
 * up once when the band is read, because these are the platform's real numbers
 * and watching them land is the point; and the credit figure carries the credit
 * hue while the rest stay white ink.
 */

/**
 * Returns the counting value while it counts, or null when there is nothing to
 * animate. Null means "render the real figure": reduced motion, no
 * IntersectionObserver, or before the band is reached all show the true number
 * rather than a zero that never moves.
 */
function useCounter(rootRef) {
  const [counted, setCounted] = useState(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    // Reduced motion shows the settled figure; there is no animation to start.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const target = Number(el.dataset.value) || 0;
    let frame;
    let observer;

    const run = () => {
      const started = performance.now();
      const duration = 900;
      const tick = (now) => {
        const t = Math.min(1, (now - started) / duration);
        // ease-out-quint, the same arrival curve as the ledger rail.
        const eased = 1 - (1 - t) ** 5;
        setCounted(Math.round(target * eased));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      run();
    }, { threshold: 0.4 });

    observer.observe(el);
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [rootRef]);

  return counted;
}

function Figure({ value, label, credit = false }) {
  const ref = useRef(null);
  const counted = useCounter(ref);
  const shown = counted === null ? value : counted;

  return (
    <li className="border-t border-white/25 pt-4" ref={ref} data-value={value}>
      {/* The number counts up; assistive tech gets the settled value once,
          never the frames. */}
      <span
        aria-hidden="true"
        className={`block text-3xl sm:text-4xl font-extrabold tabular-nums ${
          credit ? 'text-field-credit' : 'text-white'
        }`}
      >
        {shown.toLocaleString()}
      </span>
      <span className="sr-only">{value.toLocaleString()} {label}</span>
      <span className="mt-1 block text-sm text-field-muted" aria-hidden="true">{label}</span>
    </li>
  );
}

export default function PlatformImpact() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let mounted = true;
    api.get('/api/stats')
      .then(res => { if (mounted) setStats(res.data); })
      .catch(() => { if (mounted) setStats(null); });
    return () => { mounted = false; };
  }, []);

  const hasActivity = stats && (
    stats.campaigns_live + stats.campaigns_raised + stats.credits_raised + stats.supporters > 0
  );
  if (!hasActivity) return null;

  const tiles = [
    { value: stats.campaigns_live, label: 'Live Campaigns' },
    { value: stats.credits_raised, label: 'Credits Raised', credit: true },
    { value: stats.supporters, label: 'Supporters' },
    { value: stats.campaigns_raised, label: 'Goals Reached' },
  ];

  return (
    <section
      className="relative py-20 sm:py-24 overflow-hidden"
      style={{ backgroundImage: 'var(--field-impact)' }}
      aria-labelledby="impact-heading"
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:items-start">
          <header>
            <h2
              id="impact-heading"
              className="text-3xl sm:text-4xl font-bold tracking-tight text-white text-balance"
            >
              Platform Impact
            </h2>
            <p className="mt-3 text-lg text-field-muted max-w-[46ch]">
              Counted live from the platform. Nothing here is estimated or
              rounded up.
            </p>
          </header>

          <ul role="list" className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
            {tiles.map((tile) => (
              <Figure key={tile.label} value={tile.value} label={tile.label} credit={tile.credit} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
