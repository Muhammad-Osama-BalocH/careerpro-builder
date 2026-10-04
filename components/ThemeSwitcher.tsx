'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { THEMES, type Theme } from '@/lib/theme';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Avoid hydration mismatch — only render theme-dependent UI after mount
  useEffect(() => setMounted(true), []);

  const currentIcon = mounted
    ? THEMES.find((t) => t.value === theme)?.icon ?? '💻'
    : '💻';

  const handleSelect = useCallback(
    (value: Theme) => {
      setTheme(value);
      setOpen(false);
      buttonRef.current?.focus();
    },
    [setTheme],
  );

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Keyboard navigation inside dropdown
  const handleMenuKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const items = menuRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]',
      );
      if (!items) return;

      const active = document.activeElement;
      const currentIndex = Array.from(items).indexOf(active as HTMLButtonElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = (currentIndex + 1) % items.length;
        items[next].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = (currentIndex - 1 + items.length) % items.length;
        items[prev].focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        (active as HTMLButtonElement)?.click();
      }
    },
    [],
  );

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-cp text-[var(--cp-text-muted)] transition-colors duration-cp hover:bg-[var(--cp-surface-raised)] hover:text-[var(--cp-text)]"
        aria-label="Change theme"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="text-sm" aria-hidden="true">{currentIcon}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Theme options"
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-cp-lg border border-[var(--cp-border)] bg-[var(--cp-surface-raised)] py-1 shadow-cp-lg"
        >
          {THEMES.map((t) => (
            <button
              key={t.value}
              role="menuitem"
              type="button"
              onClick={() => handleSelect(t.value)}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium text-[var(--cp-text)] transition-colors duration-cp hover:bg-[var(--cp-surface-overlay)]"
            >
              <span className="w-5 text-center text-sm" aria-hidden="true">{t.icon}</span>
              <span className="flex-1">{t.label}</span>
              {mounted && theme === t.value && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[var(--cp-accent)]" aria-hidden="true">
                  <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
