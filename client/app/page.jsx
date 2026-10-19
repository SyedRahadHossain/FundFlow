import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSlider from '@/components/HeroSlider';
import TopFundedCampaigns from '@/components/TopFundedCampaigns';
import HowItWorks from '@/components/HowItWorks';
import PlatformImpact from '@/components/PlatformImpact';
import Testimonials from '@/components/Testimonials';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

// ── Extra section 2: Explore by Category ─────────────────────────
// The categories are peers, so they share one hairline grid rather than eight
// separate bordered boxes — the separators carry the grouping and nothing
// else competes with the labels.
function ExploreByCategory() {
  const cats = [
    { label: 'Technology', icon: '💻' },
    { label: 'Art & Design', icon: '🎨' },
    { label: 'Community', icon: '👥' },
    { label: 'Health', icon: '🏥' },
    { label: 'Music', icon: '🎵' },
    { label: 'Education', icon: '📚' },
    { label: 'Environment', icon: '🌱' },
    { label: 'Gaming', icon: '🎮' },
  ];

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
          <p className="mt-3 text-lg text-neutral-500">
            Find the campaigns that match what you already care about.
          </p>
        </header>

        <ul
          role="list"
          className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-neutral-200 border-y border-neutral-200"
        >
          {cats.map((c) => (
            <li key={c.label} className="bg-surface">
              <Link
                href={`/campaigns?category=${encodeURIComponent(c.label)}`}
                className="group flex items-center gap-3 h-full min-h-[64px] px-4 py-5 transition-colors hover:bg-primary-light"
              >
                <span className="text-xl leading-none" aria-hidden="true">{c.icon}</span>
                <span className="text-sm font-medium text-neutral-700 group-hover:text-primary transition-colors">
                  {c.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── CTA Section ───────────────────────────────────────────────────
// One peak is the page's limit. The hero and the impact band already own the
// color, so the closing ask is ink on a quiet surface and takes its weight from
// type size instead of another gradient.
function CTASection() {
  return (
    <section className="py-20 sm:py-28 bg-canvas" aria-labelledby="cta-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="px-6 py-12 sm:px-12 sm:py-16 lg:px-16 text-center">
          <div className="max-w-2xl mx-auto">
            <h2
              id="cta-heading"
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-900 text-balance"
            >
              Ready to Start Your Journey?
            </h2>
            <p className="mt-4 text-lg text-neutral-600">
              Create a campaign or back one today. Credits are refundable, and
              every campaign is reviewed before it goes live.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="primary" size="lg" className="w-full sm:w-auto">
                <Link href="/register">Create Your Campaign</Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
                <Link href="/campaigns">Explore Campaigns</Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen flex flex-col">
      <Navbar />
      <HeroSlider />
      <TopFundedCampaigns />
      <HowItWorks />
      <ExploreByCategory />
      <PlatformImpact />
      <Testimonials />
      <CTASection />
      <Footer />
    </main>
  );
}
