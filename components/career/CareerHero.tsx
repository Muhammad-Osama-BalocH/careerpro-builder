'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';
import type { CareerReadiness, ProfileCompletenessResult } from '@/lib/careerScoring';

interface CareerHeroProps {
  readiness: CareerReadiness;
  completeness: ProfileCompletenessResult;
  summary: string;
}

export function CareerHero({ readiness, completeness, summary }: CareerHeroProps) {
  const readinessLabel = useMemo(() => {
    if (readiness.overall >= 75) return 'Strong position';
    if (readiness.overall >= 50) return 'Good foundation';
    if (readiness.overall >= 25) return 'Building momentum';
    return 'Early stage';
  }, [readiness.overall]);

  const scoreColor = readiness.overall >= 75 ? 'text-emerald-600' : readiness.overall >= 50 ? 'text-amber-600' : readiness.overall >= 25 ? 'text-orange-600' : 'text-red-500';
  const ringColor = readiness.overall >= 75 ? 'stroke-emerald-500' : readiness.overall >= 50 ? 'stroke-amber-500' : readiness.overall >= 25 ? 'stroke-orange-500' : 'stroke-red-400';

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (readiness.overall / 100) * circumference;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* Score Ring */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Career Readiness</p>
        <div className="relative mt-6 h-40 w-40">
          <svg className="h-40 w-40 -rotate-90" viewBox="0 0 120 120" aria-label={`Career readiness score: ${readiness.overall} out of 100`}>
            <circle cx="60" cy="60" r="54" fill="none" stroke="#f1f5f9" strokeWidth="8" />
            <motion.circle
              cx="60" cy="60" r="54"
              fill="none"
              className={ringColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold tabular-nums ${scoreColor}`}>
              {readiness.overall}
            </span>
            <span className="text-xs font-medium text-slate-400">/ 100</span>
          </div>
        </div>
        <p className="mt-4 text-base font-bold text-slate-900">{readinessLabel}</p>
        {summary && <p className="mt-2 text-center text-xs leading-relaxed text-slate-500">{summary}</p>}
      </motion.div>

      {/* Category Scores + Completeness */}
      <div className="space-y-4">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-4">
            {readiness.categories.map((cat, idx) => (
              <div key={cat.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700">{cat.label}</span>
                  <span className="text-xs font-bold tabular-nums text-slate-900">{cat.score}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(cat.score, 2)}%` }}
                    transition={{ duration: 1, delay: 0.2 + idx * 0.1 }}
                    className={`h-full rounded-full ${
                      cat.score >= 75 ? 'bg-emerald-500' : cat.score >= 50 ? 'bg-amber-500' : cat.score >= 25 ? 'bg-orange-400' : 'bg-red-400'
                    }`}
                  />
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">{cat.explanation}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Profile Completeness inline */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">Profile Completeness</span>
            <span className="text-xs font-bold tabular-nums text-indigo-600">{completeness.score}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden mb-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(completeness.score, 2)}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className={`h-full rounded-full ${completeness.score >= 80 ? 'bg-emerald-500' : completeness.score >= 50 ? 'bg-amber-500' : 'bg-orange-400'}`}
            />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {completeness.areas.map((a) => (
              <span key={a.label} className={`flex items-center gap-1.5 text-[11px] ${a.complete ? 'text-slate-500' : 'text-orange-600 font-semibold'}`}>
                <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[10px] ${a.complete ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                  {a.complete ? '✓' : '○'}
                </span>
                {a.label}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
