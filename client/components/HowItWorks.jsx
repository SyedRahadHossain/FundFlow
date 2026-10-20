'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * How It Works — the ledger path.
 *
 * The platform's one unusual mechanism is the asymmetric credit economy, so the
 * section is that mechanism drawn as the route it takes: a supporter buys in at
 * 10 credits = $1, the creator approves, the creator cashes out at 20 credits =
 * $1. One rail, three nodes, and the rail fills in the direction the credit
 * travels.
 *
 * The stage is composed as three bands — the title, the route, the closing
 * note — so the pinned screen is filled by the mechanism instead of floating in
 * the middle of it. The rate is the section's own data, so it is set in the
 * largest type the page gives a figure: the credit in teal, the dollar in ink.
 *
 * Motion is layered, never doubled (see the ledger rules in `globals.css`):
 * the rail is complete by default so a failed script or an unsupported browser
 * still shows the mechanism; `data-run` plays it once on reveal; on a wide
 * viewport with view-timeline support the fill is bound to the scroll position
 * and the stage pins instead. Reduced motion keeps the complete route.
 */
const stages = [
  {
    title: 'Create a Campaign',
    desc: 'Tell your story, set a funding goal, and define rewards for backers.',
    status: 'Pending admin review',
    note: 'Your goal is set in credits',
    nodeAt: '0ms',
    railAt: '120ms',
  },
  {
    title: 'Collect Credits',
    desc: 'Supporters buy credits and back the campaigns they believe in.',
    figure: { credits: 10, dollars: 1 },
    note: 'You approve every contribution yourself.',
    nodeAt: '540ms',
    railAt: '620ms',
  },
  {
    title: 'Withdraw Funds',
    desc: 'Once your goal is reached, cash out your earnings to your bank account.',
    figure: { credits: 20, dollars: 1 },
    note: 'Minimum 200 raised credits',
    nodeAt: '1040ms',
    railAt: '0ms',
  },
];

export default function HowItWorks() {
  const ledgerRef = useRef(null);
  const [run, setRun] = useState(false);

  useEffect(() => {
    const el = ledgerRef.current;
    if (!el) return;
    // Reduced motion shows the completed route, so there is nothing to start.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      setRun(true);
    }, { threshold: 0.4 });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" className="bg-surface">
      <div className="ledger-scroll">
        <div className="ledger-stage">
          <div className="ledger-sheet w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <header>
              <h2
                id="how-it-works-heading"
                className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 text-balance"
              >
                How a credit travels
              </h2>
              <p className="mt-4 text-lg text-neutral-600 max-w-[52ch]">
                One route, three moves. Supporters buy credits in, creators take
                them out, and the spread between the two rates is what keeps the
                platform running.
              </p>
            </header>

            <ol
              ref={ledgerRef}
              data-ui
              role="list"
              aria-labelledby="how-it-works-heading"
              className="ledger grid gap-10 lg:grid-cols-3 lg:gap-8"
              {...(run ? { 'data-run': '' } : {})}
            >
              {stages.map((stage, i) => (
                <li
                  key={stage.title}
                  className="ledger-step"
                  style={{ '--ledger-node-at': stage.nodeAt, '--ledger-rail-at': stage.railAt }}
                >
                  <span className="ledger-node" aria-hidden="true">{i + 1}</span>

                  <div className="ledger-copy max-w-[38ch] md:max-w-none">
                    <h3 className="text-xl font-semibold tracking-tight text-neutral-900">
                      {stage.title}
                    </h3>
                    <p className="mt-2 text-base leading-relaxed text-neutral-600">
                      {stage.desc}
                    </p>

                    {/* The datum for this step: the credit in teal because a
                        credit is teal, the dollar in ink because money is ink.
                        The rate is the section's data, so it is set at figure
                        size, and the row keeps one height so the three
                        stations share a baseline. */}
                    <div className="ledger-data mt-5">
                      <p className="ledger-value flex items-baseline gap-x-2">
                        {stage.figure ? (
                          <>
                            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-accent tabular-nums">
                              {stage.figure.credits}
                            </span>
                            <span className="text-base font-medium text-neutral-600">
                              credits
                            </span>
                            <span className="text-xl text-neutral-500">=</span>
                            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 tabular-nums">
                              ${stage.figure.dollars}
                            </span>
                          </>
                        ) : (
                          <span className="ledger-status text-sm font-medium text-neutral-700">
                            {stage.status}
                          </span>
                        )}
                      </p>
                      <p className="mt-2 text-sm text-neutral-600">{stage.note}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            {/* The sheet's last band. The reversibility is the platform's first
                promise, so it closes the section instead of sitting inside one
                step's note. */}
            <p className="border-t border-neutral-200 pt-6 text-lg text-neutral-600 max-w-[68ch]">
              <span className="font-semibold text-neutral-900">
                Every step is reversible.
              </span>{' '}
              A rejected contribution refunds the credits instantly, and deleting
              a campaign refunds every approved contribution.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
