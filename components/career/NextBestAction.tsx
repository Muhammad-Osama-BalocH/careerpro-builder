'use client';

import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import type { CareerProjectIdea } from '@/types/career';

interface NextBestActionProps {
  idea: CareerProjectIdea;
  onViewProject: () => void;
  onGenerateBlueprint?: () => void;
  onGenerateRoadmap?: () => void;
  hasBlueprint: boolean;
  hasRoadmap: boolean;
}

export function NextBestAction({ idea, onViewProject, onGenerateBlueprint, onGenerateRoadmap, hasBlueprint, hasRoadmap }: NextBestActionProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-white shadow-lg shadow-indigo-100/20"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-lg shadow-lg shadow-indigo-200">🚀</span>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600">Next Best Action</p>
        </div>
        
        <div className="mt-6 space-y-4">
          <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">{idea.title}</h3>
          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
            {idea.whyThisProject}
          </p>
          
          <div className="rounded-xl bg-white/60 p-4 backdrop-blur-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Skills you&apos;ll prove:</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {idea.skillsToDemonstrate.map((skill, i) => (
                <span key={i} className="rounded-full bg-indigo-100/50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 pt-2">
            <Button size="lg" onClick={onViewProject} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]">
              View Project Details
            </Button>
            {hasBlueprint && onGenerateBlueprint && (
              <Button size="lg" variant="outline" onClick={onGenerateBlueprint} className="border-indigo-200 bg-white hover:bg-indigo-50">
                Technical Blueprint
              </Button>
            )}
            {hasRoadmap && onGenerateRoadmap && (
              <Button size="lg" variant="outline" onClick={onGenerateRoadmap} className="border-indigo-200 bg-white hover:bg-indigo-50">
                Development Roadmap
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Decorative background element */}
      <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-indigo-100/30 blur-3xl" />
    </motion.div>
  );
}
