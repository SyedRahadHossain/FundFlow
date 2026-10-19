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
 * Motion is layered, never doubled (see the ledger rules in `globals.css`):
 * the rail is complete by default so a failed script or an unsupported browser
 * still shows the mechanism; `data-run` plays it once on reveal; on a wide
 * viewport with view-timeline support the fill is bound to the scroll position
 * and the stage pins instead. Reduced motion keeps the complete route.
 *
 * Copy is the existing step copy, unchanged — the mapping to the money is the
 * only thing that moved.
 */
const stages = [
  {
    title: 'Create a Campaign',
    desc: 'Tell your story, set a funding goal, and define rewards for backers.',
    note: 'Reviewed by an admin before it goes live',
    nodeAt: '0ms',
    railAt: '120ms',
  },
  {
    title: 'Collect Credits',
    desc: 'Supporters buy credits and back the campaigns they believe in. You approve every contribution yourself.',
    figure: { credits: 10, dollars: 1 },
    note: 'Reject one and the credits refund instantly',
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
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-0">
            <header className="mb-12 lg:mb-16">
              <h2
                id="how-it-works-heading"
                className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 text-balance"
              >
                How It Works
              </h2>
              <p className="mt-4 text-lg text-neutral-500 max-w-[62ch]">
                One route, three moves. Every credit a supporter buys in at
                {' '}10&nbsp;credits&nbsp;=&nbsp;$1 travels it, and every step is
                reversible by design.
              </p>
            </header>

            <ol
              ref={ledgerRef}
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

                  <div className="max-w-[38ch]">
                    <h3 className="text-xl font-semibold tracking-tight text-neutral-900">
                      {stage.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                      {stage.desc}
                    </p>

                    {/* The datum for this step: the credit in teal because a
                        credit is teal, the dollar in ink because money is ink. */}
                    <div className="mt-4 pt-4 border-t border-neutral-200">
                      {stage.figure ? (
                        <p className="text-sm">
                          <span className="font-semibold text-accent tabular-nums">
                            {stage.figure.credits} credits
                          </span>
                          <span className="mx-1.5 text-neutral-400" aria-hidden="true">=</span>
                          <span className="font-semibold text-neutral-900 tabular-nums">
                            ${stage.figure.dollars}
                          </span>
                        </p>
                      ) : (
                        <p className="text-sm font-medium text-neutral-700">
                          Status: pending admin review
                        </p>
                      )}
                      <p className="mt-1.5 text-xs text-neutral-500">{stage.note}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
