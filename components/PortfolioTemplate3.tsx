'use client';

import type { Portfolio } from '@/types/portfolio';
import { ContactInfo, AboutSection, SkillsSection, ProjectsSection, ExperienceSection, EducationSection } from '@/components/templates/shared';

export function PortfolioTemplate3({ portfolio }: { portfolio: Portfolio }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-12">
        <header className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-5">
              {portfolio.avatarUrl ? (
                <img src={portfolio.avatarUrl} alt={portfolio.name} className="h-20 w-20 rounded-full border border-slate-700 object-cover" />
              ) : null}
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">{portfolio.title}</p>
                <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">{portfolio.name}</h1>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-5 py-4 text-sm text-slate-400">
              <ContactInfo portfolio={portfolio} linkClassName="text-slate-300 hover:text-white hover:underline" />
            </div>
          </div>
        </header>

        <main className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="space-y-6">
            <AboutSection
              text={portfolio.about}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-6"
              textClassName="mt-3 leading-8 text-slate-400"
            >
              <h2 className="text-xl font-semibold">About</h2>
            </AboutSection>

            <ExperienceSection
              experience={portfolio.experience}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-6"
              headingClassName="text-xl font-semibold"
              itemClassName="border-l border-slate-700 pl-4"
              roleClassName="font-medium text-slate-200"
              metaClassName="text-sm text-slate-500"
              dateClassName="text-sm text-slate-500"
              descClassName="text-sm leading-7 text-slate-400"
              compactDateLocation
            />

            <EducationSection
              education={portfolio.education}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-6"
              headingClassName="text-xl font-semibold"
              itemClassName="border-l border-slate-700 pl-4"
              schoolClassName="font-medium text-slate-200"
              metaClassName="text-sm text-slate-500"
              dateClassName="text-xs text-slate-600"
              descClassName="text-sm text-slate-400"
            />
          </section>

          <section className="space-y-6">
            <SkillsSection
              skills={portfolio.skills}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-6"
              headingClassName="text-xl font-semibold"
              badgeClassName="rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300"
            />

            <ProjectsSection
              projects={portfolio.projects}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-6"
              headingClassName="text-xl font-semibold"
              cardClassName="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
              titleClassName="font-semibold text-slate-200"
              techBadgeClassName="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400"
              descClassName="text-sm leading-7 text-slate-400"
              linkClassName="text-sm text-slate-300 hover:text-white hover:underline"
            />
          </section>
        </main>
      </div>
    </div>
  );
}
