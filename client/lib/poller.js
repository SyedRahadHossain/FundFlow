'use client';

/**
 * One poller for the whole app.
 *
 * The dashboard used to run two independent 30-second timers — one for the
 * notification bell, one for the sidebar counts — and both kept firing in
 * background tabs. One shared tick, skipped while the tab is hidden, serves
 * every subscriber, and a tab that comes back to the front asks for fresh
 * numbers at once instead of waiting out the rest of the interval.
 */
const SUBSCRIBERS = new Set();
const TICK_MS = 30000;
let timer = null;

function tick() {
  if (typeof document !== 'undefined' && document.hidden) return;
  SUBSCRIBERS.forEach((fn) => {
    try {
      fn();
    } catch {
      // One failed poll must not stop the others.
    }
  });
}

function onVisibilityChange() {
  if (typeof document !== 'undefined' && !document.hidden) tick();
}

export function subscribePoller(fn, intervalMs = TICK_MS) {
  SUBSCRIBERS.add(fn);

  if (timer === null) {
    timer = setInterval(tick, intervalMs);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }
  }

  return () => {
    SUBSCRIBERS.delete(fn);
    if (SUBSCRIBERS.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    }
  };
}
