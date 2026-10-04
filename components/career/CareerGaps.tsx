'use client';

import { StaggerList, StaggerItem, HoverLift } from '@/lib/motion';
import type { CareerGapAnalysis } from '@/types/career';

interface CareerGapsProps {
  analysis: CareerGapAnalysis;
}

export function CareerGaps({ analysis }: CareerGapsProps) {
  const priorityStyles: Record<string, string> = {
    high: 'bg-red-50 text-red-700 border-red-100',
    medium: 'bg-amber-50 text-amber-700 border-amber-100',
    low: 'bg-slate-50 text-slate-500 border-slate-100',
  };

  const statusStyles: Record<string, string> = {
    missing: 'bg-red-100 text-red-700',
    weak_evidence: 'bg-amber-100 text-amber-700',
    developing: 'bg-blue-100 text-blue-700',
    demonstrated: 'bg-emerald-100 text-emerald-700',
  };

  if (analysis.gaps.length === 0) {
    if (!analysis.targetRole) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">Set a target career to identify skill gaps.</p>
          <p className="mt-1 text-xs text-slate-400">Add a target role in your Career Profile.</p>
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-8 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-xl">🌟</div>
        <p className="mt-4 text-sm font-bold text-emerald-700">No skill gaps detected for {analysis.targetRole}.</p>
        <p className="mt-1 text-xs text-emerald-600">Your profile is looking exceptionally strong!</p>
      </div>
    );
  }

  return (
    <StaggerList className="grid gap-3">
      {analysis.gaps.map((gap) => (
        <StaggerItem key={gap.skill}>
          <HoverLift>
            <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-slate-200 hover:shadow-md">
              <div className="flex items-start gap-4">
                <span className={`mt-0.5 flex-shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${priorityStyles[gap.priority]}`}>
                  {gap.priority}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{gap.skill}</h4>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusStyles[gap.status]}`}>
                      {gap.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">{gap.missingEvidence}</p>
                  <div className="mt-3 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>Current: {gap.currentEvidenceLevel} evidence</span>
                    <span className="text-slate-200">•</span>
                    <span>Required: {gap.requiredEvidenceLevel}</span>
                  </div>
                </div>
              </div>
              
              <div className={`absolute left-0 top-0 h-full w-1 ${
                gap.priority === 'high' ? 'bg-red-400' : 
                gap.priority === 'medium' ? 'bg-amber-400' : 
                'bg-slate-300'
              }`} />
            </div>
          </HoverLift>
        </StaggerItem>
      ))}
    </StaggerList>
  );
}
