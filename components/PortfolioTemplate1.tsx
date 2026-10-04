'use client';

import type { Portfolio } from '@/types/portfolio';
import { ContactInfo, AboutSection, SkillsSection, ProjectsSection, ExperienceSection, EducationSection } from '@/components/templates/shared';

export function PortfolioTemplate1({ portfolio }: { portfolio: Portfolio }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 p-4 text-slate-900 sm:p-6">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 bg-slate-50 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            {portfolio.avatarUrl ? (
              <img src={portfolio.avatarUrl} alt={portfolio.name} className="h-20 w-20 rounded-full border border-slate-200 object-cover" />
            ) : null}
            <div className="flex-1">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{portfolio.title}</p>
              <h1 className="mt-1 text-4xl font-semibold">{portfolio.name}</h1>
              <ContactInfo
                portfolio={portfolio}
                className="mt-2"
                itemClassName="text-sm text-slate-500"
                linkClassName="text-sm text-blue-600 hover:underline"
              />
            </div>
          </div>
          <AboutSection
            text={portfolio.about}
            className="mt-4 max-w-2xl"
            textClassName="text-sm leading-7 text-slate-600"
          />
        </header>

        <main className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <ProjectsSection
              projects={portfolio.projects}
              headingClassName="text-xl font-semibold"
              cardClassName="rounded-xl border border-slate-200 p-4"
              titleClassName="font-medium"
              techBadgeClassName="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
              descClassName="text-sm leading-7 text-slate-600"
              linkClassName="text-sm text-blue-600 hover:underline"
            />
            <EducationSection
              education={portfolio.education}
              headingClassName="text-xl font-semibold"
              itemClassName="rounded-xl border border-slate-200 p-4"
              schoolClassName="font-medium"
              metaClassName="text-sm text-slate-600"
              dateClassName="mt-1 text-xs text-slate-400"
              descClassName="text-sm text-slate-600"
            />
          </section>

          <aside className="space-y-6">
            <SkillsSection
              skills={portfolio.skills}
              headingClassName="text-xl font-semibold"
              badgeClassName="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700"
            />
            <ExperienceSection
              experience={portfolio.experience}
              headingClassName="text-xl font-semibold"
              itemClassName="rounded-lg bg-slate-50 p-3"
              roleClassName="font-medium"
              metaClassName="text-sm text-slate-500"
              dateClassName="text-xs text-slate-400"
              descClassName="text-sm text-slate-600"
            />
          </aside>
        </main>
      </div>
    </div>
  );
}
