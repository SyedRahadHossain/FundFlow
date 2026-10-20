import Link from 'next/link';

/**
 * The auth layout.
 *
 * The (auth) pages carry no navbar, so the wordmark is also the way back to
 * the landing page. The card is the one surface every auth screen stands on,
 * so it lives in one place instead of being copied into each page — the
 * password recovery screens use it, and it matches the sign-in and sign-up
 * screens exactly.
 */
export default function AuthShell({ title, subtitle, children }) {
  return (
    <main
      id="main-content"
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-accent-light to-primary-light px-4 py-10"
    >
      <Link
        href="/"
        className="flex items-center gap-2 mb-6 min-h-11 font-bold text-xl text-primary hover:text-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
      >
        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <span>FundFlow</span>
      </Link>

      <div className="bg-surface rounded-2xl border border-neutral-200 shadow-sm p-8 w-full max-w-md">
        {title && <h1 className="text-2xl font-bold text-neutral-900 mb-1">{title}</h1>}
        {subtitle && <p className="text-sm text-neutral-500 mb-6">{subtitle}</p>}
        {children}
      </div>
    </main>
  );
}
