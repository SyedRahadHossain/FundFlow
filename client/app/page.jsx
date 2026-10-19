import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSlider from '@/components/HeroSlider';
import TopFundedCampaigns from '@/components/TopFundedCampaigns';
import PlatformImpact from '@/components/PlatformImpact';
import Testimonials from '@/components/Testimonials';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

// ── Extra section 1: How It Works ─────────────────────────────────
function HowItWorks() {
  const steps = [
    { 
      title: 'Create a Campaign', 
      desc: 'Tell your story, set your funding goal, and define rewards for backers. Supporters buy in at 10 credits = $1.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
    },
    { 
      title: 'Collect Credits', 
      desc: 'Supporters purchase credits and contribute to campaigns they believe in.',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a1 1 0 100-2 1 1 0 000 2z" />
        </svg>
      ),
    },
    { 
      title: 'Withdraw Funds', 
      desc: 'Once your goal is reached, withdraw your earnings to your bank account.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
    },
  ];
  return (
    <section id="how-it-works" className="py-20 bg-neutral-50" aria-labelledby="how-it-works-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-16">
          <Badge variant="primary" className="mb-4">Simple Process</Badge>
          <h2 id="how-it-works-heading" className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">How It Works</h2>
          <p className="text-neutral-500 text-lg max-w-2xl mx-auto">Three simple steps to fund your vision</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <Card key={i} className="text-center" padding="lg">
              <div className="w-14 h-14 rounded-xl bg-primary-light text-primary flex items-center justify-center mx-auto mb-5">
                {s.icon}
              </div>
              <h3 className="font-bold text-neutral-900 text-lg mb-3">{s.title}</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">{s.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Extra section 2: Explore by Category ─────────────────────────
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
    <section className="py-20 bg-surface" aria-labelledby="categories-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">Browse Categories</Badge>
          <h2 id="categories-heading" className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">Explore by Category</h2>
          <p className="text-neutral-500 text-lg max-w-2xl mx-auto">Find campaigns that match your passions</p>
        </header>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {cats.map(c => (
            <Link
              key={c.label}
              href={`/campaigns?category=${encodeURIComponent(c.label)}`}
              className={cn(
                'group flex flex-col items-center justify-center gap-3 p-6 rounded-xl border',
                'border-neutral-200 hover:border-primary hover:bg-primary-light',
                'transition-all duration-200 min-h-[110px] text-center font-medium',
                'text-neutral-700 hover:text-primary'
              )}
            >
              <span className="text-xl w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center" aria-hidden="true">{c.icon}</span>
              <span>{c.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA Section ───────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="py-20 bg-neutral-50" aria-labelledby="cta-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="bg-gradient-to-r from-primary-dark via-accent-hover to-primary-dark p-8 sm:p-12 lg:p-16 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 id="cta-heading" className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Start Your Journey?</h2>
            <p className="text-primary-light text-lg mb-8">Create a campaign or back one today.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="primary" size="lg" className="w-full sm:w-auto">
                <Link href="/register">Create Your Campaign</Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto text-surface! hover:bg-white/10!">
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