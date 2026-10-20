'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Modal';
import { CLIENT_REPO_URL } from '@/lib/links';
import ThemeToggle from '@/components/ThemeToggle';
import Icon from '@/components/ui/Icon';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const menuRef = useRef(null);
  const userMenuRef = useRef(null);

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    setUserMenuOpen(false);
    router.push('/');
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setUserMenuOpen(false);
        setShowLogoutConfirm(false);
      }
    };
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-surface sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 min-h-11 font-bold text-xl text-primary" aria-label="FundFlow Home">
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span>FundFlow</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/campaigns" className="inline-flex items-center min-h-11 text-sm text-neutral-600 hover:text-primary font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm">
              Explore Campaigns
            </Link>

            <a
              href={CLIENT_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center min-h-11 text-sm text-neutral-600 hover:text-primary font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
            >
              Join as Developer
            </a>

            <ThemeToggle />

            {loading ? (
              /* The session is not known on the server, so the auth area waits
                 for it. Rendering "Login" on the server and "Dashboard" on the
                 client is a hydration mismatch and a visible flash. */
              <span className="h-8 w-24 rounded-full bg-neutral-100 animate-pulse" aria-hidden="true" />
            ) : user ? (
              <>
                <Link href="/dashboard" className="inline-flex items-center min-h-11 text-sm text-neutral-600 hover:text-primary font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm">
                  Dashboard
                </Link>
                <span className="flex items-center gap-2 text-sm bg-accent-light text-accent-hover px-3 py-1.5 rounded-full font-semibold tabular-nums">
                  <Icon name="credits" className="w-4 h-4" />
                  <span aria-label="Credits balance">{user.credits ?? 0} credits</span>
                  <span className="text-[13px] text-accent" title="10 credits = $1 USD buy-in · 20 credits = $1 USD payout">(10 credits = $1)</span>
                </span>
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                    aria-controls="user-menu"
                    aria-label="User menu"
                    className="p-1 rounded-full min-w-11 min-h-11 flex items-center justify-center hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <Avatar name={user.email} size="sm" />
                  </button>
                  {userMenuOpen && (
                    <div id="user-menu" className="absolute right-0 top-full mt-2 w-56 bg-surface border border-neutral-200 rounded-xl shadow-lg py-2 animate-fade-in">
                      <div className="px-4 py-2 text-sm text-neutral-500 border-b border-neutral-200">
                        {user.email}
                      </div>
                      <Link
                        href="/dashboard"
                        className="flex items-center min-h-11 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/purchase-credit"
                        className="flex items-center min-h-11 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Purchase Credits
                      </Link>
                      <hr className="my-2 border-neutral-200" />
                      <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="w-full text-left min-h-11 px-4 py-2 text-sm text-error hover:bg-error-light"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="inline-flex items-center min-h-11 text-sm text-neutral-600 hover:text-primary font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm">
                  Login
                </Link>
                <Button asChild variant="primary" size="sm">
                  <Link href="/register">Register</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile burger */}
          <button
            className="md:hidden p-2 text-neutral-600 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation menu"
          >
            <Icon name={menuOpen ? 'close' : 'menu'} className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div id="mobile-menu" ref={menuRef} className="md:hidden border-t border-neutral-200 py-3 space-y-2 pb-4 animate-slide-down">
            <div className="px-4 py-2 flex items-center justify-between">
              <span className="text-sm text-neutral-500">Theme</span>
              <ThemeToggle />
            </div>
            <Link href="/campaigns" className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg min-h-[44px] flex items-center" onClick={() => setMenuOpen(false)}>Explore Campaigns</Link>
            <a href={CLIENT_REPO_URL} target="_blank" rel="noopener noreferrer" className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg min-h-[44px] flex items-center" onClick={() => setMenuOpen(false)}>Join as Developer</a>
            {user ? (
              <>
                <Link href="/dashboard" className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg min-h-[44px] flex items-center" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <div className="px-4 py-2 text-[13px] text-neutral-500 flex items-center gap-2">
                  <Icon name="credits" className="w-4 h-4" />
                  {user.credits ?? 0} credits (10 credits = $1)
                </div>
                <button onClick={() => setShowLogoutConfirm(true)} className="block w-full text-left px-4 py-3 text-sm text-error hover:bg-error-light rounded-lg min-h-[44px]">Sign out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg min-h-[44px] flex items-center" onClick={() => setMenuOpen(false)}>Login</Link>
                <Button asChild variant="primary" width="full" className="mx-4" onClick={() => setMenuOpen(false)}>
                  <Link href="/register">Register</Link>
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Logout confirmation modal */}
      <ConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Sign out?"
        description="Are you sure you want to sign out?"
        confirmText="Sign out"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleLogout}
      />
    </nav>
  );
}