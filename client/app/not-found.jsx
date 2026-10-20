import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';

export default function NotFound() {
  return (
    <main id="main-content" className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-light to-accent-light px-4 text-center">
      <span className="block mb-6"><Icon name="launch" className="w-20 h-20 mx-auto text-primary" /></span>
      <h1 className="text-6xl font-extrabold text-primary mb-2">404</h1>
      <p className="text-xl font-semibold text-neutral-800 mb-2">Page not found</p>
      <p className="text-neutral-600 mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Button asChild variant="primary" size="lg">
        <Link href="/" className="inline-flex items-center gap-1.5"><Icon name="chevronLeft" className="w-5 h-5" />Back to FundFlow</Link>
      </Button>
    </main>
  );
}
