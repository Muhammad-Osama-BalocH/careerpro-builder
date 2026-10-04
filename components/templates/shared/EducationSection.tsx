import type { Portfolio } from '@/types/portfolio';

export function EducationSection({
  education,
  className,
  headingClassName,
  itemClassName,
  schoolClassName,
  metaClassName,
  dateClassName,
  descClassName,
}: {
  education: Portfolio['education'];
  className?: string;
  headingClassName?: string;
  itemClassName?: string;
  schoolClassName?: string;
  metaClassName?: string;
  dateClassName?: string;
  descClassName?: string;
}) {
  if (education.length === 0) return null;
  return (
    <div className={className}>
      <h2 className={headingClassName}>Education</h2>
      <div className="mt-4 space-y-3">
        {education.map((edu) => (
          <div key={edu.id} className={itemClassName}>
            <p className={schoolClassName}>{edu.school}</p>
            <p className={metaClassName}>{edu.degree}{edu.field ? `, ${edu.field}` : ''}</p>
            {(edu.startDate || edu.endDate) && (
              <p className={dateClassName}>{edu.startDate}{edu.endDate ? ` — ${edu.endDate}` : ''}</p>
            )}
            {edu.description && <p className={`mt-2 ${descClassName ?? ''}`}>{edu.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
