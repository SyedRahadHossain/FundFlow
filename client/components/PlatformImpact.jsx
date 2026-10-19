'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';

/**
 * Live platform numbers.
 *
 * PRODUCT.md forbids fabricated benchmark metrics, so every value here comes
 * from `GET /api/stats`. When the platform genuinely has no activity the
 * section renders nothing rather than a wall of zeros — the page must never
 * imply traction that does not exist.
 */
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
    { value: stats.campaigns_live.toLocaleString(), label: 'Live Campaigns' },
    { value: stats.credits_raised.toLocaleString(), label: 'Credits Raised' },
    { value: stats.supporters.toLocaleString(), label: 'Supporters' },
    { value: stats.campaigns_raised.toLocaleString(), label: 'Goals Reached' },
  ];

  return (
    <section
      className="py-20 bg-gradient-to-br from-primary via-accent to-primary relative overflow-hidden"
      aria-labelledby="impact-heading"
    >
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-16">
          <Badge variant="outline" className="mb-4 bg-white/10 text-white border-white/20 hover:bg-white/20">Platform Impact</Badge>
          <h2 id="impact-heading" className="text-3xl sm:text-4xl font-bold text-white mb-2">Platform Impact</h2>
          <p className="text-primary-light text-lg max-w-2xl mx-auto">Counted live from the platform — nothing estimated</p>
        </header>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {tiles.map((s, i) => (
            <div key={s.label} className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-4xl font-extrabold text-white mb-2 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>{s.value}</div>
              <div className="text-primary-light text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
