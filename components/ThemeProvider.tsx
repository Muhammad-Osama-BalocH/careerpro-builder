'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { STORAGE_KEY } from '@/lib/theme';

/**
 * Syncs the `dark` and `dim` classes on <html> whenever the resolved theme changes.
 * - "dark" theme → adds `dark` class
 * - "dim" theme → adds `dark` + `dim` classes
 * - "light" theme → removes both
 * - "system" → follows OS preference
 *
 * This ensures Tailwind's `dark:` prefix works for both dark and dim themes,
 * and the CSS variable overrides in `.dim` are applied.
 */
function ThemeClassSync({ children }: { children: React.ReactNode }) {
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'dim');

    const effective = theme === 'system' ? resolvedTheme : theme;

    if (effective === 'dark') {
      root.classList.add('dark');
    } else if (effective === 'dim') {
      root.classList.add('dark', 'dim');
    }
  }, [theme, resolvedTheme]);

  // Listen for OS theme changes when in system mode
  useEffect(() => {
    if (theme !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const root = document.documentElement;
      root.classList.remove('dark', 'dim');
      if (e.matches) root.classList.add('dark');
    };

    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return <>{children}</>;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      storageKey={STORAGE_KEY}
      themes={['light', 'dark', 'dim', 'system']}
      enableSystem
      disableTransitionOnChange={false}
    >
      <ThemeClassSync>{children}</ThemeClassSync>
    </NextThemesProvider>
  );
}
