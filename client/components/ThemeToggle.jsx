'use client';

import { useTheme } from '@/context/ThemeContext';
import Icon from '@/components/ui/Icon';

/**
 * Light/dark switch. Reads the live theme from context, so it stays correct
 * even when the initial class came from the pre-paint inline script.
 */
export default function ThemeToggle({ className }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={
        'p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 ' +
        'transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ' +
        (className || '')
      }
    >
      {isDark ? (
        // Sun — visible while dark, clicking returns to light
        <Icon name="sun" className="w-5 h-5" />
      ) : (
        // Moon — visible while light, clicking switches to dark
        <Icon name="moon" className="w-5 h-5" />
      )}
    </button>
  );
}
