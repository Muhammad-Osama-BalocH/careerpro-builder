import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  // 1. Verify user authentication
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const idToken = authHeader.split('Bearer ')[1];
  let userId: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Read the stored GitHub token
    const tokenDoc = await adminDb.collection('githubTokens').doc(userId).get();

    if (!tokenDoc.exists) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 404 });
    }

    const { accessToken } = tokenDoc.data() as { accessToken: string };

    // 3. Revoke the token with GitHub
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    const revokeResponse = await fetch(
      `https://api.github.com/applications/${clientId}/token`,
      {
        method: 'DELETE',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: accessToken }),
      },
    );

    // GitHub returns 204 on success; 422 if token already revoked — both are acceptable
    if (!revokeResponse.ok && revokeResponse.status !== 422) {
      console.error('GitHub token revocation failed:', revokeResponse.status, await revokeResponse.text());
      // Continue with cleanup even if revocation fails (token may be expired already)
    }

    // 4. Delete the token document from Firestore
    await adminDb.collection('githubTokens').doc(userId).delete();

    // 5. Update career profile to reflect disconnection
    const profileRef = adminDb.collection('careerProfiles').where('userId', '==', userId);
    const snapshot = await profileRef.get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      // Use Firestore FieldValue.delete() to remove the fields cleanly
      const { FieldValue } = await import('firebase-admin/firestore');
      await doc.ref.update({
        'githubConnection.isConnected': false,
        'githubConnection.username': FieldValue.delete(),
        'githubConnection.githubId': FieldValue.delete(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('GitHub disconnect error:', error);
    return NextResponse.json({ error: 'Failed to disconnect GitHub' }, { status: 500 });
  }
}
