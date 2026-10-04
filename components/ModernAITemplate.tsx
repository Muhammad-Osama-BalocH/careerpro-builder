'use client';

import type { Portfolio } from '@/types/portfolio';
import { ContactInfo, SkillsSection, ProjectsSection, ExperienceSection, EducationSection } from '@/components/templates/shared';

export function ModernAITemplate({ portfolio }: { portfolio: Portfolio }) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Hero — large gradient accent */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            {portfolio.avatarUrl ? (
              <img src={portfolio.avatarUrl} alt={portfolio.name} className="h-24 w-24 rounded-2xl border-2 border-white/30 object-cover shadow-lg sm:h-28 sm:w-28" />
            ) : null}
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold text-white sm:text-5xl">{portfolio.name || 'Your Name'}</h1>
              <p className="mt-2 text-lg font-medium text-white/80">{portfolio.title || 'Your Title'}</p>
              <ContactInfo
                portfolio={portfolio}
                className="mt-3 justify-center sm:justify-start"
                itemClassName="text-sm text-white/70"
                linkClassName="text-sm text-white/90 underline decoration-white/40 hover:decoration-white"
              />
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* About */}
        {portfolio.about && (
          <div className="mb-10 rounded-2xl border border-slate-100 bg-slate-50 p-6 sm:p-8">
            <p className="text-base leading-8 text-slate-600">{portfolio.about}</p>
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-10">
            {/* Projects — case study style */}
            {portfolio.projects.length > 0 && (
              <div>
                <h2 className="mb-5 text-xs font-bold uppercase tracking-widest text-indigo-600">Case Studies</h2>
                <div className="space-y-5">
                  {portfolio.projects.map((project) => (
                    <div key={project.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{project.name}</h3>
                          {project.techStack.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {project.techStack.map((tech) => (
                                <span key={tech} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">{tech}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        {(project.link || project.githubUrl) && (
                          <div className="flex shrink-0 gap-2">
                            {project.link ? <a href={project.link} target="_blank" rel="noreferrer" className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Live ↗</a> : null}
                            {project.githubUrl ? <a href={project.githubUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-slate-400 hover:text-slate-700">Code ↗</a> : null}
                          </div>
                        )}
                      </div>
                      {project.description && <p className="mt-3 text-sm leading-7 text-slate-500">{project.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {portfolio.education.length > 0 && (
              <div>
                <h2 className="mb-5 text-xs font-bold uppercase tracking-widest text-indigo-600">Education</h2>
                <div className="space-y-3">
                  {portfolio.education.map((edu) => (
                    <div key={edu.id} className="rounded-xl border border-slate-100 p-4">
                      <p className="font-bold text-slate-900">{edu.school}</p>
                      <p className="text-sm text-slate-500">{edu.degree}{edu.field ? `, ${edu.field}` : ''}</p>
                      {(edu.startDate || edu.endDate) && (
                        <p className="mt-1 text-xs text-slate-400">{edu.startDate}{edu.endDate ? ` — ${edu.endDate}` : ''}</p>
                      )}
                      {edu.description && <p className="mt-2 text-sm text-slate-500">{edu.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-10">
            {/* Skills — visual grid */}
            {portfolio.skills.length > 0 && (
              <div>
                <h2 className="mb-5 text-xs font-bold uppercase tracking-widest text-indigo-600">Expertise</h2>
                <div className="grid grid-cols-2 gap-2">
                  {portfolio.skills.map((skill) => (
                    <div key={skill} className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 px-3 py-2.5 text-center text-sm font-medium text-indigo-900">
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {portfolio.experience.length > 0 && (
              <div>
                <h2 className="mb-5 text-xs font-bold uppercase tracking-widest text-indigo-600">Experience</h2>
                <div className="space-y-4">
                  {portfolio.experience.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-100 p-4">
                      <p className="font-bold text-slate-900">{item.role}</p>
                      <p className="text-sm text-indigo-600">{item.company}{item.location ? ` · ${item.location}` : ''}</p>
                      <p className="text-xs text-slate-400">{item.startDate} — {item.current ? 'Present' : (item.endDate ?? '')}</p>
                      {item.description && <p className="mt-2 text-sm text-slate-500">{item.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        Built with AI Portfolio Builder
      </footer>
    </div>
  );
}
