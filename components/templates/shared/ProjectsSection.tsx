import type { Portfolio } from '@/types/portfolio';

export function ProjectsSection({
  projects,
  className,
  headingClassName,
  cardClassName,
  titleClassName,
  techBadgeClassName,
  descClassName,
  linkClassName,
}: {
  projects: Portfolio['projects'];
  className?: string;
  headingClassName?: string;
  cardClassName?: string;
  titleClassName?: string;
  techBadgeClassName?: string;
  descClassName?: string;
  linkClassName?: string;
}) {
  if (projects.length === 0) return null;
  return (
    <div className={className}>
      <h2 className={headingClassName}>Projects</h2>
      <div className="mt-4 space-y-3">
        {projects.map((project) => (
          <div key={project.id} className={cardClassName}>
            <h3 className={titleClassName}>{project.name}</h3>
            {project.techStack.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {project.techStack.map((tech) => (
                  <span key={tech} className={techBadgeClassName}>{tech}</span>
                ))}
              </div>
            )}
            {project.description && <p className={`mt-2 ${descClassName ?? ''}`}>{project.description}</p>}
            {(project.link || project.githubUrl) && (
              <div className="mt-2 flex flex-wrap gap-3">
                {project.link ? <a href={project.link} target="_blank" rel="noreferrer" className={linkClassName}>Live Demo</a> : null}
                {project.githubUrl ? <a href={project.githubUrl} target="_blank" rel="noreferrer" className={linkClassName}>Source</a> : null}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
