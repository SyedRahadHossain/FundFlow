import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="main-content" className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-light to-accent-light px-4 text-center">
      <span className="text-8xl mb-6" aria-hidden="true">🚀</span>
      <h1 className="text-6xl font-extrabold text-primary mb-2">404</h1>
      <p className="text-xl font-semibold text-neutral-800 mb-2">Page not found</p>
      <p className="text-neutral-600 mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Link href="/"
        className="bg-primary hover:bg-primary-hover text-white font-semibold px-6 py-3 rounded-lg transition-colors">
        ← Back to FundFlow
      </Link>
    </main>
  );
}