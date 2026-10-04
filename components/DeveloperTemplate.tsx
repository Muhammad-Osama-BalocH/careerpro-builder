'use client';

import type { Portfolio } from '@/types/portfolio';
import { ContactInfo, SkillsSection, ProjectsSection, ExperienceSection, EducationSection } from '@/components/templates/shared';

export function DeveloperTemplate({ portfolio }: { portfolio: Portfolio }) {
  return (
    <div className="min-h-screen bg-slate-950 font-mono text-slate-300">
      {/* Hero — terminal-style top bar */}
      <header className="border-b border-emerald-900/40 bg-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="text-xs">$</span>
                <span className="text-xs tracking-wide opacity-70">whoami</span>
              </div>
              <h1 className="mt-1 text-3xl font-bold text-slate-100 sm:text-4xl">{portfolio.name || 'Developer'}</h1>
              <p className="mt-1 text-lg text-emerald-400">{portfolio.title || 'Software Engineer'}</p>
              <ContactInfo
                portfolio={portfolio}
                className="mt-2"
                itemClassName="text-xs text-slate-500"
                linkClassName="text-xs text-emerald-400 hover:text-emerald-300"
              />
            </div>
            {portfolio.avatarUrl ? (
              <img src={portfolio.avatarUrl} alt={portfolio.name} className="h-16 w-16 rounded-lg border border-emerald-900/50 object-cover sm:h-20 sm:w-20" />
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* About — code comment style */}
        {portfolio.about && (
          <div className="mb-8 rounded-lg border border-slate-800 bg-slate-900 p-4 sm:p-6">
            <span className="text-xs text-emerald-600">// about</span>
            <p className="mt-2 text-sm leading-7 text-slate-400">{portfolio.about}</p>
          </div>
        )}

        {/* Skills — categorized grid */}
        {portfolio.skills.length > 0 && (
          <div className="mb-8">
            <div className="mb-3 flex items-center gap-2 text-emerald-400">
              <span className="text-xs">$</span>
              <h2 className="text-lg font-bold text-slate-200">skills</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {portfolio.skills.map((skill) => (
                <div key={skill} className="flex items-center gap-2 rounded border border-slate-800 bg-slate-900 px-3 py-2">
                  <span className="text-emerald-500">▸</span>
                  <span className="text-sm text-slate-300">{skill}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects — prominent cards */}
        {portfolio.projects.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-2 text-emerald-400">
              <span className="text-xs">$</span>
              <h2 className="text-lg font-bold text-slate-200">projects</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {portfolio.projects.map((project) => (
                <div key={project.id} className="group rounded-lg border border-slate-800 bg-slate-900 p-4 transition hover:border-emerald-900/60">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-200">{project.name}</h3>
                    <div className="flex shrink-0 gap-2">
                      {project.githubUrl ? (
                        <a href={project.githubUrl} target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:text-emerald-400">src</a>
                      ) : null}
                      {project.link ? (
                        <a href={project.link} target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:text-emerald-400">live</a>
                      ) : null}
                    </div>
                  </div>
                  {project.techStack.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {project.techStack.map((tech) => (
                        <span key={tech} className="rounded border border-emerald-900/40 bg-emerald-950/30 px-2 py-0.5 text-xs text-emerald-400">{tech}</span>
                      ))}
                    </div>
                  )}
                  {project.description && <p className="mt-3 text-sm leading-7 text-slate-500">{project.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience — terminal log style */}
        {portfolio.experience.length > 0 && (
          <div className="mb-8">
            <div className="mb-3 flex items-center gap-2 text-emerald-400">
              <span className="text-xs">$</span>
              <h2 className="text-lg font-bold text-slate-200">experience</h2>
            </div>
            <div className="space-y-0 border-l-2 border-slate-800 pl-4">
              {portfolio.experience.map((item) => (
                <div key={item.id} className="relative pb-4 pl-4 last:pb-0">
                  <span className="absolute -left-[9px] top-1 h-3 w-3 rounded-full border-2 border-emerald-500 bg-slate-950" />
                  <p className="font-bold text-slate-200">{item.role}</p>
                  <p className="text-sm text-emerald-400">{item.company}{item.location ? ` · ${item.location}` : ''}</p>
                  <p className="text-xs text-slate-600">{item.startDate} — {item.current ? 'Present' : (item.endDate ?? '')}</p>
                  {item.description && <p className="mt-1 text-sm text-slate-500">{item.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {portfolio.education.length > 0 && (
          <div className="mb-8">
            <div className="mb-3 flex items-center gap-2 text-emerald-400">
              <span className="text-xs">$</span>
              <h2 className="text-lg font-bold text-slate-200">education</h2>
            </div>
            <div className="space-y-2">
              {portfolio.education.map((edu) => (
                <div key={edu.id} className="rounded border border-slate-800 bg-slate-900 px-4 py-3">
                  <p className="font-bold text-slate-200">{edu.school}</p>
                  <p className="text-sm text-slate-500">{edu.degree}{edu.field ? `, ${edu.field}` : ''}</p>
                  {(edu.startDate || edu.endDate) && (
                    <p className="text-xs text-slate-600">{edu.startDate}{edu.endDate ? ` — ${edu.endDate}` : ''}</p>
                  )}
                  {edu.description && <p className="mt-1 text-sm text-slate-500">{edu.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-600">
        Built with AI Portfolio Builder
      </footer>
    </div>
  );
}
