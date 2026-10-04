'use client';

import { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  type AuthError,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

const FRIENDLY_ERRORS: Record<string, string> = {
  'auth/email-already-in-use': 'An account already exists with this email. Please log in instead.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/user-not-found': 'Invalid email or password.',
  'auth/wrong-password': 'Invalid email or password.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method. Please log in with your original method.',
  'auth/operation-not-allowed': 'Email/password sign-in is not enabled. Please contact support.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/network-request-failed': 'Network error. Please check your connection and try again.',
  'auth/invalid-user-token': 'Your session has expired. Please sign in again.',
  'auth/app-deleted': 'The application no longer exists. Please contact support.',
};

function friendlyMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as AuthError).code;
    return FRIENDLY_ERRORS[code] ?? 'Something went wrong. Please try again.';
  }
  return err instanceof Error ? err.message : 'Authentication failed.';
}

export default function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (user) {
      // Create server-side session cookie after Firebase auth succeeds
      user.getIdToken().then((idToken) => {
        fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        }).then(() => {
          const redirect = new URLSearchParams(window.location.search).get('redirect');
          router.push(redirect || '/dashboard');
        });
      });
    }
  }, [user, router]);

  async function handleEmailAuth() {
    if (!auth || !isFirebaseConfigured) {
      setError('Firebase is not configured yet. Add your Firebase credentials to continue.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    if (!auth || !isFirebaseConfigured) {
      setError('Firebase is not configured yet. Add your Firebase credentials to continue.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return <p className="text-sm text-slate-500">Loading...</p>;
  }

  if (user) {
    return <p className="text-sm text-slate-500">Redirecting...</p>;
  }

  return (
    <div className="mx-auto max-w-md rounded-lg border border-slate-200 p-6 shadow-sm">
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => { setMode('signin'); setError(null); }}
          className={`rounded px-3 py-2 text-sm ${mode === 'signin' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => { setMode('signup'); setError(null); }}
          className={`rounded px-3 py-2 text-sm ${mode === 'signup' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}
        >
          Create Account
        </button>
      </div>

      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleEmailAuth();
        }}
        className="space-y-3"
      >
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="w-full rounded border border-slate-300 px-3 py-2"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="w-full rounded border border-slate-300 px-3 py-2"
          required
        />
        <button type="submit" disabled={loading} className="w-full rounded bg-slate-900 px-3 py-2 text-white">
          {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <div className="my-4 flex items-center gap-2">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs uppercase text-slate-400">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        type="button"
        onClick={() => {
          void handleGoogleSignIn();
        }}
        disabled={loading}
        className="w-full rounded border border-slate-300 px-3 py-2"
      >
        Continue with Google
      </button>
    </div>
  );
}
