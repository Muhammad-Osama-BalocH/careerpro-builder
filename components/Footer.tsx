'use client';

import Link from 'next/link';
import { useState } from 'react';

// ─── Icons ───
const Icon = {
  Github: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.4-5.25 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  ),
  Twitter: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  Linkedin: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  ArrowUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
      <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Sparkle: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />
    </svg>
  ),
};

const PRODUCT_LINKS = [
  { label: 'Portfolio Builder', href: '/builder' },
  { label: 'Career Intelligence', href: '/career' },
  { label: 'Dashboard', href: '/dashboard' },
];

const COMPANY_LINKS = [
  { label: 'Sign In', href: '/login' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

const SOCIAL_LINKS = [
  { name: 'GitHub', href: 'https://github.com', Icon: Icon.Github },
  { name: 'Twitter', href: 'https://twitter.com', Icon: Icon.Twitter },
  { name: 'LinkedIn', href: 'https://linkedin.com', Icon: Icon.Linkedin },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 3000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-white/10 bg-[#0B0F19]">
      {/* Background Glow Effects */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[600px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-purple-600/10 blur-[100px]" />

      <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:py-20">

        {/* Top Section */}
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          
          {/* Brand */}
          <div>
            <Link href="/" className="group inline-flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/30 transition group-hover:scale-105">
                <Icon.Sparkle />
              </span>
              <span className="text-2xl font-bold tracking-tight text-white">
                CareerProof
              </span>
            </Link>

            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-slate-400">
              AI-powered platform to build professional portfolios, generate career evidence,
              and identify gaps to accelerate your career growth.
            </p>

            {/* Social */}
            <div className="mt-8 flex gap-3">
              {SOCIAL_LINKS.map(({ name, href, Icon: IconComp }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:bg-indigo-500/20 hover:text-white hover:shadow-lg hover:shadow-indigo-500/20"
                >
                  <IconComp />
                </a>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-8">
            <h4 className="text-sm font-semibold tracking-wide text-white">
              Stay in the loop
            </h4>
            <p className="mt-2 text-sm text-slate-400">
              Product updates, career tips & early access to new features.
            </p>

            <form onSubmit={handleSubscribe} className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-[#0B0F19] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              />
              <button
                type="submit"
                className="shrink-0 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:brightness-110 hover:shadow-indigo-500/40 active:scale-[0.98]"
              >
                {subscribed ? '✓ Subscribed' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        {/* Links Section */}
        <div className="mt-16 grid gap-10 border-t border-white/10 pt-12 sm:grid-cols-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">
              Product
            </h4>
            <ul className="mt-5 space-y-3.5">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center text-sm text-slate-400 transition hover:text-white"
                  >
                    <span className="mr-0 h-px w-0 bg-indigo-400 transition-all duration-300 group-hover:mr-2.5 group-hover:w-3" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">
              Company
            </h4>
            <ul className="mt-5 space-y-3.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center text-sm text-slate-400 transition hover:text-white"
                  >
                    <span className="mr-0 h-px w-0 bg-indigo-400 transition-all duration-300 group-hover:mr-2.5 group-hover:w-3" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">
              Legal
            </h4>
            <ul className="mt-5 space-y-3.5">
              <li>
                <Link href="/privacy" className="group inline-flex items-center text-sm text-slate-400 transition hover:text-white">
                  <span className="mr-0 h-px w-0 bg-indigo-400 transition-all duration-300 group-hover:mr-2.5 group-hover:w-3" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="group inline-flex items-center text-sm text-slate-400 transition hover:text-white">
                  <span className="mr-0 h-px w-0 bg-indigo-400 transition-all duration-300 group-hover:mr-2.5 group-hover:w-3" />
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-5 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} CareerProof. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            <span className="hidden text-xs text-slate-500 sm:inline">
              Made with ❤️ for ambitious builders
            </span>

            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Back to top"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-all hover:-translate-y-1 hover:border-indigo-500/50 hover:bg-indigo-500/20 hover:text-white"
            >
              <Icon.ArrowUp />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}