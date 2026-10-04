import type { Portfolio } from '@/types/portfolio';

export function ExperienceSection({
  experience,
  className,
  headingClassName,
  itemClassName,
  roleClassName,
  metaClassName,
  dateClassName,
  descClassName,
  compactDateLocation,
}: {
  experience: Portfolio['experience'];
  className?: string;
  headingClassName?: string;
  itemClassName?: string;
  roleClassName?: string;
  metaClassName?: string;
  dateClassName?: string;
  descClassName?: string;
  /** When true, renders date and location on the same line (e.g. "Jan 2022 — Present · San Francisco") */
  compactDateLocation?: boolean;
}) {
  if (experience.length === 0) return null;
  return (
    <div className={className}>
      <h2 className={headingClassName}>Experience</h2>
      <div className="mt-4 space-y-3">
        {experience.map((item) => (
          <div key={item.id} className={itemClassName}>
            <p className={roleClassName}>{item.role}{compactDateLocation && item.company ? ` · ${item.company}` : ''}</p>
            {compactDateLocation ? (
              <p className={metaClassName ?? dateClassName}>
                {item.startDate} — {item.current ? 'Present' : (item.endDate ?? '')}
                {item.location ? ` · ${item.location}` : ''}
              </p>
            ) : (
              <>
                <p className={metaClassName}>{item.company}{item.location ? ` · ${item.location}` : ''}</p>
                {(item.startDate || item.endDate || item.current) && (
                  <p className={dateClassName}>{item.startDate} — {item.current ? 'Present' : (item.endDate ?? '')}</p>
                )}
              </>
            )}
            {item.description && <p className={`mt-1 ${descClassName ?? ''}`}>{item.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
