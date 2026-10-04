import type { Portfolio } from '@/types/portfolio';

export function ContactInfo({
  portfolio,
  className,
  itemClassName,
  linkClassName,
}: {
  portfolio: Portfolio;
  className?: string;
  itemClassName?: string;
  linkClassName?: string;
}) {
  const items = [portfolio.email, portfolio.phone, portfolio.location].filter(Boolean);
  const links = [
    portfolio.linkedinUrl ? { label: 'LinkedIn', url: portfolio.linkedinUrl } : null,
    portfolio.githubUrl ? { label: 'GitHub', url: portfolio.githubUrl } : null,
    portfolio.websiteUrl ? { label: 'Website', url: portfolio.websiteUrl } : null,
  ].filter(Boolean) as Array<{ label: string; url: string }>;

  if (items.length === 0 && links.length === 0) return null;

  return (
    <div className={className}>
      {items.length > 0 && (
        <div className={`flex flex-wrap gap-3 ${itemClassName ?? ''}`}>
          {items.map((item) => <span key={item}>{item}</span>)}
        </div>
      )}
      {links.length > 0 && (
        <div className={`mt-2 flex flex-wrap gap-3 ${linkClassName ?? ''}`}>
          {links.map((link) => (
            <a key={link.label} href={link.url} target="_blank" rel="noreferrer">{link.label}</a>
          ))}
        </div>
      )}
    </div>
  );
}
