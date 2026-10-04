export function SkillsSection({
  skills,
  className,
  headingClassName,
  badgeClassName,
}: {
  skills: string[];
  className?: string;
  headingClassName?: string;
  badgeClassName?: string;
}) {
  if (skills.length === 0) return null;
  return (
    <div className={className}>
      <h2 className={headingClassName}>Skills</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span key={skill} className={badgeClassName}>{skill}</span>
        ))}
      </div>
    </div>
  );
}
