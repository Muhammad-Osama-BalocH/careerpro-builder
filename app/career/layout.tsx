import type { Metadata } from 'next';
import ProtectedRoute from '@/components/ProtectedRoute';

export const metadata: Metadata = {
  title: 'Career Intelligence',
  description: 'Analyze your career readiness, identify skill gaps, and get AI-powered career recommendations.',
};

export default function CareerLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
