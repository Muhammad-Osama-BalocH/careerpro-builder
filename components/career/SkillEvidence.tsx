'use client';

import type { SkillEvidenceScore } from '@/lib/careerScoring';

export function SkillEvidence({ scores }: { scores: SkillEvidenceScore[] }) {
  if (scores.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
        <p className="text-sm text-slate-500">No skills to visualize.</p>
        <p className="mt-1 text-xs text-slate-400">Add skills to your portfolio and build evidence.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {scores.map((s) => {
        const barColor =
          s.score >= 70 ? 'bg-green-500' :
          s.score >= 45 ? 'bg-amber-500' :
          s.score >= 20 ? 'bg-orange-400' : 'bg-slate-300';

        return (
          <div key={s.skill} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-800">{s.skill}</span>
              <span className="text-xs text-slate-500">{s.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-slate-100">
                <div
                  className={`h-2 rounded-full transition-all ${barColor}`}
                  style={{ width: `${Math.max(s.score, 2)}%` }}
                />
              </div>
              <span className="w-6 text-right text-xs font-semibold text-slate-600">{s.score}</span>
            </div>
            <p className="text-[10px] text-slate-400">{s.sourceCount} source{s.sourceCount !== 1 ? 's' : ''}</p>
          </div>
        );
      })}
    </div>
  );
}
