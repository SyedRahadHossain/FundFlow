'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { subscribePoller } from '@/lib/poller';
import { cn } from '@/lib/utils';
import Icon from '@/components/ui/Icon';

// One meaning, one glyph: the bell and the notification kinds take their
// icons from the registry like every other surface in the product.
const typeIcon = {
  contribution: 'credits',
  approval: 'approve',
  rejection: 'reject',
  withdrawal: 'payouts',
  system: 'warning',
  comment: 'message',
};

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const buttonRef = useRef(null);

  // Close on outside click, and on Escape for keyboard users. Focus returns to
  // the bell so the panel is never a dead end.
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      setOpen((wasOpen) => {
        if (wasOpen) buttonRef.current?.focus();
        return false;
      });
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const fetchNotes = async () => {
    if (!user) return;
    try {
      const res = await api.get('/api/notifications');
      setNotes(res.data);
      setUnread(res.data.filter(n => !n.read).length);
    } catch { /* silent */ }
  };

  // Poll for new notifications on the app's shared 30s tick. The bell used to
  // own a second interval of its own, so the dashboard ran two timers and both
  // kept firing in background tabs.
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const fetchAndSet = async () => {
      if (!user) return;
      try {
        const res = await api.get('/api/notifications');
        if (mounted) {
          setNotes(res.data);
          setUnread(res.data.filter(n => !n.read).length);
        }
      } catch { /* silent */ }
    };
    fetchAndSet();
    const unsubscribe = subscribePoller(fetchAndSet);
    return () => { mounted = false; unsubscribe(); };
  }, [user]);

  const handleToggle = () => {
    if (!open) {
      setLoading(true);
      fetchNotes().finally(() => setLoading(false));
    }
    if (!open) setUnread(0); // mark as read on open
    setOpen(o => !o);
  };

  const markAllRead = async () => {
    try {
      await api.post('/api/notifications/mark-all-read');
      setNotes(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch {
      // Silent fail - not critical
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={cn(
          'relative w-11 h-11 rounded-xl flex items-center justify-center',
          'text-neutral-500 hover:bg-neutral-100 transition-colors',
          'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2'
        )}
        aria-label={unread > 0 ? `${unread} unread notifications` : 'Notifications'}
        aria-expanded={open}
      >
        <Icon name="notifications" className="w-5 h-5" />
        {unread > 0 && (
          <span className={cn(
            'absolute -top-0.5 -right-0.5 w-5 h-5 bg-error text-white text-xs font-bold rounded-full flex items-center justify-center',
            'animate-scale-in'
          )}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        /* On a phone the panel is a sheet under the top bar, not a dropdown
           hanging off a bell: a 352px panel anchored to the top-right corner
           runs off the left edge of a 360px screen. From sm up it stays a
           dropdown under the bell. */
        <div className="fixed left-4 right-4 top-16 z-50 overflow-hidden rounded-2xl border border-neutral-200 bg-surface shadow-xl animate-fade-in sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-88 sm:max-w-[calc(100vw-1.5rem)]">
          <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-neutral-900">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center min-h-11 text-[13px] text-primary hover:underline font-medium"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="py-6 text-center text-sm text-neutral-500">
                <svg className="w-5 h-5 mx-auto mb-2 animate-spin text-primary" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading…
              </div>
            )}
            {!loading && notes.length === 0 && (
              <div className="py-10 text-center">
                <Icon name="notifications" className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
                <p className="text-sm text-neutral-500">No notifications yet</p>
                <p className="text-[13px] text-neutral-500 mt-1">You&apos;ll see updates about your campaigns here</p>
              </div>
            )}
            {!loading && notes.map((n, i) => (
              <div
                key={i}
                className={cn(
                  'px-4 py-3 border-b border-neutral-50 hover:bg-neutral-50 transition-colors',
                  !n.read && 'bg-primary-light/30'
                )}
              >
                <div className="flex gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    n.type === 'contribution' && 'bg-success-light text-success',
                    n.type === 'approval' && 'bg-primary-light text-primary',
                    n.type === 'rejection' && 'bg-error-light text-error',
                    n.type === 'withdrawal' && 'bg-warning-light text-warning-dark',
                    n.type === 'system' && 'bg-info-light text-info',
                    n.type === 'comment' && 'bg-accent-light text-accent'
                  )}>
                    <Icon name={typeIcon[n.type] || 'notifications'} className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-700">{n.message}</p>
                    <p className="text-[13px] text-neutral-500 mt-1">
                      {new Date(n.time).toLocaleString()}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" aria-label="Unread" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}