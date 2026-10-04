'use client';

import { StaggerList, StaggerItem, HoverLift } from '@/lib/motion';
import type { StructuredCareerRecommendation } from '@/types/career';

interface RecommendationListProps {
  recommendations: StructuredCareerRecommendation[];
}

export function RecommendationList({ recommendations }: RecommendationListProps) {
  if (recommendations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
        <p className="text-sm font-medium text-slate-500">No recommendations yet.</p>
        <p className="mt-2 text-xs text-slate-400">Complete your career profile and set a target role to get AI-powered suggestions.</p>
      </div>
    );
  }

  return (
    <StaggerList className="grid gap-4">
      {recommendations.map((rec) => (
        <StaggerItem key={rec.id}>
          <HoverLift>
            <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-slate-200 hover:shadow-md">
              <div className="flex items-start gap-4">
                <span className={`mt-0.5 flex-shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                  rec.priority === 'high' ? 'bg-red-50 text-red-700' : 
                  rec.priority === 'medium' ? 'bg-amber-50 text-amber-700' : 
                  'bg-slate-50 text-slate-500'
                }`}>
                  {rec.priority}
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{rec.title}</h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{rec.description}</p>
                  
                  <div className="mt-4 space-y-4">
                    <div className="rounded-xl bg-slate-50 p-3.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Why</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-700">{rec.reason}</p>
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      {rec.skillsToDevelop.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Skills to Develop</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {rec.skillsToDevelop.map((s, idx) => (
                              <span key={idx} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 border border-indigo-100/50">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {rec.evidenceToCreate.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Evidence to Create</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {rec.evidenceToCreate.map((e, idx) => (
                              <span key={idx} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-100/50">{e}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative highlight */}
              <div className={`absolute left-0 top-0 h-full w-1 ${
                rec.priority === 'high' ? 'bg-red-400' : 
                rec.priority === 'medium' ? 'bg-amber-400' : 
                'bg-slate-300'
              }`} />
            </div>
          </HoverLift>
        </StaggerItem>
      ))}
    </StaggerList>
  );
}
