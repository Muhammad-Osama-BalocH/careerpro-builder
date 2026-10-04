'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase';
import { StaggerList, StaggerItem, HoverLift } from '@/lib/motion';

interface GitHubRepo {
  id: number;
  name: string;
  description: string;
  url: string;
  language: string;
  topics: string[];
  stars: number;
  updatedAt: string;
  isPrivate: boolean;
}

export function GitHubRepositoryList() {
  const { user } = useAuth();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRepos = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/github/repos', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch repositories');
      const data = await response.json();
      setRepos(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchRepos();
  }, [user]);

  return (
    <Card className="border-slate-200">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold">🐙 GitHub Repositories</CardTitle>
        <Button size="sm" variant="outline" onClick={fetchRepos} disabled={loading}>
          {loading ? 'Syncing…' : 'Sync / Refresh'}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {error && <p className="p-6 text-sm text-red-600">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading repositories...</div>
        ) : repos.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No repositories found.</div>
        ) : (
          <StaggerList className="divide-y divide-slate-100">
            {repos.map(repo => (
              <StaggerItem key={repo.id}>
                <HoverLift className="p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <a href={repo.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-indigo-600 hover:underline truncate">
                        {repo.name}
                    </a>
                    {repo.isPrivate && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded flex-shrink-0">Private</span>}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 break-words">{repo.description}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-[10px] text-slate-400">
                    <span>{repo.language}</span>
                    <span>⭐ {repo.stars}</span>
                    <span>Updated: {new Date(repo.updatedAt).toLocaleDateString()}</span>
                  </div>
                </HoverLift>
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </CardContent>
    </Card>
  );
}
