import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="text-lg font-semibold text-[var(--cp-text)]">Page not found</h2>
      <p className="max-w-md text-sm text-[var(--cp-text-muted)]">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="rounded-cp bg-[var(--cp-accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Go home
      </Link>
    </div>
  );
}
