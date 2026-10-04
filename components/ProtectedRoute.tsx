'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!auth || !isFirebaseConfigured) {
        // Firebase not configured — block access rather than silently allow
        console.error('Firebase is not configured. Protected routes are unavailable.');
        router.push('/login?error=config');
        return;
      }
      if (!user) {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-slate-500">Checking authentication…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
