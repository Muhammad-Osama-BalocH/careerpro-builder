'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { CareerProjectIdea, CareerProjectBlueprint, CareerDevelopmentRoadmap, CareerProjectDocumentationPack } from '@/types/career';

interface ProjectExplorerProps {
  ideas: CareerProjectIdea[];
  selectedIdea: CareerProjectIdea | null;
  onSelectIdea: (idea: CareerProjectIdea) => void;
  isGeneratingIdeas: boolean;
  onGenerateIdeas: () => void;
  targetRole: string;
  blueprint: CareerProjectBlueprint | null;
  isGeneratingBlueprint: boolean;
  onGenerateBlueprint: () => void;
  roadmap: CareerDevelopmentRoadmap | null;
  isGeneratingRoadmap: boolean;
  onGenerateRoadmap: () => void;
  docsPack: CareerProjectDocumentationPack | null;
  isGeneratingDocsPack: boolean;
  onGenerateDocsPack: () => void;
  gaps: number;
}

export function ProjectExplorer({
  ideas,
  selectedIdea,
  onSelectIdea,
  isGeneratingIdeas,
  onGenerateIdeas,
  targetRole,
  blueprint,
  isGeneratingBlueprint,
  onGenerateBlueprint,
  roadmap,
  isGeneratingRoadmap,
  onGenerateRoadmap,
  docsPack,
  isGeneratingDocsPack,
  onGenerateDocsPack,
  gaps,
}: ProjectExplorerProps) {
  return (
    <div className="space-y-6">
      {/* Idea List */}
      <Card className="border-slate-200 overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-bold">💡 Projects to Close Your Career Gaps</CardTitle>
              <p className="text-xs text-slate-500 mt-1">AI-generated project ideas that directly address your skill gaps.</p>
            </div>
            {targetRole && gaps > 0 && (
              <Button
                size="sm"
                onClick={onGenerateIdeas}
                disabled={isGeneratingIdeas}
                className="bg-white text-slate-900 border-slate-200 hover:bg-slate-50"
              >
                {isGeneratingIdeas ? 'Generating…' : ideas.length > 0 ? 'Regenerate Ideas' : 'Generate Ideas'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!targetRole ? (
            <div className="p-12 text-center">
              <p className="text-sm text-slate-500 font-medium">No target career selected.</p>
              <p className="mt-2 text-xs text-slate-400">Set a target role in your Career Profile to get project ideas.</p>
            </div>
          ) : gaps === 0 ? (
            <div className="p-12 text-center bg-emerald-50/30">
              <p className="text-sm text-emerald-700 font-bold">No skill gaps detected — no project ideas needed!</p>
            </div>
          ) : isGeneratingIdeas ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Architecting ideas...</p>
            </div>
          ) : ideas.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {ideas.map((idea, i) => (
                <div 
                  key={idea.id} 
                  className={`p-6 transition-colors hover:bg-slate-50/30 ${selectedIdea?.id === idea.id ? 'bg-indigo-50/30' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <span className={`mt-0.5 flex-shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      idea.priority === 'high' ? 'bg-red-50 text-red-700' : 
                      idea.priority === 'medium' ? 'bg-amber-50 text-amber-700' : 
                      'bg-slate-50 text-slate-500'
                    }`}>
                      {idea.priority}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900">{idea.title}</h4>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{idea.shortDescription}</p>
                      
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Addresses Gap</p>
                          <p className="mt-1 text-xs font-bold text-amber-700">{idea.relatedGap}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Skills to Demonstrate</p>
                          <p className="mt-1 text-xs text-slate-600">{idea.skillsToDemonstrate.join(' · ')}</p>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-end gap-3">
                        <Button
                          size="sm"
                          variant={selectedIdea?.id === idea.id ? 'default' : 'outline'}
                          onClick={() => onSelectIdea(idea)}
                          className={selectedIdea?.id === idea.id ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                        >
                          {selectedIdea?.id === idea.id ? 'Selected ✓' : 'Select Project'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-sm text-slate-500 font-medium">Click &quot;Generate Ideas&quot; to receive project suggestions.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blueprint / Roadmap / Docs */}
      {selectedIdea && (
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedIdea.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Technical Blueprint */}
            <Card className="border-indigo-100 shadow-md">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <span className="text-xl">🏗</span> Technical Blueprint
                    </CardTitle>
                    <p className="text-[11px] font-medium text-indigo-600 uppercase tracking-wider mt-0.5">{selectedIdea.title}</p>
                  </div>
                  {!blueprint && !isGeneratingBlueprint && (
                    <Button size="sm" onClick={onGenerateBlueprint} className="bg-indigo-600 hover:bg-indigo-700">
                      Generate Blueprint ✨
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {isGeneratingBlueprint ? (
                  <div className="flex flex-col items-center gap-3 py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Designing architecture...</p>
                  </div>
                ) : blueprint ? (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Objective</h4>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">{blueprint.objective}</p>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Technologies</h4>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {blueprint.technologies.map((t, i) => (
                            <span key={i} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-700">
                              <span className="text-indigo-600">{t.category}:</span> {t.items.join(', ')}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Requirements</h4>
                        <ul className="mt-3 space-y-2">
                          {blueprint.requirements.slice(0, 5).map((req, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-[11px] leading-relaxed text-slate-600">
                              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-slate-50">
                      {!roadmap && !isGeneratingRoadmap && (
                        <Button size="sm" onClick={onGenerateRoadmap} className="bg-indigo-600 hover:bg-indigo-700">
                          Generate Roadmap ✨
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-xs text-slate-400">Generate the technical blueprint to see architecture and details.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Roadmap */}
            {blueprint && (
              <Card className="border-indigo-100 shadow-md">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <span className="text-xl">📋</span> Development Roadmap
                    </CardTitle>
                    {!roadmap && !isGeneratingRoadmap && (
                      <Button size="sm" onClick={onGenerateRoadmap} variant="outline" className="border-indigo-200">
                        Generate Roadmap ✨
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {isGeneratingRoadmap ? (
                    <div className="flex flex-col items-center gap-3 py-12">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Mapping timeline...</p>
                    </div>
                  ) : roadmap ? (
                    <div className="space-y-8">
                      <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-indigo-50 p-4 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Timeline</p>
                          <p className="mt-1 text-sm font-bold text-slate-900">{roadmap.phases.length} Phases · {roadmap.totalTasks} Tasks</p>
                        </div>
                        <div className="rounded-xl bg-emerald-50 p-4 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Outcome</p>
                          <p className="mt-1 text-sm font-bold text-slate-900">{roadmap.expectedEvidence.length} New Evidence Items</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {roadmap.phases.map((phase, i) => (
                          <div key={i} className="flex gap-4">
                            <div className="flex flex-col items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                                {i + 1}
                              </div>
                              {i < roadmap.phases.length - 1 && <div className="w-0.5 flex-1 bg-slate-100" />}
                            </div>
                            <div className="flex-1 pb-6">
                              <h5 className="text-sm font-bold text-slate-900">{phase.title}</h5>
                              <p className="mt-1 text-xs text-slate-500 leading-relaxed">{phase.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-end pt-4 border-t border-slate-50">
                        {!docsPack && !isGeneratingDocsPack && (
                          <Button size="sm" onClick={onGenerateDocsPack} className="bg-indigo-600 hover:bg-indigo-700">
                            Generate GitHub & Docs ✨
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-xs text-slate-400">Generate the roadmap to see detailed development steps.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Docs Pack */}
            {roadmap && (
              <Card className="border-indigo-100 shadow-md">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <span className="text-xl">📦</span> GitHub & Docs Pack
                    </CardTitle>
                    {!docsPack && !isGeneratingDocsPack && (
                      <Button size="sm" onClick={onGenerateDocsPack} variant="outline" className="border-indigo-200">
                        Generate Pack ✨
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {isGeneratingDocsPack ? (
                    <div className="flex flex-col items-center gap-3 py-12">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Writing documentation...</p>
                    </div>
                  ) : docsPack ? (
                    <div className="space-y-6">
                      <div className="rounded-xl bg-slate-900 p-6 text-white overflow-hidden relative">
                        <div className="relative z-10">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Suggested Repository</p>
                          <p className="mt-2 text-lg font-bold font-mono">{docsPack.repositoryName}</p>
                          <p className="mt-2 text-xs text-slate-400 leading-relaxed">{docsPack.repositoryDescription}</p>
                        </div>
                        <div className="absolute -right-8 -bottom-8 h-32 w-32 bg-indigo-500/10 blur-2xl rounded-full" />
                      </div>
                      
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-100 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Documentation Included</p>
                          <ul className="mt-3 space-y-2">
                            {docsPack.documentation.map((d, i) => (
                              <li key={i} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                <span className="text-indigo-500">📄</span> {d}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Portfolio Ready</p>
                          <p className="mt-2 text-xs leading-relaxed text-indigo-800 italic">
                            &quot;{docsPack.portfolioDescription.slice(0, 150)}...&quot;
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-xs text-slate-400">Generate the docs pack to see repository structure and README.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
