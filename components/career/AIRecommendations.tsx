'use client';

import { useState } from 'react';
import { generateCareerRecommendations, type CareerRecommendationsInput } from '@/lib/gemini';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export function AIRecommendations({ input }: { input: CareerRecommendationsInput }) {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<string[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    setRecommendations(null);

    try {
      const result = await generateCareerRecommendations(input, await user?.getIdToken());

      if (result.data) {
        setRecommendations(result.data);
      } else {
        setError(result.error ?? 'Failed to generate recommendations.');
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to generate recommendations.');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">AI analyzes your career data to suggest improvements.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => { void handleGenerate(); }}
          disabled={isGenerating}
        >
          {isGenerating ? '✨ Analyzing…' : recommendations ? '✨ Regenerate' : '✨ Analyze Career'}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {isGenerating && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          <p className="text-sm text-blue-700">Analyzing your career profile…</p>
        </div>
      )}

      {recommendations && !isGenerating && (
        <div className="space-y-2.5">
          {recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-indigo-100 bg-indigo-50/40 p-3">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                {i + 1}
              </span>
              <p className="text-sm leading-6 text-slate-800">{rec}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
