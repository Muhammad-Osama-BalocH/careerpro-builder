'use client';

import { cn } from '@/lib/utils';

export interface PortfolioPreviewProps {
  data: {
    name: string;
    title: string;
    about: string;
    skills: string[];
    projects: Array<{ name: string; description: string }>;
    template: string;
  };
}

export function PortfolioPreview({ data }: PortfolioPreviewProps) {
  const templateClasses = {
    minimal: 'border-slate-200',
    modern: 'border-slate-900 bg-slate-50',
    creative: 'border-violet-300 bg-violet-50',
    dark: 'border-slate-800 bg-slate-900 text-white',
  };

  return (
    <div className={cn('rounded-xl border p-6 shadow-sm', templateClasses[data.template as keyof typeof templateClasses] ?? 'border-slate-200')}>
      <div className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{data.title}</p>
          <h2 className="text-3xl font-semibold">{data.name || 'Your Name'}</h2>
        </div>

        <section>
          <h3 className="mb-2 text-lg font-semibold">About</h3>
          <p className="text-sm leading-6 text-slate-600">{data.about || 'Add a short introduction about yourself.'}</p>
        </section>

        <section>
          <h3 className="mb-2 text-lg font-semibold">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {(data.skills.length ? data.skills : ['Skill 1', 'Skill 2']).map((skill) => (
              <span key={skill} className="rounded-full border border-slate-300 px-3 py-1 text-sm">
                {skill}
              </span>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-lg font-semibold">Projects</h3>
          <div className="space-y-3">
            {(data.projects.length ? data.projects : [{ name: 'Your Project', description: 'Add a project description.' }]).map((project) => (
              <div key={project.name} className="rounded-lg border border-slate-200 bg-white p-3">
                <h4 className="font-medium">{project.name}</h4>
                <p className="mt-1 text-sm text-slate-600">{project.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
