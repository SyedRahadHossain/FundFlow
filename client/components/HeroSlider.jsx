'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

const slides = [
  {
    heading: 'Bring Your Ideas to Life',
    subtitle: 'Launch a campaign and let the world back your vision. From tech to art — every dream deserves a chance.',
    cta: 'Start a Campaign',
    href: '/register',
    alt: { label: 'Browse Campaigns', href: '/campaigns' },
    gradient: 'from-primary via-accent to-primary-dark',
    illustration: '🚀',
  },
  {
    heading: 'Support What Matters',
    subtitle: 'Browse live campaigns and contribute credits to the projects that inspire you.',
    cta: 'Explore Campaigns',
    href: '/campaigns',
    alt: { label: 'Start a Campaign', href: '/register' },
    gradient: 'from-accent via-primary-hover to-primary',
    illustration: '💎',
  },
  {
    heading: 'Turn Backers Into Believers',
    subtitle: 'Build a community around your campaign with updates, rewards, and transparent progress tracking.',
    cta: 'See How It Works',
    href: '#how-it-works',
    alt: { label: 'Browse Campaigns', href: '/campaigns' },
    gradient: 'from-primary-dark via-primary to-accent',
    illustration: '🤝',
  },
];

export default function HeroSlider() {
  const [active, setActive] = useState(0);
  // User-controlled pause (WCAG 2.2.2), independent of the hover pause.
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef(null);

  const goToSlide = useCallback((index) => {
    setActive(index);
  }, []);

  const nextSlide = useCallback(() => {
    setActive(i => (i + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setActive(i => (i - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (paused || hovered) return;
    // Respect the OS "reduce motion" setting: never auto-advance.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    timerRef.current = setInterval(nextSlide, 6000);
    return () => clearInterval(timerRef.current);
  }, [paused, hovered, nextSlide]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
  }, [nextSlide, prevSlide]);

  const slide = slides[active];

  return (
    <section
      className={`relative bg-gradient-to-br ${slide.gradient} transition-all duration-1000 min-h-[500px] flex items-center overflow-hidden`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="Hero carousel"
      role="region"
    >
      {/* Background decorative elements. Dark blobs: white blobs lightened the
          gradient under the trust copy and pushed it below 4.5:1. */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-black/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-black/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-black/5 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="max-w-3xl animate-fade-in">
          {/* Illustration badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <span className="text-xl w-10 h-10 rounded-xl flex items-center justify-center" aria-hidden="true">{slide.illustration}</span>
            <span className="text-white text-sm font-medium">FundFlow</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
            {slide.heading}
          </h1>
          <p className="text-lg sm:text-xl text-white mb-10 max-w-2xl animate-slide-up" style={{ animationDelay: '300ms' }}>
            {slide.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '400ms' }}>
            <Button
              asChild
              variant="primary"
              size="lg"
            >
              <Link href={slide.href}>{slide.cta}</Link>
            </Button>
            {slide.alt && (
              <Button
                asChild
                variant="ghost"
                size="lg"
              >
                <Link href={slide.alt.href} className="text-white">{slide.alt.label}</Link>
              </Button>
            )}
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center gap-6 text-white text-sm animate-fade-in" style={{ animationDelay: '500ms' }}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-success-light" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Every campaign is admin-reviewed</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <span>Rejected contributions refunded instantly</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-info-light" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Secure payments via Stripe</span>
            </div>
            <div className="flex items-center gap-2 border-l border-white/20 pl-6">
              <span className="text-primary-light font-medium" aria-hidden="true">💎</span>
              <span>10 credits = $1 in · 20 credits = $1 out</span>
            </div>
          </div>
        </div>
      </div>

      {/* Carousel controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4" role="group" aria-label="Slide navigation">
        <button
          onClick={prevSlide}
          aria-label="Previous slide"
          className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex gap-2">
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              aria-label={`Go to slide ${i + 1}: ${s.heading}`}
              aria-current={i === active}
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-all ${i === active ? 'bg-white' : 'bg-white/30 hover:bg-white/50'}`}
            >
              <span
                aria-hidden="true"
                className={`block rounded-full transition-all ${i === active ? 'w-8 h-2.5 bg-primary' : 'w-2.5 h-2.5 bg-white/70'}`}
              />
            </button>
          ))}
        </div>

        <button
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
          aria-pressed={paused}
          className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
        >
          {paused ? (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M6.3 3.4A1 1 0 014.8 4.3v11.4a1 1 0 001.5.9l9.2-5.7a1 1 0 000-1.7L6.3 3.4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5.75 3.5A1.75 1.75 0 014 5.25v9.5c0 .966.784 1.75 1.75 1.75h1.5A1.75 1.75 0 009 14.75v-9.5A1.75 1.75 0 007.25 3.5h-1.5zm7 0A1.75 1.75 0 0011 5.25v9.5c0 .966.784 1.75 1.75 1.75h1.5A1.75 1.75 0 0016 14.75v-9.5A1.75 1.75 0 0014.25 3.5h-1.5z" />
            </svg>
          )}
        </button>

        <button
          onClick={nextSlide}
          aria-label="Next slide"
          className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Pause indicator */}
      {paused && (
        <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs text-white animate-fade-in" aria-live="polite">
          Slideshow paused
        </div>
      )}
    </section>
  );
}
