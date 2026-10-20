'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/Modal';
import Icon from '@/components/ui/Icon';
import api from '@/lib/api';
import { subscribePoller } from '@/lib/poller';

// Element focused before the mobile drawer opened; restored on close.
let lastFocused = null;

// The icon vocabulary lives in components/ui/Icon.jsx, so a meaning has one
// glyph everywhere. The names here are the names there.
const roleIcon = {
  supporter: 'roleSupporter',
  creator: 'roleCreator',
  admin: 'roleAdmin',
};

const navItems = {
  supporter: [
    { href: '/dashboard/supporter-home', label: 'Home', icon: 'home' },
    { href: '/dashboard/explore', label: 'Explore Campaigns', icon: 'explore' },
    { href: '/dashboard/my-contributions', label: 'My Contributions', icon: 'contributions', countKey: 'pendingContributions' },
    { href: '/dashboard/purchase-credit', label: 'Purchase Credits', icon: 'credits' },
    { href: '/dashboard/payment-history', label: 'Payment History', icon: 'history' },
  ],
  creator: [
    { href: '/dashboard/creator-home', label: 'Home', icon: 'home' },
    { href: '/dashboard/add-campaign', label: 'Add Campaign', icon: 'add' },
    { href: '/dashboard/my-campaigns', label: 'My Campaigns', icon: 'campaigns' },
    { href: '/dashboard/contributions-review', label: 'Contributions Review', icon: 'approve', countKey: 'pendingContributions' },
    { href: '/dashboard/withdrawals', label: 'Withdrawals', icon: 'wallet', countKey: 'pendingWithdrawals' },
    { href: '/dashboard/creator-payment-history', label: 'Payment History', icon: 'history' },
  ],
  admin: [
    { href: '/dashboard/admin-home', label: 'Home', icon: 'dashboard' },
    { href: '/dashboard/campaign-approvals', label: 'Campaign Approvals', icon: 'approve', countKey: 'pendingCampaigns' },
    { href: '/dashboard/withdrawal-requests', label: 'Withdrawals', icon: 'wallet', countKey: 'pendingWithdrawals' },
    { href: '/dashboard/manage-users', label: 'Manage Users', icon: 'users' },
    { href: '/dashboard/manage-campaigns', label: 'Manage Campaigns', icon: 'campaigns' },
    { href: '/dashboard/reports', label: 'Reports', icon: 'reports' },
  ],
};

const roleLabels = {
  supporter: 'Supporter',
  creator: 'Creator',
  admin: 'Admin',
};

export default function DashboardSidebar({ mobileOpen, onClose, profile }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [counts, setCounts] = useState({ pendingContributions: 0, pendingWithdrawals: 0, pendingCampaigns: 0 });
  const drawerRef = useRef(null);

  // The JWT carries only { email, role }; the display name arrives separately
  // via /api/auth/me. Fall back to the email until it does.
  const displayName = profile?.name || user?.email || '';

  useEffect(() => {
    if (!user) return;

    const fetchCounts = async () => {
      try {
        const { data } = await api.get('/api/dashboard/counts');
        setCounts({
          pendingContributions: data.pendingContributions || 0,
          pendingWithdrawals: data.pendingWithdrawals || 0,
          pendingCampaigns: data.pendingCampaigns || 0,
        });
      } catch {
        // Counts are an optional enhancement — leave the last known values.
      }
    };

    fetchCounts();
    // The shared poller: one 30s tick for the whole app, skipped while the
    // tab is hidden. The sidebar used to own a timer of its own.
    const unsubscribe = subscribePoller(fetchCounts);
    return () => unsubscribe();
  }, [user]);

  // Mobile drawer: Escape closes it, focus moves in on open and back on close,
  // and Tab stays inside the drawer. An aria-modal dialog that lets focus
  // walk into the page behind it is not modal.
  useEffect(() => {
    if (!mobileOpen) return;

    lastFocused = document.activeElement;
    const drawer = drawerRef.current;
    drawer?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        // Only the drawer closes, and only while the focus is inside it: a
        // dialog opened from the drawer (the sign-out confirmation) is
        // portaled to the body, and Escape belongs to that dialog.
        if (drawer && drawer.contains(e.target)) onClose();
        return;
      }
      if (e.key !== 'Tab' || !drawer) return;

      const focusables = drawer.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first || document.activeElement === drawer) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      lastFocused?.focus();
    };
  }, [mobileOpen, onClose]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // The navbar asks before signing out; the sidebar is where a dashboard user
  // actually leaves from, so it asks too.
  const [confirmLogout, setConfirmLogout] = useState(false);

  const items = navItems[user?.role] || [];
  const roleIconName = roleIcon[user?.role] || 'person';

  const getCount = (countKey) => {
    if (!countKey) return null;
    return counts[countKey] || 0;
  };

  const content = (
    <div className="flex flex-col h-full bg-surface border-r border-neutral-200">
      {/* Brand — links home, per the logged-in navbar spec (Logo → home) */}
      <Link
        href="/"
        onClick={onClose}
        aria-label="FundFlow home"
        className="flex items-center gap-3 px-5 py-5 border-b border-neutral-200 group"
      >
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center transition-colors group-hover:bg-primary-hover">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <span className="font-bold text-lg text-primary">FundFlow</span>
      </Link>

      {/* User chip */}
      <div className="px-4 py-4 border-b border-neutral-200">
        <div className="flex items-center gap-3 bg-primary-light rounded-xl px-3 py-2">
          <Avatar
            src={profile?.photo_url}
            name={displayName}
            alt={displayName}
            size="sm"
            className="bg-primary-medium text-primary-dark"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-neutral-900 truncate" title={displayName}>{displayName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-4.5 h-4.5 flex items-center justify-center" aria-hidden="true"><Icon name={roleIconName} className="w-4.5 h-4.5" /></span>
              <span className="text-[13px] text-primary font-medium capitalize">{roleLabels[user?.role] || user?.role}</span>
              {profile?.name && (
                <span className="text-[13px] text-neutral-500 truncate" title={user?.email}>{user?.email}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Dashboard navigation">
        {items.map(item => {
          const active = pathname === item.href;
          const count = getCount(item.countKey);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 min-h-11 rounded-xl text-sm font-medium transition-[background-color,color] duration-150 relative',
                active
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-primary'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <span className="w-5 h-5 flex items-center justify-center flex-shrink-0"><Icon name={item.icon} className="w-5 h-5" /></span>
              <span className="truncate flex-1">{item.label}</span>
              {count > 0 && (
                <Badge variant="primary" size="sm" className="ml-auto" aria-label={`${count} pending`}>
                  {count > 99 ? '99+' : count}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-neutral-200">
        <button
          onClick={() => setConfirmLogout(true)}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 min-h-11 rounded-xl text-sm font-medium transition-colors',
            'text-error hover:bg-error-light'
          )}
        >
          <span className="w-5 h-5 flex items-center justify-center flex-shrink-0"><Icon name="signout" className="w-5 h-5" /></span>
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <ConfirmDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title="Sign out?"
        description="Are you sure you want to sign out?"
        confirmText="Sign out"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleLogout}
      />

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-fade-in">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
          <aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Dashboard navigation"
            tabIndex={-1}
            className="relative w-64 h-full shadow-xl pt-[env(safe-area-inset-top)]"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              className="lg:hidden absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-100"
            >
              <Icon name="close" className="w-5 h-5" />
            </button>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}