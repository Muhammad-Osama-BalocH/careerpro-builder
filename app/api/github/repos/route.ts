import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  // 1. Verify User Auth
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // 2. Retrieve GitHub Token
    const tokenDoc = await adminDb.collection('githubTokens').doc(userId).get();
    if (!tokenDoc.exists) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 404 });
    }

    const { accessToken } = tokenDoc.data() as { accessToken: string };

    // 3. Fetch GitHub Repos
    const reposResponse = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!reposResponse.ok) {
      throw new Error(`GitHub API error: ${reposResponse.statusText}`);
    }

    const repos = await reposResponse.json();

    // 4. Map to simplified format
    const simplifiedRepos = repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      url: repo.html_url,
      language: repo.language,
      topics: repo.topics,
      stars: repo.stargazers_count,
      updatedAt: repo.updated_at,
      isPrivate: repo.private,
    }));

    return NextResponse.json(simplifiedRepos);
  } catch (error) {
    console.error('GitHub Repos Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 });
  }
}
