'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

/**
 * The hero field.
 *
 * Each slide owns one constant indigo→teal gradient (`--field-hero-*` in
 * globals.css) and they cross-fade, so the field never flashes the wrong hue
 * mid-transition. The fields are theme-independent on purpose: this is the
 * page's Persuade surface, and the neutral ramp inverting under it would put
 * white copy on a light gradient.
 *
 * There is no eyebrow label above the headline — the headline carries its own
 * weight — and no decorative blurred blobs; the ledger section below is the
 * page's one authored moment.
 */
const slides = [
  {
    heading: 'Bring Your Ideas to Life',
    subtitle: 'Launch a campaign and let the world back your vision. From tech to art, every dream deserves a chance.',
    cta: 'Start a Campaign',
    href: '/register',
    alt: { label: 'Browse Campaigns', href: '/campaigns' },
    field: '--field-hero-a',
  },
  {
    heading: 'Support What Matters',
    subtitle: 'Browse live campaigns and contribute credits to the projects that inspire you.',
    cta: 'Explore Campaigns',
    href: '/campaigns',
    alt: { label: 'Start a Campaign', href: '/register' },
    field: '--field-hero-b',
  },
  {
    heading: 'Turn Backers Into Believers',
    subtitle: 'Build a community around your campaign with updates, rewards, and transparent progress tracking.',
    cta: 'See How It Works',
    href: '#how-it-works',
    alt: { label: 'Browse Campaigns', href: '/campaigns' },
    field: '--field-hero-c',
  },
];

// Three indicators, per DESIGN.md's hero spec.
const trust = [
  {
    text: 'Every campaign is admin-reviewed before it goes live',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    text: 'Rejected contributions refund instantly',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 15L3 21m0 0h6m-6 0v-6m8.5-6.5A7.5 7.5 0 0111 21" />
      </svg>
    ),
  },
  {
    text: '10 credits = $1 in · 20 credits = $1 out',
    icon: <span className="text-base leading-none" aria-hidden="true">💎</span>,
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
    timerRef.current = setInterval(nextSlide, 7000);
    return () => clearInterval(timerRef.current);
  }, [paused, hovered, nextSlide]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
  }, [nextSlide, prevSlide]);

  const slide = slides[active];

  return (
    <section
      className="relative flex items-center overflow-hidden min-h-[520px] lg:min-h-[600px]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="Hero carousel"
      role="region"
    >
      {/* The field. Constant gradients, crossed faded, plus one hairline rule
          at the composition's baseline so the copy sits on a drawn line rather
          than on the gradient alone. */}
      <div className="absolute inset-0" aria-hidden="true">
        {slides.map((s, i) => (
          <div
            key={s.heading}
            className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${
              i === active ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `var(${s.field})` }}
          />
        ))}
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/15" />
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        {/* Remounted per slide, so the copy's entrance ladder is the carousel's
            one rehearsed sequence rather than a scroll effect. Reduced motion
            drops the ladder and keeps the copy. */}
        <div key={active} className="max-w-3xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] text-balance animate-slide-up">
            {slide.heading}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-field-muted max-w-[52ch] animate-slide-up" style={{ animationDelay: '80ms' }}>
            {slide.subtitle}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 animate-slide-up" style={{ animationDelay: '160ms' }}>
            <Button asChild variant="primary" size="lg">
              <Link href={slide.href}>{slide.cta}</Link>
            </Button>
            {slide.alt && (
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="text-white! hover:bg-white/15!"
              >
                <Link href={slide.alt.href}>{slide.alt.label}</Link>
              </Button>
            )}
          </div>

          <ul
            role="list"
            className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 animate-slide-up"
            style={{ animationDelay: '240ms' }}
          >
            {trust.map((item) => (
              <li key={item.text} className="flex items-center gap-2 text-sm text-white">
                <span className="text-field-muted flex-shrink-0">{item.icon}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Carousel controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3" role="group" aria-label="Slide navigation">
        <button
          onClick={prevSlide}
          aria-label="Previous slide"
          className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-1">
          {slides.map((s, i) => (
            <button
              key={s.heading}
              onClick={() => goToSlide(i)}
              aria-label={`Go to slide ${i + 1}: ${s.heading}`}
              aria-current={i === active}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full"
            >
              <span
                aria-hidden="true"
                className={`block h-2 rounded-full transition-all duration-300 ${
                  i === active ? 'w-8 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            </button>
          ))}
        </div>

        <button
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
          aria-pressed={paused}
          className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 transition-colors"
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
      </div>

      {/* Pause indicator */}
      {paused && (
        <div className="absolute top-4 right-4 bg-white/10 rounded-full px-3 py-1.5 text-xs text-white animate-fade-in" aria-live="polite">
          Slideshow paused
        </div>
      )}
    </section>
  );
}
