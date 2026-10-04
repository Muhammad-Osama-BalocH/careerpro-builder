'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageTransition, SectionReveal, StaggerList, StaggerItem, HoverLift, HoverScale } from '@/lib/motion';
import { motion } from 'motion/react';

const steps = [
  {
    label: 'Build',
    number: '01',
    description: 'Create a professional portfolio with AI assistance.',
    detail: 'Import your resume, generate polished copy, and choose from modern templates — all in minutes.',
  },
  {
    label: 'Prove',
    number: '02',
    description: 'Turn your real portfolio work into skill evidence.',
    detail: 'Every skill mapped to real projects and experience. No claims without proof.',
  },
  {
    label: 'Improve',
    number: '03',
    description: 'Get AI-powered recommendations for your next career step.',
    detail: 'Career readiness scoring, gap analysis, and actionable next steps — tailored to your data.',
  },
];

/* ── Product preview mockup ── */
function CareerPreview() {
  const categories = [
    { label: 'Skills', score: 82, color: 'bg-emerald-500' },
    { label: 'Projects', score: 75, color: 'bg-amber-500' },
    { label: 'Evidence', score: 80, color: 'bg-emerald-500' },
    { label: 'Career Gaps', score: 68, color: 'bg-amber-500' },
  ];

  return (
    <div className="rounded-cp-lg border border-stone-200/80 bg-white p-5 shadow-cp-md">
      <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
        <div className="relative flex h-14 w-14 shrink-0">
          <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke="#f5f5f4" strokeWidth="4" />
            <circle
              cx="28" cy="28" r="24"
              fill="none"
              stroke="#059669"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 24}`}
              strokeDashoffset={`${2 * Math.PI * 24 * (1 - 0.78)}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold tabular-nums text-stone-900">78</span>
            <span className="text-[8px] text-stone-400">/ 100</span>
          </div>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-stone-900">Career Readiness</p>
          <p className="text-[11px] text-stone-400">Based on your portfolio data</p>
        </div>
      </div>
      <div className="space-y-3 pt-4">
        {categories.map((cat) => (
          <div key={cat.label}>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-stone-600">{cat.label}</span>
              <span className="text-[12px] font-semibold tabular-nums text-stone-800">{cat.score}</span>
            </div>
            <div className="mt-1 h-1 w-full rounded-full bg-stone-100">
              <div
                className={`h-1 rounded-full ${cat.color}`}
                style={{ width: `${cat.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <PageTransition>
      <main className="overflow-x-hidden">
        {/* ═══ HERO ═══ */}
        <section className="relative">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20 lg:py-28">
            <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
              {/* Copy */}
              <div className="max-w-xl">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.08 } },
                  }}
                >
                  <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } } }}>
                    <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <span className="text-[12px] font-medium text-stone-500">AI-powered career portfolio</span>
                    </div>
                  </motion.div>

                  <motion.h1
                    className="t-display mt-6"
                    variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } }}
                  >
                    Your career,<br />with proof.
                  </motion.h1>

                  <motion.p
                    className="t-muted mt-5 max-w-md text-[15px] leading-7"
                    variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 } } }}
                  >
                    Build a portfolio, prove your skills with real evidence, and discover what to improve next.
                  </motion.p>

                  <motion.div
                    className="mt-8 flex flex-col gap-3 sm:flex-row"
                    variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.15 } } }}
                  >
                    <HoverLift>
                      <Button asChild size="lg" className="px-6 text-[14px] font-semibold">
                        <Link href="/builder">Build My Career Portfolio</Link>
                      </Button>
                    </HoverLift>
                    <HoverLift>
                      <Button asChild size="lg" variant="outline" className="px-6 text-[14px] font-medium">
                        <Link href="/career">Explore Career Intelligence</Link>
                      </Button>
                    </HoverLift>
                  </motion.div>
                </motion.div>
              </div>

              {/* Product preview */}
              <div className="relative mx-auto w-full max-w-sm lg:mx-0 lg:max-w-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
                  className="absolute -inset-4 rounded-2xl bg-gradient-to-br from-amber-50/50 via-stone-50 to-transparent"
                />
                <HoverScale className="relative">
                  <CareerPreview />
                </HoverScale>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ FEATURE STORY ═══ */}
        <section className="border-t border-stone-100">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20 lg:py-24">
            <SectionReveal>
              <div className="max-w-lg">
                <p className="t-label text-amber-700">How it works</p>
                <h2 className="t-h1 mt-3">
                  Build → Prove → Improve
                </h2>
                <p className="t-muted mt-3">
                  Three steps to a career-ready portfolio backed by real evidence.
                </p>
              </div>
            </SectionReveal>

            <StaggerList className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {steps.map((step) => (
                <StaggerItem key={step.label}>
                  <HoverLift className="h-full">
                    <div className="group h-full rounded-cp-lg border border-stone-200/80 bg-white p-6 transition-all duration-cp hover:border-stone-300 hover:shadow-cp-md">
                      <div className="flex items-center justify-between">
                        <span className="t-label text-amber-700">{step.label}</span>
                        <span className="font-mono text-[11px] text-stone-300">{step.number}</span>
                      </div>
                      <p className="mt-4 text-[15px] font-semibold leading-snug text-stone-900">{step.description}</p>
                      <p className="mt-2 text-[13px] leading-6 text-stone-500">{step.detail}</p>
                    </div>
                  </HoverLift>
                </StaggerItem>
              ))}
            </StaggerList>
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section className="border-t border-stone-100 bg-white">
          <SectionReveal>
            <div className="mx-auto max-w-6xl px-5 py-14 text-center sm:px-6 sm:py-20">
              <h2 className="t-h2">Ready to prove your career?</h2>
              <p className="t-muted mx-auto mt-3 max-w-sm">
                Start free. Your portfolio, your evidence, your career.
              </p>
              <div className="mt-6">
                <HoverLift>
                  <Button asChild size="lg" className="px-8 text-[14px] font-semibold">
                    <Link href="/builder">Get Started</Link>
                  </Button>
                </HoverLift>
              </div>
            </div>
          </SectionReveal>
        </section>
      </main>
    </PageTransition>
  );
}
