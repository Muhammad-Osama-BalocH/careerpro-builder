export function AboutSection({
  text,
  className,
  textClassName,
  children,
}: {
  text: string;
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
}) {
  if (!text) return null;
  return (
    <div className={className}>
      {children}
      <p className={textClassName}>{text}</p>
    </div>
  );
}
