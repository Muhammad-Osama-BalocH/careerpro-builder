'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/builder', label: 'Portfolio' },
  { href: '/career', label: 'Career' },
  { href: '/dashboard', label: 'Dashboard' },
];

export function Navbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    if (auth && isFirebaseConfigured) {
      await signOut(auth);
    }
    // Clear the server-side session cookie
    await fetch('/api/auth/session', { method: 'DELETE' });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--cp-border-subtle)] bg-[var(--cp-surface)]/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-2.5 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-1.5 text-[var(--cp-text)] transition-opacity hover:opacity-70">
          <span className="text-[14px] font-bold tracking-tight">CareerProof</span>
          <span className="t-label rounded-sm bg-[var(--cp-accent-subtle)] px-1.5 py-0.5 text-[var(--cp-accent-text)]">AI</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-0.5 md:flex">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative rounded-cp px-3 py-1.5 text-[13px] font-medium transition-colors duration-cp ${
                  active
                    ? 'text-[var(--cp-text)]'
                    : 'text-[var(--cp-text-muted)] hover:text-[var(--cp-text-secondary)]'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-cp bg-[var(--cp-surface-overlay)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Desktop right side */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeSwitcher />
          {user ? (
            <>
              <span className="max-w-[160px] truncate text-[12px] text-[var(--cp-text-muted)]">{user.email}</span>
              <button
                type="button"
                onClick={() => { void handleSignOut(); }}
                className="rounded-cp border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-1.5 text-[12px] font-medium text-[var(--cp-text-secondary)] transition-colors duration-cp hover:border-[var(--cp-border-hover)] hover:bg-[var(--cp-surface-raised)] hover:text-[var(--cp-text)]"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-cp bg-[var(--cp-text)] px-4 py-1.5 text-[13px] font-medium text-[var(--cp-bg)] transition-colors duration-cp hover:opacity-90"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeSwitcher />
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-cp text-[var(--cp-text-muted)] transition-colors hover:bg-[var(--cp-surface-raised)]"
            aria-label="Toggle navigation"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            {mobileOpen ? (
              <>
                <line x1="3" y1="3" x2="13" y2="13" />
                <line x1="13" y1="3" x2="3" y2="13" />
              </>
            ) : (
              <>
                <line x1="2.5" y1="4" x2="13.5" y2="4" />
                <line x1="2.5" y1="8" x2="13.5" y2="8" />
                <line x1="2.5" y1="12" x2="13.5" y2="12" />
              </>
            )}
          </svg>
        </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-[var(--cp-border-subtle)] bg-[var(--cp-surface)] md:hidden"
          >
            <div className="space-y-0.5 px-5 py-3">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded-cp px-3 py-2 text-[13px] font-medium transition-colors duration-cp ${
                      active ? 'bg-[var(--cp-surface-overlay)] text-[var(--cp-text)]' : 'text-[var(--cp-text-muted)] hover:bg-[var(--cp-surface-overlay)] hover:text-[var(--cp-text-secondary)]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <div className="border-t border-[var(--cp-border-subtle)] pt-2.5">
                {user ? (
                  <div className="space-y-1">
                    <p className="truncate px-3 text-[12px] text-[var(--cp-text-muted)]">{user.email}</p>
                    <button
                      type="button"
                      onClick={() => { void handleSignOut(); setMobileOpen(false); }}
                      className="block w-full rounded-cp px-3 py-2 text-left text-[13px] font-medium text-[var(--cp-text-secondary)] transition-colors hover:bg-[var(--cp-surface-overlay)] hover:text-[var(--cp-text)]"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-cp bg-[var(--cp-text)] px-3 py-2 text-center text-[13px] font-medium text-[var(--cp-bg)] transition-colors hover:opacity-90"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
