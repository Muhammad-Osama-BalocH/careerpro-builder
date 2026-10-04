import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  if (!idToken) {
    return NextResponse.json({ error: 'Missing ID token' }, { status: 400 });
  }

  try {
    // Verify the Firebase ID token before creating a session cookie
    await adminAuth.verifyIdToken(idToken);

    // Create a session cookie signed by Firebase Admin
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_COOKIE_MAX_AGE * 1000, // ms
    });

    const response = NextResponse.json({ status: 'success' });

    response.cookies.set('session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_COOKIE_MAX_AGE,
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid ID token' }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ status: 'signed_out' });

  response.cookies.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
