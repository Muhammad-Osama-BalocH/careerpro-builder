'use client';

import { StaggerList, StaggerItem, HoverLift } from '@/lib/motion';
import type { CareerEvidence } from '@/types/career';

interface SkillEvidenceListProps {
  evidence: CareerEvidence[];
}

export function SkillEvidenceList({ evidence }: SkillEvidenceListProps) {
  if (evidence.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
        <p className="text-sm font-medium text-slate-500">No career evidence yet.</p>
        <p className="mt-2 text-xs text-slate-400">Click &quot;Build Evidence&quot; to scan your portfolio for skill demonstrations.</p>
      </div>
    );
  }

  const groups = getSkillGroups(evidence);

  return (
    <StaggerList className="grid gap-4 sm:grid-cols-2">
      {groups.map((group) => (
        <StaggerItem key={group.skill}>
          <HoverLift>
            <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-slate-200 hover:shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-bold text-slate-800">{group.skill}</span>
                  <StrengthBadge strength={group.bestStrength} />
                </div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{group.items.length} records</span>
              </div>
              
              <div className="space-y-2.5 flex-1">
                {group.items.map((ev) => (
                  <div key={ev.id} className="group relative flex items-start gap-3 rounded-xl bg-slate-50/50 p-3 transition-colors hover:bg-slate-50">
                    <SourceIcon type={ev.sourceType} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-slate-700 truncate">{ev.sourceTitle}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 line-clamp-2">{ev.evidenceText}</p>
                    </div>
                    <StrengthIndicator strength={ev.evidenceStrength} />
                  </div>
                ))}
              </div>
            </div>
          </HoverLift>
        </StaggerItem>
      ))}
    </StaggerList>
  );
}

function getSkillGroups(evidence: CareerEvidence[]) {
  const map = new Map<string, { skill: string; items: CareerEvidence[]; bestStrength: CareerEvidence['evidenceStrength'] }>();
  const strengthOrder: Record<CareerEvidence['evidenceStrength'], number> = { strong: 3, moderate: 2, weak: 1 };
  
  for (const ev of evidence) {
    const key = ev.skill.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.items.push(ev);
      if (strengthOrder[ev.evidenceStrength] > strengthOrder[existing.bestStrength]) {
        existing.bestStrength = ev.evidenceStrength;
      }
    } else {
      map.set(key, { skill: ev.skill, items: [ev], bestStrength: ev.evidenceStrength });
    }
  }
  
  return Array.from(map.values()).sort((a, b) => {
    const diff = strengthOrder[b.bestStrength] - strengthOrder[a.bestStrength];
    return diff !== 0 ? diff : b.items.length - a.items.length;
  });
}

function StrengthBadge({ strength }: { strength: CareerEvidence['evidenceStrength'] }) {
  const styles = {
    strong: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    moderate: 'bg-amber-50 text-amber-700 border-amber-100',
    weak: 'bg-slate-50 text-slate-500 border-slate-100',
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${styles[strength]}`}>
      {strength}
    </span>
  );
}

function SourceIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    project: 'bg-blue-500', experience: 'bg-emerald-500', education: 'bg-amber-500', certificate: 'bg-indigo-500', portfolio: 'bg-slate-500',
  };
  return <div className={`mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full ${icons[type] || 'bg-slate-300'}`} />;
}

function StrengthIndicator({ strength }: { strength: string }) {
  const colors: Record<string, string> = { strong: 'bg-emerald-500', moderate: 'bg-amber-500', weak: 'bg-slate-200' };
  return <div className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${colors[strength]}`} />;
}
