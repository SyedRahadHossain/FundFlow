'use client';

import { useEffect, useId } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const roleHome = {
  supporter: '/dashboard/supporter-home',
  creator:   '/dashboard/creator-home',
  admin:     '/dashboard/admin-home',
};

export default function DashboardIndex() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace(roleHome[user.role] || '/dashboard/supporter-home');
  }, [user, loading, router]);

  // Keep a spinner on screen until the role redirect lands, so the page never
  // flashes blank.
  return (
    <div className="min-h-[50vh] flex items-center justify-center" role="status" aria-live="polite">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" style={{ animationDuration: '1s' }} />
      <span className="sr-only">Loading your dashboard…</span>
    </div>
  );
}
