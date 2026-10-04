'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { DerivedSkillIntelligence, SkillEvidenceReport } from '@/types/career';
import { findSkillEvidenceReport } from '@/lib/evidenceIntelligence';
import { StaggerList, StaggerItem } from '@/lib/motion';

interface SkillIntelligenceListProps {
  skills: DerivedSkillIntelligence[];
  reports: SkillEvidenceReport[];
}

export function SkillIntelligenceList({ skills, reports }: SkillIntelligenceListProps) {
  if (skills.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl">🧠</div>
        <p className="mt-4 text-sm font-medium text-slate-500">Build evidence first to see skill intelligence.</p>
      </div>
    );
  }

  return (
    <StaggerList className="grid gap-3">
      {skills.map((skill) => (
        <StaggerItem key={skill.name}>
          <SkillRow 
            skill={skill} 
            report={findSkillEvidenceReport(reports, skill.name)} 
          />
        </StaggerItem>
      ))}
    </StaggerList>
  );
}

function SkillRow({ skill, report }: { skill: DerivedSkillIntelligence; report?: SkillEvidenceReport | null }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const strengthStyles: Record<DerivedSkillIntelligence['strengthLevel'], string> = {
    advanced: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    strong: 'bg-blue-50 text-blue-700 border-blue-100',
    developing: 'bg-amber-50 text-amber-700 border-amber-100',
    emerging: 'bg-slate-50 text-slate-500 border-slate-100',
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-all hover:border-slate-200">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-50/50"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="truncate text-sm font-bold text-slate-800">{skill.name}</span>
          <span className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${strengthStyles[skill.strengthLevel]}`}>
            {skill.strengthLevel}
          </span>
          {!skill.explicitlyListed && (
            <span className="flex-shrink-0 rounded-full border border-slate-100 bg-slate-50 px-2 py-0.5 text-[9px] font-medium text-slate-400">
              inferred
            </span>
          )}
        </div>
        <div className="flex items-center gap-5 flex-shrink-0">
          <div className="hidden items-center gap-1.5 sm:flex">
            <span className="text-[11px] font-medium text-slate-400">{skill.evidenceCount} sources</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 w-3 rounded-full ${i < Math.round(skill.confidence / 20) ? 'bg-indigo-400' : 'bg-slate-100'}`} 
                />
              ))}
            </div>
          </div>
          <span className="w-8 text-right text-sm font-bold tabular-nums text-slate-700">{skill.confidence}%</span>
          <motion.span 
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-slate-300"
          >
            ▾
          </motion.span>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-50 bg-slate-50/30"
          >
            <div className="px-5 py-4 space-y-3">
              {report && report.evidence.length > 0 ? (
                report.evidence.map((ev) => (
                  <div key={ev.id} className="flex items-start gap-3 rounded-lg bg-white p-3 shadow-sm">
                    <SourceBadge type={ev.sourceType} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-700">{ev.sourceTitle}</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">{ev.description}</p>
                    </div>
                    <StrengthDot strength={ev.strength} />
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No detailed evidence records found.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SourceBadge({ type }: { type: string }) {
  const icons: Record<string, string> = {
    project: '🔵', experience: '🟢', education: '🟡', certificate: '🏅', portfolio: '⚫',
  };
  return <span className="text-sm" title={type}>{icons[type] || '⚪'}</span>;
}

function StrengthDot({ strength }: { strength: 'strong' | 'moderate' | 'weak' }) {
  const colors: Record<string, string> = { strong: 'bg-emerald-500', moderate: 'bg-amber-500', weak: 'bg-slate-300' };
  return <span className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${colors[strength]}`} title={strength} />;
}
