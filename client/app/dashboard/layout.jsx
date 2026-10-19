'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import DashboardSidebar from '@/components/DashboardSidebar';
import NotificationBell from '@/components/NotificationBell';
import ThemeToggle from '@/components/ThemeToggle';
import api from '@/lib/api';

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [credits, setCredits] = useState(null);
  // Full profile from /api/auth/me. The JWT only carries { email, role }, so
  // the display name has to come from here.
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      api.get('/api/auth/me')
        .then(res => {
          setCredits(res.data.credits ?? 0);
          setProfile(res.data);
        })
        .catch(() => {});
    }
  }, [user]);

  // While auth state resolves, show spinner — never redirect prematurely
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" style={{ animationDuration: '1s' }} />
          <p className="text-sm text-neutral-400">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
      <div className="flex h-screen bg-neutral-50 overflow-hidden">
        <DashboardSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} profile={profile} />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top bar */}
          <header className="bg-surface border-b border-neutral-200 px-4 sm:px-6 h-14 flex items-center justify-between flex-shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button
                className="lg:hidden p-1.5 min-w-11 min-h-11 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-sm font-semibold text-neutral-700 capitalize">
                <Link
                  href="/"
                  className="hover:text-primary transition-colors underline decoration-neutral-200 underline-offset-4 hover:decoration-primary"
                  title="Back to FundFlow home"
                >
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard
                </Link>
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:flex items-center gap-1.5 text-sm bg-primary-light text-primary-dark px-3 py-1.5 rounded-full font-semibold">
                <span aria-hidden="true">💎</span> {credits !== null ? credits.toLocaleString() : '—'} credits
              </span>
              {user.role === 'supporter' && credits !== null && credits > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 text-xs bg-accent-light text-accent px-2 py-1 rounded-full font-medium">
                  10 credits = $1
                </span>
              )}
              {user.role === 'creator' && credits !== null && credits > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 text-xs bg-accent-light text-accent px-2 py-1 rounded-full font-medium">
                  20 credits = $1 withdrawal
                </span>
              )}
              {user.role === 'supporter' && (!credits || credits === 0) && (
                <span className="hidden sm:inline-flex items-center gap-1 text-xs bg-warning-light text-warning-dark px-2 py-1 rounded-full font-medium animate-pulse">
                  0 credits — purchase to contribute
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
