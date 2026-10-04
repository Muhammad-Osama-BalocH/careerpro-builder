'use client';

import type { Portfolio } from '@/types/portfolio';
import { ContactInfo, AboutSection, SkillsSection, ProjectsSection, ExperienceSection, EducationSection } from '@/components/templates/shared';

export function PortfolioTemplate2({ portfolio }: { portfolio: Portfolio }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-violet-600 via-fuchsia-500 to-amber-400 p-3 text-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-xl sm:p-8">
        <header className="rounded-[1.5rem] border border-white/20 bg-slate-950/40 p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex items-start gap-5">
              {portfolio.avatarUrl ? (
                <img src={portfolio.avatarUrl} alt={portfolio.name} className="h-20 w-20 rounded-full border border-white/20 object-cover" />
              ) : null}
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-violet-200">{portfolio.title}</p>
                <h1 className="text-4xl font-semibold sm:text-5xl">{portfolio.name}</h1>
                <ContactInfo
                  portfolio={portfolio}
                  className="mt-2"
                  itemClassName="text-sm text-violet-200"
                  linkClassName="text-sm text-white underline decoration-white/40 hover:decoration-white"
                />
              </div>
            </div>
            <AboutSection
              text={portfolio.about}
              className="max-w-md"
              textClassName="text-sm leading-7 text-violet-100"
            />
          </div>
        </header>

        <main className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <ProjectsSection
              projects={portfolio.projects}
              className="rounded-[1.5rem] border border-white/20 bg-slate-950/30 p-6"
              headingClassName="mb-4 text-2xl font-semibold"
              cardClassName="rounded-2xl bg-white/10 p-4"
              titleClassName="font-semibold"
              techBadgeClassName="rounded bg-white/10 px-2 py-0.5 text-xs"
              descClassName="text-sm leading-7 text-violet-100"
              linkClassName="text-sm text-white underline decoration-white/40 hover:decoration-white"
            />
            <EducationSection
              education={portfolio.education}
              className="rounded-[1.5rem] border border-white/20 bg-slate-950/30 p-6"
              headingClassName="mb-4 text-2xl font-semibold"
              schoolClassName="font-semibold text-white"
              metaClassName="text-violet-100"
              dateClassName="text-xs text-violet-300"
            />
          </section>

          <aside className="space-y-6">
            <SkillsSection
              skills={portfolio.skills}
              className="rounded-[1.5rem] border border-white/20 bg-slate-950/30 p-6"
              headingClassName="mb-4 text-xl font-semibold"
              badgeClassName="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm"
            />
            <ExperienceSection
              experience={portfolio.experience}
              className="rounded-[1.5rem] border border-white/20 bg-slate-950/30 p-6"
              headingClassName="mb-4 text-xl font-semibold"
              roleClassName="font-semibold text-white"
              metaClassName="text-violet-100"
              dateClassName="text-xs text-violet-300"
              descClassName="text-violet-200"
            />
          </aside>
        </main>
      </div>
    </div>
  );
}
