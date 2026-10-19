'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotes = async () => {
    if (!user) return;
    try {
      const res = await api.get('/api/notifications');
      setNotes(res.data);
      setUnread(res.data.filter(n => !n.read).length);
    } catch { /* silent */ }
  };

  // Poll every 30s for new notifications
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
    const interval = setInterval(fetchAndSet, 30000);
    return () => { mounted = false; clearInterval(interval); };
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
        onClick={handleToggle}
        className={cn(
          'relative w-10 h-10 rounded-xl flex items-center justify-center',
          'text-neutral-500 hover:bg-neutral-100 transition-colors',
          'focus:outline-none focus:ring-3 focus:ring-primary'
        )}
        aria-label={unread > 0 ? `${unread} unread notifications` : 'Notifications'}
        aria-expanded={open}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className={cn(
            'absolute -top-0.5 -right-0.5 w-5 h-5 bg-error text-white text-[11px] font-bold rounded-full flex items-center justify-center',
            'animate-scale-in'
          )}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-88 bg-surface border border-neutral-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
          <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-neutral-900">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary hover:underline font-medium"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="py-6 text-center text-sm text-neutral-400">
                <svg className="w-5 h-5 mx-auto mb-2 animate-spin text-primary" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading…
              </div>
            )}
            {!loading && notes.length === 0 && (
              <div className="py-10 text-center">
                <svg className="w-12 h-12 mx-auto text-neutral-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-sm text-neutral-500">No notifications yet</p>
                <p className="text-xs text-neutral-400 mt-1">You&apos;ll see updates about your campaigns here</p>
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
                    {n.type === 'contribution' && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a1 1 0 100-2 1 1 0 000 2z" />
                      </svg>
                    )}
                    {n.type === 'approval' && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                    {n.type === 'rejection' && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                    {n.type === 'withdrawal' && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a1 1 0 100-2 1 1 0 000 2z" />
                      </svg>
                    )}
                    {n.type === 'system' && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    )}
                    {n.type === 'comment' && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-700">{n.message}</p>
                    <p className="text-xs text-neutral-400 mt-1">
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