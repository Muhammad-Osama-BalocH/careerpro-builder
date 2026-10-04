'use client';

import type { CareerReadiness } from '@/lib/careerScoring';

export function CareerScore({ readiness }: { readiness: CareerReadiness }) {
  const scoreColor =
    readiness.overall >= 75 ? 'text-emerald-600' :
    readiness.overall >= 50 ? 'text-amber-600' :
    readiness.overall >= 25 ? 'text-orange-600' : 'text-red-500';

  const ringColor =
    readiness.overall >= 75 ? 'stroke-emerald-500' :
    readiness.overall >= 50 ? 'stroke-amber-500' :
    readiness.overall >= 25 ? 'stroke-orange-500' : 'stroke-red-400';

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (readiness.overall / 100) * circumference;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/50">
      <div className="flex flex-col items-center px-6 pb-6 pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Career Readiness</p>
        <div className="relative mt-5 h-36 w-36">
          <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="7" />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              className={ringColor}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold tabular-nums ${scoreColor}`}>{readiness.overall}</span>
            <span className="text-[11px] font-medium text-slate-400">/ 100</span>
          </div>
        </div>
      </div>

      <div className="space-y-0 border-t border-slate-100">
        {readiness.categories.map((cat) => (
          <div key={cat.label} className="border-b border-slate-50 px-6 py-3.5 last:border-b-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">{cat.label}</span>
              <span className="text-sm font-semibold tabular-nums text-slate-900">{cat.score}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  cat.score >= 75 ? 'bg-emerald-500' :
                  cat.score >= 50 ? 'bg-amber-500' :
                  cat.score >= 25 ? 'bg-orange-400' : 'bg-red-400'
                }`}
                style={{ width: `${Math.max(cat.score, 2)}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{cat.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
