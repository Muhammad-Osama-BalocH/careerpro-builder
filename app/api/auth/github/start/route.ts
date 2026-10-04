import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  // 1. Verify user authentication
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const idToken = authHeader.split('Bearer ')[1];
  let decodedUid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    decodedUid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Generate cryptographically random nonce
  const nonce = crypto.randomUUID();

  // 3. Store nonce + UID in an HttpOnly, Secure, SameSite=Lax cookie
  //    Format: "nonce:uid" so the callback can extract both
  const cookieValue = `${nonce}:${decodedUid}`;

  const origin = request.headers.get('origin') || new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/callback/github`;
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  const params = new URLSearchParams({
    client_id: clientId || '',
    redirect_uri: redirectUri,
    scope: 'read:user',
    state: nonce,
  });
  const githubAuthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

  const response = NextResponse.json({ url: githubAuthUrl });

  response.cookies.set('github_oauth_state', cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 minutes
  });

  return response;
}
