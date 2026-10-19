'use client';

import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

// Illustrative sample content. PRODUCT.md lists testimonials as something that
// must not be fabricated, so the UI labels these as samples rather than real
// customer quotes. The women's portraits were removed on request, so those
// cards fall back to the initials Avatar generates from the persona name.
const testimonials = [
  {
    name: 'Nadia Rahman',
    role: 'Supporter · Dhaka',
    quote:
      'I bought a 300 credit pack and backed three campaigns in one evening. Watching the creator approve each contribution within a day made the whole platform feel trustworthy.',
  },
  {
    name: 'Marcus Feld',
    role: 'Creator · Berlin',
    photo: 'https://randomuser.me/api/portraits/men/32.jpg',
    quote:
      'My hardware prototype crossed its funding goal in eleven days. The withdrawal took two clicks and the dollar amount was exactly what the calculator promised.',
  },
  {
    name: 'Ayesha Siddika',
    role: 'Supporter · Sylhet',
    quote:
      'Every campaign is reviewed before it goes live, so I never worry about where my credits go. Rejecting a contribution refunds me instantly — that rule sold me.',
  },
  {
    name: 'Diego Alvarez',
    role: 'Creator · Bogotá',
    photo: 'https://randomuser.me/api/portraits/men/75.jpg',
    quote:
      'The credit economy is simple math I can explain to backers: ten credits in for a dollar, twenty out. No hidden fees, no surprise deductions on payout day.',
  },
  {
    name: 'Priya Nair',
    role: 'Supporter · Kochi',
    quote:
      'I flag one suspicious campaign and the admin handled it the same afternoon. A report queue that actually moves is why I keep contributing here.',
  },
  {
    name: 'Tomasz Kowal',
    role: 'Creator · Kraków',
    photo: 'https://randomuser.me/api/portraits/men/18.jpg',
    quote:
      'Posting campaign updates keeps my backers in the loop without a single email tool. The notification bell tells me the moment new credits land.',
  },
];

export default function Testimonials() {
  // Autoplay is decided once at first render, so the OS "reduce motion"
  // setting is honoured without a hydration mismatch (it is a prop, not markup).
  const [autoplay] = useState(() =>
    typeof window !== 'undefined' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? { delay: 5000, disableOnInteraction: true, pauseOnMouseEnter: true }
      : false
  );

  return (
    <section className="py-24 bg-surface overflow-hidden" aria-labelledby="testimonials-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-10 max-w-2xl">
          <h2 id="testimonials-heading" className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 text-balance">
            The FundFlow Experience
          </h2>
          <p className="mt-3 text-lg text-neutral-500">
            Illustrative examples of how supporters and creators use FundFlow —
            sample quotes, not statements from real customers.
          </p>
        </header>

        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={24}
          slidesPerView={1}
          breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
          navigation
          pagination={{ clickable: true }}
          autoplay={autoplay || false}
          loop={testimonials.length >= 6}
          a11y={{ enabled: true }}
          className="pb-14 !overflow-visible sm:!overflow-hidden"
          aria-label="Illustrative sample testimonials"
        >
          {testimonials.map((t) => (
            <SwiperSlide key={t.name} className="!h-auto">
              <figure className="h-full bg-neutral-50 border border-neutral-200 rounded-2xl p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  {/* Rating marks stay in ink: amber is this system's review /
                      pending state, not a review score. */}
                  <div className="flex items-center gap-1 text-neutral-500" aria-label="5 out of 5 stars">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L1.077 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    ))}
                  </div>
                  <Badge variant="secondary" size="sm">Sample</Badge>
                </div>

                <blockquote className="text-neutral-600 text-sm leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                <figcaption className="flex items-center gap-3 mt-6 pt-5 border-t border-neutral-200">
                  <Avatar src={t.photo} alt={t.name} name={t.name} size="lg" />
                  <div>
                    <div className="font-semibold text-neutral-900 text-sm">{t.name}</div>
                    <div className="text-neutral-500 text-xs">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
