import type { Metadata } from 'next';
import ProtectedRoute from '@/components/ProtectedRoute';

export const metadata: Metadata = {
  title: 'Portfolio Builder',
  description: 'Create and customize your professional portfolio with AI assistance.',
};

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
