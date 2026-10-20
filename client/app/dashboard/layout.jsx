'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import DashboardSidebar from '@/components/DashboardSidebar';
import NotificationBell from '@/components/NotificationBell';
import ThemeToggle from '@/components/ThemeToggle';
import Icon from '@/components/ui/Icon';

export default function DashboardLayout({ children }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  // The balance and the display name come from the auth context, which
  // fetched the profile once for the whole app. The dashboard used to ask for
  // /api/auth/me a second time on every entry.
  const credits = user?.credits ?? null;

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  // While auth state resolves, show spinner — never redirect prematurely
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" style={{ animationDuration: '1s' }} />
          <p className="text-sm text-neutral-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
      <div className="flex h-screen bg-canvas overflow-hidden">
        <DashboardSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} profile={profile} />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top bar */}
          <header className="bg-surface border-b border-neutral-200 px-4 sm:px-6 h-14 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button
                className="lg:hidden p-1.5 min-w-11 min-h-11 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation menu"
              >
                <Icon name="menu" className="w-5 h-5" />
              </button>
              <h1 className="text-sm font-semibold text-neutral-700 capitalize">
                <Link
                  href="/"
                  className="inline-flex items-center min-h-11 hover:text-primary transition-colors underline decoration-neutral-200 underline-offset-4 hover:decoration-primary"
                  title="Back to FundFlow home"
                >
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard
                </Link>
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* The balance is the credit hue; the rate beside it is ink, not a
                  second tinted pill, and there is no pulse — a steady warning
                  does not need to throb to be read. The balance stays on the
                  phone: it is the number the whole platform turns on, so width
                  never hides it. A supporter with nothing left gets the action
                  instead of the number. */}
              {credits === 0 && user.role === 'supporter' ? (
                <Link
                  href="/dashboard/purchase-credit"
                  className="flex items-center gap-1.5 text-sm bg-warning-light text-warning-dark px-2.5 sm:px-3 py-1.5 rounded-full font-semibold focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <Icon name="credits" className="w-4 h-4" /> Buy credits
                </Link>
              ) : (
                <span className="flex items-center gap-1.5 text-sm bg-accent-light text-accent-hover px-2.5 sm:px-3 py-1.5 rounded-full font-semibold tabular-nums">
                  <Icon name="credits" className="w-4 h-4" />
                  <span>{credits !== null ? credits.toLocaleString() : '—'}</span>
                  <span className="hidden sm:inline">credits</span>
                  <span className="sr-only sm:hidden">credits</span>
                </span>
              )}
              {credits !== null && credits > 0 && (
                <span className="hidden sm:inline text-[13px] text-neutral-500">
                  {user.role === 'creator' ? '20 credits = $1 on withdrawal' : '10 credits = $1'}
                </span>
              )}
              <NotificationBell />
              <ThemeToggle />
            </div>
          </header>

          {/* Page content */}
          <main id="main-content" className="flex-1 overflow-y-auto p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
  );
}
