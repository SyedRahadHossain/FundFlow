import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSlider from '@/components/HeroSlider';
import TopFundedCampaigns from '@/components/TopFundedCampaigns';
import HowItWorks from '@/components/HowItWorks';
import PlatformImpact from '@/components/PlatformImpact';
import Testimonials from '@/components/Testimonials';
import { Button } from '@/components/ui/Button';
import CampaignFormFragment from '@/components/CampaignFormFragment';
import { getTopFundedCampaigns, getPlatformStats } from '@/lib/catalog';

// ── Extra section 2: Explore by Category ─────────────────────────
// The categories are peers, so they read as an index of plain links, one
// drawn icon each, with space between them. No boxes, no grid lines: the
// label and the icon are enough.
const cats = [
  {
    label: 'Technology',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path strokeLinecap="round" d="M8 20h8M12 16v4" />
      </svg>
    ),
  },
  {
    label: 'Art & Design',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinejoin="round" d="M4 20l4.5-1L20 7.5a2.1 2.1 0 00-3-3L5.5 16 4 20z" />
        <path strokeLinecap="round" d="M14.5 6.5l3 3" />
      </svg>
    ),
  },
  {
    label: 'Community',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="8" r="3" />
        <path strokeLinecap="round" d="M3.5 20c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" />
        <path strokeLinecap="round" d="M16 5.5a3 3 0 010 5M17 14.8c2 .9 3.5 2.6 3.5 5.2" />
      </svg>
    ),
  },
  {
    label: 'Health',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinejoin="round" d="M12 20s-7-4.4-7-9.2A4 4 0 0112 8a4 4 0 017 2.8C19 15.6 12 20 12 20z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12.5h3l1.5-3 2 5.5 1.5-2.5h3.5" />
      </svg>
    ),
  },
  {
    label: 'Education',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinejoin="round" d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5v-15z" />
        <path strokeLinecap="round" d="M20 18v3H6.5" />
      </svg>
    ),
  },
  {
    label: 'Environment',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinejoin="round" d="M5 20c0-8 6-14 15-14 0 9-6 14-11 14H5z" />
        <path strokeLinecap="round" d="M5 20c3-5 7-8 11-9" />
      </svg>
    ),
  },
  {
    label: 'Gaming',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinejoin="round" d="M7 8h10a4.5 4.5 0 014.4 5.4l-.4 2a2.6 2.6 0 01-4.6 1.2L14.5 15h-5l-1.9 1.6a2.6 2.6 0 01-4.6-1.2l-.4-2A4.5 4.5 0 017 8z" />
        <path strokeLinecap="round" d="M7.5 11v2M6.5 12h2M15.5 11.5h.01M17.5 13.5h.01" />
      </svg>
    ),
  },
];

function ExploreByCategory() {
  return (
    <section className="py-20 sm:py-24 bg-surface" aria-labelledby="categories-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-10 max-w-2xl">
          <h2
            id="categories-heading"
            className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 text-balance"
          >
            Explore by Category
          </h2>
          <p className="mt-3 text-lg text-neutral-700">
            Find the campaigns that match what you already care about.
          </p>
        </header>

        <ul role="list" className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          {cats.map((c) => (
            <li key={c.label}>
              <Link
                href={`/campaigns?category=${encodeURIComponent(c.label)}`}
                className="group flex items-center gap-3 py-3 text-neutral-700 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
              >
                <span className="text-neutral-500 group-hover:text-primary transition-colors">
                  {c.icon}
                </span>
                <span className="text-base font-medium">{c.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── CTA Section ───────────────────────────────────────────────────
// One peak is the page's limit. The close is a split: the ask on the left,
// a real photograph of the world campaigns are made in on the right. No card
// around it — the field already separates it from the section above.
function CTASection() {
  return (
    <section className="py-20 sm:py-28 bg-canvas" aria-labelledby="cta-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-14 items-center">
          <div>
            <h2
              id="cta-heading"
              className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 text-balance"
            >
              Back a campaign, or start one
            </h2>
            <p className="mt-4 text-lg text-neutral-700 max-w-[52ch]">
              A title, a goal in credits and a story — then an admin review before it
              goes live. Supporters buy credits at 10 credits = $1, creators cash out
              at 20 credits = $1, and a rejected contribution refunds the credits the
              same day.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button asChild variant="primary" size="lg" className="w-full sm:w-auto">
                <Link href="/register">Create Your Campaign</Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
                <Link href="/campaigns">Explore Campaigns</Link>
              </Button>
            </div>
          </div>

          <CampaignFormFragment />
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  // The ranking and the live counters are read on the server, so the first
  // screen ships with them instead of a skeleton and a round trip.
  const [{ campaigns: topFunded, failed: topFundedFailed }, { stats }] = await Promise.all([
    getTopFundedCampaigns(),
    getPlatformStats(),
  ]);

  return (
    <main id="main-content" className="min-h-[100svh] flex flex-col">
      <Navbar />
      <HeroSlider />
      <TopFundedCampaigns initialCampaigns={topFunded} initialFailed={topFundedFailed} />
      <HowItWorks />
      <ExploreByCategory />
      <PlatformImpact initialStats={stats} />
      <Testimonials />
      <CTASection />
      <Footer />
    </main>
  );
}
