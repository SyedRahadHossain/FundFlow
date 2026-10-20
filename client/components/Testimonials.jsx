'use client';

import { Avatar } from '@/components/ui/Avatar';

/**
 * Two sides of the ledger.
 *
 * PRODUCT.md lists testimonials as something that must not be fabricated, so
 * this section never dresses up as a wall of customer endorsements. It shows
 * the two sides of the same ledger — the supporter's and the creator's — as
 * worked examples written by the product team, and it says so in its own
 * words.
 *
 * The section is one constant field, because the platform's subject is the
 * two sides of one ledger rather than two testimonials. A field holds its own
 * colour in both themes (the Constant Field Rule), so the copy on it uses the
 * field's own tints: a credit is teal, money is the field's foreground, and
 * both are tabular.
 *
 * There are no photographs. A face next to a first-person line reads as a
 * customer talking, and the initials keep the sample honest.
 */
const examples = [
  {
    role: 'Supporter',
    name: 'Nadia Rahman',
    place: 'Dhaka',
    quote: 'I bought 300 credits and backed three campaigns in an evening.',
    rows: [
      {
        label: 'Buy credits',
        value: (
          <>
            <span className="text-field-credit tabular-nums">10</span>{' '}
            <span className="text-field-muted">credits</span>{' '}
            <span className="text-field-muted">=</span>{' '}
            <span className="tabular-nums">$1</span>
          </>
        ),
      },
      { label: 'Back a campaign', value: 'The creator approves it' },
      { label: 'If it is rejected', value: 'Your credits come back the same day' },
    ],
  },
  {
    role: 'Creator',
    name: 'Diego Alvarez',
    place: 'Bogotá',
    quote: 'Ten credits in for a dollar, twenty out. No hidden fees.',
    rows: [
      { label: 'Set the goal', value: 'In credits, not dollars' },
      { label: 'Approve each one', value: 'You accept or reject every contribution' },
      {
        label: 'Withdraw',
        value: (
          <>
            <span className="text-field-credit tabular-nums">200</span>{' '}
            <span className="text-field-muted">raised credits</span>
          </>
        ),
      },
    ],
  },
];

export default function Testimonials() {
  return (
    <section className="relative bg-field-ink" aria-labelledby="testimonials-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
        <header className="max-w-2xl">
          <h2
            id="testimonials-heading"
            className="text-3xl sm:text-4xl font-bold tracking-tight text-white text-balance"
          >
            Two sides of the ledger
          </h2>
          <p className="mt-4 text-lg text-field-muted max-w-[52ch]">
            Two worked examples of the workflows, written by our team.
          </p>
        </header>

        {/* The two pages of one ledger, side by side. The gutter between them
            is the fold: the rules stop short of it, so the sheet reads as one
            spread rather than two cards. */}
        <div className="mt-14 sm:mt-16 grid lg:grid-cols-2">
          {examples.map((e, i) => (
            <article
              key={e.role}
              className={`py-8 sm:py-10 lg:py-0 lg:pb-16 ${
                i === 0 ? 'lg:pr-8' : 'lg:pl-8'
              }`}
            >
              <h3 className="text-xl font-semibold tracking-tight text-white">{e.role}</h3>

              <div className="mt-5 flex items-center gap-3">
                <Avatar name={e.name} size="lg" className="example-mark" />
                <p className="text-base">
                  <span className="text-white">{e.name}</span>
                  <span className="text-field-muted"> · {e.place}</span>
                </p>
              </div>

              {/* Side by side, both quotes hold three lines at this size, so
                  the two columns' rules below start on the same line. */}
              <blockquote className="mt-7 text-2xl sm:text-3xl font-medium leading-[1.4] tracking-[0.005em] text-white max-w-[24ch] lg:min-h-[7.875rem]">
                &ldquo;{e.quote}&rdquo;
              </blockquote>

              {/* The rules of each side, as a ledger sheet records them: the
                  action on the left, what it means on the right. `data-ui`
                  marks the sheet's own lines as data marks, the same
                  convention the ledger path uses for its rail. */}
              <dl data-ui className="mt-9">
                {e.rows.map((row) => (
                  <div
                    key={row.label}
                    className="grid sm:grid-cols-[9.5rem_1fr] gap-x-6 gap-y-1 py-4 border-b border-white/10"
                  >
                    <dt className="text-sm font-medium text-field-muted">{row.label}</dt>
                    <dd className="text-base text-white">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
