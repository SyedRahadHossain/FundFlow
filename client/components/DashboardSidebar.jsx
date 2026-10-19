'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';

// Element focused before the mobile drawer opened; restored on close.
let lastFocused = null;

const roleEmoji = {
  supporter: '💳',
  creator: '📈',
  admin: '⚙️',
};

const navItems = {
  supporter: [
    { href: '/dashboard/supporter-home', label: 'Home', icon: '🏠' },
    { href: '/dashboard/explore', label: 'Explore Campaigns', icon: '🔍' },
    { href: '/dashboard/my-contributions', label: 'My Contributions', icon: '💳', countKey: 'pendingContributions' },
    { href: '/dashboard/purchase-credit', label: 'Purchase Credit', icon: '💎' },
    { href: '/dashboard/payment-history', label: 'Payment History', icon: '📄' },
  ],
  creator: [
    { href: '/dashboard/creator-home', label: 'Home', icon: '🏠' },
    { href: '/dashboard/add-campaign', label: 'Add Campaign', icon: '➕' },
    { href: '/dashboard/my-campaigns', label: 'My Campaigns', icon: '📋' },
    { href: '/dashboard/contributions-review', label: 'Contributions Review', icon: '✅', countKey: 'pendingContributions' },
    { href: '/dashboard/withdrawals', label: 'Withdrawals', icon: '💵', countKey: 'pendingWithdrawals' },
    { href: '/dashboard/creator-payment-history', label: 'Payment History', icon: '📄' },
  ],
  admin: [
    { href: '/dashboard/admin-home', label: 'Home', icon: '📊' },
    { href: '/dashboard/campaign-approvals', label: 'Campaign Approvals', icon: '✅', countKey: 'pendingCampaigns' },
    { href: '/dashboard/withdrawal-requests', label: 'Withdrawals', icon: '💵', countKey: 'pendingWithdrawals' },
    { href: '/dashboard/manage-users', label: 'Manage Users', icon: '👥' },
    { href: '/dashboard/manage-campaigns', label: 'Manage Campaigns', icon: '📋' },
    { href: '/dashboard/reports', label: 'Reports', icon: '🚩' },
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
    const interval = setInterval(fetchCounts, 30000); // Poll every 30s like notifications
    return () => clearInterval(interval);
  }, [user]);

  // Mobile drawer: Escape closes it, and focus moves in on open and back on close.
  // The desktop rail does not mount this effect because mobileOpen stays false there.
  useEffect(() => {
    if (!mobileOpen) return;

    lastFocused = document.activeElement;
    drawerRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
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

  const items = navItems[user?.role] || [];
  const roleEmojiChar = roleEmoji[user?.role] || '👤';

  const getCount = (countKey) => {
    if (!countKey) return null;
    return counts[countKey] || 0;
  };

  const content = (
    <div className="flex flex-col h-full bg-surface border-r border-neutral-100">
      {/* Brand — links home, per the logged-in navbar spec (Logo → home) */}
      <Link
        href="/"
        onClick={onClose}
        aria-label="FundFlow home"
        className="flex items-center gap-3 px-5 py-5 border-b border-neutral-100 group"
      >
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center transition-colors group-hover:bg-primary-hover">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <span className="font-bold text-lg text-primary">FundFlow</span>
      </Link>

      {/* User chip */}
      <div className="px-4 py-4 border-b border-neutral-100">
        <div className="flex items-center gap-3 bg-primary-light rounded-xl px-3 py-2">
          <Avatar
            src={profile?.photo_url}
            name={displayName}
            alt={displayName}
            size="sm"
            className="bg-primary-medium text-primary-dark"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-neutral-900 truncate" title={displayName}>{displayName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-3 h-3 flex items-center justify-center text-lg" aria-hidden="true">{roleEmojiChar}</span>
              <span className="text-xs text-primary font-medium capitalize">{roleLabels[user?.role] || user?.role}</span>
              {profile?.name && (
                <span className="text-[11px] text-neutral-500 truncate" title={user?.email}>{user?.email}</span>
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
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative',
                active
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-primary'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <span className="w-5 h-5 flex items-center justify-center text-lg flex-shrink-0" aria-hidden="true">{item.icon}</span>
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
      <div className="px-3 py-4 border-t border-neutral-100">
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
            'text-error hover:bg-error-light'
          )}
        >
          <span className="w-5 h-5 flex items-center justify-center text-lg flex-shrink-0" aria-hidden="true">🚪</span>
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
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
            className="relative w-64 h-full shadow-xl"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              className="lg:hidden absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-100"
            >
              <span aria-hidden="true">✕</span>
            </button>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}